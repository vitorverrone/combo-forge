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
  const unitId = adsAreLive() ? bannerAdUnitId() : TestIds.ADAPTIVE_BANNER;

  if (!shouldShowBanner(adsRemoved, unitId)) return null;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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
    width: '100%',
    minHeight: 50, // Garante reserva de espaço sem prender a altura máxima
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingTop: 8, // Margem de respiro superior do ad
  },
});