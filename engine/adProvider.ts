/**
 * Provider de anúncios recompensados (ticket 13, abstração).
 *
 * O Desafio Diário libera a tentativa extra por anúncio recompensado. A
 * implementação real (AdMob/RevenueCat — monetização) entra no ticket 16;
 * aqui fica apenas a abstração que a UI e o store consomem, com uma
 * implementação de desenvolvimento que simula o anúncio concluído.
 *
 * Também vive aqui a regra pura de visibilidade do banner (ticket
 * banner-01/02): o banner full-width de 50dp aparece quando há um ad unit de
 * banner disponível para a plataforma atual e a remoção de anúncios não foi
 * comprada. Sem ad unit (produção sem env) ou com a compra feita, o banner
 * fica oculto e o jogo segue intacto — anúncio nunca é obrigatório.
 */

/**
 * Deve exibir o banner de anúncios? Regra pura (ticket banner-01/02):
 * visível quando há um ad unit de banner para usar E a remoção de anúncios
 * não foi comprada. Type guard: quando true, adUnitId é uma string não
 * vazia — o narrowing flui para o componente. A origem do ad unit (env da
 * plataforma / TestId em dev) fica no serviço de ads; aqui apenas a
 * decisão, testável sem dependências.
 */
export function shouldShowBanner(
  adsRemoved: boolean,
  adUnitId: string | undefined,
): adUnitId is string {
  return !adsRemoved && Boolean(adUnitId);
}

/**
 * Port do provider de anúncios recompensados. Resolve true quando o jogador
 * assistiu o anúncio até o fim (tentativa liberada); false se desistiu ou o
 * provider não tinha anúncio disponível. Rejeita em falha de carregamento.
 */
export interface AdProvider {
  requestRewardedAd(): Promise<boolean>;
  /** Anúncio intersticial entre Runs. Resolve true quando exibido; false se
   * falhou ou indisponível. Nunca rejeita. */
  requestInterstitialAd(): Promise<boolean>;
}

/** Implementação de desenvolvimento: anúncio sempre concluído. */
export function createDevAdProvider(): AdProvider {
  return { requestRewardedAd: async () => true, requestInterstitialAd: async () => true };
}
