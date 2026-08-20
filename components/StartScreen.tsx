import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  canPlayDaily,
  computeUnlocks,
  dailyAttemptsForDay,
  DAILY_MAX_ATTEMPTS,
  FORGERS,
  getForger,
  isForgerUnlocked,
  milestoneForForger,
  utcDateIso,
} from '../engine';

import { relicDescription } from './format';
import { completeOnboarding, hasSeenOnboarding, OnboardingOverlay } from './OnboardingOverlay';
import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

export function StartScreen() {
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding());
  const forger = useGameStore((state) => state.forger);
  const chooseForger = useGameStore((state) => state.chooseForger);
  const startRun = useGameStore((state) => state.startRun);
  const progression = useGameStore((state) => state.progression);
  const openProfile = useGameStore((state) => state.openProfile);
  const openCollection = useGameStore((state) => state.openCollection);
  const openDaily = useGameStore((state) => state.openDaily);
  const openShop = useGameStore((state) => state.openShop);
  const daily = useGameStore((state) => state.daily);

  const unlocks = computeUnlocks(progression);
  const dailyAttempts = dailyAttemptsForDay(daily.attempts, utcDateIso());
  const dailyPlayable = canPlayDaily(dailyAttempts);

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  return (
    <>
    <OnboardingOverlay visible={showOnboarding} onComplete={handleOnboardingComplete} />
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.navRow}>
        <Pressable
          accessibilityLabel="Open profile"
          accessibilityRole="button"
          onPress={openProfile}
          style={({ pressed }) => [styles.navButton, pressed && styles.forgerCardPressed]}
        >
          <Text style={styles.navButtonText}>PROFILE</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Open collection"
          accessibilityRole="button"
          onPress={openCollection}
          style={({ pressed }) => [styles.navButton, pressed && styles.forgerCardPressed]}
        >
          <Text style={styles.navButtonText}>COLLECTION</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Open shop"
          accessibilityRole="button"
          onPress={openShop}
          style={({ pressed }) => [styles.navButton, styles.navButtonShop, pressed && styles.forgerCardPressed]}
        >
          <Text style={[styles.navButtonText, styles.navButtonShopText]}>SHOP</Text>
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
              accessibilityRole="button"
              accessibilityState={{ disabled: !unlocked, selected }}
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
        accessibilityLabel="Daily challenge"          accessibilityRole="button"
          onPress={openDaily}
          style={({ pressed }) => [styles.dailyButton, pressed && styles.dailyButtonPressed]}
      >
        <Text style={styles.dailyButtonText}>DAILY CHALLENGE</Text>
        <Text style={styles.dailyButtonHint}>
          {dailyAttempts.attemptsUsed}/{DAILY_MAX_ATTEMPTS} attempts used{dailyPlayable ? '' : ' · done for today'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Start run"          accessibilityRole="button"
          onPress={startRun}
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
      >
        <Text style={styles.startButtonText}>START RUN</Text>
      </Pressable>
    </ScrollView>
    </>
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
  navButtonShop: {
    borderColor: colors.gold,
  },
  navButtonShopText: {
    color: colors.gold,
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
    backgroundColor: colors.surfaceSelected,
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
  dailyButton: {
    marginTop: 24,
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dailyButtonPressed: {
    backgroundColor: colors.surfaceSelected,
  },
  dailyButtonText: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  dailyButtonHint: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  startButton: {
    marginTop: 12,
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
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
