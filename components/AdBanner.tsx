import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { shouldShowBanner } from '../engine';
import { adsAreLive, bannerAdUnitId } from '../services/ads';
import { useGameStore } from '../store/gameStore';
import { colors } from './theme';

export function AdBanner() {
  const insets = useSafeAreaInsets();
  const adsRemoved = useGameStore((state) => state.adsRemoved);
  const telemetry = useGameStore((state) => state.telemetry);
  const runPhase = useGameStore((state) => state.run?.phase);
  const unitId = adsAreLive() ? bannerAdUnitId() : TestIds.ADAPTIVE_BANNER;

  // Fora da Rodada ativa (ADR 0008 — reverte parte do ADR 0004): o risco de
  // toque acidental era especificamente sobre selecionar cartas sob pressão
  // de tempo. Forja, fim de Rodada e fim de Run não são time-pressured —
  // o banner continua aparecendo neles, e em todas as outras telas.
  if (!shouldShowBanner(adsRemoved, unitId) || runPhase === 'playing') return null;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        // ad_request_result (ticket 04/ADR 0007): sinal real de fill rate do
        // AdMob pro banner — mesmo par filled true/false do rewarded e do
        // intersticial em services/ads.ts.
        onAdLoaded={() => void telemetry.logEvent('ad_request_result', { format: 'banner', filled: true })}
        onAdFailedToLoad={() =>
          void telemetry.logEvent('ad_request_result', { format: 'banner', filled: false })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 50, // Garante reserva de espaço sem prender a altura máxima
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingTop: 8, // Margem de respiro superior do ad
  },
});