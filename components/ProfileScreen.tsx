import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { computeUnlocks, MILESTONES, Suit } from '../engine';

import i18n, { useTranslation } from '../i18n';
import { milestoneDescription, milestoneTitle } from './format';
import { SuitSymbol } from './SuitSymbol';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { useDisplayNameForm } from './useDisplayNameForm';
import { useGameStore } from '../store/gameStore';
import TopButton from './TopButton';

export function ProfileScreen() {
  const { t } = useTranslation();
  const progression = useGameStore((state) => state.progression);
  const daily = useGameStore((state) => state.daily);
  const setDisplayName = useGameStore((state) => state.setDisplayName);
  const backToStart = useGameStore((state) => state.backToStart);
  const displayNameSaving = daily.displayNameStatus === 'saving';
  const displayNameForm = useDisplayNameForm({
    initialValue: daily.displayName ?? '',
    saving: displayNameSaving,
    onSave: (name) => void setDisplayName(name),
  });
  const displayNameServerError = daily.displayNameStatus === 'error' ? daily.displayNameError : null;
  const displayNameError = displayNameForm.clientError ?? displayNameServerError;

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
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.dailyStreakCurrent}</Text>
              <Text style={styles.statLabel}>{t('profile.currentStreak')}</Text>
            </View>
          </View>
        </View>

        {/* Favorite cards — mini playing cards
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
        )} */}

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
                    {milestoneTitle(milestone.id)}
                  </Text>
                  <Text style={styles.milestoneDesc}>{milestoneDescription(milestone.id)}</Text>
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

        {/* Display Name (ticket 02) — editable anytime, same validation as the mandatory modal */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.displayName')}</Text>
        </View>
        <View style={styles.displayNameRow}>
          <TextInput
            value={displayNameForm.value}
            onChangeText={displayNameForm.setValue}
            placeholder={t('daily.displayNamePlaceholder')}
            placeholderTextColor={colors.textDim}
            style={styles.displayNameInput}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!displayNameSaving}
            accessibilityLabel={t('a11y.displayNameInput')}
          />
          <Pressable
            accessibilityLabel={t('a11y.saveDisplayName')}
            accessibilityRole="button"
            accessibilityState={{ disabled: !displayNameForm.canSave }}
            disabled={!displayNameForm.canSave}
            onPress={displayNameForm.submit}
            style={({ pressed }) => [
              styles.displayNameSaveBtn,
              !displayNameForm.canSave && styles.btnDisabled,
              pressed && displayNameForm.canSave && styles.btnPressed,
            ]}
          >
            <Text style={styles.displayNameSaveBtnText}>
              {displayNameSaving ? t('common.loading') : t('daily.saveDisplayName')}
            </Text>
          </Pressable>
        </View>
        {displayNameError !== null && <Text style={styles.displayNameErrorText}>{displayNameError}</Text>}

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
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[8],
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: radius[10],
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
    paddingHorizontal: spacing[16],
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
    marginTop: spacing[14],
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.gold,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  screenDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing[8],
    maxWidth: 290,
    alignSelf: 'center',
  },
  /* ── Stats card (2×2 grid) ── */
  statCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[14],
    padding: spacing[14],
    marginTop: spacing[18],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[10],
  },
  statBox: {
    width: '48%' as unknown as number,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing[14],
    paddingHorizontal: spacing[8],
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[12],
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
    marginTop: spacing[24],
    marginBottom: spacing[10],
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
    marginTop: spacing[10],
  },
  /* ── Favorite cards (mini playing cards) ── */
  favCards: {
    flexDirection: 'row',
    gap: spacing[10],
  },
  favCardWrap: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[6],
  },
  favCard: {
    width: '100%' as unknown as number,
    aspectRatio: 0.72,
    backgroundColor: colors.cardFace,
    borderRadius: radius[8],
    padding: spacing[8],
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
    gap: spacing[0],
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    paddingVertical: 11,
  },
  milestoneRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  milestoneDot: {
    width: 20,
    height: 20,
    borderRadius: radius[10],
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
    marginTop: spacing[2],
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
    borderRadius: radius[6],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    color: colors.textDim,
    borderWidth: 1,
    borderColor: colors.surfaceBorder
  },
  milestoneBadgeDone: {
    backgroundColor: 'rgba(127,201,138,0.15)',
    color: colors.success,
    borderColor: colors.success,
  },
  milestoneBadgeReady: {
    backgroundColor: 'rgba(224,165,62,0.15)',
    color: colors.gold,
    borderColor: colors.gold,
  },
  /* ── Forgers note ── */
  forgersNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[12],
    padding: spacing[12],
    paddingLeft: spacing[14],
    marginTop: spacing[18],
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
    gap: spacing[8],
  },
  langBtn: {
    flex: 1,
    borderRadius: radius[10],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing[12],
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
  /* ── Display Name (ticket 02) ── */
  displayNameRow: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  displayNameInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[10],
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[12],
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  displayNameSaveBtn: {
    borderRadius: radius[10],
    backgroundColor: colors.gold,
    paddingHorizontal: spacing[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayNameSaveBtnText: {
    fontFamily: fonts.heading,
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  displayNameErrorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.danger,
    marginTop: spacing[6],
  },
});
