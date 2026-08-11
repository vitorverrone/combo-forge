import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { activeRelics, getForger, RunState } from '../engine';

import { DailySubmitStatus } from './DailySubmitStatus';
import { RelicRow } from './RelicRow';
import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

interface RunLostScreenProps {
  readonly run: RunState;
}

/** Derrota: destaque do "quase lá" (distância que faltou) e restart imediato. */
export function RunLostScreen({ run }: RunLostScreenProps) {
  const restartRun = useGameStore((state) => state.restartRun);
  const backToStart = useGameStore((state) => state.backToStart);
  const recentUnlocks = useGameStore((state) => state.recentUnlocks);
  const runMode = useGameStore((state) => state.runMode);
  const daily = useGameStore((state) => state.daily);
  const openDaily = useGameStore((state) => state.openDaily);
  const submitDailyScore = useGameStore((state) => state.submitDailyScore);

  const dailyEnd = runMode === 'daily';
  const missing = Math.max(run.target - run.score, 0);
  // Barra "quase cheia" quando a margem é pequena (Efeito Zeigarnik).
  const progress = Math.min(run.score / run.target, 1);
  const marginPct = missing > 0 ? Math.round((missing / run.target) * 100) : 0;
  const soClose = missing > 0 && missing <= Math.round(run.target * 0.1);

  // Pulso suave na barra "quase cheia" (juice transiente, volta ao repouso).
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!soClose) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.55, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [soClose, pulse]);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>
        {dailyEnd ? 'DAILY CHALLENGE · ' : ''}ROUND {run.roundNumber} · {getForger(run.forger).name}
      </Text>
      <Text style={styles.title}>{soClose ? 'So close!' : 'Run over'}</Text>

      {missing > 0 ? (
        <Text style={styles.missingText}>
          You were <Text style={styles.missingValue}>{missing} pts ({marginPct}%)</Text> short of
          the target.
        </Text>
      ) : (
        <Text style={styles.missingText}>The target slipped away.</Text>
      )}

      {!dailyEnd && recentUnlocks.length > 0 && (
        <View style={styles.unlockBanner}>
          <Text style={styles.unlockBannerText}>
            NEW UNLOCK{recentUnlocks.length > 1 ? 'S' : ''}: {recentUnlocks.join(' · ')}
          </Text>
        </View>
      )}

      {dailyEnd && (
        <DailySubmitStatus
          submitStatus={daily.submitStatus}
          onRetry={() => void submitDailyScore(run.runScore)}
        />
      )}

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
            soClose && styles.progressFillClose,
            soClose && { opacity: pulse },
          ]}
        />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>{run.score}</Text>
        <Text style={styles.progressLabel}>target {run.target}</Text>
      </View>

      <Text style={styles.runTotal}>Run total: {run.runScore} pts</Text>

      <RelicRow relics={activeRelics(run.startingRelic, run.relics)} />

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
          accessibilityLabel="Try again immediately"
          onPress={restartRun}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>TRY AGAIN</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityLabel="Back to start"
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
  },
  eyebrow: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 6,
  },
  missingText: {
    color: colors.textDim,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  missingValue: {
    color: colors.danger,
    fontWeight: '800',
  },
  unlockBanner: {
    alignSelf: 'stretch',
    borderRadius: 10,
    backgroundColor: 'rgba(224,165,62,0.15)',
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  unlockBannerText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surface,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
    backgroundColor: colors.gold,
  },
  progressFillClose: {
    backgroundColor: colors.danger,
  },
  progressLabels: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  runTotal: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 20,
  },
  primaryButton: {
    marginTop: 28,
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#241a05',
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
