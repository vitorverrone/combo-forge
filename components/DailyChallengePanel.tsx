import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DailyAttempts } from '../engine';
import { useTranslation } from '../i18n';
import { dailyCallToActionText } from './format';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';

/**
 * Painel do Desafio Diário na Start Screen (ADR-0011): promove o Desafio
 * Diário ao mesmo peso visual que "Iniciar Run" tinha antes. Componente fino
 * — a lógica dos 3 estados vem de `dailyCallToActionState` (mesmo seam que a
 * `DailyChallengeScreen` usa), sem duplicar cálculo nem disparar chamada de
 * rede nova. Tocar em qualquer parte navega para o Desafio Diário; nunca
 * dispara o anúncio direto daqui.
 */
export function DailyChallengePanel({
  attempts,
  streakCurrent,
  onPress,
}: {
  readonly attempts: DailyAttempts;
  readonly streakCurrent: number;
  readonly onPress: () => void;
}) {
  const { t } = useTranslation();
  const remaining = attempts.unlockedTotal - attempts.attemptsUsed;
  const stateText = dailyCallToActionText(attempts);

  return (
    <Pressable
      accessibilityLabel={t('start.dailyChallenge')}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.panel, pressed && styles.panelPressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>{t('start.dailyChallenge')}</Text>
        <Text style={styles.stateText}>{stateText}</Text>
        {streakCurrent > 0 && (
          <Text style={styles.streakLine}>
            {t('daily.streakLabel')} <Text style={styles.streakValue}>{streakCurrent}</Text>
          </Text>
        )}
      </View>
      <Text style={styles.counter}>{remaining} / 1</Text>

    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(224,165,62,0.07)',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius[14],
    padding: spacing[16],
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  panelPressed: {
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: spacing[4],
    flexShrink: 1
  },
  label: {
    fontFamily: fonts.heading,
    color: colors.gold,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  counter: {
    fontFamily: fonts.heading,
    color: colors.gold,
    fontSize: 20,
    fontWeight: '800',
    flexShrink: 0
  },
  stateText: {
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  streakLine: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
  },
  streakValue: {
    color: colors.gold,
    fontWeight: '700',
  },
});
