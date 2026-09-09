import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../i18n';
import { colors, spacing, radius } from './theme';
import { useResetStepOnReopen } from './useResetStepOnReopen';

interface Step {
  readonly title: string;
  readonly body: string;
  readonly tip: string;
  /** Nem todo passo tem uma ilustração própria — texto puro é suficiente pros conceitos mais abstratos (Divisão, Sequência). */
  readonly visual?: 'tiers';
}

const STEP_KEYS = ['tiers', 'divisions', 'streak'] as const;
const STEP_VISUALS: readonly (Step['visual'] | undefined)[] = ['tiers', undefined, undefined];

interface Props {
  readonly visible: boolean;
  readonly onComplete: () => void;
}

/**
 * Onboarding da Liga (ticket 01): explica Tiers/Divisão/Sequência antes do
 * jogador interagir com a DailyChallengeScreen. Mesmo padrão estrutural de
 * OnboardingOverlay (Modal, dots, X pra fechar, não bloqueante) — a
 * persistência do "já visto" e o botão "?" de reabertura vivem no
 * componente pai (DailyChallengeScreen), não aqui: este componente só
 * reflete `visible`/`onComplete`, igual ao onboarding geral.
 */
export function DailyOnboardingOverlay({ visible, onComplete }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  useResetStepOnReopen(visible, setStep);

  if (!visible) return null;

  const stepKey = STEP_KEYS[step];
  const current: Step = {
    title: t(`dailyOnboarding.${stepKey}.title`),
    body: t(`dailyOnboarding.${stepKey}.body`),
    tip: t(`dailyOnboarding.${stepKey}.tip`),
    visual: STEP_VISUALS[step],
  };
  const isLast = step === STEP_KEYS.length - 1;
  const isFirst = step === 0;

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.dots}>
              {STEP_KEYS.map((_, i) => (
                <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={styles.closeBtn}
              onPress={onComplete}
            >
              <Text style={styles.counter}>X</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{current.title}</Text>

            {current.visual === 'tiers' && (
              <View style={styles.visual}>
                <TierBadges />
              </View>
            )}

            <Text style={styles.body}>{current.body}</Text>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>{current.tip}</Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.previous')}
              disabled={isFirst}
              onPress={() => setStep(step - 1)}
              style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.skipBtnText}>{t('common.previous')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isLast ? t('a11y.closeDailyOnboarding') : t('a11y.nextStep')}
              onPress={() => (isLast ? onComplete() : setStep(step + 1))}
              style={({ pressed }) => [styles.nextBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.nextBtnText}>{isLast ? t('dailyOnboarding.gotIt') : t('common.next')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const TIER_KEYS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;

/** Fileira dos 5 Tiers nomeados — sem cor por Tier (não há palette de Liga definida ainda), só a inicial em ordem crescente. */
function TierBadges() {
  const { t } = useTranslation();
  return (
    <View style={styles.tierRow}>
      {TIER_KEYS.map((tier) => (
        <View key={tier} style={styles.tierBadge}>
          <Text style={styles.tierBadgeText}>{t(`dailyOnboarding.tierInitial.${tier}`)}</Text>
        </View>
      ))}
    </View>
  );
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
    borderRadius: radius[16],
    padding: spacing[22],
    paddingHorizontal: spacing[20],
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    maxHeight: '85%',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius[12],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing[6],
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
  scrollBody: {
    height: 'auto',
  },
  visual: {
    height: 72,
    marginTop: spacing[18],
    marginBottom: spacing[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierRow: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  tierBadge: {
    width: 40,
    height: 40,
    borderRadius: radius[10],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gold,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing[8],
  },
  tipBox: {
    marginTop: spacing[14],
    padding: spacing[10],
    paddingHorizontal: spacing[12],
    backgroundColor: 'rgba(224,165,62,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(224,165,62,0.35)',
    borderRadius: radius[10],
  },
  tipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gold,
    textAlign: 'center',
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[10],
    marginTop: spacing[20],
  },
  skipBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius[12],
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
    borderRadius: radius[12],
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
