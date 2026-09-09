/**
 * Fluxo de notificação push — orquestração entre o store e os ports de push
 * (ADR 0012, atualização 2026-09-08 — ticket 03; espelha store/dailyFlow.ts/
 * store/shopFlow.ts).
 *
 * Cuida de: (a) pedir a permissão nativa do SO uma única vez, no cold start
 * (sem soft-ask nem qualquer card do jogo antes), registrando o Expo push
 * token via PushBackend quando concedida, e (b) ligar o listener de toque em
 * notificação a um callback de navegação (openDaily no gameStore). Nunca
 * lança: falha do provider/backend só impede o registro do token, nunca
 * trava a resolução (sempre marca "já solicitado" ao final) — mesma regra de
 * "nunca quebra o app" de AdProvider/PushProvider.
 *
 * PushFlowStorage vive aqui (não em engine/) porque a flag "permissão já
 * solicitada" não é regra de jogo — é uma preocupação de fluxo/UI, mesmo
 * raciocínio de TutorialStorage em store/tutorialFlow.ts.
 */

import { PushBackend, PushProvider } from '../engine';

/** Ports que o fluxo precisa (injetados pelo store; memória nos testes). */
export interface PushFlowDeps {
  /** Permissão/token/listener do SO (expo-notifications no app). */
  readonly provider: PushProvider;
  /** Registro do token no backend (Supabase no app). */
  readonly backend: PushBackend;
  /** Persistência de "já pedimos a permissão nesta instalação". */
  readonly storage: PushFlowStorage;
}

/**
 * Port de persistência de "o prompt nativo já foi disparado" (memória nos
 * testes; SQLite no app via store/sqlite.ts, mesmo padrão dos outros ports
 * do projeto). Booleano só — não há mais escolha do jogador dentro do app,
 * quem decide concedido/negado é o próprio SO.
 */
export interface PushFlowStorage {
  hasRequestedPushPermission(): boolean;
  saveRequestedPushPermission(): void;
}

/** Implementação em memória do port, para testes. */
export function createMemoryPushFlowStorage(initial = false): PushFlowStorage {
  let requested = initial;
  return {
    hasRequestedPushPermission: () => requested,
    saveRequestedPushPermission: () => {
      requested = true;
    },
  };
}

/**
 * Pede a permissão nativa do SO uma única vez por instalação, no cold start.
 * Já solicitada antes: no-op (nem toca o provider/backend) — o SO não reabre
 * um prompt já decidido de qualquer forma, mas evitamos a chamada redundante.
 * Concedida: registra o Expo push token no backend, best-effort (falha de
 * rede/SDK não impede marcar como solicitado — nunca fica pendurado nem
 * pergunta de novo no próximo cold start).
 */
export async function requestPushPermissionOnColdStart(
  deviceId: string,
  deps: PushFlowDeps,
): Promise<void> {
  if (deps.storage.hasRequestedPushPermission()) return;
  try {
    const permission = await deps.provider.requestPermission();
    if (permission === 'granted') {
      const pushToken = await deps.provider.getExpoPushToken();
      if (pushToken !== null) {
        await deps.backend.registerToken(deviceId, pushToken.token, pushToken.platform);
      }
    }
  } catch {
    // Falha do provider/backend (rede, SDK): registro best-effort — ainda
    // marca como solicitado, nunca fica pendurado nem pergunta de novo.
  }
  deps.storage.saveRequestedPushPermission();
}

/**
 * Liga o listener de toque em notificação a um callback de navegação
 * (openDaily no gameStore) — devolve a função de unsubscribe do provider.
 * Extraído como seam próprio pra ser testável sem zustand (mesmo padrão dos
 * outros fluxos: só os ports injetados fazem IO).
 */
export function registerNotificationTapListener(provider: PushProvider, onTap: () => void): () => void {
  return provider.addNotificationResponseListener(onTap);
}
