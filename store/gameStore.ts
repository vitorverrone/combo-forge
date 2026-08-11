/**
 * Camada de estado (Zustand) da Run jogável + meta-progressão (ticket 11).
 *
 * Nenhuma regra de jogo vive aqui: o store apenas (a) guarda o estado do
 * motor (RunState) e estado de UI (tela, seleção de cartas), (b) despacha as
 * ações do jogador para o motor puro com a stream de RNG contínua que ele
 * mesmo criou no startRun, (c) persiste o histórico DDA ao fim de cada
 * Rodada e (d) acumula estatísticas de perfil e reivindica desbloqueios de
 * meta-progressão ao fim de cada Run (funções puras de progression.ts),
 * persistindo via port injetado (memória nos testes; SQLite no app).
 * Tudo o que a UI precisa ler vem de funções puras do motor.
 */

import { useStore } from 'zustand';
import { createStore, StoreApi } from 'zustand/vanilla';

import {
  activeRelics,
  Card,
  cardKey,
  claimOption as engineClaimOption,
  claimReachedSingles,
  computeUnlocks,
  createMemoryDdaStorage,
  createMemoryProgressionStorage,
  createSeededRng,
  currentPlayNumber,
  DEFAULT_DDA_CONFIG,
  DEFAULT_PROGRESSION,
  discard,
  DdaStorage,
  applyForgeOffer as engineApplyForgeOffer,
  evaluatePlay,
  ForgerId,
  isEasyWin,
  isForgerUnlocked,
  isOptionClaimable,
  loadDda,
  makePlay,
  milestoneOptionTitle,
  PendingMilestone,
  pendingMilestones,
  PersistedProgression,
  persistDda,
  PlayEvaluation,
  ProgressionStorage,
  recordPlay,
  recordRunEnd,
  Rng,
  RunEvent,
  RunState,
  saveProgression,
  scoreModifiers,
  startNextRound,
  startRun as engineStartRun,
} from '../engine';

export type Screen = 'start' | 'game' | 'profile' | 'collection';

/** Máximo de cartas selecionáveis (tamanho máximo de uma Jogada). */
export const MAX_SELECTION = 5;

export interface GameState {
  readonly screen: Screen;
  readonly forger: ForgerId;
  readonly run: RunState | null;
  /** Identidades (`naipe:valor`) das cartas da Mão selecionadas. */
  readonly selectedKeys: readonly string[];
  /** Eventos do motor da última ação (para a UI reagir a eles). */
  readonly lastEvents: readonly RunEvent[];
  /** Stream contínua de RNG da Run; criada no startRun e usada em toda ação. */
  readonly rng: Rng | null;
  readonly ddaStorage: DdaStorage;
  /** Meta-progressão persistida: estatísticas de perfil + desbloqueios. */
  readonly progression: PersistedProgression;
  /**
   * Marco com mais de uma opção aguardando a escolha de ordem do jogador
   * (modal). Null quando não há escolha pendente.
   */
  readonly unlockChoice: PendingMilestone | null;
  /** Títulos dos desbloqueios recém-concedidos (banner nas telas de fim de Run). */
  readonly recentUnlocks: readonly string[];

  readonly chooseForger: (forger: ForgerId) => void;
  readonly startRun: () => void;
  readonly toggleCard: (key: string) => void;
  readonly clearSelection: () => void;
  readonly playSelection: () => void;
  readonly discardSelection: () => void;
  /**
   * Aplica a oferta de Forja escolhida (índice em run.forgeOffers). Ofertas
   * de carta exigem a carta alvo do Baralho; a de Relíquia, só o índice.
   * Encerra a fase 'forging' e volta para 'roundWon' (pronto para nextRound).
   */
  readonly applyForgeOffer: (offerIndex: number, targetCard?: Card) => void;
  /** Avança para a próxima Rodada após vencer e forjar (fase 'roundWon'). */
  readonly nextRound: () => void;
  /** Reinicia imediatamente uma nova Run (novo seed, mesmo Forjador). */
  readonly restartRun: () => void;
  /** Reivindica uma opção de desbloqueio pendente (escolha da ordem). */
  readonly claimUnlock: (optionId: string) => void;
  /** Fecha o modal de escolha de desbloqueio sem reivindicar (fica na Coleção). */
  readonly dismissUnlockChoice: () => void;
  readonly openProfile: () => void;
  readonly openCollection: () => void;
  readonly backToStart: () => void;
}

export interface GameStoreDeps {
  readonly ddaStorage?: DdaStorage;
  /** Port de persistência da meta-progressão (padrão: memória, p/ testes). */
  readonly progressionStorage?: ProgressionStorage;
  /** Meta-progressão inicial (padrão: nova; injetável em testes). */
  readonly initialProgression?: PersistedProgression;
  /** Fonte de seed da próxima Run (padrão: relógio; injetável em testes). */
  readonly seed?: () => number;
}

/** Seleção resolvida em cartas da Mão, na ordem da Mão. */
export function selectedCards(run: RunState, selectedKeys: readonly string[]): Card[] {
  const keys = new Set(selectedKeys);
  return run.deck.hand.filter((card) => keys.has(cardKey(card)));
}

/**
 * Preview do melhor Padrão e do Valor-Base da seleção atual, avaliado pelo
 * motor com o contexto da Run (Cartas Forjadas, Jogada atual e Relíquias).
 * Null quando não há seleção ou ela é inválida.
 */
export function selectionPreview(
  run: RunState | null,
  selectedKeys: readonly string[],
): PlayEvaluation | null {
  if (run === null || selectedKeys.length === 0) return null;
  try {
    const selected = selectedCards(run, selectedKeys);
    return evaluatePlay(selected, {
      forgedCards: run.forgedCards,
      playNumber: currentPlayNumber(run),
      modifiers: scoreModifiers(activeRelics(run.startingRelic, run.relics)),
    });
  } catch {
    return null;
  }
}

/**
 * Persiste o histórico DDA a partir dos eventos de fim de Rodada do motor.
 * Runs "sem DDA" (ddaConfig.enabled false, Desafio Diário) não tocam o
 * histórico — a carga já devolve o estado neutro e nada deve ser salvo.
 */
export function persistRoundEnd(
  run: RunState,
  events: readonly RunEvent[],
  storage: DdaStorage,
): void {
  if (!run.ddaConfig.enabled) return;
  for (const event of events) {
    if (event.type === 'roundWon') {
      const easyWin = isEasyWin(event.score, event.target, run.playsRemaining, DEFAULT_DDA_CONFIG);
      persistDda(storage, run.dda, { roundNumber: event.roundNumber, won: true, easyWin });
    } else if (event.type === 'roundLost') {
      persistDda(storage, run.dda, { roundNumber: event.roundNumber, won: false, easyWin: false });
    }
  }
}

export function createGameStore(deps: GameStoreDeps = {}): StoreApi<GameState> {
  const ddaStorage = deps.ddaStorage ?? createMemoryDdaStorage();
  const progressionStorage = deps.progressionStorage ?? createMemoryProgressionStorage();
  const nextSeed = deps.seed ?? (() => (Date.now() % 0xffffffff) >>> 0);

  return createStore<GameState>()((set, get) => ({
    screen: 'start',
    forger: 'apprentice',
    run: null,
    selectedKeys: [],
    lastEvents: [],
    rng: null,
    ddaStorage,
    progression: deps.initialProgression ?? DEFAULT_PROGRESSION,
    unlockChoice: null,
    recentUnlocks: [],

    chooseForger: (forger) => {
      // Forjadores bloqueados pela meta-progressão não podem ser escolhidos.
      if (!isForgerUnlocked(computeUnlocks(get().progression), forger)) return;
      set({ forger });
    },

    startRun: () => {
      const { forger, progression } = get();
      const unlocks = computeUnlocks(progression);
      if (!isForgerUnlocked(unlocks, forger)) return;
      const seed = nextSeed();
      const rng = createSeededRng(seed);
      const dda = loadDda(ddaStorage, DEFAULT_DDA_CONFIG);
      const run = engineStartRun(seed, { forger, dda, ddaConfig: DEFAULT_DDA_CONFIG, rng, unlocks });
      set({ screen: 'game', run, rng, selectedKeys: [], lastEvents: [], recentUnlocks: [] });
    },

    toggleCard: (key) => {
      const { run, selectedKeys } = get();
      if (run === null) return;
      const inHand = run.deck.hand.some((card) => cardKey(card) === key);
      if (!inHand) return; // seleção só é válida para cartas da Mão atual
      if (selectedKeys.includes(key)) {
        set({ selectedKeys: selectedKeys.filter((candidate) => candidate !== key) });
      } else if (selectedKeys.length < MAX_SELECTION) {
        set({ selectedKeys: [...selectedKeys, key] });
      }
    },

    clearSelection: () => set({ selectedKeys: [] }),

    playSelection: () => {
      const { run, rng, selectedKeys, ddaStorage: storage, progression } = get();
      if (run === null || rng === null || selectedKeys.length === 0) return;
      try {
        const played = selectedCards(run, selectedKeys);
        const result = makePlay(run, played, rng);
        persistRoundEnd(result.run, result.events, storage);
        set(advanceProgression(result, played, progression, get().unlockChoice, get().recentUnlocks, progressionStorage));
      } catch {
        // Jogada inválida (defesa da UI): estado permanece intacto
      }
    },

    discardSelection: () => {
      const { run, rng, selectedKeys, ddaStorage: storage } = get();
      if (run === null || rng === null || selectedKeys.length === 0) return;
      try {
        const nextRun = discard(run, selectedCards(run, selectedKeys), rng);
        set({ run: nextRun, selectedKeys: [], lastEvents: [] });
      } catch {
        // Sem Descarte restante (defesa da UI): estado permanece intacto
      }
    },

    applyForgeOffer: (offerIndex, targetCard) => {
      const { run } = get();
      if (run === null || run.phase !== 'forging') return;
      try {
        const result = engineApplyForgeOffer(run, offerIndex, targetCard);
        set({ run: result.run, selectedKeys: [], lastEvents: result.events });
      } catch {
        // Oferta/carta inválida (defesa da UI): estado permanece intacto
      }
    },

    nextRound: () => {
      const { run, rng } = get();
      if (run === null || rng === null || run.phase !== 'roundWon') return;
      set({ run: startNextRound(run, rng), selectedKeys: [], lastEvents: [] });
    },

    restartRun: () => {
      // Nova Run com novo seed e o mesmo Forjador, sem passar pela tela inicial.
      get().startRun();
    },

    claimUnlock: (optionId) => {
      const { progression } = get();
      if (!isOptionClaimable(progression, optionId)) return;
      const next = engineClaimOption(progression, optionId);
      saveProgression(progressionStorage, next);
      // O modal fecha após a escolha; as opções restantes ficam na Coleção.
      set({
        progression: next,
        unlockChoice: null,
        recentUnlocks: [milestoneOptionTitle(optionId)],
      });
    },

    dismissUnlockChoice: () => set({ unlockChoice: null }),

    openProfile: () => set({ screen: 'profile' }),
    openCollection: () => set({ screen: 'collection' }),

    backToStart: () =>
      set({ screen: 'start', run: null, selectedKeys: [], lastEvents: [], rng: null }),
  }));
}

/**
 * Avança a meta-progressão após uma ação de Jogada: acumula estatísticas por
 * Jogada, registra o fim da Run (vitória/derrota + recorde), reivindica
 * automaticamente os marcos de opção única e expõe o marco multi-opção
 * (escolha da ordem) como modal. Persiste o resultado no storage.
 */
function advanceProgression(
  result: { run: RunState; events: readonly RunEvent[] },
  played: readonly Card[],
  progression: PersistedProgression,
  currentChoice: PendingMilestone | null,
  currentUnlocks: readonly string[],
  storage: ProgressionStorage,
): Partial<GameState> {
  let next: PersistedProgression = progression;
  let unlockChoice = currentChoice;
  let recentUnlocks = currentUnlocks;

  const playedEvent = result.events.find((event) => event.type === 'played');
  if (playedEvent !== undefined) {
    next = { ...next, stats: recordPlay(next.stats, played, playedEvent.multiplier) };
  }

  const ended = result.events.find(
    (event) => event.type === 'runWon' || event.type === 'runLost',
  );
  if (ended !== undefined) {
    next = { ...next, stats: recordRunEnd(next.stats, ended.type === 'runWon', result.run.runScore) };
    const singles = claimReachedSingles(next);
    next = singles.persisted;
    if (singles.claimed.length > 0) {
      recentUnlocks = singles.claimed.map(milestoneOptionTitle);
    }
    const multi = pendingMilestones(next).find((candidate) => candidate.milestone.options.length > 1);
    if (multi !== undefined) {
      unlockChoice = multi;
    }
  }

  // Grava a cada Jogada: o blob é pequeno (estatísticas + ids) e o port do
  // SQLite é síncrono via KV store — aceitável no MVP.
  saveProgression(storage, next);
  return {
    run: result.run,
    selectedKeys: [],
    lastEvents: result.events,
    progression: next,
    unlockChoice,
    recentUnlocks,
  };
}

/** Store singleton usado pela UI (memória; o app injeta SQLite no boot). */
export const gameStore = createGameStore();

/** Hook da UI: seleciona uma fatia do estado do store. */
export function useGameStore<T>(selector: (state: GameState) => T): T {
  return useStore(gameStore, selector);
}
