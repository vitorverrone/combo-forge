/**
 * Port de telemetria (ticket 01, base para 02/03/04): abstração que os flows
 * do store usam pra emitir eventos de produto, sem que o motor puro do jogo
 * saiba que telemetria existe. Mesmo molde de AdProvider/DailyBackend/
 * ShopProvider — a implementação real entra em services/firebaseAnalytics.ts;
 * aqui só a interface e o provider de desenvolvimento (no-op).
 */

export type TelemetryParams = Readonly<Record<string, string | number | boolean>>;

/**
 * Nunca rejeita (mesmo contrato de AdProvider): quem chama decide se espera
 * ou dispara-e-esquece (`void provider.logEvent(...)`), como já é feito para
 * `syncRemoveAdsEntitlement()` em store/bootstrap.ts.
 */
export interface TelemetryProvider {
  logEvent(name: string, params?: TelemetryParams): Promise<void>;
  /** Liga o device_id anônimo do Desafio Diário à identidade de telemetria (ADR 0007). */
  setUserId(deviceId: string): Promise<void>;
}

/** Implementação de desenvolvimento: nunca falha, nunca envia nada. */
export function createDevTelemetryProvider(): TelemetryProvider {
  return {
    logEvent: async () => {},
    setUserId: async () => {},
  };
}
