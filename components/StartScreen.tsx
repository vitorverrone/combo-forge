import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { computeUnlocks, FORGERS, getForger, isForgerUnlocked, milestoneForForger } from '../engine';

import { relicDescription } from './format';
import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

export function StartScreen() {
  const forger = useGameStore((state) => state.forger);
  const chooseForger = useGameStore((state) => state.chooseForger);
  const startRun = useGameStore((state) => state.startRun);
  const progression = useGameStore((state) => state.progression);
  const openProfile = useGameStore((state) => state.openProfile);
  const openCollection = useGameStore((state) => state.openCollection);

  const unlocks = computeUnlocks(progression);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.navRow}>
        <Pressable
          accessibilityLabel="Open profile"
          onPress={openProfile}
          style={({ pressed }) => [styles.navButton, pressed && styles.forgerCardPressed]}
        >
          <Text style={styles.navButtonText}>PROFILE</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Open collection"
          onPress={openCollection}
          style={({ pressed }) => [styles.navButton, pressed && styles.forgerCardPressed]}
        >
          <Text style={styles.navButtonText}>COLLECTION</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>COMBO FORGE</Text>
      <Text style={styles.subtitle}>Choose your Forger</Text>

      <View style={styles.list}>
        {FORGERS.map((candidate) => {
          const unlocked = isForgerUnlocked(unlocks, candidate.id);
          const selected = candidate.id === forger;
          const relic = getForger(candidate.id).startingRelic;
          const milestone = milestoneForForger(candidate.id);
          return (
            <Pressable
              key={candidate.id}
              accessibilityLabel={`${candidate.name} forger${unlocked ? '' : ' (locked)'}`}
              disabled={!unlocked}
              onPress={() => chooseForger(candidate.id)}
              style={({ pressed }) => [
                styles.forgerCard,
                selected && styles.forgerCardSelected,
                !unlocked && styles.forgerCardLocked,
                pressed && styles.forgerCardPressed,
              ]}
            >
              <View style={styles.forgerHeader}>
                <Text style={[styles.forgerName, !unlocked && styles.forgerNameLocked]}>
                  {unlocked ? candidate.name : `🔒 ${candidate.name}`}
                </Text>
                {!unlocked && milestone !== undefined && (
                  <Text style={styles.forgerLockHint}>{milestone.description}</Text>
                )}
              </View>
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
  navRow: {
    position: 'absolute',
    top: 18,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  navButton: {
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  navButtonText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
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
  forgerCardLocked: {
    opacity: 0.6,
  },
  forgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  forgerName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  forgerNameLocked: {
    color: colors.textDim,
  },
  forgerLockHint: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
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
