import { StyleSheet, Text, View } from 'react-native';

import { Relic } from '../engine';

import { relicDescription } from './format';
import { colors } from './theme';

interface RelicRowProps {
  readonly relics: readonly Relic[];
  readonly compact?: boolean;
}

/**
 * Relíquias ativas da Run (incluindo a de largada).
 * Em modo normal (game screen), exibe como overlay legível acima da mão.
 * Em modo compact (forge, round summary), exibe como chips menores.
 */
export function RelicRow({ relics, compact = false }: RelicRowProps) {
  if (relics.length === 0) return null;

  if (compact) {
    return (
      <View style={styles.compactRow}>
        {relics.map((relic) => (
          <View key={relic.id} style={styles.compactChip} accessibilityLabel={`Relic: ${relic.name} — ${relicDescription(relic)}`} accessibilityRole="text">
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
      <Text style={styles.overlayLabel}>ACTIVE RELICS</Text>
      <View style={styles.overlayList}>
        {relics.map((relic) => (
          <View key={relic.id} style={styles.overlayItem} accessibilityLabel={`Relic: ${relic.name} — ${relicDescription(relic)}`} accessibilityRole="text">
            <Text style={styles.overlayName}>{relic.name}</Text>
            <Text style={styles.overlayDesc}>{relicDescription(relic)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Full display — used on game screen above the hand */
  overlay: {
    marginTop: 10,
  },
  overlayLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  overlayList: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  overlayItem: {
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
    minWidth: 100,
  },
  overlayName: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  overlayDesc: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  /* Compact display — used on forge, round summary screens */
  compactRow: {
    marginTop: 10,
    gap: 6,
  },
  compactChip: {
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactText: {
    color: colors.textDim,
    fontSize: 12,
  },
});
