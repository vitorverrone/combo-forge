import { Pressable, StyleSheet, Text, View } from 'react-native';

import { activeRelics, getForger, RunState } from '../engine';

import { RelicRow } from './RelicRow';
import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

interface RoundWonScreenProps {
  readonly run: RunState;
}

/** Resumo da Rodada vencida: pontuação obtida vs Meta e avanço para a próxima. */
export function RoundWonScreen({ run }: RoundWonScreenProps) {
  const nextRound = useGameStore((state) => state.nextRound);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ROUND {run.roundNumber} CLEARED</Text>
      <Text style={styles.title}>Target beaten!</Text>

      <View style={styles.card}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{run.score}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Target</Text>
          <Text style={styles.statValue}>{run.target}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Margin</Text>
          <Text style={[styles.statValue, styles.marginValue]}>+{run.score - run.target}</Text>
        </View>
      </View>

      <RelicRow relics={activeRelics(run.startingRelic, run.relics)} compact />

      <Text style={styles.forgerNote}>
        {getForger(run.forger).name} · Run total {run.runScore} pts
      </Text>

      <Pressable
        accessibilityLabel="Start next round"
        onPress={nextRound}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>NEXT ROUND →</Text>
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
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 6,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 18,
    marginTop: 28,
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  statLabel: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  marginValue: {
    color: colors.gold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
  },
  forgerNote: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 14,
  },
  button: {
    marginTop: 28,
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.goldDark,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
