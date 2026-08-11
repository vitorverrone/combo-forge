import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RunState } from '../engine';

import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

interface PhaseScreenProps {
  readonly run: RunState;
}

/** Telas de transição de fase; a Forja (ticket 10) e a derrota/vitória (ticket 09) entram depois. */
export function PhaseScreen({ run }: PhaseScreenProps) {
  const backToStart = useGameStore((state) => state.backToStart);

  const title =
    run.phase === 'runWon'
      ? 'RUN COMPLETE'
      : run.phase === 'runLost'
        ? 'DEFEAT'
        : `ROUND ${run.roundNumber} COMPLETE`;
  const message =
    run.phase === 'runWon'
      ? `Victory! You cleared all ${run.roundNumber} rounds with ${run.runScore} points.`
      : run.phase === 'runLost'
        ? `You reached round ${run.roundNumber} with ${run.runScore} points.`
        : 'The Forge between rounds arrives in a future update.';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        accessibilityLabel="New run"
        onPress={backToStart}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>NEW RUN</Text>
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
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  message: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#241a05',
    fontWeight: '900',
    letterSpacing: 1,
  },
});
