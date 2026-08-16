import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { shouldShowBanner } from '../engine';
import { bannerAdUnitId } from '../services/ads';
import { useGameStore } from '../store/gameStore';
import { colors } from './theme';

/** Altura reservada do rodapé (50dp — decisão do grilling/ADR 0004). */
const BANNER_HEIGHT = 50;

/**
 * Banner full-width de 50dp no rodapé de todas as telas (ticket banner-01).
 * Componente fino: a visibilidade vem da regra pura shouldShowBanner (engine)
 * — oculto quando a remoção de anúncios foi comprada (ticket 02) ou quando
 * não há ad unit — e o ad unit de cada build vem de services/ads.ts — em dev
 * o TestId oficial de banner adaptativo (sempre carrega), em produção o ad
 * unit real da plataforma (sem env → oculto; o jogo segue intacto, anúncio
 * nunca obrigatório).
 *
 * O container reserva os 50dp mesmo quando o anúncio não carrega (NO_FILL):
 * estabilidade de layout — o conteúdo nunca pula quando o anúncio aparecer.
 */
export function AdBanner() {
  const insets = useSafeAreaInsets();
  const adsRemoved = useGameStore((state) => state.adsRemoved);
  const unitId =
    process.env.NODE_ENV === 'production' ? bannerAdUnitId() : TestIds.ADAPTIVE_BANNER;

  if (!shouldShowBanner(adsRemoved, unitId)) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
