/**
 * Meta-Progressão (ticket 11).
 *
 * Progressão permanente entre Runs, sem moeda — por conquista. Marcos: 1ª Run
 * vencida (desbloqueia o Forjador Martelo), 3ª (desbloqueia a Bigorna), 5ª
 * (2 novos Efeitos de Forja entram no pool de ofertas — o jogador escolhe a
 * ordem em que eles entram) e recorde de ≥ 2.500 pontos numa Run (Relíquias
 * raras entram no pool).
 *
 * O estado persistido (PersistedProgression) é uma estrutura serializável
 * mínima: estatísticas de perfil + ids das opções de desbloqueio já
 * reivindicadas. Tudo o mais (unlocks efetivos, pools filtrados, marcos
 * pendentes) é derivado por funções puras — nada de regra vive na UI nem na
 * camada de persistência.
 *
 * A persistência usa um port injetado (ProgressionStorage) no mesmo padrão do
 * DDA (dda.ts): implementação em memória para testes; o app usa SQLite na
 * camada de persistência (store/sqlite.ts).
 *
 * Regra de "escolha da ordem": um marco com mais de uma opção (o da 5ª Run
 * vencida) não é reivindicado automaticamente — cada opção fica pendente até
 * o jogador escolher (claimOption), podendo reivindicar a segunda depois,
 * pela Coleção. Marcos de opção única são reivindicados automaticamente
 * (claimReachedSingles) ao fim da Run. Todas as opções de um marco atingido
 * eventualmente desbloqueiam; a escolha define apenas a ordem.
 */

import { assertNever } from './assert';
import { Card, cardKey, ForgeEffect } from './cards';
import { BONUS_FORGE_EFFECTS, FORGE_EFFECT_POOL, ForgeEffectOption } from './forge';
import { ForgerId } from './forgers';
import { Relic, RELIC_POOL } from './relics';

// ---------------------------------------------------------------------------
// Estatísticas de perfil
// ---------------------------------------------------------------------------

export interface ProfileStats {
  /** Runs iniciadas (vitórias + derrotas). */
  readonly runsStarted: number;
  /** Runs vencidas (todas as 6 Rodadas). */
  readonly runsWon: number;
  /** Recorde de pontuação numa Run. */
  readonly bestRunScore: number;
  /** Maior Multiplicador de Combo alcançado numa Jogada (o "maior combo"). */
  readonly maxMultiplier: number;
  /** Quantas vezes cada carta (identidade `naipe:valor`) entrou numa Jogada. */
  readonly cardPlays: Readonly<Record<string, number>>;
}

export const DEFAULT_PROFILE_STATS: ProfileStats = {
  runsStarted: 0,
  runsWon: 0,
  bestRunScore: 0,
  maxMultiplier: 1,
  cardPlays: {},
};

/** Registra uma Jogada nas estatísticas: contagem de cartas + maior combo. */
export function recordPlay(stats: ProfileStats, cards: readonly Card[], multiplier: number): ProfileStats {
  const cardPlays = { ...stats.cardPlays };
  for (const card of cards) {
    const key = cardKey(card);
    cardPlays[key] = (cardPlays[key] ?? 0) + 1;
  }
  return {
    ...stats,
    cardPlays,
    maxMultiplier: Math.max(stats.maxMultiplier, multiplier),
  };
}

/** Registra o fim de uma Run (vitória ou derrota) nas estatísticas. */
export function recordRunEnd(stats: ProfileStats, won: boolean, runScore: number): ProfileStats {
  return {
    ...stats,
    runsStarted: stats.runsStarted + 1,
    runsWon: stats.runsWon + (won ? 1 : 0),
    bestRunScore: Math.max(stats.bestRunScore, runScore),
  };
}

// ---------------------------------------------------------------------------
// Desbloqueios efetivos (derivados das opções reivindicadas)
// ---------------------------------------------------------------------------

export interface UnlocksState {
  /** Forjadores disponíveis (o Aprendiz é sempre disponível). */
  readonly forgers: readonly ForgerId[];
  /** Ids dos Efeitos de Forja bônus já desbloqueados (entram no pool). */
  readonly extraEffects: readonly string[];
  /** True quando as Relíquias raras entram no pool de ofertas. */
  readonly rareRelics: boolean;
}

/** Estado de desbloqueio "tudo liberado" — padrão do motor para testes/back-compat. */
export const ALL_UNLOCKS: UnlocksState = {
  forgers: ['apprentice', 'hammer', 'anvil'],
  extraEffects: BONUS_FORGE_EFFECTS.map((option) => option.id),
  rareRelics: true,
};

/** O que uma opção de desbloqueio concede quando reivindicada. */
export type UnlockKind =
  | { readonly kind: 'forger'; readonly forger: ForgerId }
  | { readonly kind: 'forgeEffect'; readonly effectId: string }
  | { readonly kind: 'rareRelics' }
  /** Título (ADR 0009): marco cosmético — só texto de Perfil, não concede nada em UnlocksState. */
  | { readonly kind: 'title' };

export interface MilestoneOption {
  /** Id estável usado no estado persistido (claimedOptions). */
  readonly id: string;
  /** Título curto (texto de jogo em inglês). */
  readonly title: string;
  readonly unlock: UnlockKind;
}

export interface Milestone {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly condition: (stats: ProfileStats) => boolean;
  readonly options: readonly MilestoneOption[];
}

export const MILESTONES: readonly Milestone[] = [
  {
    id: 'firstRunWon',
    title: 'First Victory',
    description: 'Win your first run.',
    condition: (stats) => stats.runsWon >= 1,
    options: [{ id: 'unlock-forger-hammer', title: 'Hammer forger', unlock: { kind: 'forger', forger: 'hammer' } }],
  },
  {
    id: 'thirdRunWon',
    title: 'Third Victory',
    description: 'Win 3 runs.',
    condition: (stats) => stats.runsWon >= 3,
    options: [{ id: 'unlock-forger-anvil', title: 'Anvil forger', unlock: { kind: 'forger', forger: 'anvil' } }],
  },
  {
    id: 'fifthRunWon',
    title: 'Fifth Victory',
    description: 'Win 5 runs.',
    condition: (stats) => stats.runsWon >= 5,
    // Dois Efeitos de Forja bônus entram no pool; o jogador escolhe a ordem.
    options: [
      {
        id: 'value-bonus-7',
        title: "+7 to a card's value",
        unlock: { kind: 'forgeEffect', effectId: 'value-bonus-7' },
      },
      {
        id: 'trigger-2-15',
        title: '+15 pts on play 2',
        unlock: { kind: 'forgeEffect', effectId: 'trigger-2-15' },
      },
    ],
  },
  {
    id: 'scoreRecord2500',
    title: 'Legendary Forge',
    description: 'Score 2,500+ points in a single run.',
    condition: (stats) => stats.bestRunScore >= 2500,
    options: [{ id: 'unlock-rare-relics', title: 'Rare relics in the forge', unlock: { kind: 'rareRelics' } }],
  },
];

interface IndexedOption {
  readonly milestone: Milestone;
  readonly option: MilestoneOption;
}

const OPTION_INDEX: ReadonlyMap<string, IndexedOption> = new Map(
  MILESTONES.flatMap((milestone) =>
    milestone.options.map((option) => [option.id, { milestone, option }] as const),
  ),
);

/** Opção de desbloqueio por id (undefined para ids desconhecidos). */
export function milestoneOptionById(optionId: string): MilestoneOption | undefined {
  return OPTION_INDEX.get(optionId)?.option;
}

/** Marco que oferece a opção (undefined para ids desconhecidos). */
export function milestoneOfOption(optionId: string): Milestone | undefined {
  return OPTION_INDEX.get(optionId)?.milestone;
}

/** Marco que desbloqueia um Forjador (usado pelas telas de seleção/Coleção). */
export function milestoneForForger(forger: ForgerId): Milestone | undefined {
  return MILESTONES.find((milestone) =>
    milestone.options.some((option) => option.unlock.kind === 'forger' && option.unlock.forger === forger),
  );
}

/** Marco que desbloqueia as Relíquias raras. */
export function milestoneForRareRelics(): Milestone | undefined {
  return MILESTONES.find((milestone) =>
    milestone.options.some((option) => option.unlock.kind === 'rareRelics'),
  );
}

// ---------------------------------------------------------------------------
// Estado persistido e derivações
// ---------------------------------------------------------------------------

export interface PersistedProgression {
  readonly stats: ProfileStats;
  /** Ids das opções de desbloqueio já reivindicadas. */
  readonly claimedOptions: readonly string[];
}

export const DEFAULT_PROGRESSION: PersistedProgression = {
  stats: DEFAULT_PROFILE_STATS,
  claimedOptions: [],
};

/**
 * Estado carregado do storage, normalizado: saves antigos, gravados antes de
 * um campo novo entrar em ProfileStats (ex. winsByForger, ADR 0009), não têm
 * esse campo — o merge profundo em stats aplica os defaults sem perder o
 * resto. Null (sem save) vira o estado inicial. Espelha normalizeShopState
 * (engine/shop.ts), mas com merge em dois níveis: ao contrário de
 * PersistedShop (objeto plano), stats é aninhado, e um merge raso deixaria
 * um stats antigo sem os campos novos.
 */
export function normalizeProgression(state: PersistedProgression | null): PersistedProgression {
  if (state === null) return DEFAULT_PROGRESSION;
  return { ...DEFAULT_PROGRESSION, ...state, stats: { ...DEFAULT_PROFILE_STATS, ...state.stats } };
}

/** Port de persistência da meta-progressão (injetado; memória para testes). */
export interface ProgressionStorage {
  load(): PersistedProgression | null;
  save(state: PersistedProgression): void;
}

/** Implementação em memória do port, para testes. */
export function createMemoryProgressionStorage(initial?: PersistedProgression): ProgressionStorage {
  let stored = initial ?? null;
  return {
    load: () => stored,
    save: (state) => {
      stored = state;
    },
  };
}

/** Persiste o estado da meta-progressão no storage injetado. */
export function saveProgression(storage: ProgressionStorage, state: PersistedProgression): void {
  storage.save(state);
}

/** Acumulador mutável de computeUnlocks (UnlocksState, mas com campos graváveis). */
export interface UnlocksDraft {
  forgers: ForgerId[];
  extraEffects: string[];
  rareRelics: boolean;
}

/**
 * Aplica um único desbloqueio já reivindicado a um UnlocksDraft em
 * construção. Extraída de computeUnlocks pra ser testável com uma
 * UnlockKind sintética, sem depender de um Milestone real em MILESTONES —
 * necessário pro kind 'title' (ADR 0009), que não concede nada aqui.
 */
export function applyUnlockKind(draft: UnlocksDraft, unlock: UnlockKind): void {
  switch (unlock.kind) {
    case 'forger':
      draft.forgers.push(unlock.forger);
      return;
    case 'forgeEffect':
      draft.extraEffects.push(unlock.effectId);
      return;
    case 'rareRelics':
      draft.rareRelics = true;
      return;
    case 'title':
      return;
    default:
      assertNever(unlock);
  }
}

/** Desbloqueios efetivos derivados das opções reivindicadas. */
export function computeUnlocks(p: PersistedProgression): UnlocksState {
  const claimed = new Set(p.claimedOptions);
  const draft: UnlocksDraft = { forgers: ['apprentice'], extraEffects: [], rareRelics: false };
  for (const { option } of OPTION_INDEX.values()) {
    if (!claimed.has(option.id)) continue;
    applyUnlockKind(draft, option.unlock);
  }
  return draft;
}

/** True se o Forjador pode ser escolhido com os desbloqueios atuais. */
export function isForgerUnlocked(unlocks: UnlocksState, forger: ForgerId): boolean {
  return unlocks.forgers.includes(forger);
}

/**
 * Pools de oferta da Forja filtrados pelos desbloqueios atuais: os Efeitos
 * de Forja bônus entram conforme reivindicados e as Relíquias raras só entram
 * com o desbloqueio de recorde.
 */
export function poolsFor(unlocks: UnlocksState): {
  forgeEffects: readonly ForgeEffectOption[];
  relics: readonly Relic[];
} {
  const bonus = BONUS_FORGE_EFFECTS.filter((option) => unlocks.extraEffects.includes(option.id));
  return {
    forgeEffects: [...FORGE_EFFECT_POOL, ...bonus],
    relics: RELIC_POOL.filter((relic) => relic.rarity !== 'rare' || unlocks.rareRelics),
  };
}

// ---------------------------------------------------------------------------
// Marcos: detecção, pendências e reivindicação
// ---------------------------------------------------------------------------

export interface PendingMilestone {
  readonly milestone: Milestone;
  /** Opções ainda não reivindicadas deste marco atingido. */
  readonly unclaimedOptions: readonly MilestoneOption[];
}

/** Marcos cuja condição já foi atingida e que ainda têm opções por reivindicar. */
export function pendingMilestones(p: PersistedProgression): PendingMilestone[] {
  const claimed = new Set(p.claimedOptions);
  const pending: PendingMilestone[] = [];
  for (const milestone of MILESTONES) {
    if (!milestone.condition(p.stats)) continue;
    const unclaimed = milestone.options.filter((option) => !claimed.has(option.id));
    if (unclaimed.length === 0) continue;
    pending.push({ milestone, unclaimedOptions: unclaimed });
  }
  return pending;
}

/**
 * Reivindica automaticamente, ao fim da Run, as opções únicas de marcos
 * atingidos (não há ordem a escolher). Retorna o estado novo + os ids
 * reivindicados agora (para o banner de "novo desbloqueio").
 */
export function claimReachedSingles(p: PersistedProgression): {
  persisted: PersistedProgression;
  claimed: readonly string[];
} {
  const claimed = new Set(p.claimedOptions);
  const newly: string[] = [];
  for (const milestone of MILESTONES) {
    if (milestone.options.length !== 1) continue;
    if (!milestone.condition(p.stats)) continue;
    const option = milestone.options[0];
    if (claimed.has(option.id)) continue;
    claimed.add(option.id);
    newly.push(option.id);
  }
  return { persisted: { ...p, claimedOptions: [...p.claimedOptions, ...newly] }, claimed: newly };
}

/** True se a opção pode ser reivindicada agora (marco atingido e não reivindicada). */
export function isOptionClaimable(p: PersistedProgression, optionId: string): boolean {
  if (p.claimedOptions.includes(optionId)) return false;
  const milestone = milestoneOfOption(optionId);
  return milestone !== undefined && milestone.condition(p.stats);
}

/** Reivindica uma opção de desbloqueio (escolha da ordem num marco multi-opção). */
export function claimOption(p: PersistedProgression, optionId: string): PersistedProgression {
  if (!isOptionClaimable(p, optionId)) {
    throw new Error(`Opção de desbloqueio indisponível: ${optionId}.`);
  }
  return { ...p, claimedOptions: [...p.claimedOptions, optionId] };
}

/** Título legível de uma opção (para banners e listas). */
export function milestoneOptionTitle(optionId: string): string {
  return milestoneOptionById(optionId)?.title ?? optionId;
}

/** Status de cada opção de desbloqueio (para a tela de Coleção). */
export interface UnlockStatus {
  readonly option: MilestoneOption;
  readonly milestone: Milestone;
  readonly claimed: boolean;
  /** Atingida a condição do marco e ainda não reivindicada → pode desbloquear. */
  readonly available: boolean;
}

export function unlockStatuses(p: PersistedProgression): UnlockStatus[] {
  const claimed = new Set(p.claimedOptions);
  return MILESTONES.flatMap((milestone) =>
    milestone.options.map((option) => ({
      option,
      milestone,
      claimed: claimed.has(option.id),
      available: milestone.condition(p.stats) && !claimed.has(option.id),
    })),
  );
}

/** Resolve um Efeito de Forja bônus pelo id (para exibição na Coleção). */
export function bonusForgeEffectById(effectId: string): ForgeEffect | undefined {
  return BONUS_FORGE_EFFECTS.find((option) => option.id === effectId)?.effect;
}
