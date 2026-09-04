import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { Trans } from 'react-i18next';

import { activeRelics, RunState } from '../engine';

import { useTranslation } from '../i18n';
import { DailySubmitStatus } from './DailySubmitStatus';
import { forgerName } from './format';
import { RelicRow } from './RelicRow';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';
import { useInterstitialOnRunEnd } from './useInterstitialOnRunEnd';

interface RunLostScreenProps {
  readonly run: RunState;
}

/** Derrota: destaque do "quase lá" (distância que faltou) e restart imediato. */
export function RunLostScreen({ run }: RunLostScreenProps) {
  const { t } = useTranslation();
  const restartRun = useGameStore((state) => state.restartRun);
  const backToStart = useGameStore((state) => state.backToStart);
  const recentUnlocks = useGameStore((state) => state.recentUnlocks);
  const runMode = useGameStore((state) => state.runMode);
  const daily = useGameStore((state) => state.daily);
  const openDaily = useGameStore((state) => state.openDaily);
  const submitDailyScore = useGameStore((state) => state.submitDailyScore);

  const dailyEnd = runMode === 'daily';
  useInterstitialOnRunEnd(dailyEnd);
  const missing = Math.max(run.target - run.score, 0);
  // Barra "quase cheia" quando a margem é pequena (Efeito Zeigarnik).
  const progress = Math.min(run.score / run.target, 1);
  const marginPct = missing > 0 ? Math.round((missing / run.target) * 100) : 0;
  const soClose = missing > 0 && missing <= Math.round(run.target * 0.1);

  // Pulso suave na barra "quase cheia" (juice transiente, volta ao repouso).
  // Respeta Reduce Motion: sem pulsação, mantém barra estática. useMemo (não
  // useRef): o valor precisa ser lido no render (style da Animated.View), e a
  // regra react-hooks/refs proíbe ler ref.current fora de efeitos/handlers.
  const pulse = useMemo(() => new Animated.Value(1), []);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!soClose || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.55, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [soClose, pulse, reduceMotion]);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>
        {dailyEnd ? `${t('runLost.dailyChallenge')} · ` : ''}
        {t('runLost.eyebrowRound', { number: run.roundNumber, forger: forgerName(run.forger) })}
      </Text>
      <Text style={styles.title}>{soClose ? t('runLost.soClose') : t('runLost.runOver')}</Text>

      {missing > 0 ? (
        <Text style={styles.missingText}>
          <Trans
            i18nKey="runLost.shortOfTarget"
            values={{ pts: missing, pct: marginPct }}
            components={{ 1: <Text style={styles.missingValue} /> }}
          />
        </Text>
      ) : (
        <Text style={styles.missingText}>{t('runLost.targetSlipped')}</Text>
      )}

      {!dailyEnd && recentUnlocks.length > 0 && (
        <View style={styles.unlockBanner}>
          <Text style={styles.unlockBannerText}>
            {recentUnlocks.length > 1 ? t('runWon.newUnlocks') : t('runWon.newUnlock')}: {recentUnlocks.join(' · ')}
          </Text>
        </View>
      )}

      {dailyEnd && (
        <DailySubmitStatus
          submitStatus={daily.submitStatus}
          onRetry={() => void submitDailyScore(run.runScore)}
        />
      )}

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
            soClose && styles.progressFillClose,
            soClose && { opacity: pulse },
          ]}
        />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>{run.score}</Text>
        <Text style={styles.progressLabel}>{t('runLost.progressTarget', { target: run.target })}</Text>
      </View>

      <Text style={styles.runTotal}>{t('runLost.runTotal', { pts: run.runScore })}</Text>

      <RelicRow relics={activeRelics(run.startingRelic, run.relics)} compact />

      {dailyEnd ? (
        <Pressable
          accessibilityLabel={t('a11y.backToDailyChallenge')}
          onPress={openDaily}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>{t('runLost.dailyChallenge')}</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel={t('a11y.tryAgainImmediately')}
          accessibilityRole="button"
          onPress={restartRun}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>{t('runLost.tryAgain')}</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityLabel={t('a11y.backToStart')}
        accessibilityRole="button"
        onPress={backToStart}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.secondaryButtonText}>{dailyEnd ? t('common.home') : t('runLost.changeForger')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[24],
    paddingBottom: 80,
  },
  eyebrow: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    fontFamily: fonts.heading,
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: spacing[6],
  },
  missingText: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 14,
    marginTop: spacing[10],
    textAlign: 'center',
    lineHeight: 20,
  },
  missingValue: {
    color: colors.danger,
    fontWeight: '800',
  },
  unlockBanner: {
    alignSelf: 'stretch',
    borderRadius: radius[10],
    backgroundColor: 'rgba(224,165,62,0.15)',
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[12],
    alignItems: 'center',
    marginTop: spacing[16],
  },
  unlockBannerText: {
    fontFamily: fonts.heading,
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 14,
    borderRadius: radius[7],
    backgroundColor: colors.surface,
    marginTop: spacing[24],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius[7],
    backgroundColor: colors.gold,
  },
  progressFillClose: {
    backgroundColor: colors.danger,
  },
  progressLabels: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[6],
  },
  progressLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  runTotal: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: spacing[20],
  },
  primaryButton: {
    marginTop: spacing[28],
    alignSelf: 'stretch',
    borderRadius: radius[12],
    backgroundColor: colors.gold,
    paddingVertical: spacing[16],
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: spacing[10],
    alignSelf: 'stretch',
    borderRadius: radius[12],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing[14],
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
