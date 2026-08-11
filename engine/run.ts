/**
 * Rodada, Meta e Multiplicador de Combo.
 *
 * Uma Run tem ROUNDS_PER_RUN Rodadas; cada Rodada tem PLAYS_PER_ROUND
 * Jogadas. A Jogada pontua Valor-Base × Multiplicador de Combo (×1 na 1ª,
 * ×4 na 4ª, zerando a cada Rodada). A Meta segue a curva base e a Rodada é
 * vencida ao atingir a Meta antes de esgotar as Jogadas; esgotar sem atingir
 * perde a Run. Estado serializável, sem referências de UI.
 */

import { Card } from './cards';
import { DeckState, discardCards, initialDeckState, playCards, startRound } from './deck';
import { evaluatePlay } from './patterns';
import { Rng } from './random';

export const PLAYS_PER_ROUND = 4;
export const ROUNDS_PER_RUN = 6;
export const BASE_TARGET = 50;
export const TARGET_GROWTH = 1.7;

export type RunPhase = 'playing' | 'roundWon' | 'runWon' | 'runLost';

export interface RunState {
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
  | { type: 'runLost'; roundNumber: number; runScore: number };

/**
 * Meta base da Rodada R: 50 × 1,7^(R−1), arredondada.
 *
 * Nota: 1,7² = 2,88999… (ponto flutuante), então a Rodada 3 dá 144 (não 145
 * como no exemplo ilustrativo da spec) — não "corrigir" o arredondamento.
 */
export function baseTarget(roundNumber: number): number {
  return Math.round(BASE_TARGET * Math.pow(TARGET_GROWTH, roundNumber - 1));
}

/** Multiplicador de Combo da próxima Jogada: ×1 na 1ª, ×4 na 4ª da Rodada. */
export function currentMultiplier(run: RunState): number {
  return PLAYS_PER_ROUND - run.playsRemaining + 1;
}

/** Inicia uma nova Run (Rodada 1). */
export function startRun(rng: Rng): RunState {
  return startRoundState(initialDeckState(), 1, rng);
}

/**
 * Avança para a próxima Rodada (reciclando o deck). Válido apenas quando a
 * Rodada atual foi vencida e ainda há Rodadas na Run.
 */
export function startNextRound(run: RunState, rng: Rng): RunState {
  if (run.phase !== 'roundWon') {
    throw new Error('Só é possível avançar após vencer a Rodada atual.');
  }
  if (run.roundNumber >= ROUNDS_PER_RUN) {
    throw new Error('A Run já terminou (todas as Rodadas foram vencidas).');
  }
  return startRoundState(run.deck, run.roundNumber + 1, rng, run.runScore);
}

function startRoundState(
  previousDeck: DeckState,
  roundNumber: number,
  rng: Rng,
  runScore = 0,
): RunState {
  return {
    deck: startRound(previousDeck, rng),
    roundNumber,
    playsRemaining: PLAYS_PER_ROUND,
    score: 0,
    runScore,
    target: baseTarget(roundNumber),
    phase: 'playing',
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
  return { ...run, deck: discardCards(run.deck, selected, rng) };
}

/**
 * Joga as cartas selecionadas: pontua Valor-Base × Multiplicador de Combo,
 * move as cartas para o descarte, reabastece a Mão e avalia o fim da Rodada
 * e da Run. Retorna o novo estado e os eventos emitidos.
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

  const evaluation = evaluatePlay(selected);
  const multiplier = currentMultiplier(run);
  const points = evaluation.baseValue * multiplier;

  const deck = playCards(run.deck, selected, rng);
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
    return { run: { ...base, phase: 'roundWon' }, events };
  }

  if (playsRemaining === 0) {
    events.push({ type: 'roundLost', roundNumber: run.roundNumber, score, target: run.target });
    events.push({ type: 'runLost', roundNumber: run.roundNumber, runScore: base.runScore });
    return { run: { ...base, phase: 'runLost' }, events };
  }

  return { run: base, events };
}
