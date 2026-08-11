import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  activeRelics,
  Card,
  cardKey,
  createDeck,
  ForgeOffer,
  RunState,
  SUITS,
} from '../engine';

import {
  forgeEffectDescription,
  forgeEffectLabel,
  isRedSuit,
  relicDescription,
  SUIT_SYMBOL,
} from './format';
import { RelicRow } from './RelicRow';
import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

interface ForgeScreenProps {
  readonly run: RunState;
}

/**
 * A Forja entre Rodadas: as 3 ofertas do motor (2 de Efeito de Forja + 1 de
 * Relíquia, ou 3 de carta com o teto de Relíquias cheio). Oferta de carta
 * abre o seletor de carta-alvo do Baralho e exige confirmação; a Relíquia é
 * aplicada no toque. A Forja não pode ser pulada — o motor só sai da fase
 * 'forging' via applyForgeOffer.
 */
export function ForgeScreen({ run }: ForgeScreenProps) {
  const applyForgeOffer = useGameStore((state) => state.applyForgeOffer);
  // Índice da oferta em exame (carta) ou já confirmada (Relíquia).
  const [activeOffer, setActiveOffer] = useState<number | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);

  const deck = createDeck();
  const active = activeOffer !== null ? run.forgeOffers[activeOffer] : undefined;

  const handleOfferPress = (index: number) => {
    // Mesma oferta de novo = cancela. Oferta nova = abre a confirmação.
    if (activeOffer === index) {
      setActiveOffer(null);
      setTargetKey(null);
    } else {
      setActiveOffer(index);
      setTargetKey(null);
    }
  };

  const handleConfirm = () => {
    if (active === undefined || activeOffer === null) return;
    if (active.type === 'cardEffect') {
      if (targetKey === null) return;
      const target = deck.find((card) => cardKey(card) === targetKey);
      if (target === undefined) return;
      applyForgeOffer(activeOffer, target);
    } else {
      // Relíquia: confirmada na segunda etapa (sem carta alvo).
      applyForgeOffer(activeOffer);
    }
    setActiveOffer(null);
    setTargetKey(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.eyebrow}>ROUND {run.roundNumber} CLEARED</Text>
      <Text style={styles.title}>The Forge</Text>
      <Text style={styles.subtitle}>Pick one upgrade to carry into the next round.</Text>

      <RelicRow relics={activeRelics(run.startingRelic, run.relics)} />

      <View style={styles.offerList}>
        {run.forgeOffers.map((offer, index) => (
          <OfferCard
            key={index}
            offer={offer}
            selected={activeOffer === index}
            onPress={() => handleOfferPress(index)}
          />
        ))}
      </View>

      {active !== undefined && active.type === 'cardEffect' && (
        <View style={styles.picker}>
          <Text style={styles.pickerTitle}>Apply {forgeEffectLabel(active.effect)} to which card?</Text>
          <Text style={styles.pickerHint}>
            Already-forged cards keep stacking effects.
          </Text>
          <View style={styles.deckGrid}>
            {SUITS.map((suit) => (
              <View key={suit} style={styles.suitRow}>
                {deck
                  .filter((card) => card.suit === suit)
                  .map((card) => (
                    <DeckCardCell
                      key={cardKey(card)}
                      card={card}
                      forged={run.forgedCards.some((forged) => cardKey(forged.card) === cardKey(card))}
                      selected={targetKey === cardKey(card)}
                      onPress={() => setTargetKey(cardKey(card))}
                    />
                  ))}
              </View>
            ))}
          </View>
          <View style={styles.confirmRow}>
            <Pressable
              accessibilityLabel="Cancel forge"
              onPress={() => {
                setActiveOffer(null);
                setTargetKey(null);
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>CANCEL</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Confirm forge on selected card"
              disabled={targetKey === null}
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.primaryButton,
                targetKey === null && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>FORGE</Text>
            </Pressable>
          </View>
        </View>
      )}

      {active !== undefined && active.type === 'relic' && (
        <View style={styles.picker}>
          <Text style={styles.pickerTitle}>Take {active.relic.name}?</Text>
          <Text style={styles.pickerHint}>{relicDescription(active.relic)}</Text>
          <View style={styles.confirmRow}>
            <Pressable
              accessibilityLabel="Cancel relic"
              onPress={() => {
                setActiveOffer(null);
                setTargetKey(null);
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>CANCEL</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Confirm relic"
              onPress={handleConfirm}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>TAKE IT</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

interface OfferCardProps {
  readonly offer: ForgeOffer;
  readonly selected: boolean;
  readonly onPress: () => void;
}

function OfferCard({ offer, selected, onPress }: OfferCardProps) {
  if (offer.type === 'relic') {
    return (
      <Pressable
        accessibilityLabel={`Take relic ${offer.relic.name}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.offerCard,
          selected && styles.offerCardSelected,
          pressed && styles.cardPressed,
        ]}
      >
        <Text style={styles.offerTag}>RELIC</Text>
        <Text style={styles.offerName}>{offer.relic.name}</Text>
        <Text style={styles.offerText}>{relicDescription(offer.relic)}</Text>
        <Text style={styles.offerAction}>{selected ? 'Confirm below' : 'Tap to review'}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityLabel={`Forge effect ${forgeEffectLabel(offer.effect)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.offerCard,
        selected && styles.offerCardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <Text style={styles.offerTag}>CARD EFFECT</Text>
      <Text style={[styles.offerName, styles.offerNameGold]}>
        {forgeEffectLabel(offer.effect)}
      </Text>
      <Text style={styles.offerText}>{forgeEffectDescription(offer.effect)}</Text>
      <Text style={styles.offerAction}>{selected ? 'Pick a card below' : 'Tap to choose a card'}</Text>
    </Pressable>
  );
}

interface DeckCardCellProps {
  readonly card: Card;
  readonly forged: boolean;
  readonly selected: boolean;
  readonly onPress: () => void;
}

function DeckCardCell({ card, forged, selected, onPress }: DeckCardCellProps) {
  const red = isRedSuit(card.suit);
  return (
    <Pressable
      accessibilityLabel={`${card.value} of ${card.suit}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.deckCell,
        selected && styles.deckCellSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <Text style={[styles.deckCellText, red && styles.deckCellRed]}>
        {card.value}
        {SUIT_SYMBOL[card.suit]}
      </Text>
      {forged && <View style={styles.deckCellForged} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  eyebrow: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 14,
    marginTop: 4,
  },
  offerList: {
    marginTop: 16,
    gap: 10,
  },
  offerCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: 14,
  },
  offerCardSelected: {
    borderColor: colors.gold,
    backgroundColor: '#2a2140',
  },
  cardPressed: {
    opacity: 0.85,
  },
  offerTag: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  offerName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  offerNameGold: {
    color: colors.gold,
  },
  offerText: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  offerAction: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  picker: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: 14,
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  pickerHint: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  deckGrid: {
    marginTop: 12,
    gap: 6,
  },
  suitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  deckCell: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: 6,
    backgroundColor: colors.cardFace,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  deckCellSelected: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  deckCellText: {
    color: colors.cardInk,
    fontSize: 12,
    fontWeight: '800',
  },
  deckCellRed: {
    color: colors.red,
  },
  deckCellForged: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    flex: 2,
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#241a05',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
