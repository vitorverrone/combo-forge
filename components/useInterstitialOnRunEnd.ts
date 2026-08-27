import { useEffect } from 'react';

import { useGameStore } from '../store/gameStore';

/**
 * Intersticial entre Runs: exibe ao montar a tela de fim quando marcado.
 * Compartilhado por RunWonScreen e RunLostScreen (era o mesmo bloco copiado
 * nos dois — 3 assinaturas do store + o mesmo useEffect, linha por linha).
 */
export function useInterstitialOnRunEnd(dailyEnd: boolean): void {
  const showInterstitial = useGameStore((state) => state.showInterstitial);
  const dismissInterstitial = useGameStore((state) => state.dismissInterstitial);
  const adProvider = useGameStore((state) => state.adProvider);

  useEffect(() => {
    if (!showInterstitial || dailyEnd) return;
    dismissInterstitial();
    void adProvider.requestInterstitialAd();
  }, [showInterstitial, dailyEnd, dismissInterstitial, adProvider]);
}
