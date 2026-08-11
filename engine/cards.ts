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

/** Identidade única de uma carta no Baralho: `naipe:valor`. */
export function cardKey(card: Card): string {
  return `${card.suit}:${card.value}`;
}

// ---------------------------------------------------------------------------
// Efeitos de Forja e Cartas Forjadas (metadados por cima da carta)
//
// A identidade da carta é `naipe:valor` e nunca muda; os Efeitos de Forja são
// metadados permanentes da Run aplicados sempre que a carta entra numa Jogada.
// ---------------------------------------------------------------------------

export type ForgeEffectKind = 'valueBonus' | 'multiplier' | 'wildcard' | 'trigger';

/** +Valor: soma fixa ao Valor da carta. */
export interface ValueBonusEffect {
  readonly kind: 'valueBonus';
  readonly amount: number;
}

/** Multiplicador: a carta vale ×2 ou ×3. */
export interface MultiplierEffect {
  readonly kind: 'multiplier';
  readonly multiplier: 2 | 3;
}

/** Curinga: conta como qualquer Valor e qualquer Naipe para formar Padrões. */
export interface WildcardEffect {
  readonly kind: 'wildcard';
}

/** Gatilho: bônus apenas quando a condição é satisfeita (ex.: 3ª Jogada da Rodada). */
export interface TriggerEffect {
  readonly kind: 'trigger';
  /** Número da Jogada dentro da Rodada (1–4) que dispara o bônus. */
  readonly triggerPlay: number;
  readonly bonus: number;
}

export type ForgeEffect = ValueBonusEffect | MultiplierEffect | WildcardEffect | TriggerEffect;

/** Carta Forjada: uma carta do Baralho com um ou mais Efeitos de Forja empilhados. */
export interface ForgedCard {
  readonly card: Card;
  /** Efeitos na ordem em que foram aplicados; a resolução sempre soma antes de multiplicar. */
  readonly effects: readonly ForgeEffect[];
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
