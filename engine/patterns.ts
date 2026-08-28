/**
 * Reconhecimento de Padrões e cálculo do Valor-Base.
 *
 * Uma Jogada usa de 1 a 5 cartas; pontua o melhor Padrão formado pelas
 * cartas selecionadas e o Valor-Base é bônus do Padrão + soma dos Valores
 * de todas as cartas selecionadas. Funções puras e determinísticas.
 *
 * Cartas Forjadas (ticket 05): os Efeitos de Forja entram na avaliação —
 * +Valor soma ao Valor da carta, Multiplicador multiplica o Valor (somas
 * resolvem antes de multiplicadores), Curinga conta como qualquer Valor para
 * formar o melhor Padrão e Gatilho concede bônus apenas quando a condição
 * (número da Jogada na Rodada) é satisfeita.
 *
 * Relíquias (ticket 06): modificadores de pontuação derivados das Relíquias
 * ativas — Relíquias de Naipe multiplicam a contribuição das cartas do Naipe
 * na soma e Relíquias de Padrão somam ao bônus do Padrão.
 *
 * Dicas de hesitação (ticket 07): availablePatternHints é função pura que
 * lista os Padrões formáveis pela Mão — apenas dado para a UI exibir uma
 * dica sutil quando o jogador hesita; nunca altera estado nem Meta.
 */

import { assertNever } from './assert';
import {
  ACE_HIGH_VALUE,
  Card,
  cardKey,
  ForgedCard,
  isCard,
  MAX_CARD_VALUE,
  MIN_CARD_VALUE,
  Suit,
} from './cards';

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

/**
 * Descrição curta de composição de cada Padrão (texto de jogo, em inglês —
 * mesmo padrão de nomes de Relíquia em relics.ts). Fonte única consumida
 * pelo tutorial de onboarding e pelo modal de referência de Padrões.
 */
export const PATTERN_COMPOSITIONS: Readonly<Record<PatternKind, string>> = {
  [PatternKind.HighCard]: 'No matching cards',
  [PatternKind.Pair]: '2 cards of the same value',
  [PatternKind.TwoPair]: '2 different pairs',
  [PatternKind.ThreeOfAKind]: '3 cards of the same value',
  [PatternKind.Straight]: '5 consecutive values',
  [PatternKind.FullHouse]: '3 of a kind + a pair',
  [PatternKind.FourOfAKind]: '4 cards of the same value',
};

/**
 * Prioridade dos Padrões para a melhor Jogada (maior = melhor). Exportado
 * porque é também a ordem canônica (do mais fraco ao mais forte) usada pela
 * UI para listar os 7 Padrões (ver components/PatternList.tsx) — uma única
 * fonte para "qual Padrão é melhor" evita duas listas divergentes.
 */
export const PATTERN_RANK: Readonly<Record<PatternKind, number>> = {
  [PatternKind.FourOfAKind]: 7,
  [PatternKind.FullHouse]: 6,
  [PatternKind.ThreeOfAKind]: 5,
  [PatternKind.Straight]: 4,
  [PatternKind.TwoPair]: 3,
  [PatternKind.Pair]: 2,
  [PatternKind.HighCard]: 1,
};

/**
 * Modificadores de pontuação derivados das Relíquias ativas (ticket 06):
 * Naipe (multiplica a contribuição das cartas do Naipe) e Padrão (soma ao
 * bônus do Padrão). Ausente/omisso = jogo base.
 */
export interface ScoreModifiers {
  readonly suitMultipliers?: Readonly<Partial<Record<Suit, number>>>;
  readonly patternBonuses?: Readonly<Partial<Record<PatternKind, number>>>;
}

export interface PlayContext {
  /** Cartas Forjadas ativas na Run (identidade `naipe:valor`). */
  readonly forgedCards?: readonly ForgedCard[];
  /** Número da Jogada dentro da Rodada (1–4), para Gatilhos. */
  readonly playNumber?: number;
  /** Modificadores de Relíquias aplicados à pontuação. */
  readonly modifiers?: ScoreModifiers;
}

export interface PlayEvaluation {
  readonly pattern: Pattern;
  /** Valor-Base = bônus do Padrão + soma dos Valores (com Efeitos de Forja) de todas as cartas. */
  readonly baseValue: number;
}

const MIN_PLAY_CARDS = 1;
const MAX_PLAY_CARDS = 5;

/**
 * Reconhece o melhor Padrão formado pelas cartas selecionadas. Cartas com
 * efeito Curinga podem contar como qualquer Valor para formar o Padrão.
 */
export function identifyPattern(cards: readonly Card[], forgedCards?: readonly ForgedCard[]): PatternKind {
  assertValidPlay(cards);
  const forged = forgedCards ?? [];
  const wildcardKeys = wildcardCardKeys(cards, forged);
  if (wildcardKeys.size === 0) return identifyPatternFromValues(cards.map((card) => card.value));
  const realValues = cards
    .map((card) => card.value)
    .filter((_, index) => !wildcardKeys.has(cardKey(cards[index])));
  return bestWildcardResult(realValues, wildcardKeys.size).kind;
}

/** Avalia a Jogada considerando os Efeitos de Forja das cartas (ticket 05). */
export function evaluatePlay(cards: readonly Card[], context: PlayContext = {}): PlayEvaluation {
  assertValidPlay(cards);
  const forgedCards = context.forgedCards ?? [];
  const wildcardKeys = wildcardCardKeys(cards, forgedCards);
  const values = cards.map((card) => card.value);

  let patternKind: PatternKind;
  let assignments: readonly number[] = [];
  if (wildcardKeys.size > 0) {
    const realValues = values.filter((_, index) => !wildcardKeys.has(cardKey(cards[index])));
    const best = bestWildcardResult(realValues, wildcardKeys.size);
    patternKind = best.kind;
    assignments = best.assignments;
  } else {
    patternKind = identifyPatternFromValues(values);
  }

  // Contribuição de cada carta na ordem da Jogada: Curingas consomem as
  // atribuições na ordem em que aparecem; Relíquias de Naipe multiplicam a
  // contribuição das cartas do Naipe (identidade impressa da carta).
  const suitMultipliers = context.modifiers?.suitMultipliers ?? {};
  let wildcardIndex = 0;
  const contributions = cards.map((card) => {
    const forged = forgedCards.find((candidate) => cardKey(candidate.card) === cardKey(card));
    const base = forged
      ? cardContribution(
          forged.effects.some((effect) => effect.kind === 'wildcard')
            ? assignments[wildcardIndex++]
            : card.value,
          forged,
          context.playNumber,
        )
      : card.value;
    return base * (suitMultipliers[card.suit] ?? 1);
  });
  const bonus = PATTERN_BONUSES[patternKind] + (context.modifiers?.patternBonuses?.[patternKind] ?? 0);
  const baseValue = bonus + contributions.reduce((total, value) => total + value, 0);
  return { pattern: { kind: patternKind, bonus }, baseValue };
}

/**
 * Padrões formáveis com as cartas da Mão (dica visual de hesitação, ticket
 * 07). Função pura sobre os Valores impressos — não considera Curingas e
 * nunca toca estado ou Meta. Devolve os melhores Padrões disponíveis, sem
 * redundâncias implicadas (ex.: Quadra já implica Trinca).
 */
export function availablePatternHints(cards: readonly Card[]): PatternKind[] {
  const countByValue = new Map<number, number>();
  for (const card of cards) {
    countByValue.set(card.value, (countByValue.get(card.value) ?? 0) + 1);
  }
  const counts = [...countByValue.values()];
  const maxGroup = Math.max(...counts, 0);
  const pairCount = counts.filter((count) => count >= 2).length;

  const hints: PatternKind[] = [];
  if (maxGroup >= 4) {
    hints.push(PatternKind.FourOfAKind);
  } else if (maxGroup >= 3 && pairCount >= 2) {
    hints.push(PatternKind.FullHouse);
  } else if (maxGroup >= 3) {
    hints.push(PatternKind.ThreeOfAKind);
  } else if (pairCount >= 2) {
    hints.push(PatternKind.TwoPair);
  } else if (pairCount === 1) {
    hints.push(PatternKind.Pair);
  }
  if (isStraightPossible([...countByValue.keys()])) {
    hints.push(PatternKind.Straight);
  }
  return hints;
}

/** Há 5 valores distintos consecutivos na Mão (incluindo 10–Ás)? */
function isStraightPossible(values: readonly number[]): boolean {
  const present = new Set(values);
  // janelas de 5 consecutivos em 1..10
  for (let start = MIN_CARD_VALUE; start <= 6; start += 1) {
    const run = [start, start + 1, start + 2, start + 3, start + 4];
    if (run.every((value) => present.has(value))) return true;
  }
  // 10–Ás: 7,8,9,10 + Ás (1)
  return [7, 8, 9, 10, MIN_CARD_VALUE].every((value) => present.has(value));
}

/**
 * Contribuição de uma carta forjada ao Valor-Base: soma-se primeiro todos os
 * efeitos aditivos (+Valor e Gatilhos que dispararam), depois multiplica-se
 * pelos Multiplicadores — "somas antes de multiplicadores", independente da
 * ordem em que os efeitos foram aplicados.
 */
/** Switch exaustivo sobre ForgeEffect.kind — ver relics.ts::scoreModifiers. */
function cardContribution(rawValue: number, forged: ForgedCard, playNumber?: number): number {
  let sum = rawValue;
  let product = 1;
  for (const effect of forged.effects) {
    switch (effect.kind) {
      case 'valueBonus':
        sum += effect.amount;
        break;
      case 'multiplier':
        product *= effect.multiplier;
        break;
      case 'trigger':
        if (playNumber === effect.triggerPlay) sum += effect.bonus;
        break;
      case 'wildcard':
        // o papel de valor já foi resolvido em rawValue
        break;
      default:
        assertNever(effect);
    }
  }
  return sum * product;
}

/**
 * Melhor atribuição de valores para os Curingas: maximiza o Padrão formado
 * e, entre atribuições do mesmo Padrão, a maior soma (o Curinga "conta como
 * qualquer Valor"). Enumera as atribuições 1..10 por Curinga — no máximo
 * 10^4 combinações para uma Jogada de 5 cartas.
 */
function bestWildcardResult(
  realValues: readonly number[],
  wildcardCount: number,
): { kind: PatternKind; assignments: readonly number[] } {
  let best: { kind: PatternKind; assignments: number[]; sum: number } | null = null;
  const assignments = new Array<number>(wildcardCount).fill(MIN_CARD_VALUE);
  for (;;) {
    const virtual = [...realValues, ...assignments];
    const kind = identifyPatternFromValues(virtual);
    const sum = virtual.reduce((total, value) => total + value, 0);
    if (best === null || isBetter(kind, sum, best.kind, best.sum)) {
      best = { kind, assignments: [...assignments], sum };
    }
    // odômetro: próxima atribuição, do último Curinga para o primeiro
    let digit = wildcardCount - 1;
    while (digit >= 0) {
      assignments[digit] += 1;
      if (assignments[digit] <= MAX_CARD_VALUE) break;
      assignments[digit] = MIN_CARD_VALUE;
      digit -= 1;
    }
    if (digit < 0) break;
  }
  // best nunca é null aqui: wildcardCount >= 1 garante ao menos uma iteração
  return { kind: best!.kind, assignments: best!.assignments };
}

function isBetter(
  kind: PatternKind,
  sum: number,
  bestKind: PatternKind,
  bestSum: number,
): boolean {
  const rankDiff = PATTERN_RANK[kind] - PATTERN_RANK[bestKind];
  return rankDiff > 0 || (rankDiff === 0 && sum > bestSum);
}

/** Reconhecimento sobre a lista de Valores (sem naipes), usado também com Curingas. */
function identifyPatternFromValues(values: readonly number[]): PatternKind {
  const countByValue = new Map<number, number>();
  for (const value of values) {
    countByValue.set(value, (countByValue.get(value) ?? 0) + 1);
  }
  const groupSizes = [...countByValue.values()].sort((a, b) => b - a);
  const largestGroup = groupSizes[0];
  const pairCount = groupSizes.filter((size) => size === 2).length;

  if (largestGroup === 4) return PatternKind.FourOfAKind;
  if (largestGroup === 3 && pairCount === 1) return PatternKind.FullHouse;
  if (largestGroup === 3) return PatternKind.ThreeOfAKind;
  if (values.length === 5 && groupSizes.length === 5 && isStraight([...countByValue.keys()])) {
    return PatternKind.Straight;
  }
  if (pairCount === 2) return PatternKind.TwoPair;
  if (pairCount === 1) return PatternKind.Pair;
  return PatternKind.HighCard;
}

function wildcardCardKeys(cards: readonly Card[], forgedCards: readonly ForgedCard[]): Set<string> {
  const keys = new Set<string>();
  for (const card of cards) {
    const forged = forgedCards.find((candidate) => cardKey(candidate.card) === cardKey(card));
    if (forged !== undefined && forged.effects.some((effect) => effect.kind === 'wildcard')) {
      keys.add(cardKey(card));
    }
  }
  return keys;
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
