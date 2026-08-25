/**
 * Formatadores de exibição. São só rótulos: nenhuma regra de jogo mora aqui.
 * Funções usam i18n diretamente (não são React components, então não usam hook).
 */

import i18n from '../i18n';
import { Card, ForgeEffect, PatternKind, Relic, Suit } from '../engine';

export const SUIT_SYMBOL: Readonly<Record<Suit, string>> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const SUIT_NAME: Readonly<Record<Suit, string>> = {
  spades: 'Spades',
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
};

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

/** Pattern names — translated via i18n. */
const PATTERN_I18N_KEY: Readonly<Record<PatternKind, string>> = {
  [PatternKind.HighCard]: 'format.pattern.highCard',
  [PatternKind.Pair]: 'format.pattern.pair',
  [PatternKind.TwoPair]: 'format.pattern.twoPair',
  [PatternKind.ThreeOfAKind]: 'format.pattern.threeOfAKind',
  [PatternKind.Straight]: 'format.pattern.straight',
  [PatternKind.FullHouse]: 'format.pattern.fullHouse',
  [PatternKind.FourOfAKind]: 'format.pattern.fourOfAKind',
};

/** Non-translated pattern names for internal use (tests, etc.). */
export const PATTERN_NAME: Readonly<Record<PatternKind, string>> = {
  [PatternKind.HighCard]: 'High Card',
  [PatternKind.Pair]: 'Pair',
  [PatternKind.TwoPair]: 'Two Pair',
  [PatternKind.ThreeOfAKind]: 'Three of a Kind',
  [PatternKind.Straight]: 'Straight',
  [PatternKind.FullHouse]: 'Full House',
  [PatternKind.FourOfAKind]: 'Four of a Kind',
};

/** Translated pattern name for display. */
export function patternName(kind: PatternKind): string {
  return i18n.t(PATTERN_I18N_KEY[kind]);
}

export function cardLabel(card: Card): string {
  return `${card.value}${SUIT_SYMBOL[card.suit]}`;
}

/** Rótulo curto de um Efeito de Forja (ex.: "+2", "×2", "★", "⚡20"). */
export function forgeEffectLabel(effect: ForgeEffect): string {
  switch (effect.kind) {
    case 'valueBonus':
      return `+${effect.amount}`;
    case 'multiplier':
      return `×${effect.multiplier}`;
    case 'wildcard':
      return '★';
    case 'trigger':
      return `⚡${effect.bonus}`;
  }
}

/** Descrição legível de um Efeito de Forja (translated via i18n). */
export function forgeEffectDescription(effect: ForgeEffect): string {
  switch (effect.kind) {
    case 'valueBonus':
      return i18n.t('format.forgeEffect.valueBonus', { amount: effect.amount });
    case 'multiplier':
      return i18n.t('format.forgeEffect.multiplier', { multiplier: effect.multiplier });
    case 'wildcard':
      return i18n.t('format.forgeEffect.wildcard');
    case 'trigger':
      return i18n.t('format.forgeEffect.trigger', { bonus: effect.bonus, triggerPlay: effect.triggerPlay });
  }
}

/** Translated suit name for display. */
export function suitName(suit: Suit): string {
  return i18n.t(`format.suit.${suit}`);
}

export function relicDescription(relic: Relic | undefined): string {
  if (relic === undefined) return i18n.t('format.noRelic');
  switch (relic.effect.kind) {
    case 'suit':
      return i18n.t('format.relic.suit', { suit: suitName(relic.effect.suit), multiplier: relic.effect.multiplier });
    case 'pattern':
      return i18n.t('format.relic.pattern', { pattern: patternName(relic.effect.pattern), bonus: relic.effect.bonus });
    case 'discard':
      return i18n.t('format.relic.discard', { amount: relic.effect.amount });
    case 'handSize':
      return i18n.t('format.relic.handSize', { amount: relic.effect.amount });
    case 'comboStart':
      return i18n.t('format.relic.comboStart', { multiplier: relic.effect.multiplier });
    case 'comboGrowth':
      return i18n.t('format.relic.comboGrowth', { step: relic.effect.step });
  }
}
