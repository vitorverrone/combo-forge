/**
 * Relíquias: pool, efeitos e aplicação das regras.
 *
 * Pool de 10 Relíquias em 4 categorias — suit (multiplica um Naipe na soma
 * do Valor-Base), pattern (fortalece um Padrão, somando ao bônus), mechanic
 * (ajustes de estrutura: +1 Descarte ou +1 carta na Mão por Rodada, nunca
 * +1 Jogada) e combo (mexe no Multiplicador de Combo). Máximo de RELIC_CAP
 * Relíquias adquiridas por Run; a Relíquia exclusiva de largada do Forjador
 * fica fora do teto (ver forgers.ts).
 *
 * Nomes em inglês (texto de jogo). Aplicação pura: helpers derivam os
 * modificadores de pontuação (scoreModifiers), a estrutura da Rodada
 * (structureModifiers) e o Multiplicador (comboMultiplier) das Relíquias
 * ativas — consumidos por patterns.ts e run.ts.
 */

import { Suit } from './cards';
import { DISCARDS_PER_ROUND, HAND_SIZE, RoundStructure } from './deck';
import { PatternKind, ScoreModifiers } from './patterns';

export type RelicCategory = 'suit' | 'pattern' | 'mechanic' | 'combo';

export type RelicRarity = 'common' | 'rare';

export type RelicEffect =
  | { readonly kind: 'suit'; readonly suit: Suit; readonly multiplier: number }
  | { readonly kind: 'pattern'; readonly pattern: PatternKind; readonly bonus: number }
  | { readonly kind: 'discard'; readonly amount: number }
  | { readonly kind: 'handSize'; readonly amount: number }
  | { readonly kind: 'comboStart'; readonly multiplier: number }
  | { readonly kind: 'comboGrowth'; readonly step: number };

export interface Relic {
  readonly id: string;
  readonly name: string;
  readonly category: RelicCategory;
  readonly rarity: RelicRarity;
  readonly effect: RelicEffect;
}

/** Teto de Relíquias adquiridas por Run (a de largada do Forjador fica fora). */
export const RELIC_CAP = 3;

export const RELIC_POOL: readonly Relic[] = [
  // Naipe — multiplica a contribuição das cartas do Naipe no Valor-Base
  {
    id: 'suit-spades',
    name: 'Blade of Spades',
    category: 'suit',
    rarity: 'common',
    effect: { kind: 'suit', suit: 'spades', multiplier: 2 },
  },
  {
    id: 'suit-hearts',
    name: 'Hearth of Hearts',
    category: 'suit',
    rarity: 'common',
    effect: { kind: 'suit', suit: 'hearts', multiplier: 2 },
  },
  {
    id: 'suit-diamonds',
    name: 'Crown of Diamonds',
    category: 'suit',
    rarity: 'common',
    effect: { kind: 'suit', suit: 'diamonds', multiplier: 2 },
  },
  {
    id: 'suit-clubs',
    name: 'Oak of Clubs',
    category: 'suit',
    rarity: 'common',
    effect: { kind: 'suit', suit: 'clubs', multiplier: 2 },
  },
  // Padrão — fortalece um Padrão, somando ao bônus do Valor-Base
  {
    id: 'pattern-pair',
    name: 'Pair Forge',
    category: 'pattern',
    rarity: 'common',
    effect: { kind: 'pattern', pattern: PatternKind.Pair, bonus: 10 },
  },
  {
    id: 'pattern-straight',
    name: 'Straight Line',
    category: 'pattern',
    rarity: 'rare',
    effect: { kind: 'pattern', pattern: PatternKind.Straight, bonus: 15 },
  },
  // Mecânica — ajustes suaves de estrutura (nunca +1 Jogada)
  {
    id: 'mechanic-discard',
    name: 'Scrap Yard',
    category: 'mechanic',
    rarity: 'common',
    effect: { kind: 'discard', amount: 1 },
  },
  {
    id: 'mechanic-hand',
    name: 'Big Bench',
    category: 'mechanic',
    rarity: 'common',
    effect: { kind: 'handSize', amount: 1 },
  },
  // Combo — mexe no Multiplicador de Combo
  {
    id: 'combo-start',
    name: 'Warm Up',
    category: 'combo',
    rarity: 'common',
    effect: { kind: 'comboStart', multiplier: 2 },
  },
  {
    id: 'combo-plus',
    name: 'Chain Reaction',
    category: 'combo',
    rarity: 'rare',
    // Passo reduzido de 2 para 1.5 (rebalance pós health-check, ADR 0006):
    // uma única oferta de sorte não deve mais resolver a Run sozinha.
    effect: { kind: 'comboGrowth', step: 1.5 },
  },
];

/**
 * Relíquias efetivamente ativas na Run: a exclusiva de largada do Forjador
 * (fora do teto) mais as adquiridas via Forja.
 */
export function activeRelics(startingRelic: Relic | undefined, relics: readonly Relic[]): Relic[] {
  return startingRelic === undefined ? [...relics] : [startingRelic, ...relics];
}

/** Modificadores de pontuação (Naipe e Padrão) derivados das Relíquias ativas. */
export function scoreModifiers(relics: readonly Relic[]): ScoreModifiers {
  const suitMultipliers: Partial<Record<Suit, number>> = {};
  const patternBonuses: Partial<Record<PatternKind, number>> = {};
  for (const relic of relics) {
    if (relic.effect.kind === 'suit') {
      suitMultipliers[relic.effect.suit] = relic.effect.multiplier;
    } else if (relic.effect.kind === 'pattern') {
      patternBonuses[relic.effect.pattern] =
        (patternBonuses[relic.effect.pattern] ?? 0) + relic.effect.bonus;
    }
  }
  return { suitMultipliers, patternBonuses };
}

/** Estrutura da Rodada (Mão e Descarte) derivada das Relíquias de Mecânica. */
export function structureModifiers(relics: readonly Relic[]): RoundStructure {
  let handSize = HAND_SIZE;
  let discardsPerRound = DISCARDS_PER_ROUND;
  for (const relic of relics) {
    if (relic.effect.kind === 'handSize') {
      handSize += relic.effect.amount;
    } else if (relic.effect.kind === 'discard') {
      discardsPerRound += relic.effect.amount;
    }
  }
  return { handSize, discardsPerRound };
}

/**
 * Multiplicador de Combo da Jogada N (1-based) com as Relíquias ativas:
 * base ×1 na 1ª Jogada crescendo +1; comboStart muda o ponto de partida
 * (ex.: ×2) e comboGrowth o passo (ex.: +2 por Jogada).
 */
export function comboMultiplier(playNumber: number, relics: readonly Relic[]): number {
  let first = 1;
  let step = 1;
  for (const relic of relics) {
    if (relic.effect.kind === 'comboStart') {
      first = relic.effect.multiplier;
    } else if (relic.effect.kind === 'comboGrowth') {
      step = relic.effect.step;
    }
  }
  return first + (playNumber - 1) * step;
}
