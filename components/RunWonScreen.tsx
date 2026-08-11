import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getForger, ROUNDS_PER_RUN, RunState } from '../engine';

import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

interface RunWonScreenProps {
  readonly run: RunState;
}

/** Conclusão da Run: vitória após vencer todas as Rodadas. */
export function RunWonScreen({ run }: RunWonScreenProps) {
  const restartRun = useGameStore((state) => state.restartRun);
  const backToStart = useGameStore((state) => state.backToStart);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ALL {ROUNDS_PER_RUN} ROUNDS CLEARED</Text>
      <Text style={styles.title}>Run Complete!</Text>
      <Text style={styles.subtitle}>
        {getForger(run.forger).name} forged a {run.runScore}-point run.
      </Text>

      <View style={styles.card}>
        <Text style={styles.scoreLabel}>FINAL SCORE</Text>
        <Text style={styles.scoreValue}>{run.runScore}</Text>
      </View>

      <Pressable
        accessibilityLabel="Play another run"
        onPress={restartRun}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonText}>PLAY AGAIN</Text>
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
