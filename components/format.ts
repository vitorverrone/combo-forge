/**
 * Formatadores de exibição. São só rótulos: nenhuma regra de jogo mora aqui.
 * Funções usam i18n diretamente (não são React components, então não usam hook).
 */

import i18n from '../i18n';
import {
  Card,
  DailyAttempts,
  dailyCallToActionState,
  DeckSkinItem,
  DeckSkinPalette,
  DisplayNameValidation,
  ForgeEffect,
  ForgerId,
  LeagueTier,
  PatternKind,
  Relic,
  RelicCategory,
  Suit,
} from '../engine';
import { suitColors } from './theme';

/**
 * Marca textual de cada Material, usada onde não cabe o SVG (ex.: rótulo curto
 * de carta). Símbolos geométricos neutros — nada de ♠♥♦♣.
 */
export const SUIT_SYMBOL: Readonly<Record<Suit, string>> = {
  spades: '▰',
  hearts: '◆',
  diamonds: '◇',
  clubs: '⬢',
};

/**
 * Cor do símbolo do Material. Uma `DeckSkinPalette` sobrescreve estas cores
 * (face escura precisa de tom claro); sem skin, vale a paleta da face clara.
 */
export function suitColor(suit: Suit, skin?: DeckSkinPalette): string {
  return skin?.suits[suit] ?? suitColors[suit];
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

/** Translated pattern name for display. */
export function patternName(kind: PatternKind): string {
  return i18n.t(PATTERN_I18N_KEY[kind]);
}

/** Pattern composition descriptions — translated via i18n. */
const PATTERN_COMPOSITION_I18N_KEY: Readonly<Record<PatternKind, string>> = {
  [PatternKind.HighCard]: 'format.patternComposition.highCard',
  [PatternKind.Pair]: 'format.patternComposition.pair',
  [PatternKind.TwoPair]: 'format.patternComposition.twoPair',
  [PatternKind.ThreeOfAKind]: 'format.patternComposition.threeOfAKind',
  [PatternKind.Straight]: 'format.patternComposition.straight',
  [PatternKind.FullHouse]: 'format.patternComposition.fullHouse',
  [PatternKind.FourOfAKind]: 'format.patternComposition.fourOfAKind',
};

/** Translated composition description of a Padrão (ex.: "2 cards of the same value"). */
export function patternComposition(kind: PatternKind): string {
  return i18n.t(PATTERN_COMPOSITION_I18N_KEY[kind]);
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

/** Mensagem traduzida do motivo de rejeição do Nome de Exibição (ticket 02). */
const DISPLAY_NAME_ERROR_I18N_KEY: Readonly<Record<Exclude<DisplayNameValidation, { valid: true }>['reason'], string>> = {
  tooShort: 'format.displayNameError.tooShort',
  tooLong: 'format.displayNameError.tooLong',
  invalidChars: 'format.displayNameError.invalidChars',
  profanity: 'format.displayNameError.profanity',
};

/** Mensagem traduzida (para exibição) do motivo de rejeição. */
export function displayNameErrorMessage(reason: Exclude<DisplayNameValidation, { valid: true }>['reason']): string {
  return i18n.t(DISPLAY_NAME_ERROR_I18N_KEY[reason]);
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

/** Relic category labels — translated via i18n. */
const RELIC_CATEGORY_I18N_KEY: Readonly<Record<RelicCategory, string>> = {
  suit: 'format.relicCategory.suit',
  pattern: 'format.relicCategory.pattern',
  mechanic: 'format.relicCategory.mechanic',
  combo: 'format.relicCategory.combo',
};

/** Translated Relic category label for display (Coleção). */
export function relicCategoryLabel(category: RelicCategory): string {
  return i18n.t(RELIC_CATEGORY_I18N_KEY[category]);
}

/** Forger names — translated via i18n (exceção à convenção de nomes de jogo em inglês). */
const FORGER_NAME_I18N_KEY: Readonly<Record<ForgerId, string>> = {
  apprentice: 'format.forgerName.apprentice',
  hammer: 'format.forgerName.hammer',
  anvil: 'format.forgerName.anvil',
};

/** Translated Forjador name for display. */
export function forgerName(id: ForgerId): string {
  return i18n.t(FORGER_NAME_I18N_KEY[id]);
}

/** Liga Tier names — translated via i18n (ADR 0010, ticket 02). */
const LEAGUE_TIER_I18N_KEY: Readonly<Record<LeagueTier, string>> = {
  bronze: 'format.leagueTier.bronze',
  silver: 'format.leagueTier.silver',
  gold: 'format.leagueTier.gold',
  platinum: 'format.leagueTier.platinum',
  diamond: 'format.leagueTier.diamond',
};

/** Translated Tier name for display. */
export function leagueTierName(tier: LeagueTier): string {
  return i18n.t(LEAGUE_TIER_I18N_KEY[tier]);
}

/** Translated Deck skin description (Loja). Nome do Deck continua em inglês. */
export function deckSkinDescription(item: DeckSkinItem): string {
  return i18n.t(`format.deckSkin.${item.id}`);
}

/** Texto de convite do Desafio Diário por estado do CTA (ticket 01) — translated via i18n. */
const DAILY_CALL_TO_ACTION_I18N_KEY: Readonly<Record<ReturnType<typeof dailyCallToActionState>, string>> = {
  'free-ready': 'daily.freeReady',
  'extra-ready': 'daily.extraReady',
  'watch-ad': 'daily.watchAdHint',
};

/** Translated texto de convite para o estado atual do CTA do Desafio Diário. */
export function dailyCallToActionText(attempts: DailyAttempts): string {
  return i18n.t(DAILY_CALL_TO_ACTION_I18N_KEY[dailyCallToActionState(attempts)]);
}

/** Translated Marco (Meta-Progressão) title, por id estável (engine/progression.ts). */
export function milestoneTitle(id: string): string {
  return i18n.t(`milestones.${id}.title`);
}

/** Translated Marco description, por id estável. */
export function milestoneDescription(id: string): string {
  return i18n.t(`milestones.${id}.description`);
}

/** Translated título de uma opção de desbloqueio (MilestoneOption), por id estável. */
export function milestoneOptionTitle(id: string): string {
  return i18n.t(`milestoneOptions.${id}.title`);
}
