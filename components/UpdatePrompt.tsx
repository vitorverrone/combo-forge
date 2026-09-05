import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../i18n';
import { checkForOtaUpdate, checkForStoreUpdate, reloadAppForUpdate } from '../services/updates';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';

/**
 * Checa por atualizações uma vez, na abertura do app (nunca durante uma run
 * em andamento — App.tsx monta este componente uma única vez no topo da
 * árvore). Store update (Android flexible / alerta iOS) dispensável e sem UI
 * própria — a lib mostra o prompt nativo direto. OTA (expo-updates) é
 * dispensável mas tem prompt próprio: só reinicia se o jogador confirmar.
 */
export function UpdatePrompt() {
  const { t } = useTranslation();
  const [otaReady, setOtaReady] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    void checkForStoreUpdate();
    void checkForOtaUpdate().then(setOtaReady);
  }, []);

  if (!otaReady) return null;

  const dismiss = () => setOtaReady(false);
  const restart = () => {
    setRestarting(true);
    void reloadAppForUpdate();
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('update.title')}</Text>
          <Text style={styles.message}>{t('update.message')}</Text>
          <Pressable
            accessibilityLabel={t('a11y.restartNow')}
            accessibilityRole="button"
            accessibilityState={{ disabled: restarting }}
            disabled={restarting}
            onPress={restart}
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnPrimaryText}>
              {restarting ? t('common.loading') : t('update.restartNow')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t('a11y.dismissUpdatePrompt')}
            accessibilityRole="button"
            disabled={restarting}
            onPress={dismiss}
            style={({ pressed }) => [styles.laterBtn, pressed && styles.laterBtnPressed]}
          >
            <Text style={styles.laterBtnText}>{t('update.later')}</Text>
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
  message: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing[8],
  },
  btnPrimary: {
    alignSelf: 'stretch',
    borderRadius: radius[12],
    backgroundColor: colors.gold,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[20],
  },
  btnPrimaryText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  laterBtn: {
    alignSelf: 'stretch',
    marginTop: spacing[10],
    height: 44,
    borderRadius: radius[12],
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  btnPressed: {
    backgroundColor: colors.goldDark,
    opacity: 0.85,
  },
  laterBtnPressed: {
    borderColor: colors.gold,
  },
});
