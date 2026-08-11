import { Pressable, StyleSheet, Text, View } from 'react-native';

import { activeRelics, getForger, RunState } from '../engine';

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

  const missing = Math.max(run.target - run.score, 0);
  // Barra "quase cheia" quando a margem é pequena (Efeito Zeigarnik).
  const progress = Math.min(run.score / run.target, 1);
  const marginPct = missing > 0 ? Math.round((missing / run.target) * 100) : 0;
  const soClose = missing > 0 && missing <= Math.round(run.target * 0.1);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ROUND {run.roundNumber} · {getForger(run.forger).name}</Text>
      <Text style={styles.title}>{soClose ? 'So close!' : 'Run over'}</Text>

      {missing > 0 ? (
        <Text style={styles.missingText}>
          You were <Text style={styles.missingValue}>{missing} pts ({marginPct}%)</Text> short of
          the target.
        </Text>
      ) : (
        <Text style={styles.missingText}>The target slipped away.</Text>
      )}

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
            soClose && styles.progressFillClose,
          ]}
        />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>{run.score}</Text>
        <Text style={styles.progressLabel}>target {run.target}</Text>
      </View>

      <Text style={styles.runTotal}>Run total: {run.runScore} pts</Text>

      <RelicRow relics={activeRelics(run.startingRelic, run.relics)} />

      <Pressable
        accessibilityLabel="Try again immediately"
        onPress={restartRun}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonText}>TRY AGAIN</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Back to forger select"
        onPress={backToStart}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.secondaryButtonText}>CHANGE FORGER</Text>
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
