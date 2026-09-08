/**
 * Fluxo de notificação push — orquestração entre o store e os ports de push
 * (ADR 0012, ticket 02; espelha store/dailyFlow.ts/store/shopFlow.ts).
 *
 * Cuida de: (a) decidir quando mostrar o soft-ask dentro do app (Liga ativa
 * + ainda não resolvido — aceito ou recusado, estado persistido
 * independente do status de permissão do SO), (b) disparar o prompt do SO e
 * registrar o token via PushBackend quando aceito, e (c) ligar o listener
 * de toque em notificação a um callback de navegação (openDaily no
 * gameStore). Nunca lança: falha do provider/backend só impede o registro
 * do token, nunca trava a resolução do soft-ask (accepted/declined) —
 * mesma regra de "nunca quebra o app" de AdProvider/PushProvider.
 *
 * PushFlowStorage vive aqui (não em engine/) porque a flag "soft-ask
 * resolvido" não é regra de jogo — é uma preocupação de fluxo/UI, mesmo
 * raciocínio de TutorialStorage em store/tutorialFlow.ts. shouldShowPushSoftAsk
 * (o predicado "mostrar o soft-ask agora?") vive em engine/pushProvider.ts,
 * não aqui — mesmo raciocínio de shouldShowBanner em engine/adProvider.ts:
 * predicado puro sobre tipos de domínio, consumido direto pelo componente,
 * sem depender de nenhum port deste fluxo.
 */

import { PushBackend, PushProvider, PushSoftAskState } from '../engine';

/** Estado do fluxo de push no store. */
export interface PushState {
  readonly softAskState: PushSoftAskState;
  /** Prompt do SO / registro do token em andamento (soft-ask aceito, aguardando). */
  readonly registering: boolean;
}

/** Fatia de push no store: estado + deviceId (propriedade do Desafio Diário — DailyState). */
export interface PushFlowState {
  readonly push: PushState;
  readonly deviceId: string;
}

/** Ports que o fluxo precisa (injetados pelo store; memória nos testes). */
export interface PushFlowDeps {
  /** Permissão/token/listener do SO (expo-notifications no app). */
  readonly provider: PushProvider;
  /** Registro do token no backend (Supabase no app). */
  readonly backend: PushBackend;
  /** Persistência da resolução do soft-ask. */
  readonly storage: PushFlowStorage;
}

/**
 * Port de persistência da resolução do soft-ask (memória nos testes; SQLite
 * no app via store/sqlite.ts, mesmo padrão dos outros ports do projeto).
 */
export interface PushFlowStorage {
  loadSoftAskState(): PushSoftAskState | null;
  saveSoftAskState(state: PushSoftAskState): void;
}

/** Implementação em memória do port, para testes. */
export function createMemoryPushFlowStorage(initial?: PushSoftAskState): PushFlowStorage {
  let state: PushSoftAskState | null = initial ?? null;
  return {
    loadSoftAskState: () => state,
    saveSoftAskState: (next) => {
      state = next;
    },
  };
}

/** Estado inicial do fluxo a partir do storage (sem registro em andamento no boot). */
export function loadPushState(storage: PushFlowStorage): PushState {
  return { softAskState: storage.loadSoftAskState() ?? 'unresolved', registering: false };
}

/**
 * Aceita o soft-ask: dispara o prompt nativo do SO e, se concedido, registra
 * o Expo push token no backend. Resolve para 'accepted' independentemente
 * do resultado da permissão ou do registro — best-effort, nunca re-pergunta
 * (mesma garantia que 'declined' já tem). Guarda também em `registering`
 * (não só em `softAskState`): sem isso, dois toques rápidos no botão antes
 * da primeira chamada resolver disparariam requestPermission/registerToken
 * duas vezes em paralelo (softAskState só sai de 'unresolved' ao final).
 */
export async function acceptPushSoftAsk(
  state: PushFlowState,
  deps: PushFlowDeps,
): Promise<PushFlowState> {
  if (state.push.softAskState !== 'unresolved' || state.push.registering) return state;
  const busy: PushFlowState = { ...state, push: { ...state.push, registering: true } };
  try {
    const permission = await deps.provider.requestPermission();
    if (permission === 'granted') {
      const pushToken = await deps.provider.getExpoPushToken();
      if (pushToken !== null) {
        await deps.backend.registerToken(state.deviceId, pushToken.token, pushToken.platform);
      }
    }
  } catch {
    // Falha do provider/backend (rede, SDK): registro best-effort — o
    // soft-ask ainda resolve para accepted, nunca fica pendurado nem pergunta de novo.
  }
  deps.storage.saveSoftAskState('accepted');
  return { ...busy, push: { softAskState: 'accepted', registering: false } };
}

/** Recusa o soft-ask: nunca mais aparece, mesmo em sessões futuras (persistido). */
export function declinePushSoftAsk(state: PushFlowState, deps: PushFlowDeps): PushFlowState {
  if (state.push.softAskState !== 'unresolved') return state;
  deps.storage.saveSoftAskState('declined');
  return { ...state, push: { ...state.push, softAskState: 'declined' } };
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
