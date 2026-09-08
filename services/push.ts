/**
 * Provider de notificação push real (ADR 0012, ticket 02): implementa o
 * port PushProvider (engine/pushProvider.ts) com `expo-notifications` —
 * permissão do SO, Expo push token, e listener de resposta de notificação.
 *
 * Mesmo padrão de services/ads.ts/services/updates.ts: o módulo nativo não
 * existe no Expo Go/web/testes — todo import é dinâmico e qualquer falha do
 * SDK resolve o estado "indisponível" (`unavailable`/null/listener inerte),
 * nunca lança. A notificação nunca é obrigatória: o app funciona
 * integralmente sem ela.
 */

import { Platform } from 'react-native';

import { ExpoPushToken, PushProvider } from '../engine';

/**
 * Id do projeto EAS (app.json → extra.eas.projectId), exigido por
 * `getExpoPushTokenAsync` pra resolver o token certo. Lido via
 * expo-constants (import dinâmico — mesmo motivo do módulo de notificação:
 * ausente em ambientes sem app nativo real).
 */
async function resolveEasProjectId(): Promise<string | undefined> {
  const Constants = await import('expo-constants');
  return Constants.default.expoConfig?.extra?.eas?.projectId;
}

/** Provider real sobre `expo-notifications`. */
export function createAppPushProvider(): PushProvider {
  return {
    requestPermission: async () => {
      try {
        const Notifications = await import('expo-notifications');
        const current = await Notifications.getPermissionsAsync();
        if (current.granted) return 'granted';
        const requested = await Notifications.requestPermissionsAsync();
        return requested.granted ? 'granted' : 'denied';
      } catch {
        return 'unavailable';
      }
    },

    getExpoPushToken: async (): Promise<ExpoPushToken | null> => {
      try {
        const Notifications = await import('expo-notifications');
        const projectId = await resolveEasProjectId();
        if (projectId === undefined) return null;
        const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
        return { token: data, platform: Platform.OS === 'ios' ? 'ios' : 'android' };
      } catch {
        return null;
      }
    },

    addNotificationResponseListener: (listener) => {
      let subscription: { remove: () => void } | null = null;
      let unsubscribed = false;
      void (async () => {
        try {
          const Notifications = await import('expo-notifications');
          if (unsubscribed) return;
          subscription = Notifications.addNotificationResponseReceivedListener(() => listener());
        } catch {
          // Sem módulo nativo (Expo Go/web/testes): o listener nunca dispara,
          // o app segue funcionando normalmente.
        }
      })();
      return () => {
        unsubscribed = true;
        subscription?.remove();
      };
    },
  };
}
