import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, cardKey, ForgedCard } from '../engine';

import { forgeEffectLabel, isRedSuit, SUIT_SYMBOL } from './format';
import { colors } from './theme';

interface CardViewProps {
  readonly card: Card;
  readonly forgedCards: readonly ForgedCard[];
  readonly selected: boolean;
  readonly disabled?: boolean;
  readonly onPress?: () => void;
}

export function CardView({ card, forgedCards, selected, disabled = false, onPress }: CardViewProps) {
  const forged = forgedCards.find((candidate) => cardKey(candidate.card) === cardKey(card));
  const red = isRedSuit(card.suit);

  return (
    <Pressable
      accessibilityLabel={`${card.value} of ${card.suit}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.corner}>
        <Text style={[styles.value, red && styles.red]}>{card.value}</Text>
        <Text style={[styles.suit, red && styles.red]}>{SUIT_SYMBOL[card.suit]}</Text>
      </View>
      <Text style={[styles.centerSuit, red && styles.red]}>{SUIT_SYMBOL[card.suit]}</Text>
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
    backgroundColor: colors.cardFace,
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
    color: colors.cardInk,
    fontSize: 16,
    fontWeight: '800',
  },
  suit: {
    color: colors.cardInk,
    fontSize: 14,
    marginLeft: 2,
  },
  red: {
    color: colors.red,
  },
  centerSuit: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    left: 0,
    textAlign: 'center',
    fontSize: 34,
    color: colors.cardInk,
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
    color: '#241a05',
    fontSize: 9,
    fontWeight: '800',
  },
});
