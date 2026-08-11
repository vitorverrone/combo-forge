/**
 * Baralho, Mão e Descarte.
 *
 * O Baralho tem 40 cartas (4 Naipes × Valores 1–10) e é reciclado: ao fim de
 * cada Rodada todas as cartas (drawPile + discardPile + Mão) voltam ao
 * Baralho, que é reembaralhado para a Rodada seguinte. Dentro da Rodada, o
 * discardPile é reembaralhado no drawPile quando ele esgota. Estado
 * serializável, sem referências de UI.
 */

import { Card, SUITS } from './cards';
import { Rng } from './random';

export const HAND_SIZE = 7;
export const DISCARDS_PER_ROUND = 2;
export const DECK_SIZE = 40;
const MIN_CARD_VALUE = 1;
const MAX_CARD_VALUE = 10;

export interface DeckState {
  /** Cartas disponíveis para compra (fim da lista = topo). */
  readonly drawPile: readonly Card[];
  /** Cartas jogadas/descartadas na Rodada atual; reembaralhadas se o drawPile esgota. */
  readonly discardPile: readonly Card[];
  /** Cartas na Mão do jogador (máx. HAND_SIZE). */
  readonly hand: readonly Card[];
  /** Descarte restante na Rodada atual; não usados são perdidos. */
  readonly discardsRemaining: number;
}

/**
 * O Baralho completo: 40 cartas únicas (4 Naipes × Valores 1–10, sem figuras).
 *
 * Cartas são imutáveis: a identidade é `naipe:valor` (única no Baralho) e os
 * Efeitos de Forja devem ser tratados como metadados por cima, nunca
 * mutando suit/value — do contrário a identidade quebra (ver ticket 05).
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let value = MIN_CARD_VALUE; value <= MAX_CARD_VALUE; value += 1) {
      deck.push(Object.freeze({ suit, value }));
    }
  }
  return deck;
}

/** Estado inicial: o Baralho completo ainda não embaralhado, Mão vazia. */
export function initialDeckState(): DeckState {
  return { drawPile: createDeck(), discardPile: [], hand: [], discardsRemaining: 0 };
}

/** Fisher–Yates determinístico usando a fonte de aleatoriedade injetada. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.min(Math.floor(rng() * (i + 1)), i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Inicia (ou recicla) uma Rodada: junta todas as cartas do estado anterior
 * (reciclagem), reembaralha, compra a Mão de 7 e reinicia os Descarte.
 */
export function startRound(previous: DeckState, rng: Rng): DeckState {
  const allCards = [...previous.drawPile, ...previous.discardPile, ...previous.hand];
  return drawToHand(
    { drawPile: shuffle(allCards, rng), discardPile: [], hand: [], discardsRemaining: DISCARDS_PER_ROUND },
    rng,
  );
}

/** Compra do drawPile até encher a Mão (HAND_SIZE), reembaralhando o discardPile se necessário. */
export function drawToHand(state: DeckState, rng: Rng): DeckState {
  let { drawPile, discardPile, hand } = state;
  while (hand.length < HAND_SIZE) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      drawPile = shuffle(discardPile, rng);
      discardPile = [];
    }
    hand = [...hand, drawPile[drawPile.length - 1]];
    drawPile = drawPile.slice(0, -1);
  }
  return { ...state, drawPile, discardPile, hand };
}

/**
 * Ação de Descarte: devolve as cartas escolhidas da Mão ao discardPile e
 * compra o mesmo número. Consome 1 Descarte da Rodada (máx. DISCARDS_PER_ROUND).
 */
export function discardCards(state: DeckState, selected: readonly Card[], rng: Rng): DeckState {
  if (selected.length === 0) throw new Error('Descarte precisa de pelo menos uma carta.');
  if (state.discardsRemaining <= 0) throw new Error('Nenhum Descarte restante nesta Rodada.');
  const { removed, nextHand } = removeFromHand(state, selected);
  const moved: DeckState = {
    ...state,
    hand: nextHand,
    discardPile: [...state.discardPile, ...removed],
    discardsRemaining: state.discardsRemaining - 1,
  };
  return drawToHand(moved, rng);
}

/**
 * Ação de Jogar: move as cartas selecionadas da Mão para o discardPile e
 * reabastece a Mão. A pontuação da Jogada é responsabilidade do módulo de
 * Rodada (que compõe esta função com o cálculo de pontos) — inclusive a
 * validação de tamanho da Jogada (1–5 cartas, ver evaluatePlay).
 */
export function playCards(state: DeckState, selected: readonly Card[], rng: Rng): DeckState {
  const { removed, nextHand } = removeFromHand(state, selected);
  return drawToHand(
    { ...state, hand: nextHand, discardPile: [...state.discardPile, ...removed] },
    rng,
  );
}

function removeFromHand(
  state: DeckState,
  selected: readonly Card[],
): { removed: Card[]; nextHand: Card[] } {
  if (selected.length === 0) throw new Error('Seleção vazia: escolha ao menos uma carta.');
  const selectedIds = new Set(selected.map(cardId));
  if (selectedIds.size !== selected.length) throw new Error('Seleção contém cartas duplicadas.');
  const removed: Card[] = [];
  const nextHand: Card[] = [];
  for (const card of state.hand) {
    if (selectedIds.has(cardId(card))) {
      removed.push(card);
      selectedIds.delete(cardId(card));
    } else {
      nextHand.push(card);
    }
  }
  if (selectedIds.size > 0) throw new Error('Seleção contém cartas que não estão na Mão.');
  return { removed, nextHand };
}

function cardId(card: Card): string {
  return `${card.suit}:${card.value}`;
}
