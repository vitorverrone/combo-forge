/**
 * Formatadores de exibição (texto de jogo em inglês). São só rótulos: nenhuma
 * regra de jogo mora aqui.
 */

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

export const PATTERN_NAME: Readonly<Record<PatternKind, string>> = {
  [PatternKind.HighCard]: 'High Card',
  [PatternKind.Pair]: 'Pair',
  [PatternKind.TwoPair]: 'Two Pair',
  [PatternKind.ThreeOfAKind]: 'Three of a Kind',
  [PatternKind.Straight]: 'Straight',
  [PatternKind.FullHouse]: 'Full House',
  [PatternKind.FourOfAKind]: 'Four of a Kind',
};

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

/** Descrição legível de um Efeito de Forja (ex.: "Adds +2 to the card's value"). */
export function forgeEffectDescription(effect: ForgeEffect): string {
  switch (effect.kind) {
    case 'valueBonus':
      return `Adds +${effect.amount} to the card's value`;
    case 'multiplier':
      return `Multiplies the card's value by ×${effect.multiplier}`;
    case 'wildcard':
      return 'Counts as any value and suit to form patterns';
    case 'trigger':
      return `Adds +${effect.bonus} pts when played on play ${effect.triggerPlay} of a round`;
  }
}

export function relicDescription(relic: Relic | undefined): string {
  if (relic === undefined) return 'No starting relic — pure skill.';
  switch (relic.effect.kind) {
    case 'suit':
      return `${SUIT_NAME[relic.effect.suit]} cards ×${relic.effect.multiplier}`;
    case 'pattern':
      return `${PATTERN_NAME[relic.effect.pattern]} bonus +${relic.effect.bonus}`;
    case 'discard':
      return `+${relic.effect.amount} discard per round`;
    case 'handSize':
      return `+${relic.effect.amount} card in hand`;
    case 'comboStart':
      return `Combo starts at ×${relic.effect.multiplier}`;
    case 'comboGrowth':
      return `Combo grows +${relic.effect.step} per play`;
  }
}
