/**
 * App Tracking Transparency (iOS 14+): pede a permissão antes do primeiro
 * carregamento de anúncio — recomendação do Google (developers.google.com/
 * admob/ios/privacy/strategies: "wait for the completion callback prior to
 * loading ads"). Ver docs/research/ios-launch-admob-revenuecat-appstore.md
 * (seção 1) — as fontes primárias não dão uma regra clara pra apps que só
 * pedem anúncio não-personalizado, então pedimos de qualquer forma pra
 * fechar essa zona cinzenta antes da revisão da Apple. O resultado nunca
 * muda o comportamento do app: `requestNonPersonalizedAdsOnly: true`
 * continua fixo em services/ads.ts e AdBanner.tsx independente da resposta.
 *
 * No-op no Android (a API nem existe lá) e em qualquer ambiente sem o
 * módulo nativo (Expo Go/web/testes) — nunca lança, nunca bloqueia o boot.
 */
import { Platform } from 'react-native';

export async function requestTrackingPermission(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
    await requestTrackingPermissionsAsync();
  } catch {
    // Módulo nativo ausente ou falha do SDK — segue sem o prompt.
  }
}
