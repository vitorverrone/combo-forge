import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cardKey, Card, DeckSkinPalette, ForgedCard } from '../engine';

import { useTranslation } from '../i18n';
import { forgeEffectLabel, isRedSuit, suitName } from './format';
import { SuitSymbol } from './SuitSymbol';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';

interface PlayingCardProps {
  /** The card data. */
  readonly card: Card;
  /** Optional: forged effects applied to this card. */
  readonly forgedCards?: readonly ForgedCard[];
  /** Whether the card is visually selected (lifted + gold border). */
  readonly selected?: boolean;
  /** Whether the card is disabled / non-interactive. */
  readonly disabled?: boolean;
  /** Press handler — if omitted the card renders as decorative (no press). */
  readonly onPress?: () => void;
  /** Optional deck-skin palette override. */
  readonly skin?: DeckSkinPalette;
  /** Additional inline style (used by fan positioning). */
  readonly style?: object;
}

/**
 * Global playing card component used across the app (Home fan, Game hand, etc.).
 * Layout matches the design reference: rank top-left, suit centered,
 * rank bottom-right (rotated 180°).
 */
export function PlayingCard({
  card,
  forgedCards,
  selected = false,
  disabled = false,
  onPress,
  skin,
  style,
}: PlayingCardProps) {
  const { t } = useTranslation();
  const forged = forgedCards?.find((c) => cardKey(c.card) === cardKey(card));
  const red = isRedSuit(card.suit);
  const face = skin?.cardFace ?? colors.cardFace;
  const borderColor = skin?.border ?? 'transparent';
  const ink = skin?.cardInk ?? colors.cardInk;
  const redColor = skin?.red ?? colors.red;

  const rankColor = red ? redColor : ink;
  const suitColor = red ? redColor : ink;

  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: face },
        { borderColor },
        selected && styles.cardSelected,
        style,
      ]}
    >
      {/* Top-left rank */}
      <View style={styles.topCorner}>
        <Text style={[styles.rank, { color: rankColor }]}>{card.value}</Text>
      </View>

      {/* Center suit (large) */}
      <View style={styles.centerSuit}>
        <SuitSymbol suit={card.suit} color={suitColor} size={28} />
      </View>

      {/* Bottom-right rank (rotated) */}
      <View style={styles.bottomCorner}>
        <Text style={[styles.rank, styles.rankRotated, { color: rankColor }]}>{card.value}</Text>
      </View>

      {/* Forge effect badge */}
      {forged !== undefined && forged.effects.length > 0 && (
        <View style={styles.forgedBadge}>
          <Text style={styles.forgedText}>{forged.effects.map(forgeEffectLabel).join(' ')}</Text>
        </View>
      )}
    </View>
  );

  if (onPress !== undefined) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('a11y.cardOfSuit', { value: card.value, suit: suitName(card.suit) })}
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.cardPressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    width: 62,
    height: 88,
    borderRadius: radius[8],
    borderWidth: 1,
    padding: spacing[6],
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardSelected: {
    transform: [{ translateY: -14 }],
    borderColor: colors.gold,
  },
  cardPressed: {
    opacity: 0.85,
  },
  /* ── Rank & suit ── */
  topCorner: {
    alignSelf: 'flex-start',
  },
  rank: {
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  centerSuit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCorner: {
    alignSelf: 'flex-end',
  },
  rankRotated: {
    transform: [{ rotate: '180deg' }],
  },
  /* ── Forge badge ── */
  forgedBadge: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: radius[4],
    backgroundColor: colors.gold,
    paddingVertical: 1,
    alignItems: 'center',
  },
  forgedText: {
    color: colors.textOnPrimary,
    fontSize: 9,
    fontWeight: '800',
  },
});
