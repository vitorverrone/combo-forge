import { Pressable, StyleSheet, Text, View } from 'react-native';

import { activeRelics, getForger, ROUNDS_PER_RUN, RunState } from '../engine';

import { DailySubmitStatus } from './DailySubmitStatus';
import { RelicRow } from './RelicRow';
import { colors } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';

interface RunWonScreenProps {
  readonly run: RunState;
}

export function RunWonScreen({ run }: RunWonScreenProps) {
  const restartRun = useGameStore((state) => state.restartRun);
  const backToStart = useGameStore((state) => state.backToStart);
  const recentUnlocks = useGameStore((state) => state.recentUnlocks);
  const runMode = useGameStore((state) => state.runMode);
  const daily = useGameStore((state) => state.daily);
  const openDaily = useGameStore((state) => state.openDaily);
  const submitDailyScore = useGameStore((state) => state.submitDailyScore);

  const dailyEnd = runMode === 'daily';

  return (
    <View style={styles.container}>
      {/* Win badge */}
      <View style={styles.winBadge}>
        <Text style={styles.winBadgeIcon}>✓</Text>
      </View>

      <Text style={styles.eyebrow}>
        {dailyEnd ? 'DAILY CHALLENGE · CLEARED' : `ALL ${ROUNDS_PER_RUN} ROUNDS CLEARED`}
      </Text>
      <Text style={styles.title}>{dailyEnd ? 'Daily Complete!' : 'Run Complete!'}</Text>
      <Text style={styles.subtitle}>
        {getForger(run.forger).name} forged a {run.runScore}-point run.
      </Text>

      {/* Unlock banner */}
      {!dailyEnd && recentUnlocks.length > 0 && (
        <View style={styles.unlockBanner}>
          <View style={styles.unlockGem} />
          <View>
            <Text style={styles.unlockBannerLabel}>
              NEW UNLOCK{recentUnlocks.length > 1 ? 'S' : ''}
            </Text>
            <Text style={styles.unlockBannerName}>
              {recentUnlocks.join(' · ')}
            </Text>
          </View>
        </View>
      )}

      {/* Final score card */}
      <View style={styles.finalCard}>
        <Text style={styles.finalLabel}>Final Score</Text>
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
        <Text style={styles.relicsLabel}>Active relics</Text>
        <RelicRow relics={activeRelics(run.startingRelic, run.relics)} compact />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {dailyEnd ? (
          <Pressable
            accessibilityLabel="Back to daily challenge"
            onPress={openDaily}
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
          >
            <Text style={styles.btnPrimaryText}>Daily Challenge</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="Play another run"
            accessibilityRole="button"
            onPress={restartRun}
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
          >
            <Text style={styles.btnPrimaryText}>Play Again</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel="Back to start"
          accessibilityRole="button"
          onPress={backToStart}
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnSecondaryText}>{dailyEnd ? 'Home' : 'Change Forger'}</Text>
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
    padding: 20,
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
    marginBottom: 14,
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
    marginTop: 6,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },
  /* ── Unlock banner ── */
  unlockBanner: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(224,165,62,0.1)',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    marginTop: 18,
  },
  unlockGem: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    flexShrink: 0,
  },
  unlockBannerLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  unlockBannerName: {
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  /* ── Final score card ── */
  finalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 22,
    paddingHorizontal: 16,
    marginTop: 20,
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
    marginTop: 6,
  },
  /* ── Relics ── */
  relicsBlock: {
    marginTop: 20,
    alignItems: 'center',
  },
  relicsLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  /* ── Actions ── */
  actions: {
    alignSelf: 'stretch',
    paddingTop: 14,
  },
  btnPrimary: {
    width: '100%',
    height: 48,
    borderRadius: 12,
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
    marginTop: 10,
    width: '100%',
    height: 48,
    borderRadius: 12,
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
