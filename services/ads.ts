/**
 * Provider de anúncios real (tickets 16 + banner-01): implementa o port
 * AdProvider (engine/adProvider.ts) com o SDK react-native-google-mobile-ads
 * (AdMob) — recompensado (Desafio Diário, tentativa extra) e intersticial
 * (entre Runs).
 *
 * Config via EXPO_PUBLIC_ADMOB_{REWARDED,INTERSTITIAL,BANNER}_AD_UNIT_ID_{ANDROID,IOS}
 * (ver .env.example). Ad units do AdMob são específicos por formato — um id de
 * rewarded não serve anúncio como intersticial — então cada formato tem a sua
 * própria variável, e cada plataforma a sua (o EAS injeta env por ambiente,
 * não por plataforma), selecionada em runtime via Platform.OS. Sem o env do
 * formato/plataforma atual, devolve o provider dev (anúncio sempre concluído)
 * — o jogo funciona integralmente sem anúncios (nunca são obrigatórios). Sem
 * EXPO_PUBLIC_ADMOB_LIVE_ADS=true o SDK usa o TestId oficial de cada formato
 * (não gasta impressões reais), independente do profile de build.
 *
 * O módulo nativo não existe no Expo Go/web/testes: o import é dinâmico e
 * qualquer falha resolve false — o anúncio nunca bloqueia nem quebra o
 * fluxo do jogo (a UI mostra o estado anterior).
 */

import { Platform } from 'react-native';

import { AdProvider, TelemetryProvider } from '../engine';

const REWARDED_UNIT_ANDROID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID;
const REWARDED_UNIT_IOS = process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS;

const INTERSTITIAL_UNIT_ANDROID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID;
const INTERSTITIAL_UNIT_IOS = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_IOS;

const BANNER_UNIT_ANDROID = process.env.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID;
const BANNER_UNIT_IOS = process.env.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_IOS;

/**
 * Liga anúncios reais explicitamente (independente do profile de build) —
 * default é anúncio de TESTE mesmo em build "production" do EAS. O teste
 * fechado do Play Console usa o profile production (obrigatório pro .aab +
 * submit), mas não deve servir anúncio real: exigiria marcar cada tester
 * como test device no AdMob (mínimo 12 no teste fechado) pra não arriscar
 * suspensão da conta por clique acidental. Ligar só antes do lançamento
 * público de fato: EXPO_PUBLIC_ADMOB_LIVE_ADS=true (ver .env.example).
 */
const LIVE_ADS = process.env.EXPO_PUBLIC_ADMOB_LIVE_ADS === 'true';

/** Ad unit de recompensado da plataforma atual (Android é o padrão; iOS exige variável própria). */
function rewardedAdUnitId(): string | undefined {
  return Platform.OS === 'ios' ? REWARDED_UNIT_IOS : REWARDED_UNIT_ANDROID;
}

/** Ad unit de intersticial da plataforma atual — SEPARADO do de recompensado (formato diferente no AdMob). */
function interstitialAdUnitId(): string | undefined {
  return Platform.OS === 'ios' ? INTERSTITIAL_UNIT_IOS : INTERSTITIAL_UNIT_ANDROID;
}

/** Env do anúncio recompensado configurado para esta plataforma? */
export function isAdMobConfigured(): boolean {
  return Boolean(rewardedAdUnitId());
}

/**
 * Ad unit de banner real da plataforma atual (produção). Em dev o componente
 * usa o TestId oficial de banner adaptativo do SDK (sempre carrega); aqui
 * apenas o env da plataforma, sem depender do módulo nativo do SDK.
 */
export function bannerAdUnitId(): string | undefined {
  return Platform.OS === 'ios' ? BANNER_UNIT_IOS : BANNER_UNIT_ANDROID;
}

/** EXPO_PUBLIC_ADMOB_LIVE_ADS=true? Controla anúncio real vs. TestId em todos os formatos. */
export function adsAreLive(): boolean {
  return LIVE_ADS;
}

/**
 * Provider para o store: real (AdMob) se configurado; dev simulado se não.
 * Mesmo padrão dos demais serviços do app (Supabase, RevenueCat).
 */
export function createAppAdProvider(telemetry: TelemetryProvider): AdProvider {
  // Em dev usa TestIds oficiais do SDK (banner já faz o mesmo);
  // em produção só usa ad unit real se configurado via env — e cada formato
  // usa o seu próprio (rewarded e intersticial não compartilham ad unit).
  return {
    requestRewardedAd: () => requestAdMobRewarded(rewardedAdUnitId(), telemetry),
    requestInterstitialAd: () => requestAdMobInterstitial(interstitialAdUnitId(), telemetry),
  };
}

/**
 * Mostra um anúncio recompensado e resolve true apenas se o jogador
 * assistiu até o fim (EARNED_REWARD). Desistir (CLOSED sem recompensa),
 * falha de carregamento (ERROR) ou ambiente sem módulo nativo → false.
 * Nunca rejeita: a chamada não pode quebrar o fluxo do jogo.
 *
 * ad_request_result (ticket 04/ADR 0007) dispara só em LOADED/ERROR — o
 * sinal real de fill rate do AdMob para este ad unit. Não dispara no catch
 * externo (módulo nativo indisponível, ex.: Expo Go/web/testes): isso é
 * ausência de ambiente, não falha de preenchimento do AdMob, e contaria
 * como NO_FILL de todo dev/teste, poluindo a métrica de produção.
 */
async function requestAdMobRewarded(
  adUnitId: string | undefined,
  telemetry: TelemetryProvider,
): Promise<boolean> {
  try {
    const {
      AdEventType,
      MobileAds,
      RewardedAd,
      RewardedAdEventType,
      TestIds,
    } = await import('react-native-google-mobile-ads');
    await MobileAds().initialize();
    // LIVE_ADS desligado (padrão) usa o TestId oficial mesmo em build
    // production — sem env configurado → TestId também.
    const unitId = LIVE_ADS && adUnitId ? adUnitId : TestIds.REWARDED;
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
          void telemetry.logEvent('ad_request_result', { format: 'rewarded', filled: true });
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
        () => {
          void telemetry.logEvent('ad_request_result', { format: 'rewarded', filled: false });
          settle(false);
        },
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

/**
 * Mostra um anúncio intersticial (tela cheia) entre Runs. Resolve true
 * quando exibido com sucesso; false se falhou ou indisponível. Nunca rejeita:
 * o fluxo do jogo nunca é interrompido.
 *
 * ad_request_result (ticket 04/ADR 0007): mesma regra do rewarded — só
 * LOADED/ERROR contam pro fill rate, não o catch de módulo indisponível.
 */
async function requestAdMobInterstitial(
  adUnitId: string | undefined,
  telemetry: TelemetryProvider,
): Promise<boolean> {
  try {
    const {
      AdEventType,
      InterstitialAd,
      MobileAds,
      TestIds,
    } = await import('react-native-google-mobile-ads');
    await MobileAds().initialize();
    // LIVE_ADS desligado (padrão) usa o TestId oficial mesmo em build
    // production — sem env configurado → TestId também.
    const unitId = LIVE_ADS && adUnitId ? adUnitId : TestIds.INTERSTITIAL;
    const interstitial = InterstitialAd.createForAdRequest(unitId, {
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
      const unsubscribeLoaded = interstitial.addAdEventListener(
        AdEventType.LOADED,
        () => {
          void telemetry.logEvent('ad_request_result', { format: 'interstitial', filled: true });
          void interstitial.show().catch(() => settle(false));
        },
      );
      const unsubscribeClosed = interstitial.addAdEventListener(
        AdEventType.CLOSED,
        () => settle(true),
      );
      const unsubscribeError = interstitial.addAdEventListener(
        AdEventType.ERROR,
        () => {
          void telemetry.logEvent('ad_request_result', { format: 'interstitial', filled: false });
          settle(false);
        },
      );
      const cleanup = () => {
        unsubscribeLoaded();
        unsubscribeClosed();
        unsubscribeError();
      };
      interstitial.load();
    });
  } catch {
    return false;
  }
}
