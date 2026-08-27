import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { computeUnlocks, MILESTONES, Suit } from '../engine';

import i18n, { useTranslation } from '../i18n';
import { SuitSymbol } from './SuitSymbol';
import { colors } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';
import TopButton from './TopButton';

export function ProfileScreen() {
  const { t } = useTranslation();
  const progression = useGameStore((state) => state.progression);
  const backToStart = useGameStore((state) => state.backToStart);

  const { stats } = progression;
  const unlocks = computeUnlocks(progression);
  const winRate = stats.runsStarted > 0 ? Math.round((stats.runsWon / stats.runsStarted) * 100) : 0;

  const favorites = Object.entries(stats.cardPlays)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TopButton onPress={backToStart} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>{t('profile.eyebrow')}</Text>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <Text style={styles.screenDesc}>{t('profile.desc')}</Text>

        {/* Stats card — 2×2 grid */}
        <View style={styles.statCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.bestRunScore.toLocaleString()}</Text>
              <Text style={styles.statLabel}>{t('profile.bestRunScore')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.runsWon}/{stats.runsStarted}</Text>
              <Text style={styles.statLabel}>{t('profile.runsWon')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{winRate}%</Text>
              <Text style={styles.statLabel}>{t('profile.winRate')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>×{stats.maxMultiplier}</Text>
              <Text style={styles.statLabel}>{t('profile.biggestCombo')}</Text>
            </View>
          </View>
        </View>

        {/* Favorite cards — mini playing cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.favoriteCards')}</Text>
        </View>
        {favorites.length === 0 ? (
          <Text style={styles.emptyText}>{t('profile.noCardsYet')}</Text>
        ) : (
          <View style={styles.favCards}>
            {favorites.map(([key, count]) => {
              const [suit, value] = key.split(':');
              const isRed = suit === 'hearts' || suit === 'diamonds';
              return (
                <View key={key} style={styles.favCardWrap}>
                  <View style={[styles.favCard, isRed && styles.favCardRed]}>
                    <Text style={[styles.favRank, isRed && styles.favRankRed]}>{value}</Text>
                    <View style={styles.favSuitWrap}>
                      <SuitSymbol suit={suit as Suit} color={isRed ? colors.red : colors.cardInk} size={22} />
                    </View>
                  </View>
                  <Text style={styles.favPlays}>{count} {t('profile.plays')}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Milestones */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.milestones')}</Text>
        </View>
        <View style={styles.milestoneList}>
          {MILESTONES.map((milestone) => {
            const claimed = milestone.options.every((option) =>
              progression.claimedOptions.includes(option.id),
            );
            const reached = milestone.condition(stats);
            return (
              <View key={milestone.id} style={[styles.milestoneRow, !claimed && styles.milestoneRowBorder]}>
                <View style={[styles.milestoneDot, claimed && styles.milestoneDotDone, !claimed && reached && styles.milestoneDotReady]}>
                  {claimed && <View style={styles.milestoneCheck} />}
                </View>
                <View style={styles.milestoneText}>
                  <Text style={[styles.milestoneTitle, claimed && styles.milestoneTitleDone]}>
                    {milestone.title}
                  </Text>
                  <Text style={styles.milestoneDesc}>{milestone.description}</Text>
                </View>
                <View style={styles.milestoneBadge}>
                  <Text style={[styles.milestoneBadgeText, claimed && styles.milestoneBadgeDone, !claimed && reached && styles.milestoneBadgeReady]}>
                    {claimed ? t('common.done') : reached ? t('common.ready') : t('common.locked')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Language switcher */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
        </View>
        <View style={styles.langRow}>
          {[{ code: 'pt', label: 'Português' }, { code: 'en', label: 'English' }].map((lang) => (
            <Pressable
              key={lang.code}
              accessibilityRole="button"
              accessibilityState={{ selected: i18n.language === lang.code }}
              onPress={() => void i18n.changeLanguage(lang.code)}
              style={({ pressed }) => [
                styles.langBtn,
                i18n.language === lang.code && styles.langBtnSelected,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={[styles.langBtnText, i18n.language === lang.code && styles.langBtnTextSelected]}>
                {lang.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Forgers note */}
        <View style={styles.forgersNote}>
          <Text style={styles.forgersIcon}>⚒</Text>
          <Text style={styles.forgersText}>{t('profile.forgersUnlocked', { count: unlocks.forgers.length })}</Text>
        </View>
      </ScrollView>
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
  screenDesc: {
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
  /* ── Stats card (2×2 grid) ── */
  statCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%' as unknown as number,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold,
    lineHeight: 28,
  },
  statLabel: {
    fontFamily: fonts.heading,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginTop: 5,
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
  emptyText: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 13,
    marginTop: 10,
  },
  /* ── Favorite cards (mini playing cards) ── */
  favCards: {
    flexDirection: 'row',
    gap: 10,
  },
  favCardWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  favCard: {
    width: '100%' as unknown as number,
    aspectRatio: 0.72,
    backgroundColor: colors.cardFace,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  favCardRed: {},
  favRank: {
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: '900',
    color: colors.cardInk,
  },
  favRankRed: {
    color: colors.red,
  },
  favSuitWrap: {
    alignSelf: 'flex-end',
  },
  favPlays: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDim,
  },
  /* ── Milestones ── */
  milestoneList: {
    gap: 0,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  milestoneRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
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
  milestoneDotReady: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
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
  milestoneText: {
    flex: 1,
  },
  milestoneTitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  milestoneTitleDone: {
    color: colors.textDim,
  },
  milestoneDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: 2,
    lineHeight: 15,
  },
  milestoneBadge: {
    flexShrink: 0,
  },
  milestoneBadgeText: {
    fontFamily: fonts.heading,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  milestoneBadgeDone: {
    backgroundColor: 'rgba(127,201,138,0.15)',
    color: colors.success,
    borderWidth: 1,
    borderColor: colors.success,
  },
  milestoneBadgeReady: {
    backgroundColor: 'rgba(224,165,62,0.15)',
    color: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  /* ── Forgers note ── */
  forgersNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: 12,
    paddingLeft: 14,
    marginTop: 18,
  },
  forgersIcon: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.gold,
  },
  forgersText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  forgersCount: {
    color: colors.gold,
    fontWeight: '700',
  },
  /* ── Language switcher ── */
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 12,
    alignItems: 'center',
  },
  langBtnSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceSelected,
  },
  langBtnText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDim,
  },
  langBtnTextSelected: {
    color: colors.gold,
  },
  btnPressed: {
    opacity: 0.8,
  },
});
