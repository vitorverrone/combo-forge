import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  BONUS_FORGE_EFFECTS,
  cardKey,
  computeUnlocks,
  createDeck,
  FORGE_EFFECT_POOL,
  FORGERS,
  getForger,
  isForgerUnlocked,
  milestoneForForger,
  milestoneForRareRelics,
  RELIC_POOL,
  SUITS,
  unlockStatuses,
} from '../engine';

import { cardLabel, forgeEffectDescription, forgeEffectLabel, isRedSuit, relicDescription } from './format';
import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

/**
 * Coleção: cartas (Efeitos de Forja), Relíquias e Forjadores com o progresso
 * de desbloqueio visível. Os desbloqueios pendentes (marco da 5ª vitória —
 * escolha da ordem) podem ser reivindicados aqui.
 */
export function CollectionScreen() {
  const progression = useGameStore((state) => state.progression);
  const claimUnlock = useGameStore((state) => state.claimUnlock);
  const backToStart = useGameStore((state) => state.backToStart);

  const unlocks = computeUnlocks(progression);
  const statuses = unlockStatuses(progression);
  const rareMilestone = milestoneForRareRelics();

  const statusOf = (optionId: string) => statuses.find((status) => status.option.id === optionId);
  const lockedForgers = FORGERS.filter((forger) => !isForgerUnlocked(unlocks, forger.id));
  const deck = useMemo(() => createDeck(), []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.eyebrow}>COLLECTION</Text>
      <Text style={styles.title}>Unlocked Content</Text>
      <Text style={styles.subtitle}>Progress is earned by achievement — no currency.</Text>

      {/* Forjadores */}
      <SectionHeader label="Forgers" progress={`${unlocks.forgers.length}/${FORGERS.length}`} />
      <View style={styles.cardList}>
        {FORGERS.map((forger) => {
          const unlocked = isForgerUnlocked(unlocks, forger.id);
          const milestone = milestoneForForger(forger.id);
          return (
            <View key={forger.id} style={[styles.cardRow, !unlocked && styles.cardRowLocked]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, !unlocked && styles.rowTitleLocked]}>{forger.name}</Text>
                <Text style={styles.rowDesc}>{relicDescription(getForger(forger.id).startingRelic)}</Text>
                {!unlocked && <Text style={styles.lockHint}>🔒 {milestone?.description ?? 'Locked'}</Text>}
              </View>
              <UnlockBadge unlocked={unlocked} />
            </View>
          );
        })}
      </View>

      {/* Cartas do Baralho (sempre disponíveis) */}
      <SectionHeader label="Deck Cards" progress="40/40" />
      <Text style={styles.deckNote}>All 40 base cards are always available — forge effects shape them.</Text>
      <View style={styles.deckGrid}>
        {SUITS.map((suit) => (
          <View key={suit} style={styles.suitRow}>
            {deck
              .filter((card) => card.suit === suit)
              .map((card) => (
                <View key={cardKey(card)} style={styles.deckCell}>
                  <Text style={[styles.deckCellText, isRedSuit(card.suit) && styles.deckCellRed]}>
                    {cardLabel(card)}
                  </Text>
                </View>
              ))}
          </View>
        ))}
      </View>

      {/* Efeitos de Forja */}
      <SectionHeader
        label="Forge Effects"
        progress={`${FORGE_EFFECT_POOL.length + unlocks.extraEffects.length}/${FORGE_EFFECT_POOL.length + BONUS_FORGE_EFFECTS.length}`}
      />
      <View style={styles.cardList}>
        {FORGE_EFFECT_POOL.map((option) => (
          <View key={option.id} style={styles.cardRow}>
            <Text style={[styles.rowTitle, styles.effectTitle]}>{forgeEffectLabel(option.effect)}</Text>
            <Text style={[styles.rowDesc, styles.rowDescFlex]}>{forgeEffectDescription(option.effect)}</Text>
            <UnlockBadge unlocked />
          </View>
        ))}
        {BONUS_FORGE_EFFECTS.map((option) => {
          const status = statusOf(option.id);
          const unlocked = unlocks.extraEffects.includes(option.id);
          return (
            <View key={option.id} style={[styles.cardRow, !unlocked && styles.cardRowLocked]}>
              <Text style={[styles.rowTitle, styles.effectTitle, !unlocked && styles.rowTitleLocked]}>
                {forgeEffectLabel(option.effect)}
              </Text>
              <Text style={[styles.rowDesc, styles.rowDescFlex]}>{forgeEffectDescription(option.effect)}</Text>
              {unlocked ? (
                <UnlockBadge unlocked />
              ) : status?.available ? (
                <Pressable
                  accessibilityLabel={`Unlock ${forgeEffectLabel(option.effect)}`}
                  accessibilityRole="button"
                  onPress={() => claimUnlock(option.id)}
                  style={({ pressed }) => [styles.unlockButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.unlockButtonText}>UNLOCK</Text>
                </Pressable>
              ) : (
                <UnlockBadge unlocked={false} hint={status?.milestone.description} />
              )}
            </View>
          );
        })}
      </View>

      {/* Relíquias */}
      <SectionHeader
        label="Relics"
        progress={`${RELIC_POOL.length - (unlocks.rareRelics ? 0 : RELIC_POOL.filter((r) => r.rarity === 'rare').length)}/${RELIC_POOL.length}`}
      />
      <View style={styles.cardList}>
        {RELIC_POOL.map((relic) => {
          const locked = relic.rarity === 'rare' && !unlocks.rareRelics;
          return (
            <View key={relic.id} style={[styles.cardRow, locked && styles.cardRowLocked]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, locked && styles.rowTitleLocked]}>
                  {relic.name}
                  {relic.rarity === 'rare' && <Text style={styles.rareTag}> RARE</Text>}
                </Text>
                <Text style={styles.rowDesc}>{relicDescription(relic)}</Text>
                {locked && <Text style={styles.lockHint}>🔒 {rareMilestone?.description ?? 'Locked'}</Text>}
              </View>
              <UnlockBadge unlocked={!locked} />
            </View>
          );
        })}
      </View>

      <Text style={styles.lockedSummary}>
        {lockedForgers.length} forger{lockedForgers.length === 1 ? '' : 's'} to unlock · win runs to progress
      </Text>

      <Pressable
        accessibilityLabel="Back to home"
        accessibilityRole="button"
        onPress={backToStart}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>BACK</Text>
      </Pressable>
    </ScrollView>
  );
}

function SectionHeader({ label, progress }: { label: string; progress: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <Text style={styles.sectionProgress}>{progress}</Text>
    </View>
  );
}

function UnlockBadge({ unlocked, hint }: { unlocked: boolean; hint?: string }) {
  if (unlocked) {
    return (
      <View style={styles.badgeUnlocked}>
        <Text style={styles.badgeUnlockedText}>UNLOCKED</Text>
      </View>
    );
  }
  return (
    <View style={styles.badgeLocked}>
      <Text style={styles.badgeLockedText} numberOfLines={2}>
        {hint ?? 'Locked'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 70,
  },
  eyebrow: {
    color: colors.gold,
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
    fontSize: 13,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 22,
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionProgress: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  deckNote: {
    color: colors.textDim,
    fontSize: 12,
    marginBottom: 10,
  },
  deckGrid: {
    gap: 6,
  },
  suitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  deckCell: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: colors.cardFace,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  deckCellText: {
    color: colors.cardInk,
    fontSize: 11,
    fontWeight: '800',
  },
  deckCellRed: {
    color: colors.red,
  },
  cardList: {
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 12,
  },
  cardRowLocked: {
    opacity: 0.75,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  rowTitleLocked: {
    color: colors.textDim,
  },
  rowDesc: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  rowDescFlex: {
    flex: 1,
  },
  effectTitle: {
    color: colors.gold,
    width: 42,
  },
  rareTag: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '900',
  },
  lockHint: {
    color: colors.danger,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  badgeUnlocked: {
    borderRadius: 8,
    backgroundColor: 'rgba(127,201,138,0.15)',
    borderWidth: 1,
    borderColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeUnlockedText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badgeLocked: {
    maxWidth: 130,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLockedText: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  unlockButton: {
    borderRadius: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unlockButtonText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  lockedSummary: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 18,
    textAlign: 'center',
  },
  button: {
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
