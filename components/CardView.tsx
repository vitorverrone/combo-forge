import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, cardKey, DeckSkinPalette, ForgedCard } from '../engine';

import { forgeEffectLabel, isRedSuit, SUIT_SYMBOL } from './format';
import { colors } from './theme';

interface CardViewProps {
  readonly card: Card;
  readonly forgedCards: readonly ForgedCard[];
  readonly selected: boolean;
  readonly disabled?: boolean;
  readonly onPress?: () => void;
  /** Skin de baralho equipada (ticket 14) — só muda cores, nunca regras. */
  readonly skin?: DeckSkinPalette;
}

export function CardView({ card, forgedCards, selected, disabled = false, onPress, skin }: CardViewProps) {
  const forged = forgedCards.find((candidate) => cardKey(candidate.card) === cardKey(card));
  const red = isRedSuit(card.suit);
  const face = skin?.cardFace ?? colors.cardFace;
  const ink = skin?.cardInk ?? colors.cardInk;
  const redColor = skin?.red ?? colors.red;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.value} of ${card.suit}`}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: face },
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.corner}>
        <Text style={[styles.value, { color: ink }, red && { color: redColor }]}>{card.value}</Text>
        <Text style={[styles.suit, { color: ink }, red && { color: redColor }]}>{SUIT_SYMBOL[card.suit]}</Text>
      </View>
      <Text style={[styles.centerSuit, { color: ink }, red && { color: redColor }]}>{SUIT_SYMBOL[card.suit]}</Text>
      {forged !== undefined && forged.effects.length > 0 && (
        <View style={styles.forgedBadge}>
          <Text style={styles.forgedText}>{forged.effects.map(forgeEffectLabel).join(' ')}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 62,
    height: 88,
    borderRadius: 8,
    padding: 6,
    margin: 4,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardSelected: {
    transform: [{ translateY: -14 }],
    borderWidth: 3,
    borderColor: colors.gold,
  },
  cardPressed: {
    opacity: 0.85,
  },
  corner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
  },
  suit: {
    fontSize: 14,
    marginLeft: 2,
  },
  centerSuit: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    left: 0,
    textAlign: 'center',
    fontSize: 34,
  },
  red: {
    color: colors.red,
  },
  forgedBadge: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 4,
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
