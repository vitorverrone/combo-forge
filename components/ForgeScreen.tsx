import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  activeRelics,
  Card,
  cardKey,
  createDeck,
  ForgedCard,
  ForgeOffer,
  RunState,
  SUITS,
} from '../engine';

import {
  forgeEffectDescription,
  forgeEffectLabel,
  isRedSuit,
  relicDescription,
} from './format';
import { SuitSymbol } from './SuitSymbol';
import { colors } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';

interface ForgeScreenProps {
  readonly run: RunState;
}

export function ForgeScreen({ run }: ForgeScreenProps) {
  const applyForgeOffer = useGameStore((state) => state.applyForgeOffer);
  const [activeOffer, setActiveOffer] = useState<number | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const [cardEffectConfirmed, setCardEffectConfirmed] = useState(false);

  const deck = useMemo(() => createDeck(), []);
  const active = activeOffer !== null ? run.forgeOffers[activeOffer] : undefined;
  const relicCount = activeRelics(run.startingRelic, run.relics).length;

  const handleOfferPress = (index: number) => {
    if (activeOffer === index) {
      setActiveOffer(null);
      setTargetKey(null);
      setCardEffectConfirmed(false);
    } else {
      setActiveOffer(index);
      setTargetKey(null);
      setCardEffectConfirmed(false);
    }
  };

  const handleApplyCardEffect = () => {
    if (active === undefined || activeOffer === null || active.type !== 'cardEffect') return;
    if (targetKey === null) return;
    setCardEffectConfirmed(true);
  };

  const handleConfirm = () => {
    if (active === undefined || activeOffer === null) return;
    if (active.type === 'cardEffect') {
      if (targetKey === null) return;
      const target = deck.find((card) => cardKey(card) === targetKey);
      if (target === undefined) return;
      applyForgeOffer(activeOffer, target);
    } else {
      applyForgeOffer(activeOffer);
    }
    setActiveOffer(null);
    setTargetKey(null);
    setCardEffectConfirmed(false);
  };

  return (
    <View style={styles.container}>
      {/* Topbar with relic counter */}
      <View style={styles.topbar}>
        <View style={styles.relicCounter}>
          <Text style={styles.relicCounterLabel}>Relics</Text>
          <Text style={styles.relicCounterValue}>{relicCount}/3</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Screen header */}
        <Text style={styles.eyebrow}>Round {run.roundNumber} cleared</Text>
        <Text style={styles.title}>Forge</Text>
        <Text style={styles.subtitle}>Choose 1 of 3 offers to strengthen your run.</Text>

        {/* Offers */}
        <View style={styles.offerList}>
          {run.forgeOffers.map((offer, index) => (
            <OfferCard
              key={index}
              offer={offer}
              selected={activeOffer === index}
              deck={deck}
              forgedCards={run.forgedCards}
              onPress={() => handleOfferPress(index)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Forge button */}
      <View style={styles.actions}>
        {(() => {
          const forgeDisabled = activeOffer === null || (active !== undefined && active.type === 'cardEffect' && !cardEffectConfirmed);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: forgeDisabled }}
              accessibilityLabel="Confirm forge"
              disabled={forgeDisabled}
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.btnPrimary,
                forgeDisabled && styles.btnDisabled,
                pressed && !forgeDisabled && styles.btnPressed,
              ]}
            >
              <Text style={[styles.btnPrimaryText, forgeDisabled && styles.btnDisabledText]}>Forge</Text>
            </Pressable>
          );
        })()}
      </View>

      {/* Card picker overlay */}
      {active !== undefined && active.type === 'cardEffect' && !cardEffectConfirmed && (
        <View style={styles.overlay}>
          <View style={styles.pickerPanel}>
            <Text style={styles.pickerTitle}>Choose a card</Text>
            <Text style={styles.pickerSub}>
              {forgeEffectLabel(active.effect)} — {forgeEffectDescription(active.effect)}
            </Text>
            <ScrollView contentContainerStyle={styles.pickerGrid}>
              {SUITS.map((suit) => (
                deck
                  .filter((card) => card.suit === suit)
                  .map((card) => {
                    const red = isRedSuit(card.suit);
                    const isSelected = targetKey === cardKey(card);
                    return (
                      <Pressable
                        key={cardKey(card)}
                        accessibilityRole="button"
                        accessibilityLabel={`${card.value} of ${card.suit}`}
                        onPress={() => setTargetKey(cardKey(card))}
                        style={({ pressed }) => [
                          styles.pickCard,
                          red && styles.pickCardRed,
                          isSelected && styles.pickCardSelected,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <Text style={[styles.pickCardRank, red && styles.pickCardRedText]}>
                          {card.value}
                        </Text>
                        <SuitSymbol suit={card.suit} color={red ? colors.red : colors.cardInk} size={14} />
                      </Pressable>
                    );
                  })
              ))}
            </ScrollView>
            <View style={styles.pickerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={() => { setActiveOffer(null); setTargetKey(null); }}
                style={({ pressed }) => [styles.btnDanger, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnDangerText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: targetKey === null }}
                accessibilityLabel={`Apply ${active ? forgeEffectLabel(active.effect) : ''}`}
                disabled={targetKey === null}
                onPress={handleApplyCardEffect}
                style={({ pressed }) => [
                  styles.btnPrimarySmall,
                  targetKey === null && styles.btnDisabledSmall,
                  pressed && targetKey !== null && styles.btnPressed,
                ]}
              >
                <Text style={[styles.btnPrimaryText, targetKey === null && styles.btnDisabledText]}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

interface OfferCardProps {
  readonly offer: ForgeOffer;
  readonly selected: boolean;
  readonly deck: Card[];
  readonly forgedCards: readonly ForgedCard[];
  readonly onPress: () => void;
}

function OfferCard({ offer, selected, deck, forgedCards, onPress }: OfferCardProps) {
  if (offer.type === 'relic') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Take relic ${offer.relic.name}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.offer,
          selected && styles.offerSelected,
          pressed && styles.btnPressed,
        ]}
      >
        <View style={styles.offerThumb}>
          <View style={styles.relicGem} />
        </View>
        <View style={styles.offerInfo}>
          <Text style={styles.offerType}>Relic</Text>
          <Text style={styles.offerName}>{offer.relic.name}</Text>
          <Text style={styles.offerDesc}>{relicDescription(offer.relic)}</Text>
        </View>
      </Pressable>
    );
  }

  // Card effect — show a mini card with forge badge
  const sampleCard = deck[0]; // default card for thumbnail
  const badge = offer.effect.kind === 'valueBonus' ? `+${offer.effect.amount}` :
    offer.effect.kind === 'multiplier' ? `×${offer.effect.multiplier}` :
      offer.effect.kind === 'wildcard' ? 'ANY' : 'IF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Forge effect ${forgeEffectLabel(offer.effect)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.offer,
        selected && styles.offerSelected,
        pressed && styles.btnPressed,
      ]}
    >
      <View style={styles.offerThumb}>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardRank}>{sampleCard.value}</Text>
          <SuitSymbol suit={sampleCard.suit} color={colors.cardInk} size={17} />
        </View>
        <View style={styles.forgeBadge}>
          <Text style={styles.forgeBadgeText}>{badge}</Text>
        </View>
      </View>
      <View style={styles.offerInfo}>
        <Text style={styles.offerType}>Card Effect</Text>
        <Text style={styles.offerName}>{forgeEffectLabel(offer.effect)}</Text>
        <Text style={styles.offerDesc}>{forgeEffectDescription(offer.effect)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  /* ── Topbar ── */
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 44,
  },
  relicCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  relicCounterLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  relicCounterValue: {
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold,
  },
  /* ── Scroll ── */
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 70,
  },
  /* ── Header ── */
  eyebrow: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    color: colors.gold,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 16,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.gold,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 290,
    alignSelf: 'center',
  },
  /* ── Offers ── */
  offerList: {
    marginTop: 20,
    gap: 10,
  },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: 14,
  },
  offerSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceSelected,
  },
  btnPressed: {
    opacity: 0.85,
  },
  offerThumb: {
    width: 60,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  miniCard: {
    width: 48,
    height: 66,
    borderRadius: 6,
    backgroundColor: colors.cardFace,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  miniCardRank: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
    color: colors.cardInk,
  },
  miniCardSuit: {
    fontFamily: fonts.heading,
    fontSize: 17,
    lineHeight: 20,
    color: colors.cardInk,
  },
  forgeBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: colors.gold,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.goldDark,
  },
  forgeBadgeText: {
    fontFamily: fonts.body,
    color: colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  relicGem: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    shadowColor: colors.gold,
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  offerInfo: {
    flex: 1,
    minWidth: 0,
  },
  offerType: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  offerName: {
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 3,
  },
  offerDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: 3,
    lineHeight: 17,
  },
  /* ── Actions ── */
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  btnPrimary: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnDisabledText: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    fontFamily: fonts.heading,
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  /* ── Picker overlay ── */
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 10,
  },
  pickerPanel: {
    width: 'auto',
    maxWidth: 400,
    maxHeight: '92%',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  pickerTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  pickerSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickCard: {
    width: '18%',
    // aspectRatio: 5 / 9,
    paddingTop: '5%',
    paddingBottom: '5%',
    borderRadius: 6,
    backgroundColor: colors.cardFace,
    alignItems: 'center',
    gap: 1,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    display: 'flex',
    flexDirection: 'column'
  },
  pickCardRed: {},
  pickCardSelected: {
    borderColor: colors.gold,
  },
  pickCardRank: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    color: colors.cardInk,
    includeFontPadding: false
  },
  pickCardSuit: {
    fontFamily: fonts.heading,
    fontSize: 14,
    lineHeight: 18,
    color: colors.cardInk,
    includeFontPadding: false
  },
  pickCardRedText: {
    color: colors.red,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    width: '100%'
  },
  btnDanger: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDangerText: {
    fontFamily: fonts.body,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  btnPrimarySmall: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabledSmall: {
    opacity: 0.45,
  },
});
