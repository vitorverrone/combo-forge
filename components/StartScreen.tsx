import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FORGERS, getForger } from '../engine';

import { relicDescription } from './format';
import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

export function StartScreen() {
  const forger = useGameStore((state) => state.forger);
  const chooseForger = useGameStore((state) => state.chooseForger);
  const startRun = useGameStore((state) => state.startRun);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>COMBO FORGE</Text>
      <Text style={styles.subtitle}>Choose your Forger</Text>
      {/* Unlocks via meta-progression arrive in a later milestone; all three are selectable for now. */}
      <View style={styles.list}>
        {FORGERS.map((candidate) => {
          const selected = candidate.id === forger;
          const relic = getForger(candidate.id).startingRelic;
          return (
            <Pressable
              key={candidate.id}
              accessibilityLabel={`${candidate.name} forger`}
              onPress={() => chooseForger(candidate.id)}
              style={({ pressed }) => [
                styles.forgerCard,
                selected && styles.forgerCardSelected,
                pressed && styles.forgerCardPressed,
              ]}
            >
              <Text style={styles.forgerName}>{candidate.name}</Text>
              <Text style={styles.forgerRelic}>{relicDescription(relic)}</Text>
              {relic !== undefined && <Text style={styles.forgerRelicName}>Starts with: {relic.name}</Text>}
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityLabel="Start run"
        onPress={startRun}
        style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
      >
        <Text style={styles.startButtonText}>START RUN</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.gold,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 24,
  },
  list: {
    alignSelf: 'stretch',
    gap: 12,
  },
  forgerCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: 16,
  },
  forgerCardSelected: {
    borderColor: colors.gold,
    backgroundColor: '#2a2140',
  },
  forgerCardPressed: {
    opacity: 0.85,
  },
  forgerName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  forgerRelic: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 4,
  },
  forgerRelicName: {
    color: colors.gold,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  startButton: {
    marginTop: 28,
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonPressed: {
    backgroundColor: colors.goldDark,
  },
  startButtonText: {
    color: '#241a05',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
