/**
 * Provider de telemetria real (ticket 01, ADR 0007): implementa o port
 * TelemetryProvider (engine/telemetry.ts) com o SDK
 * @react-native-firebase/analytics (API modular — getAnalytics/logEvent/
 * setUserId, não o namespace analytics() antigo).
 *
 * O módulo nativo não existe no Expo Go/web/testes — e não funciona em
 * nenhum build até o projeto Firebase real ser criado e o
 * google-services.json ser adicionado (pendência em
 * docs/release-checklist.md, mesmo padrão das outras integrações externas
 * deste app). O import é dinâmico e qualquer falha degrada para no-op, mesmo
 * padrão de services/ads.ts: evento de telemetria nunca bloqueia nem quebra
 * o fluxo do jogo.
 */

import { TelemetryParams, TelemetryProvider } from '../engine';

/** Provider real: cada chamada tenta o SDK nativo e nunca rejeita/lança. */
export function createAppTelemetryProvider(): TelemetryProvider {
  return {
    logEvent: (name, params) => {
      void logFirebaseEvent(name, params);
    },
    setUserId: (deviceId) => {
      void setFirebaseUserId(deviceId);
    },
  };
}

async function logFirebaseEvent(name: string, params?: TelemetryParams): Promise<void> {
  try {
    const { getAnalytics, logEvent } = await import('@react-native-firebase/analytics');
    await logEvent(getAnalytics(), name, params);
  } catch {
    // Módulo nativo indisponível (Expo Go/web/testes) ou SDK ainda não
    // configurado (sem google-services.json) — evento perdido, jogo segue
    // intacto.
  }
}

async function setFirebaseUserId(deviceId: string): Promise<void> {
  try {
    const { getAnalytics, setUserId } = await import('@react-native-firebase/analytics');
    await setUserId(getAnalytics(), deviceId);
  } catch {
    // Mesma degradação de logFirebaseEvent.
  }
}
