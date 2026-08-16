/**
 * Provider de anúncios recompensados real (ticket 16): implementa o port
 * AdProvider (engine/adProvider.ts) com o SDK react-native-google-mobile-ads
 * (AdMob), consumido pelo Desafio Diário (tentativa extra via anúncio).
 *
 * Config via EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID / _IOS (ver
 * .env.example). Ad unit IDs são por plataforma e o EAS injeta env por
 * ambiente (não por plataforma), então cada plataforma tem a sua variável,
 * selecionada em runtime via Platform.OS. Sem o env da plataforma atual,
 * devolve o provider dev (anúncio sempre concluído) — o jogo funciona
 * integralmente sem anúncios (nunca são obrigatórios). Em desenvolvimento o
 * SDK usa o TestId oficial de rewarded (não gasta impressões reais).
 *
 * O módulo nativo não existe no Expo Go/web/testes: o import é dinâmico e
 * qualquer falha resolve false — o anúncio nunca bloqueia nem quebra o
 * fluxo do jogo (a UI mostra o estado anterior).
 */

import { Platform } from 'react-native';

import { AdProvider, createDevAdProvider } from '../engine';

const AD_UNIT_ANDROID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID;
const AD_UNIT_IOS = process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS;

/** Ad unit ID da plataforma atual (Android é o padrão; iOS exige variável própria). */
function adUnitIdForPlatform(): string | undefined {
  return Platform.OS === 'ios' ? AD_UNIT_IOS : AD_UNIT_ANDROID;
}

/** Env do anúncio recompensado configurado para esta plataforma? */
export function isAdMobConfigured(): boolean {
  return Boolean(adUnitIdForPlatform());
}

/**
 * Provider para o store: real (AdMob) se configurado; dev simulado se não.
 * Mesmo padrão dos demais serviços do app (Supabase, RevenueCat).
 */
export function createAppAdProvider(): AdProvider {
  const adUnitId = adUnitIdForPlatform();
  if (adUnitId === undefined) return createDevAdProvider();
  return { requestRewardedAd: () => requestAdMobRewarded(adUnitId) };
}

/**
 * Mostra um anúncio recompensado e resolve true apenas se o jogador
 * assistiu até o fim (EARNED_REWARD). Desistir (CLOSED sem recompensa),
 * falha de carregamento (ERROR) ou ambiente sem módulo nativo → false.
 * Nunca rejeita: a chamada não pode quebrar o fluxo do jogo.
 */
async function requestAdMobRewarded(adUnitId: string): Promise<boolean> {
  try {
    const {
      AdEventType,
      MobileAds,
      RewardedAd,
      RewardedAdEventType,
      TestIds,
    } = await import('react-native-google-mobile-ads');
    await MobileAds().initialize();
    // Em dev usa o TestId oficial (não exibe impressão real de produção).
    const unitId = process.env.NODE_ENV === 'production' ? adUnitId : TestIds.REWARDED;
    const rewarded = RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (value: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };
      const unsubscribeLoaded = rewarded.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          // Falha ao exibir: garante o settle (sem rejeição não tratada) e
          // o fluxo nunca fica pendurado — o usuário volta ao jogo intacto.
          void rewarded.show().catch(() => settle(false));
        },
      );
      const unsubscribeReward = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => settle(true),
      );
      const unsubscribeClosed = rewarded.addAdEventListener(
        AdEventType.CLOSED,
        () => settle(false),
      );
      const unsubscribeError = rewarded.addAdEventListener(
        AdEventType.ERROR,
        () => settle(false),
      );
      const cleanup = () => {
        unsubscribeLoaded();
        unsubscribeReward();
        unsubscribeClosed();
        unsubscribeError();
      };
      rewarded.load();
    });
  } catch {
    return false;
  }
}
