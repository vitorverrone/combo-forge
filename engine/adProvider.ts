/**
 * Provider de anúncios recompensados (ticket 13, abstração).
 *
 * O Desafio Diário libera a tentativa extra por anúncio recompensado. A
 * implementação real (AdMob/RevenueCat — monetização) entra no ticket 16;
 * aqui fica apenas a abstração que a UI e o store consomem, com uma
 * implementação de desenvolvimento que simula o anúncio concluído.
 */

/**
 * Port do provider de anúncios recompensados. Resolve true quando o jogador
 * assistiu o anúncio até o fim (tentativa liberada); false se desistiu ou o
 * provider não tinha anúncio disponível. Rejeita em falha de carregamento.
 */
export interface AdProvider {
  requestRewardedAd(): Promise<boolean>;
}

/** Implementação de desenvolvimento: anúncio sempre concluído. */
export function createDevAdProvider(): AdProvider {
  return { requestRewardedAd: async () => true };
}
