import { StyleSheet, Text, View } from 'react-native';

import { Relic } from '../engine';

import { relicDescription } from './format';
import { colors } from './theme';

interface RelicRowProps {
  readonly relics: readonly Relic[];
}

/** Relíquias ativas da Run (incluindo a de largada), sempre visíveis. */
export function RelicRow({ relics }: RelicRowProps) {
  if (relics.length === 0) return null;
  return (
    <View style={styles.row}>
      {relics.map((relic) => (
        <View key={relic.id} style={styles.chip}>
          <Text style={styles.text} numberOfLines={1}>
            {relic.name} · {relicDescription(relic)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 10,
    gap: 6,
  },
  chip: {
    borderRadius: 8,
    backgroundColor: '#241b33',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    color: colors.textDim,
    fontSize: 12,
  },
});
