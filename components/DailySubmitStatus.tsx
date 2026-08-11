import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

/** Status da submissão da pontuação do Desafio Diário (com retry). */
export function DailySubmitStatus({
  submitStatus,
  onRetry,
}: {
  readonly submitStatus: 'idle' | 'submitting' | 'submitted' | 'failed';
  readonly onRetry: () => void;
}) {
  if (submitStatus === 'submitting') {
    return (
      <View style={styles.submitRow}>
        <Text style={styles.submitText}>Submitting score…</Text>
      </View>
    );
  }
  if (submitStatus === 'submitted') {
    return (
      <View style={[styles.submitRow, styles.submitRowOk]}>
        <Text style={styles.submitTextOk}>✓ Score submitted</Text>
      </View>
    );
  }
  if (submitStatus === 'failed') {
    return (
      <View style={[styles.submitRow, styles.submitRowFail]}>
        <Text style={styles.submitTextFail}>Score not submitted</Text>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.retryButtonText}>RETRY</Text>
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
