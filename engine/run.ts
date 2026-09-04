/**
 * Rodada, Meta, Multiplicador de Combo, Forja, Relíquias e Forjadores.
 *
 * Uma Run tem ROUNDS_PER_RUN Rodadas; cada Rodada tem PLAYS_PER_ROUND
 * Jogadas. A Jogada pontua Valor-Base × Multiplicador de Combo (×1 na 1ª,
 * ×4 na 4ª, zerando a cada Rodada; Relíquias de Combo alteram o
 * Multiplicador). A Meta segue a curva base e a Rodada é vencida ao atingir
 * a Meta antes de esgotar as Jogadas; esgotar sem atingir perde a Run.
 *
 * Ao vencer uma Rodada (1ª à 5ª) a Run entra na fase 'forging' com 3 ofertas
 * de Forja geradas de uma stream própria do seed da Run (ver forge.ts);
 * vencer a 6ª Rodada encerra a Run em vitória, sem Forja. Aplicar uma oferta
 * (applyForgeOffer) transforma a carta escolhida numa Carta Forjada ou
 * adquire uma Relíquia — efeitos permanentes na Run, carregados entre
 * Rodadas.
 *
 * Relíquias e Forjadores (ticket 06): o Forjador escolhido no startRun traz
 * uma Relíquia exclusiva de largada (fora do teto de 3) e as Relíquias
 * aplicam regras à pontuação (Naipe/Padrão), à estrutura da Rodada
 * (Mecânica: Mão/Descarte) e ao Multiplicador de Combo.
 *
 * DDA (ticket 07): as Metas partem da curva base ajustada pelo histórico
 * persistido entre Runs (dda) — −10% na Rodada da última derrota com falhas
 * consecutivas, +10% com vitórias fáceis consecutivas, que também aumentam
 * a frequência de Relíquia rara. A flag "sem DDA" (ddaConfig.enabled false,
 * Desafio Diário) deixa as Metas na curva base. Estado serializável, sem
 * referências de UI.
 */

import { Card, ForgedCard } from './cards';
import { adjustTarget, DdaConfig, DEFAULT_DDA_CONFIG, DEFAULT_DDA_STATE, DdaState } from './dda';
import { DeckState, discardCards, initialDeckState, isDeckCard, playCards, RoundStructure, startRound } from './deck';
import { ForgeOffer, forgeCard, forgeOfferSeed, generateForgeOffers } from './forge';
import { ForgerId, getForger } from './forgers';
import { evaluatePlay } from './patterns';
import { ALL_UNLOCKS, isForgerUnlocked, poolsFor, UnlocksState } from './progression';
import { createSeededRng, Rng } from './random';
import { activeRelics, comboMultiplier, Relic, RELIC_CAP, scoreModifiers, structureModifiers } from './relics';

export const PLAYS_PER_ROUND = 4;
export const ROUNDS_PER_RUN = 6;
export const BASE_TARGET = 50;
export const TARGET_GROWTH = 1.7;

export type RunPhase = 'playing' | 'forging' | 'roundWon' | 'runWon' | 'runLost';

export interface RunState {
  /** Seed da Run: toda a aleatoriedade (embaralhamento e Forja) deriva dele. */
  readonly seed: number;
  readonly deck: DeckState;
  readonly roundNumber: number;
  readonly playsRemaining: number;
  /** Pontos acumulados na Rodada atual. */
  readonly score: number;
  /** Pontos acumulados na Run inteira (soma das Rodadas). */
  readonly runScore: number;
  /** Meta da Rodada atual (curva base; o DDA ajusta em fases futuras). */
  readonly target: number;
  readonly phase: RunPhase;
  /** Cartas Forjadas da Run (permanentes, aplicadas em toda Jogada). */
  readonly forgedCards: readonly ForgedCard[];
  /** Relíquias adquiridas via Forja (máx. RELIC_CAP). */
  readonly relics: readonly Relic[];
  /** Relíquia exclusiva de largada do Forjador (fora do teto de 3). */
  readonly startingRelic?: Relic;
  /** Forjador escolhido no início da Run. */
  readonly forger: ForgerId;
  /** Histórico DDA que ajusta as Metas (snapshot do início da Run). */
  readonly dda: DdaState;
  /** Parâmetros do DDA; `enabled: false` desliga todos os ajustes (Desafio Diário). */
  readonly ddaConfig: DdaConfig;
  /** Desbloqueios de conteúdo (ticket 11): filtram os pools de Forja e o Forjador. */
  readonly unlocks: UnlocksState;
  /** Ofertas da Forja atual (preenchido apenas na fase 'forging'). */
  readonly forgeOffers: readonly ForgeOffer[];
}

export type RunEvent =
  | {
    type: 'played';
    roundNumber: number;
    baseValue: number;
    multiplier: number;
    points: number;
    score: number;
    target: number;
    playsRemaining: number;
  }
  | { type: 'roundWon'; roundNumber: number; score: number; target: number }
  | { type: 'roundLost'; roundNumber: number; score: number; target: number }
  | { type: 'runWon'; roundNumber: number; runScore: number }
  | { type: 'runLost'; roundNumber: number; runScore: number }
  | { type: 'forgeOffers'; roundNumber: number; offers: readonly ForgeOffer[] }
  | { type: 'forgeApplied'; roundNumber: number; offerIndex: number };

/**
 * Meta base da Rodada R: 50 × 1,7^(R−1), arredondada.
 *
 * Nota: 1,7² = 2,88999… (ponto flutuante), então a Rodada 3 dá 144 (não 145
 * como no exemplo ilustrativo da spec) — não "corrigir" o arredondamento.
 */
export function baseTarget(roundNumber: number): number {
  return Math.round(BASE_TARGET * Math.pow(TARGET_GROWTH, roundNumber - 1));
}

/**
 * Multiplicador da Meta por Forjador (app-polish-pass-2, ticket 04) — hoje só
 * a Bigorna: já começa com o Multiplicador de Combo em ×1.5 (ver
 * forgers.ts), então a Meta sobe na mesma proporção pra virar uma troca de
 * dificuldade real, não um bônus gratuito. Demais Forjadores ficam em 1
 * (curva base inalterada). O Desafio Diário usa Forjador fixo `apprentice`
 * (store/dailyFlow.ts) — nunca passa por aqui com `anvil`, então o ranking
 * semanal comparável entre jogadores não é afetado.
 */
const FORGER_TARGET_MULTIPLIER: Readonly<Record<ForgerId, number>> = {
  apprentice: 1,
  hammer: 1,
  anvil: 1.5,
};

/** Meta base da Rodada R já escalada pelo Forjador, antes do ajuste de DDA. */
function forgerScaledTarget(roundNumber: number, forger: ForgerId): number {
  return Math.round(baseTarget(roundNumber) * FORGER_TARGET_MULTIPLIER[forger]);
}

/** Número (1-based) da próxima Jogada dentro da Rodada. */
export function currentPlayNumber(run: RunState): number {
  return PLAYS_PER_ROUND - run.playsRemaining + 1;
}

/** Multiplicador de Combo da próxima Jogada (Relíquias de Combo alteram). */
export function currentMultiplier(run: RunState): number {
  return comboMultiplier(currentPlayNumber(run), activeRelics(run.startingRelic, run.relics));
}

export interface StartRunOptions {
  /** Forjador escolhido (padrão: Aprendiz). */
  readonly forger?: ForgerId;
  /** Histórico DDA persistido entre Runs (padrão: neutro). */
  readonly dda?: DdaState;
  /** Parâmetros do DDA; `enabled: false` desliga os ajustes (Desafio Diário). */
  readonly ddaConfig?: DdaConfig;
  /**
   * Stream contínua de RNG do embaralhamento/compra; quem chama é dono da
   * stream e deve passá-la às ações seguintes. Default: criada do seed
   * (cada startRun usa uma stream nova).
   */
  readonly rng?: Rng;
  /**
   * Desbloqueios de conteúdo da meta-progressão (ticket 11): filtram os
   * pools de Forja (Efeitos bônus e Relíquias raras) e gateam o Forjador.
   * Padrão: tudo desbloqueado.
   */
  readonly unlocks?: UnlocksState;
}

/**
 * Inicia uma nova Run (Rodada 1) a partir do seed — determina embaralhamento
 * e Forjas — com o Forjador escolhido (padrão: Aprendiz) e o histórico DDA.
 * A Relíquia exclusiva de largada do Forjador entra fora do teto de 3. O
 * Forjador precisa estar desbloqueado nos unlocks passados (ticket 11).
 */
export function startRun(seed: number, options: StartRunOptions = {}): RunState {
  const forger = getForger(options.forger ?? 'apprentice');
  const unlocks = options.unlocks ?? ALL_UNLOCKS;
  if (!isForgerUnlocked(unlocks, forger.id)) {
    throw new Error(`Forjador bloqueado pela meta-progressão: ${forger.id}.`);
  }
  return startRoundState(
    initialDeckState(),
    1,
    options.rng ?? createSeededRng(seed),
    0,
    seed,
    [],
    [],
    forger.startingRelic,
    forger.id,
    options.dda ?? DEFAULT_DDA_STATE,
    options.ddaConfig ?? DEFAULT_DDA_CONFIG,
    unlocks,
  );
}

/**
 * Avança para a próxima Rodada (reciclando o deck), carregando Cartas
 * Forjadas, Relíquias e o Forjador. Válido apenas após a Rodada atual ter
 * sido vencida e a Forja aplicada (fase 'roundWon').
 */
export function startNextRound(run: RunState, rng: Rng): RunState {
  if (run.phase !== 'roundWon') {
    throw new Error('Só é possível avançar após vencer a Rodada atual e forjar.');
  }
  if (run.roundNumber >= ROUNDS_PER_RUN) {
    throw new Error('A Run já terminou (todas as Rodadas foram vencidas).');
  }
  return startRoundState(
    run.deck,
    run.roundNumber + 1,
    rng,
    run.runScore,
    run.seed,
    run.forgedCards,
    run.relics,
    run.startingRelic,
    run.forger,
    run.dda,
    run.ddaConfig,
    run.unlocks,
  );
}

function startRoundState(
  previousDeck: DeckState,
  roundNumber: number,
  rng: Rng,
  runScore: number,
  seed: number,
  forgedCards: readonly ForgedCard[] = [],
  relics: readonly Relic[] = [],
  startingRelic?: Relic,
  forger: ForgerId = 'apprentice',
  dda: DdaState = DEFAULT_DDA_STATE,
  ddaConfig: DdaConfig = DEFAULT_DDA_CONFIG,
  unlocks: UnlocksState = ALL_UNLOCKS,
): RunState {
  return {
    seed,
    deck: startRound(previousDeck, rng, runStructureOf(startingRelic, relics)),
    roundNumber,
    playsRemaining: PLAYS_PER_ROUND,
    score: 0,
    runScore,
    target: adjustTarget(forgerScaledTarget(roundNumber, forger), roundNumber, dda, ddaConfig),
    phase: 'playing',
    forgedCards,
    relics,
    startingRelic,
    forger,
    dda,
    ddaConfig,
    unlocks,
    forgeOffers: [],
  };
}

/**
 * Ação de Descarte da Rodada: devolve as cartas escolhidas ao descarte e
 * compra o mesmo número, consumindo 1 Descarte. Envolve deck.discardCards e
 * atualiza o deck do estado da Run. Não altera a pontuação.
 */
export function discard(run: RunState, selected: readonly Card[], rng: Rng): RunState {
  if (run.phase !== 'playing') {
    throw new Error(`Não é possível descartar na fase '${run.phase}'.`);
  }
  return { ...run, deck: discardCards(run.deck, selected, rng, runStructure(run).handSize) };
}

/**
 * Joga as cartas selecionadas: pontua Valor-Base (com Efeitos de Forja e
 * Relíquias de Naipe/Padrão) × Multiplicador de Combo (com Relíquias de
 * Combo), move as cartas para o descarte, reabastece a Mão e avalia o fim da
 * Rodada e da Run. Vencer a Rodada R (1–5) gera as ofertas de Forja e entra
 * na fase 'forging'; vencer a 6ª encerra a Run em vitória. Retorna o novo
 * estado e os eventos emitidos.
 */
export function makePlay(
  run: RunState,
  selected: readonly Card[],
  rng: Rng,
): { run: RunState; events: RunEvent[] } {
  if (run.phase !== 'playing') {
    throw new Error(`Não é possível jogar na fase '${run.phase}'.`);
  }
  if (run.playsRemaining <= 0) {
    throw new Error('Nenhuma Jogada restante nesta Rodada.');
  }

  const relics = activeRelics(run.startingRelic, run.relics);
  const playNumber = currentPlayNumber(run);
  const evaluation = evaluatePlay(selected, {
    forgedCards: run.forgedCards,
    playNumber,
    modifiers: scoreModifiers(relics),
  });
  const multiplier = comboMultiplier(playNumber, relics);
  const points = evaluation.baseValue * multiplier;

  const deck = playCards(run.deck, selected, rng, runStructure(run).handSize);
  const playsRemaining = run.playsRemaining - 1;
  const score = run.score + points;

  const events: RunEvent[] = [
    {
      type: 'played',
      roundNumber: run.roundNumber,
      baseValue: evaluation.baseValue,
      multiplier,
      points,
      score,
      target: run.target,
      playsRemaining,
    },
  ];

  const base: RunState = {
    ...run,
    deck,
    playsRemaining,
    score,
    runScore: run.runScore + points,
  };

  if (score >= run.target) {
    events.push({ type: 'roundWon', roundNumber: run.roundNumber, score, target: run.target });
    if (run.roundNumber >= ROUNDS_PER_RUN) {
      events.push({ type: 'runWon', roundNumber: run.roundNumber, runScore: base.runScore });
      return { run: { ...base, phase: 'runWon' }, events };
    }
    const pools = poolsFor(run.unlocks);
    const offers = generateForgeOffers(
      createSeededRng(forgeOfferSeed(run.seed, run.roundNumber)),
      run.relics,
      {
        // sequência de vitórias fáceis aumenta a frequência de Relíquia rara
        rareRelicBoost: run.ddaConfig.enabled && run.dda.easyWins >= run.ddaConfig.easyWinThreshold,
        // pools filtrados pelos desbloqueios da meta-progressão (ticket 11)
        forgeEffects: pools.forgeEffects,
        relics: pools.relics,
      },
    );
    events.push({ type: 'forgeOffers', roundNumber: run.roundNumber, offers });
    return { run: { ...base, phase: 'forging', forgeOffers: offers }, events };
  }

  if (playsRemaining === 0) {
    events.push({ type: 'roundLost', roundNumber: run.roundNumber, score, target: run.target });
    events.push({ type: 'runLost', roundNumber: run.roundNumber, runScore: base.runScore });
    return { run: { ...base, phase: 'runLost' }, events };
  }

  return { run: base, events };
}

/**
 * Aplica a oferta de Forja escolhida: um Efeito de Forja na carta alvo
 * (transformando-a numa Carta Forjada, empilhando efeitos) ou a aquisição da
 * Relíquia. Abaixo do teto de RELIC_CAP, a Relíquia só é adicionada. No teto,
 * `replaceRelicId` (o id de uma Relíquia já adquirida, nunca a de largada do
 * Forjador — essa fica fora de `run.relics`) escolhe qual sai no lugar da
 * nova; omitido nesse caso, lança erro (a UI precisa perguntar antes de
 * chamar de novo). Encerra a fase 'forging' e volta para 'roundWon', pronta
 * para startNextRound.
 */
export function applyForgeOffer(
  run: RunState,
  offerIndex: number,
  targetCard?: Card,
  replaceRelicId?: string,
): { run: RunState; events: RunEvent[] } {
  if (run.phase !== 'forging') {
    throw new Error(`Não é possível forjar na fase '${run.phase}'.`);
  }
  const offer = run.forgeOffers[offerIndex];
  if (offer === undefined) {
    throw new Error(`Oferta de Forja inválida: índice ${offerIndex}.`);
  }

  if (offer.type === 'cardEffect') {
    if (targetCard === undefined) {
      throw new Error('Oferta de Efeito de Forja exige a carta alvo.');
    }
    if (!isDeckCard(targetCard)) {
      throw new Error(`Carta alvo fora do Baralho: ${JSON.stringify(targetCard)}.`);
    }
    const forgedCards = forgeCard(run.forgedCards, targetCard, offer.effect);
    return forgeApplied(run, forgedCards, run.relics, offerIndex);
  }

  if (run.relics.length < RELIC_CAP) {
    return forgeApplied(run, run.forgedCards, [...run.relics, offer.relic], offerIndex);
  }
  if (replaceRelicId === undefined) {
    throw new Error(`Teto de ${RELIC_CAP} Relíquias ativas atingido — escolha uma Relíquia para substituir.`);
  }
  if (!run.relics.some((relic) => relic.id === replaceRelicId)) {
    throw new Error(`Relíquia a substituir não encontrada entre as ativas: ${replaceRelicId}.`);
  }
  const relics = run.relics.map((relic) => (relic.id === replaceRelicId ? offer.relic : relic));
  return forgeApplied(run, run.forgedCards, relics, offerIndex);
}

/** Estrutura da Rodada derivada das Relíquias ativas (Mecânica). */
function runStructure(run: RunState): RoundStructure {
  return runStructureOf(run.startingRelic, run.relics);
}

function runStructureOf(startingRelic: Relic | undefined, relics: readonly Relic[]): RoundStructure {
  return structureModifiers(activeRelics(startingRelic, relics));
}

function forgeApplied(
  run: RunState,
  forgedCards: readonly ForgedCard[],
  relics: readonly Relic[],
  offerIndex: number,
): { run: RunState; events: RunEvent[] } {
  return {
    run: { ...run, forgedCards, relics, phase: 'roundWon', forgeOffers: [] },
    events: [{ type: 'forgeApplied', roundNumber: run.roundNumber, offerIndex }],
  };
}
