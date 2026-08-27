import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../i18n';
import { colors, spacing, radius } from './theme';

/** Status da submissão da pontuação do Desafio Diário (com retry). */
export function DailySubmitStatus({
  submitStatus,
  onRetry,
}: {
  readonly submitStatus: 'idle' | 'submitting' | 'submitted' | 'failed';
  readonly onRetry: () => void;
}) {
  const { t } = useTranslation();
  if (submitStatus === 'submitting') {
    return (
      <View style={styles.submitRow}>
        <Text style={styles.submitText}>{t('dailySubmit.submitting')}</Text>
      </View>
    );
  }
  if (submitStatus === 'submitted') {
    return (
      <View style={[styles.submitRow, styles.submitRowOk]}>
        <Text style={styles.submitTextOk}>{t('dailySubmit.submitted')}</Text>
      </View>
    );
  }
  if (submitStatus === 'failed') {
    return (
      <View style={[styles.submitRow, styles.submitRowFail]}>
        <Text style={styles.submitTextFail}>{t('dailySubmit.failed')}</Text>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  submitRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius[10],
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[10],
    marginTop: spacing[16],
  },
  submitRowOk: {
    borderColor: colors.success,
    backgroundColor: 'rgba(127,201,138,0.10)',
  },
  submitRowFail: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(224,92,78,0.10)',
  },
  submitText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  submitTextOk: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '800',
  },
  submitTextFail: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  retryButton: {
    borderRadius: radius[8],
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
  },
  retryButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
