/**
 * Port de notificação push (ADR 0012, ticket 02): abstração análoga a
 * AdProvider/TelemetryProvider — solicitar a permissão do SO, obter o Expo
 * push token do dispositivo, e escutar o toque numa notificação. A
 * implementação real (`expo-notifications`) entra em services/push.ts; aqui
 * só a interface e uma implementação em memória para testes.
 *
 * PushBackend é o port do lado servidor (registro do token via
 * `register_push_token` — supabase/migrations/0007_push_tokens.sql),
 * implementado por services/supabase.ts — mesmo molde de DailyBackend.
 */

/**
 * Resultado de pedir a permissão do SO. 'unavailable' cobre tanto a ausência
 * do módulo nativo (Expo Go/web/testes) quanto qualquer falha do SDK — nunca
 * lança, mesmo contrato de AdProvider/services/ads.ts.
 */
export type PushPermissionStatus = 'granted' | 'denied' | 'unavailable';

/** Expo push token do dispositivo + a plataforma que o obteve (registrada junto no backend). */
export interface ExpoPushToken {
  readonly token: string;
  readonly platform: 'ios' | 'android';
}

export interface PushProvider {
  /** Pede a permissão do SO (prompt nativo). Nunca lança. */
  requestPermission(): Promise<PushPermissionStatus>;
  /** Obtém o Expo push token; null sem permissão concedida ou módulo indisponível. Nunca lança. */
  getExpoPushToken(): Promise<ExpoPushToken | null>;
  /**
   * Registra um listener de toque em notificação; devolve a função de
   * unsubscribe. Nunca lança — sem módulo nativo, o listener simplesmente
   * nunca dispara.
   */
  addNotificationResponseListener(listener: () => void): () => void;
}

/**
 * Implementação em memória do port, para testes: permissão/token
 * configuráveis via overrides (padrão: sem capability, mesmo estado de um
 * ambiente sem módulo nativo) + `simulateNotificationTap` para exercitar o
 * listener sem depender do SDK real.
 */
export function createMemoryPushProvider(overrides: {
  readonly permission?: PushPermissionStatus;
  readonly token?: ExpoPushToken | null;
} = {}): PushProvider & { readonly simulateNotificationTap: () => void } {
  const permission = overrides.permission ?? 'unavailable';
  const token = overrides.token ?? null;
  const listeners: (() => void)[] = [];
  return {
    requestPermission: async () => permission,
    getExpoPushToken: async () => token,
    addNotificationResponseListener: (listener) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
    simulateNotificationTap: () => {
      for (const listener of listeners) listener();
    },
  };
}

/**
 * Port do backend de push (registro do token — implementado pelo serviço
 * Supabase, services/supabase.ts). Mesmo molde de DailyBackend.
 */
export interface PushBackend {
  registerToken(deviceId: string, token: string, platform: 'ios' | 'android'): Promise<void>;
}

/** Backend indisponível (env não configurado): erro claro, nunca trava o soft-ask. */
export function createUnavailablePushBackend(): PushBackend {
  return {
    registerToken: () =>
      Promise.reject(new Error('Registro de push indisponível: backend não configurado.')),
  };
}
