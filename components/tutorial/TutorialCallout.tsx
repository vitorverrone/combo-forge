import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { fonts } from '../typography';
import { TutorialCalloutData } from './types';

interface TutorialCalloutProps {
  readonly callout: TutorialCalloutData;
}

/**
 * O balão de instrução: texto + linha de ações (Pular à esquerda,
 * Próximo/Concluir à direita), do lado do card mais distante do alvo —
 * abaixo do texto quando o balão está 'below' (o card inteiro já flutua
 * abaixo do alvo), acima do texto quando está 'above' — pra manter o texto
 * sempre coladinho no que ele está explicando.
 */
export function TutorialCallout({ callout }: TutorialCalloutProps) {
  const hasActions = callout.leftAction !== undefined || callout.rightAction !== undefined;

  const actionsRow = hasActions && (
    <View style={[styles.actionsRow, callout.position === 'below' ? styles.actionsRowBelow : styles.actionsRowAbove]}>
      <View style={styles.actionSlot}>
        {callout.leftAction && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={callout.leftAction.accessibilityLabel}
            onPress={callout.leftAction.onPress}
            style={({ pressed }) => [pressed && styles.actionPressed]}
          >
            <Text style={styles.actionText}>{callout.leftAction.label}</Text>
          </Pressable>
        )}
      </View>
      <View style={[styles.actionSlot, styles.actionSlotRight]}>
        {callout.rightAction && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={callout.rightAction.accessibilityLabel}
            onPress={callout.rightAction.onPress}
            style={({ pressed }) => [pressed && styles.actionPressed]}
          >
            <Text style={styles.actionText}>{callout.rightAction.label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.callout, callout.position === 'below' ? styles.calloutBelow : styles.calloutAbove]}>
      {callout.position === 'above' && actionsRow}
      <Text style={styles.calloutText}>{callout.text}</Text>
      {callout.position === 'below' && actionsRow}
    </View>
  );
}

const styles = StyleSheet.create({
  callout: {
    // Largura fixa (com teto de 90% pra telas estreitas) — independente da
    // largura do elemento envolvido, senão um alvo estreito (ex.: uma única
    // carta) espremeria o texto numa coluna ilegível.
    width: 320,
    maxWidth: '90%',
    padding: spacing[12],
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(224,165,62,0.35)',
    borderRadius: radius[10],
    position: 'absolute',
  },
  calloutBelow: {
    top: '100%',
    marginTop: spacing[12],
  },
  calloutAbove: {
    bottom: '100%',
    marginBottom: spacing[12],
  },
  calloutText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.gold,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRowBelow: {
    marginTop: spacing[10],
    paddingTop: spacing[10],
    borderTopWidth: 1,
    borderTopColor: 'rgba(224,165,62,0.35)',
  },
  actionsRowAbove: {
    marginBottom: spacing[10],
    paddingBottom: spacing[10],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224,165,62,0.35)',
  },
  actionSlot: {
    flex: 1,
    alignItems: 'flex-start',
  },
  actionSlotRight: {
    alignItems: 'flex-end',
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.gold,
  },
});
