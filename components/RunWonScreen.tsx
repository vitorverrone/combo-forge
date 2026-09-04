import { Pressable, StyleSheet, Text, View } from 'react-native';

import { activeRelics, ROUNDS_PER_RUN, RunState } from '../engine';

import { useTranslation } from '../i18n';
import { AchievementToast } from './AchievementToast';
import { DailySubmitStatus } from './DailySubmitStatus';
import { forgerName } from './format';
import { RelicRow } from './RelicRow';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';
import { useInterstitialOnRunEnd } from './useInterstitialOnRunEnd';

interface RunWonScreenProps {
  readonly run: RunState;
}

export function RunWonScreen({ run }: RunWonScreenProps) {
  const { t } = useTranslation();
  const restartRun = useGameStore((state) => state.restartRun);
  const backToStart = useGameStore((state) => state.backToStart);
  const runMode = useGameStore((state) => state.runMode);
  const daily = useGameStore((state) => state.daily);
  const openDaily = useGameStore((state) => state.openDaily);
  const submitDailyScore = useGameStore((state) => state.submitDailyScore);

  const dailyEnd = runMode === 'daily';
  useInterstitialOnRunEnd(dailyEnd);

  return (
    <View style={styles.container}>
      <AchievementToast />

      {/* Win badge */}
      <View style={styles.winBadge}>
        <Text style={styles.winBadgeIcon}>✓</Text>
      </View>

      <Text style={styles.eyebrow}>
        {dailyEnd ? t('runWon.dailyCleared') : t('runWon.allRoundsCleared', { rounds: ROUNDS_PER_RUN })}
      </Text>
      <Text style={styles.title}>{dailyEnd ? t('runWon.dailyComplete') : t('runWon.runComplete')}</Text>
      <Text style={styles.subtitle}>
        {t('runWon.forgedRun', { forger: forgerName(run.forger), score: run.runScore })}
      </Text>

      {/* Final score card */}
      <View style={styles.finalCard}>
        <Text style={styles.finalLabel}>{t('runWon.finalScore')}</Text>
        <Text style={styles.finalValue}>{run.runScore}</Text>
      </View>

      {dailyEnd && (
        <DailySubmitStatus
          submitStatus={daily.submitStatus}
          onRetry={() => void submitDailyScore(run.runScore)}
        />
      )}

      {/* Relics */}
      <View style={styles.relicsBlock}>
        <Text style={styles.relicsLabel}>{t('runWon.activeRelics')}</Text>
        <RelicRow relics={activeRelics(run.startingRelic, run.relics)} compact />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {dailyEnd ? (
          <Pressable
            accessibilityLabel={t('a11y.backToDailyChallenge')}
            onPress={openDaily}
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
          >
            <Text style={styles.btnPrimaryText}>{t('runWon.dailyChallenge')}</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel={t('a11y.playAnotherRun')}
            accessibilityRole="button"
            onPress={restartRun}
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
          >
            <Text style={styles.btnPrimaryText}>{t('runWon.playAgain')}</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel={t('a11y.backToStart')}
          accessibilityRole="button"
          onPress={backToStart}
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnSecondaryText}>{dailyEnd ? t('common.home') : t('runWon.changeForger')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[20],
    paddingBottom: 80,
    backgroundColor: colors.background,
  },
  /* ── Win badge ── */
  winBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[14],
    shadowColor: colors.gold,
    shadowOpacity: 0.14,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
  },
  winBadgeIcon: {
    fontFamily: fonts.heading,
    color: colors.textOnPrimary,
    fontSize: 30,
    fontWeight: '900',
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
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing[6],
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing[8],
  },
  /* ── Final score card ── */
  finalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[16],
    padding: spacing[22],
    paddingHorizontal: spacing[16],
    marginTop: spacing[20],
    alignItems: 'center',
  },
  finalLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  finalValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.gold,
    lineHeight: 54,
    marginTop: spacing[6],
  },
  /* ── Relics ── */
  relicsBlock: {
    marginTop: spacing[20],
    alignItems: 'center',
  },
  relicsLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginBottom: spacing[10],
  },
  /* ── Actions ── */
  actions: {
    alignSelf: 'stretch',
    paddingTop: spacing[14],
  },
  btnPrimary: {
    width: '100%',
    height: 48,
    borderRadius: radius[12],
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryPressed: {
    backgroundColor: colors.goldDark,
  },
  btnPrimaryText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnSecondary: {
    marginTop: spacing[10],
    width: '100%',
    height: 48,
    borderRadius: radius[12],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
