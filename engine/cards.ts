/**
 * Tipos base de carta do Combo Forge.
 *
 * O Baralho tem 40 cartas: 4 Naipes × 10 Valores (1 a 10, sem figuras).
 * O Ás é o Valor 1; para formar Sequências ele pode contar como 11
 * (ACE_HIGH_VALUE), mas na soma do Valor-Base conta sempre seu valor
 * impresso (1).
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

export interface Card {
  readonly suit: Suit;
  /** Valor numérico de 1 a 10. */
  readonly value: number;
}

export const MIN_CARD_VALUE = 1;
export const MAX_CARD_VALUE = 10;

/** Valor do Ás quando participa de uma Sequência alta (7–10 + Ás). */
export const ACE_HIGH_VALUE = 11;

export function isCard(value: unknown): value is Card {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Card;
  return (
    SUITS.includes(candidate.suit) &&
    Number.isInteger(candidate.value) &&
    candidate.value >= MIN_CARD_VALUE &&
    candidate.value <= MAX_CARD_VALUE
  );
}
