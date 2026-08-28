import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../i18n';
import { PatternList } from './PatternList';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';

interface Props {
  readonly visible: boolean;
  readonly onClose: () => void;
}

/**
 * Referência de Padrões acessível a qualquer momento durante uma Run (ícone
 * "?" persistente em GameScreen) — mesma lista mostrada no passo
 * `scorePattern` do tutorial de onboarding. Sem estado além de aberto/fechado.
 */
export function PatternReferenceModal({ visible, onClose }: Props) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('patternReference.title')}</Text>
          <Text style={styles.subtitle}>{t('patternReference.subtitle')}</Text>

          <View style={styles.listWrap}>
            <PatternList />
          </View>

          <Pressable
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.closeBtnText}>{t('common.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
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
    paddingHorizontal: spacing[18],
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing[6],
  },
  listWrap: {
    marginTop: spacing[16],
  },
  closeBtn: {
    marginTop: spacing[16],
    height: 46,
    borderRadius: radius[12],
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.85,
  },
  closeBtnText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
});
