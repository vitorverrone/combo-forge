import { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTranslation } from '../i18n';
import { useDisplayNameForm } from './useDisplayNameForm';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';

interface DisplayNameModalProps {
  readonly saving: boolean;
  readonly error: string | null;
  readonly onSave: (name: string) => void;
}

/**
 * Modal bloqueante do Nome de Exibição (ticket 02): pedido uma única vez, na
 * primeira abertura do Desafio Diário, antes de poder jogar. Sem botão de
 * fechar, sem tocar fora — e intercepta o botão físico de voltar do Android
 * (primeiro uso de BackHandler no projeto) enquanto estiver montado.
 */
export function DisplayNameModal({ saving, error, onSave }: DisplayNameModalProps) {
  const { t } = useTranslation();
  const { value, setValue, clientError, canSave, submit } = useDisplayNameForm({
    initialValue: '',
    saving,
    onSave,
  });

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const displayedError = clientError ?? error;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('daily.displayNameTitle')}</Text>
        <Text style={styles.desc}>{t('daily.displayNameDesc')}</Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={t('daily.displayNamePlaceholder')}
          placeholderTextColor={colors.textDim}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!saving}
          accessibilityLabel={t('a11y.displayNameInput')}
        />
        {displayedError !== null && <Text style={styles.errorText}>{displayedError}</Text>}
        <Pressable
          accessibilityLabel={t('a11y.saveDisplayName')}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={submit}
          style={({ pressed }) => [styles.btnPrimary, !canSave && styles.btnPrimaryDisabled, pressed && canSave && styles.btnPressed]}
        >
          <Text style={styles.btnPrimaryText}>
            {saving ? t('common.loading') : t('daily.saveDisplayName')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[24],
    zIndex: 20,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[14],
    padding: spacing[24],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.gold,
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing[8],
  },
  input: {
    alignSelf: 'stretch',
    marginTop: spacing[20],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[10],
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[12],
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  btnPrimary: {
    alignSelf: 'stretch',
    borderRadius: radius[12],
    backgroundColor: colors.gold,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[16],
  },
  btnPrimaryDisabled: {
    opacity: 0.45,
  },
  btnPrimaryText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnPressed: {
    backgroundColor: colors.goldDark,
    opacity: 0.85,
  },
});
