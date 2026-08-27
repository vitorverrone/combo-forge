import { SQLiteStorage } from 'expo-sqlite/kv-store';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../i18n';
import { colors } from './theme';

const STORAGE_KEY = 'combo-forge:onboarding-seen';
const kv = new SQLiteStorage('combo-forge.db');

interface Step {
  readonly title: string;
  readonly body: string;
  readonly tip: string;
  readonly visual: 'cards' | 'pattern' | 'combo' | 'target';
}

// Steps are defined via i18n keys — the visual type maps to each step.
const STEP_KEYS = ['selectCards', 'scorePattern', 'rideCombo', 'beatTarget'] as const;
const STEP_VISUALS: readonly Step['visual'][] = ['cards', 'pattern', 'combo', 'target'];

export function hasSeenOnboarding(): boolean {
  return kv.getItemSync(STORAGE_KEY) === 'true';
}

export function completeOnboarding(): void {
  try {
    kv.setItemSync(STORAGE_KEY, 'true');
  } catch {
    // SQLite write failure should not crash the app
  }
}

interface Props {
  readonly visible: boolean;
  readonly onComplete: () => void;
}

export function OnboardingOverlay({ visible, onComplete }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  if (!visible) return null;

  const stepKey = STEP_KEYS[step];
  const current = {
    title: t(`onboarding.${stepKey}.title`),
    body: t(`onboarding.${stepKey}.body`),
    tip: t(`onboarding.${stepKey}.tip`),
    visual: STEP_VISUALS[step],
  };
  const isLast = step === STEP_KEYS.length - 1;

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Dots + counter */}
          <View style={styles.topRow}>
            <View style={styles.dots}>
              {STEP_KEYS.map((_, i) => (
                <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
              ))}
            </View>
            <Text style={styles.counter}>{step + 1}/{STEP_KEYS.length}</Text>
          </View>

          {/* Visual area */}
          <View style={styles.visual}>
            <StepVisual kind={current.visual} />
          </View>

          {/* Content */}
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>

          {/* Tip box */}
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>{current.tip}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip tutorial"
              onPress={onComplete}
              style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.skipBtnText}>{t('common.skip')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Start playing' : 'Next step'}
              onPress={() => (isLast ? onComplete() : setStep(step + 1))}
              style={({ pressed }) => [styles.nextBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.nextBtnText}>{isLast ? t('onboarding.letsForge') : t('common.next')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Step-specific visual illustrations. */
function StepVisual({ kind }: { kind: Step['visual'] }) {
  switch (kind) {
    case 'cards':
      return (
        <View style={styles.vCards}>
          <View style={[styles.vCard, styles.vCardRed]}>
            <Text style={[styles.vCardRank, styles.vCardRankRed]}>A</Text>
            <Text style={[styles.vCardSuit, styles.vCardSuitRed]}>♥</Text>
          </View>
          <View style={[styles.vCard, styles.vCardSelected]}>
            <Text style={styles.vCardRank}>7</Text>
            <Text style={styles.vCardSuit}>♠</Text>
          </View>
          <View style={[styles.vCard, styles.vCardRed]}>
            <Text style={[styles.vCardRank, styles.vCardRankRed]}>10</Text>
            <Text style={[styles.vCardSuit, styles.vCardSuitRed]}>♦</Text>
          </View>
        </View>
      );
    case 'pattern':
      return (
        <View style={styles.vPattern}>
          <Text style={styles.vPatternName}>Pair</Text>
          <Text style={styles.vPatternBase}>10 + card values</Text>
        </View>
      );
    case 'combo':
      return (
        <View style={styles.vCombo}>
          {['×1', '×2', '×3', '×4'].map((m, i) => (
            <View key={m} style={[styles.vMult, i === 2 && styles.vMultOn]}>
              <Text style={[styles.vMultText, i === 2 && styles.vMultTextOn]}>{m}</Text>
            </View>
          ))}
        </View>
      );
    case 'target':
      return (
        <View style={styles.vTarget}>
          <View style={styles.vBar}>
            <View style={styles.vFill} />
          </View>
          <Text style={styles.vTargetLabel}>255 <Text style={styles.vTargetDim}>/ 300</Text></Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(22,17,32,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 44,
  },
  card: {
    width: '100%',
    maxWidth: 326,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 22,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  /* ── Top row: dots + counter ── */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dotOn: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  counter: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  /* ── Visual area ── */
  visual: {
    height: 120,
    marginTop: 18,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* ── Cards visual ── */
  vCards: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  vCard: {
    width: 52,
    height: 72,
    borderRadius: 7,
    backgroundColor: colors.cardFace,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  vCardRed: {},
  vCardSelected: {
    transform: [{ translateY: -10 }],
    borderColor: colors.gold,
  },
  vCardRank: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
    color: colors.cardInk,
  },
  vCardRankRed: {
    color: colors.red,
  },
  vCardSuit: {
    fontSize: 19,
    lineHeight: 22,
    color: colors.cardInk,
  },
  vCardSuitRed: {
    color: colors.red,
  },
  /* ── Pattern visual ── */
  vPattern: {
    alignItems: 'center',
  },
  vPatternName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold,
  },
  vPatternBase: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: 4,
  },
  /* ── Combo visual ── */
  vCombo: {
    flexDirection: 'row',
    gap: 8,
  },
  vMult: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vMultOn: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.gold,
  },
  vMultText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDim,
  },
  vMultTextOn: {
    color: colors.gold,
  },
  /* ── Target visual ── */
  vTarget: {
    width: '100%',
    maxWidth: 210,
  },
  vBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  vFill: {
    height: '100%',
    width: '85%',
    borderRadius: 6,
    backgroundColor: colors.gold,
  },
  vTargetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: 10,
  },
  vTargetDim: {
    color: colors.textDim,
    fontWeight: '600',
  },
  /* ── Content ── */
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },
  /* ── Tip box ── */
  tipBox: {
    marginTop: 14,
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(224,165,62,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(224,165,62,0.35)',
    borderRadius: 10,
  },
  tipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gold,
    textAlign: 'center',
    lineHeight: 17,
  },
  /* ── Actions ── */
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  skipBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  nextBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textOnPrimary,
    textTransform: 'uppercase',
  },
  btnPressed: {
    opacity: 0.85,
  },
});
