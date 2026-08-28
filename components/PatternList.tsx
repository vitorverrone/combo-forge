import { StyleSheet, Text, View } from 'react-native';

import { PATTERN_BONUSES, PATTERN_COMPOSITIONS, PATTERN_RANK, PatternKind } from '../engine';

import { patternName } from './format';
import { colors, spacing, radius } from './theme';

/** Do mais fraco ao mais forte — derivado de PATTERN_RANK, fonte única de qual Padrão é melhor. */
const PATTERN_ORDER: readonly PatternKind[] = (Object.keys(PATTERN_RANK) as PatternKind[]).sort(
  (a, b) => PATTERN_RANK[a] - PATTERN_RANK[b],
);

/**
 * Os 7 Padrões com composição e bônus — compartilhado pelo passo `scorePattern`
 * do tutorial de onboarding e pelo modal de referência de Padrões.
 */
export function PatternList() {
  return (
    <View style={styles.list}>
      {PATTERN_ORDER.map((kind) => (
        <View key={kind} style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>{patternName(kind)}</Text>
            <Text style={styles.composition}>{PATTERN_COMPOSITIONS[kind]}</Text>
          </View>
          <Text style={styles.bonus}>+{PATTERN_BONUSES[kind]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
    gap: spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[8],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[10],
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  composition: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: spacing[2],
  },
  bonus: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gold,
    flexShrink: 0,
  },
});
