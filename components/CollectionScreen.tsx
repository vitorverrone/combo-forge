import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  BONUS_FORGE_EFFECTS,
  computeUnlocks,
  FORGE_EFFECT_POOL,
  FORGERS,
  getForger,
  isForgerUnlocked,
  milestoneForForger,
  milestoneForRareRelics,
  MILESTONES,
  RELIC_POOL,
  unlockStatuses,
} from '../engine';

import { useTranslation } from '../i18n';
import { forgeEffectDescription, forgeEffectLabel, relicDescription } from './format';
import { colors } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';

export function CollectionScreen() {
  const { t } = useTranslation();
  const progression = useGameStore((state) => state.progression);
  const claimUnlock = useGameStore((state) => state.claimUnlock);
  const backToStart = useGameStore((state) => state.backToStart);

  const unlocks = computeUnlocks(progression);
  const statuses = unlockStatuses(progression);
  const rareMilestone = milestoneForRareRelics();
  const statusOf = (optionId: string) => statuses.find((status) => status.option.id === optionId);
  const lockedForgers = FORGERS.filter((forger) => !isForgerUnlocked(unlocks, forger.id));

  const { stats } = progression;
  const claimedMilestones = MILESTONES.filter((m) =>
    m.options.every((option) => progression.claimedOptions.includes(option.id)),
  );
  const milestoneProgress = claimedMilestones.length;
  const milestoneTotal = MILESTONES.length;
  const milestoneFillPct = milestoneTotal > 0 ? (milestoneProgress / milestoneTotal) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <Pressable
          accessibilityLabel="Back to home"
          accessibilityRole="button"
          onPress={backToStart}
          style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
        >
          <Text style={styles.navBtnText}>←</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>{t('collection.eyebrow')}</Text>
        <Text style={styles.title}>{t('collection.title')}</Text>
        <Text style={styles.subtitle}>{t('collection.subtitle')}</Text>

        {/* Progress card */}
        <View style={styles.progressCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.runsWon}</Text>
              <Text style={styles.statLabel}>{t('collection.runsWon')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.bestRunScore.toLocaleString()}</Text>
              <Text style={styles.statLabel}>{t('collection.bestScore')}</Text>
            </View>
          </View>

          <View style={styles.milestonesLabel}>
            <Text style={styles.milestonesLabelText}>
              {t('collection.milestones')} <Text style={styles.milestonesLabelCount}>{milestoneProgress}/{milestoneTotal}</Text>
            </Text>
          </View>
          <View style={styles.milestoneTrack}>
            <View style={[styles.milestoneFill, { width: `${milestoneFillPct}%` }]} />
          </View>

          {MILESTONES.map((milestone) => {
            const claimed = milestone.options.every((option) =>
              progression.claimedOptions.includes(option.id),
            );
            return (
              <View key={milestone.id} style={[styles.milestone, claimed && styles.milestoneDone]}>
                <View style={[styles.milestoneDot, claimed && styles.milestoneDotDone]}>
                  {claimed && <View style={styles.milestoneCheck} />}
                </View>
                <View style={styles.milestoneBody}>
                  <Text style={[styles.milestoneLabel, claimed && styles.milestoneLabelDone]}>
                    {milestone.title}
                  </Text>
                  <Text style={[styles.milestoneReward, claimed && styles.milestoneRewardDone]}>
                    {milestone.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Forgers */}
        <SectionHeader label={t('collection.forgers')} count={`${unlocks.forgers.length}/${FORGERS.length}`} />
        {FORGERS.map((forger) => {
          const unlocked = isForgerUnlocked(unlocks, forger.id);
          const milestone = milestoneForForger(forger.id);
          return (
            <View key={forger.id} style={[styles.forgerRow, !unlocked && styles.forgerRowLocked]}>
              <View style={styles.forgerAvatar}>
                <Text style={[styles.forgerAvatarText, !unlocked && styles.forgerAvatarTextLocked]}>
                  {forger.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.forgerInfo}>
                <Text style={[styles.forgerName, !unlocked && styles.forgerNameLocked]}>
                  {forger.name}
                </Text>
                <Text style={styles.forgerDesc}>
                  {relicDescription(getForger(forger.id).startingRelic)}
                </Text>
                {!unlocked && milestone !== undefined && (
                  <Text style={styles.forgerUnlock}>{milestone.description}</Text>
                )}
              </View>
              <StatusBadge unlocked={unlocked} />
            </View>
          );
        })}

        {/* Deck Cards */}
        {/* <SectionHeader label="Deck Cards" count="40/40" />
        <Text style={styles.deckNote}>All 40 base cards are always available — forge effects shape them.</Text>
        {SUITS.map((suit) => (
          <View key={suit} style={styles.deckSuitGroup}>
            <Text style={styles.deckSuitLabel}>{SUIT_SYMBOL[suit]} {suit.charAt(0).toUpperCase() + suit.slice(1)}</Text>
            <View style={styles.deckCards}>
              {deck
                .filter((card) => card.suit === suit)
                .map((card) => (
                  <View key={cardKey(card)} style={styles.deckCard}>
                    <Text style={[styles.deckCardRank, isRedSuit(card.suit) && styles.deckCardRed]}>
                      {cardLabel(card)}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        ))} */}

        {/* Relics */}
        <SectionHeader
          label={t('collection.relics')}
          count={`${RELIC_POOL.length - (unlocks.rareRelics ? 0 : RELIC_POOL.filter((r) => r.rarity === 'rare').length)}/${RELIC_POOL.length}`}
        />
        <View style={styles.relicGrid}>
          {RELIC_POOL.map((relic) => {
            const locked = relic.rarity === 'rare' && !unlocks.rareRelics;
            return (
              <View key={relic.id} style={[styles.relicTile, locked && styles.relicTileLocked]}>
                <View style={styles.relicHead}>
                  <View style={[styles.relicGemSmall, locked && styles.relicGemSmallLocked]} />
                  <Text style={styles.relicCat}>{relic.category}</Text>
                </View>
                <Text style={[styles.relicName, locked && styles.relicNameLocked]}>
                  {locked ? `🔒 ${relic.name}` : relic.name}
                </Text>
                {!locked ? (
                  <Text style={styles.relicEffect}>{relicDescription(relic)}</Text>
                ) : (
                  <Text style={styles.relicLock}>{rareMilestone?.description ?? t('common.locked')}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Forge Effects */}
        <SectionHeader
          label={t('collection.forgeEffects')}
          count={`${FORGE_EFFECT_POOL.length + unlocks.extraEffects.length}/${FORGE_EFFECT_POOL.length + BONUS_FORGE_EFFECTS.length}`}
        />
        {FORGE_EFFECT_POOL.map((option) => (
          <View key={option.id} style={styles.fxRow}>
            <View style={styles.fxIcon}>
              <Text style={styles.fxIconText}>{forgeEffectLabel(option.effect).slice(0, 3)}</Text>
            </View>
            <View style={styles.fxInfo}>
              <Text style={styles.fxName}>{forgeEffectLabel(option.effect)}</Text>
              <Text style={styles.fxDesc}>{forgeEffectDescription(option.effect)}</Text>
            </View>
            <StatusBadge unlocked />
          </View>
        ))}
        {BONUS_FORGE_EFFECTS.map((option) => {
          const status = statusOf(option.id);
          const unlocked = unlocks.extraEffects.includes(option.id);
          return (
            <View key={option.id} style={[styles.fxRow, !unlocked && styles.fxRowLocked]}>
              <View style={[styles.fxIcon, !unlocked && styles.fxIconLocked]}>
                <Text style={[styles.fxIconText, !unlocked && styles.fxIconTextLocked]}>
                  {forgeEffectLabel(option.effect).slice(0, 3)}
                </Text>
              </View>
              <View style={styles.fxInfo}>
                <Text style={[styles.fxName, !unlocked && styles.fxNameLocked]}>
                  {forgeEffectLabel(option.effect)}
                </Text>
                <Text style={styles.fxDesc}>{forgeEffectDescription(option.effect)}</Text>
                {!unlocked && <Text style={styles.fxLock}>{status?.milestone.description ?? 'Locked'}</Text>}
              </View>
              {unlocked ? (
                <StatusBadge unlocked />
              ) : status?.available ? (
                <Pressable
                  accessibilityLabel={`Unlock ${forgeEffectLabel(option.effect)}`}
                  accessibilityRole="button"
                  onPress={() => claimUnlock(option.id)}
                  style={({ pressed }) => [styles.unlockBtn, pressed && styles.btnPressed]}
                >
                  <Text style={styles.unlockBtnText}>{t('common.unlock')}</Text>
                </Pressable>
              ) : (
                <StatusBadge unlocked={false} />
              )}
            </View>
          );
        })}

        {lockedForgers.length > 0 && (
          <Text style={styles.lockedSummary}>
            {t('collection.lockedSummary', { count: lockedForgers.length })}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ label, count }: { label: string; count: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

function StatusBadge({ unlocked, hint }: { unlocked: boolean; hint?: string }) {
  const { t } = useTranslation();
  if (unlocked) {
    return (
      <View style={styles.badgeUnlocked}>
        <Text style={styles.badgeUnlockedText}>{t('common.unlocked')}</Text>
      </View>
    );
  }
  return (
    <View style={styles.badgeLocked}>
      <Text style={styles.badgeLockedText} numberOfLines={2}>
        {hint ?? t('common.locked')}
      </Text>
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPressed: {
    opacity: 0.85,
  },
  navBtnText: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 16,
  },
  /* ── Scroll ── */
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    marginTop: 14,
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
  /* ── Progress card ── */
  progressCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: 26,
    fontWeight: '700',
    color: colors.gold,
    lineHeight: 30,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  milestonesLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 14,
    marginBottom: 8,
  },
  milestonesLabelText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  milestonesLabelCount: {
    color: colors.gold,
    fontWeight: '800',
  },
  milestoneTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
    marginBottom: 10,
  },
  milestoneFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  milestoneDone: {
    opacity: 0.7,
  },
  milestoneDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  milestoneCheck: {
    width: 5,
    height: 9,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.cardInk,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  milestoneBody: {
    flex: 1,
  },
  milestoneLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  milestoneLabelDone: {
    color: colors.textDim,
  },
  milestoneReward: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.gold,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  milestoneRewardDone: {
    color: colors.textDim,
  },
  /* ── Section headers ── */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
  },
  /* ── Forgers ── */
  forgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  forgerRowLocked: {
    backgroundColor: colors.background,
    borderColor: colors.surface,
  },
  forgerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgerAvatarText: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '900',
    color: colors.gold,
  },
  forgerAvatarTextLocked: {
    color: colors.textDim,
    backgroundColor: colors.surface,
  },
  forgerInfo: {
    flex: 1,
  },
  forgerName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  forgerNameLocked: {
    color: colors.textDim,
  },
  forgerDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: 2,
    lineHeight: 15,
  },
  forgerUnlock: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textDim,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  /* ── Deck cards ── */
  deckNote: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '400',
    color: colors.textDim,
    lineHeight: 15,
    marginBottom: 12,
  },
  deckSuitGroup: {
    marginBottom: 12,
  },
  deckSuitLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  deckCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  deckCard: {
    width: 34,
    height: 46,
    borderRadius: 6,
    backgroundColor: colors.cardFace,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  deckCardRank: {
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '900',
    color: colors.cardInk,
  },
  deckCardRed: {
    color: colors.red,
  },
  /* ── Relics grid ── */
  relicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relicTile: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: 12,
  },
  relicTileLocked: {
    backgroundColor: colors.background,
    borderColor: colors.surface,
  },
  relicHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relicGemSmall: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  relicGemSmallLocked: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.textDim,
  },
  relicCat: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  relicName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  relicNameLocked: {
    color: colors.textDim,
  },
  relicEffect: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: 3,
    lineHeight: 15,
  },
  relicLock: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textDim,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  /* ── Forge effects ── */
  fxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  fxRowLocked: {
    backgroundColor: colors.background,
    borderColor: colors.surface,
  },
  fxIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fxIconLocked: {
    backgroundColor: colors.surface,
  },
  fxIconText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold,
  },
  fxIconTextLocked: {
    color: colors.textDim,
  },
  fxInfo: {
    flex: 1,
  },
  fxName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  fxNameLocked: {
    color: colors.textDim,
  },
  fxDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: 2,
    lineHeight: 15,
  },
  fxLock: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textDim,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  /* ── Badges ── */
  badgeUnlocked: {
    borderRadius: 6,
    backgroundColor: 'rgba(127,201,138,0.15)',
    borderWidth: 1,
    borderColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeUnlockedText: {
    fontFamily: fonts.body,
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badgeLocked: {
    maxWidth: 130,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLockedText: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  unlockBtn: {
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: colors.gold,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnText: {
    fontFamily: fonts.body,
    color: colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  btnPressed: {
    opacity: 0.8,
  },
  lockedSummary: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: 18,
    textAlign: 'center',
  },
});
