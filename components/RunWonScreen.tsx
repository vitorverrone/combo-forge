import { Pressable, StyleSheet, Text, View } from 'react-native';

import { activeRelics, getForger, ROUNDS_PER_RUN, RunState } from '../engine';

import { DailySubmitStatus } from './DailySubmitStatus';
import { RelicRow } from './RelicRow';
import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

interface RunWonScreenProps {
  readonly run: RunState;
}

/** Conclusão da Run: vitória após vencer todas as Rodadas. */
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
      <Text style={styles.eyebrow}>
        {dailyEnd ? 'DAILY CHALLENGE · CLEARED' : `ALL ${ROUNDS_PER_RUN} ROUNDS CLEARED`}
      </Text>
      <Text style={styles.title}>{dailyEnd ? 'Daily Complete!' : 'Run Complete!'}</Text>
      {!dailyEnd && recentUnlocks.length > 0 && (
        <View style={styles.unlockBanner}>
          <Text style={styles.unlockBannerText}>
            NEW UNLOCK{recentUnlocks.length > 1 ? 'S' : ''}: {recentUnlocks.join(' · ')}
          </Text>
        </View>
      )}
      <Text style={styles.subtitle}>
        {getForger(run.forger).name} forged a {run.runScore}-point run.
      </Text>

      <View style={styles.card}>
        <Text style={styles.scoreLabel}>FINAL SCORE</Text>
        <Text style={styles.scoreValue}>{run.runScore}</Text>
      </View>

      {dailyEnd && (
        <DailySubmitStatus
          submitStatus={daily.submitStatus}
          onRetry={() => void submitDailyScore(run.runScore)}
        />
      )}

      <RelicRow relics={activeRelics(run.startingRelic, run.relics)} compact />

      {dailyEnd ? (
        <Pressable
          accessibilityLabel="Back to daily challenge"
          onPress={openDaily}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>DAILY CHALLENGE</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel="Play another run"
          accessibilityRole="button"
          onPress={restartRun}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>PLAY AGAIN</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityLabel="Back to start"
        accessibilityRole="button"
        onPress={backToStart}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.secondaryButtonText}>{dailyEnd ? 'HOME' : 'CHANGE FORGER'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 80,
  },
  eyebrow: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 6,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  unlockBanner: {
    alignSelf: 'stretch',
    borderRadius: 10,
    backgroundColor: 'rgba(127,201,138,0.15)',
    borderWidth: 1,
    borderColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  unlockBannerText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 40,
    paddingVertical: 18,
    marginTop: 28,
  },
  scoreLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  scoreValue: {
    color: colors.gold,
    fontSize: 44,
    fontWeight: '900',
    marginTop: 2,
  },
  primaryButton: {
    marginTop: 32,
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: 10,
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
