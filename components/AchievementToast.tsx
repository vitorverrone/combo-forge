import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '../i18n';
import { useGameStore } from '../store/gameStore';
import { colors, radius, spacing } from './theme';
import { fonts } from './typography';

const HIDDEN_OFFSET = -160;

/**
 * Toast de Conquista atingida (ajuste de UX pós-lançamento — antes um banner
 * fixo no fluxo das telas de fim de Run). Desliza do topo da tela e para
 * logo abaixo da safe area, nunca descendo até o centro. Autocontido: lê
 * `recentUnlocks`/`runMode` direto do store, sem props — usável em
 * RunWonScreen e RunLostScreen sem duplicar a lógica de exibição.
 */
export function AchievementToast() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const runMode = useGameStore((state) => state.runMode);
  const recentUnlocks = useGameStore((state) => state.recentUnlocks);
  const show = runMode !== 'daily' && recentUnlocks.length > 0;

  // useMemo (não useRef): o valor precisa ser lido no render (style do
  // Animated.View), e a regra react-hooks/refs proíbe ler ref.current fora
  // de efeitos/handlers — mesmo padrão de RunLostScreen.tsx (pulse).
  const translateY = useMemo(() => new Animated.Value(HIDDEN_OFFSET), []);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!show) return;
    translateY.setValue(HIDDEN_OFFSET);
    Animated.timing(translateY, {
      toValue: 0,
      duration: reduceMotion ? 0 : 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [show, reduceMotion, translateY]);

  if (!show) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { top: insets.top + spacing[10], transform: [{ translateY }] }]}
    >
      <View style={styles.gem} />
      <View style={styles.textBlock}>
        <Text style={styles.label}>
          {recentUnlocks.length > 1 ? t('runWon.newUnlocks') : t('runWon.newUnlock')}
        </Text>
        <Text style={styles.name}>{recentUnlocks.join(' · ')}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[16],
    right: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius[12],
    padding: spacing[12],
    paddingHorizontal: spacing[14],
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 20,
  },
  gem: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});
