import { SQLiteStorage } from 'expo-sqlite/kv-store';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

const STORAGE_KEY = 'combo-forge:onboarding-seen';
const kv = new SQLiteStorage('combo-forge.db');

const STEPS = [
  {
    title: 'Select Cards',
    body: 'Tap cards from your hand (up to 5) to build a play. Look for patterns: Pairs, Straights, Full Houses.',
    hint: 'Tap to select · Tap again to deselect',
  },
  {
    title: 'Score the Pattern',
    body: 'Each pattern has a base value. The better the pattern, the higher the base score.',
    hint: 'High Card < Pair < Two Pair < Three of a Kind < Straight < Full House < Four of a Kind',
  },
  {
    title: 'Ride the Combo',
    body: 'Each play in a round multiplies your score: ×1, ×2, ×3, ×4. Stack plays to build massive scores.',
    hint: 'The combo multiplier resets at the start of each new round',
  },
  {
    title: 'Beat the Target',
    body: 'Reach the round target before your plays run out. Win rounds to unlock forge upgrades and grow stronger.',
    hint: 'After winning, choose a forge upgrade to power up your next round',
  },
];

/** Check if onboarding has been completed (synchronous, KV store). */
export function hasSeenOnboarding(): boolean {
  return kv.getItemSync(STORAGE_KEY) === 'true';
}

/** Mark onboarding as completed (synchronous, KV store). */
export function completeOnboarding(): void {
  kv.setItemSync(STORAGE_KEY, 'true');
}

interface Props {
  readonly visible: boolean;
  readonly onComplete: () => void;
}

export function OnboardingOverlay({ visible, onComplete }: Props) {
  const [step, setStep] = useState(0);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onComplete}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.stepRow}>
            <Text style={styles.stepCount}>
              {step + 1}/{STEPS.length}
            </Text>
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
          <Text style={styles.hint}>{current.hint}</Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip tutorial"
              onPress={onComplete}
              style={({ pressed }) => [styles.skipButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.skipText}>SKIP</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Start playing' : 'Next step'}
              onPress={() => (isLast ? onComplete() : setStep(step + 1))}
              style={({ pressed }) => [styles.nextButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.nextText}>{isLast ? "LET'S FORGE" : 'NEXT'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(22,17,32,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: 24,
  },
  stepRow: {
    alignItems: 'flex-end',
  },
  stepCount: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
  },
  body: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    lineHeight: 24,
  },
  hint: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  skipButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nextButton: {
    flex: 2,
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
