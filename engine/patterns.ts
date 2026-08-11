/**
 * Reconhecimento de Padrões e cálculo do Valor-Base.
 *
 * Uma Jogada usa de 1 a 5 cartas; pontua o melhor Padrão formado pelas
 * cartas selecionadas e o Valor-Base é bônus do Padrão + soma dos Valores
 * de todas as cartas selecionadas. Funções puras e determinísticas.
 */

import { ACE_HIGH_VALUE, Card, isCard, MAX_CARD_VALUE, MIN_CARD_VALUE } from './cards';

export enum PatternKind {
  HighCard = 'highCard',
  Pair = 'pair',
  TwoPair = 'twoPair',
  ThreeOfAKind = 'threeOfAKind',
  Straight = 'straight',
  FullHouse = 'fullHouse',
  FourOfAKind = 'fourOfAKind',
}

export interface Pattern {
  readonly kind: PatternKind;
  readonly bonus: number;
}

/** Bônus de Padrão (sintonizável — a forma da regra importa, os números são dados). */
export const PATTERN_BONUSES: Readonly<Record<PatternKind, number>> = {
  [PatternKind.HighCard]: 0,
  [PatternKind.Pair]: 5,
  [PatternKind.TwoPair]: 15,
  [PatternKind.ThreeOfAKind]: 25,
  [PatternKind.Straight]: 40,
  [PatternKind.FullHouse]: 55,
  [PatternKind.FourOfAKind]: 70,
};

export interface PlayEvaluation {
  readonly pattern: Pattern;
  /** Valor-Base = bônus do Padrão + soma dos Valores de todas as cartas selecionadas. */
  readonly baseValue: number;
}

const MIN_PLAY_CARDS = 1;
const MAX_PLAY_CARDS = 5;

export function identifyPattern(cards: readonly Card[]): PatternKind {
  assertValidPlay(cards);

  const countByValue = new Map<number, number>();
  for (const { value } of cards) {
    countByValue.set(value, (countByValue.get(value) ?? 0) + 1);
  }
  const groupSizes = [...countByValue.values()].sort((a, b) => b - a);
  const largestGroup = groupSizes[0];
  const pairCount = groupSizes.filter((size) => size === 2).length;

  if (largestGroup === 4) return PatternKind.FourOfAKind;
  if (largestGroup === 3 && pairCount === 1) return PatternKind.FullHouse;
  if (largestGroup === 3) return PatternKind.ThreeOfAKind;
  if (cards.length === 5 && groupSizes.length === 5 && isStraight([...countByValue.keys()])) {
    return PatternKind.Straight;
  }
  if (pairCount === 2) return PatternKind.TwoPair;
  if (pairCount === 1) return PatternKind.Pair;
  return PatternKind.HighCard;
}

export function evaluatePlay(cards: readonly Card[]): PlayEvaluation {
  const kind = identifyPattern(cards);
  const bonus = PATTERN_BONUSES[kind];
  const baseValue = bonus + sumCardValues(cards);
  return { pattern: { kind, bonus }, baseValue };
}

function sumCardValues(cards: readonly Card[]): number {
  return cards.reduce((total, { value }) => total + value, 0);
}

/**
 * Uma Sequência é exatamente 5 Valores distintos e consecutivos.
 * O Ás (1) também pode participar como 11 — a "Sequência 10–Ás"
 * equivale a 7,8,9,10,Ás.
 */
function isStraight(values: readonly number[]): boolean {
  if (isConsecutiveRun([...values].sort((a, b) => a - b))) return true;
  if (values.includes(MIN_CARD_VALUE)) {
    const withAceHigh = values
      .map((value) => (value === MIN_CARD_VALUE ? ACE_HIGH_VALUE : value))
      .sort((a, b) => a - b);
    return isConsecutiveRun(withAceHigh);
  }
  return false;
}

function isConsecutiveRun(sortedAsc: readonly number[]): boolean {
  for (let i = 1; i < sortedAsc.length; i += 1) {
    if (sortedAsc[i] !== sortedAsc[i - 1] + 1) return false;
  }
  return true;
}

function assertValidPlay(cards: readonly Card[]): void {
  if (cards.length < MIN_PLAY_CARDS || cards.length > MAX_PLAY_CARDS) {
    throw new Error(`Jogada precisa de ${MIN_PLAY_CARDS} a ${MAX_PLAY_CARDS} cartas (recebidas: ${cards.length}).`);
  }
  for (const card of cards) {
    if (!isCard(card)) {
      throw new Error(`Carta inválida na Jogada: ${JSON.stringify(card)}.`);
    }
  }
  const uniqueCards = new Set(cards.map((card) => `${card.suit}:${card.value}`));
  if (uniqueCards.size !== cards.length) {
    throw new Error('Jogada não pode conter cartas duplicadas (mesmo Naipe e Valor).');
  }
}
