import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Relic } from '../engine';

import { useTranslation } from '../i18n';
import { relicDescription } from './format';
import { colors, spacing, radius } from './theme';
import { RelicIcon } from './RelicIcon';

interface RelicRowProps {
  readonly relics: readonly Relic[];
  readonly compact?: boolean;
}

/**
 * Relíquias ativas da Run (incluindo a de largada).
 * Em modo normal (game screen), exibe como ícones tocáveis (tooltip com a
 * descrição, some sozinha) acima da mão.
 * Em modo compact (forge, round summary), exibe como chips menores.
 */
export function RelicRow({ relics, compact = false }: RelicRowProps) {
  const { t } = useTranslation();
  const [openRelicId, setOpenRelicId] = useState<string | null>(null);

  if (relics.length === 0) return null;

  if (compact) {
    return (
      <View style={styles.compactRow}>
        {relics.map((relic) => (
          <View key={relic.id} style={styles.compactChip} accessibilityLabel={t('a11y.relicSummary', { name: relic.name, description: relicDescription(relic) })} accessibilityRole="text">
            <Text style={styles.compactText} numberOfLines={1}>
              {relic.name} · {relicDescription(relic)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <Text style={styles.overlayLabel}>{t('runWon.activeRelics').toUpperCase()}</Text>
      <View style={styles.overlayList}>
        {relics.map((relic) => (
          <RelicIcon
            key={relic.id}
            relic={relic}
            open={openRelicId === relic.id}
            onPress={() => setOpenRelicId((current) => (current === relic.id ? null : relic.id))}
            onDismiss={() => setOpenRelicId((current) => (current === relic.id ? null : current))}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Full display — used on game screen above the hand */
  overlay: {
    marginTop: spacing[8],
    width: '100%'
  },
  overlayLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing[4],
  },
  overlayList: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: spacing[8],
    flexWrap: 'wrap',
    marginTop: spacing[8]
  },
  /* Compact display — used on forge, round summary screens */
  compactRow: {
    marginTop: spacing[10],
    gap: spacing[6],
  },
  compactChip: {
    borderRadius: radius[8],
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[6],
  },
  compactText: {
    color: colors.textDim,
    fontSize: 12,
  },
});
