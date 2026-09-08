/**
 * Testes do fluxo de notificação push (store/pushFlow.ts, ADR 0012, ticket
 * 02) — soft-ask não repetido após recusado/aceito, registro de token
 * quando a permissão é concedida, e o listener de toque chamando o
 * callback de navegação. Mesmo padrão de store/dailyFlow.test.ts/
 * store/shopFlow.test.ts: o fluxo é exercitado direto pela interface, sem
 * zustand.
 */
import { createMemoryPushProvider, ExpoPushToken, PushBackend } from '../engine';

import {
  acceptPushSoftAsk,
  createMemoryPushFlowStorage,
  declinePushSoftAsk,
  loadPushState,
  PushFlowDeps,
  PushFlowState,
  registerNotificationTapListener,
  shouldShowPushSoftAsk,
} from './pushFlow';

/** Backend fake: rastreia chamadas de registro, falha opcional. */
function makeFakePushBackend(fail = false): PushBackend & {
  readonly registered: { deviceId: string; token: string; platform: 'ios' | 'android' }[];
} {
  const registered: { deviceId: string; token: string; platform: 'ios' | 'android' }[] = [];
  return {
    registered,
    registerToken: async (deviceId, token, platform) => {
      if (fail) throw new Error('rede fora');
      registered.push({ deviceId, token, platform });
    },
  };
}

function makeDeps(overrides: Partial<PushFlowDeps> = {}): PushFlowDeps {
  return {
    provider: createMemoryPushProvider({ permission: 'granted', token: { token: 'tok-1', platform: 'android' } }),
    backend: makeFakePushBackend(),
    storage: createMemoryPushFlowStorage(),
    ...overrides,
  };
}

function makeState(overrides: Partial<PushFlowState> = {}): PushFlowState {
  return {
    push: { softAskState: 'unresolved', registering: false },
    deviceId: 'device-1',
    ...overrides,
  };
}

describe('shouldShowPushSoftAsk', () => {
  test('Liga inativa (null): nunca mostra, mesmo não resolvido', () => {
    expect(shouldShowPushSoftAsk({ softAskState: 'unresolved', registering: false }, null)).toBe(false);
  });

  test('Liga ativa + soft-ask não resolvido: mostra', () => {
    const league = { week: '2026-08-31', tier: 'bronze' as const, division: 1, own: null, top: [] };
    expect(shouldShowPushSoftAsk({ softAskState: 'unresolved', registering: false }, league)).toBe(true);
  });

  test('Liga ativa + já recusado: não mostra de novo', () => {
    const league = { week: '2026-08-31', tier: 'bronze' as const, division: 1, own: null, top: [] };
    expect(shouldShowPushSoftAsk({ softAskState: 'declined', registering: false }, league)).toBe(false);
  });

  test('Liga ativa + já aceito: não mostra de novo', () => {
    const league = { week: '2026-08-31', tier: 'bronze' as const, division: 1, own: null, top: [] };
    expect(shouldShowPushSoftAsk({ softAskState: 'accepted', registering: false }, league)).toBe(false);
  });
});

describe('acceptPushSoftAsk', () => {
  test('permissão concedida: registra o token no backend e resolve para accepted (persistido)', async () => {
    const storage = createMemoryPushFlowStorage();
    const backend = makeFakePushBackend();
    const deps = makeDeps({ storage, backend });
    const result = await acceptPushSoftAsk(makeState(), deps);
    expect(result.push.softAskState).toBe('accepted');
    expect(result.push.registering).toBe(false);
    expect(backend.registered).toEqual([{ deviceId: 'device-1', token: 'tok-1', platform: 'android' }]);
    expect(storage.loadSoftAskState()).toBe('accepted');
  });

  test('permissão negada: não registra token, mas resolve para accepted (nunca mais pergunta)', async () => {
    const backend = makeFakePushBackend();
    const deps = makeDeps({
      provider: createMemoryPushProvider({ permission: 'denied' }),
      backend,
    });
    const result = await acceptPushSoftAsk(makeState(), deps);
    expect(result.push.softAskState).toBe('accepted');
    expect(backend.registered).toHaveLength(0);
  });

  test('módulo indisponível (sem SDK nativo): não registra token, resolve para accepted', async () => {
    const backend = makeFakePushBackend();
    const deps = makeDeps({
      provider: createMemoryPushProvider({ permission: 'unavailable' }),
      backend,
    });
    const result = await acceptPushSoftAsk(makeState(), deps);
    expect(result.push.softAskState).toBe('accepted');
    expect(backend.registered).toHaveLength(0);
  });

  test('permissão concedida mas sem token disponível: não chama o backend, ainda resolve para accepted', async () => {
    const backend = makeFakePushBackend();
    const deps = makeDeps({
      provider: createMemoryPushProvider({ permission: 'granted', token: null }),
      backend,
    });
    const result = await acceptPushSoftAsk(makeState(), deps);
    expect(result.push.softAskState).toBe('accepted');
    expect(backend.registered).toHaveLength(0);
  });

  test('falha do backend ao registrar: não quebra, ainda resolve para accepted (best-effort)', async () => {
    const backend = makeFakePushBackend(true);
    const deps = makeDeps({ backend });
    const result = await acceptPushSoftAsk(makeState(), deps);
    expect(result.push.softAskState).toBe('accepted');
    expect(result.push.registering).toBe(false);
  });

  test('já resolvido (accepted ou declined): no-op, nenhuma chamada é feita', async () => {
    const backend = makeFakePushBackend();
    const deps = makeDeps({ backend });
    const alreadyAccepted = makeState({ push: { softAskState: 'accepted', registering: false } });
    const result = await acceptPushSoftAsk(alreadyAccepted, deps);
    expect(result).toBe(alreadyAccepted);
    expect(backend.registered).toHaveLength(0);
  });

  test('usa o deviceId do estado (não hardcoded) e a plataforma vinda do token', async () => {
    const storage = createMemoryPushFlowStorage();
    const backend = makeFakePushBackend();
    const iosToken: ExpoPushToken = { token: 'tok-ios', platform: 'ios' };
    const deps = makeDeps({
      storage,
      backend,
      provider: createMemoryPushProvider({ permission: 'granted', token: iosToken }),
    });
    await acceptPushSoftAsk(makeState({ deviceId: 'device-9' }), deps);
    expect(backend.registered).toEqual([{ deviceId: 'device-9', token: 'tok-ios', platform: 'ios' }]);
  });
});

describe('declinePushSoftAsk', () => {
  test('recusar persiste declined e nunca mais mostra', () => {
    const storage = createMemoryPushFlowStorage();
    const deps = makeDeps({ storage });
    const result = declinePushSoftAsk(makeState(), deps);
    expect(result.push.softAskState).toBe('declined');
    expect(storage.loadSoftAskState()).toBe('declined');
  });

  test('já resolvido: no-op', () => {
    const deps = makeDeps();
    const alreadyDeclined = makeState({ push: { softAskState: 'declined', registering: false } });
    const result = declinePushSoftAsk(alreadyDeclined, deps);
    expect(result).toBe(alreadyDeclined);
  });
});

describe('loadPushState', () => {
  test('reflete o estado persistido; registering sempre começa false', () => {
    const storage = createMemoryPushFlowStorage('declined');
    expect(loadPushState(storage)).toEqual({ softAskState: 'declined', registering: false });
  });

  test('sem estado salvo: começa unresolved', () => {
    const storage = createMemoryPushFlowStorage();
    expect(loadPushState(storage)).toEqual({ softAskState: 'unresolved', registering: false });
  });
});

describe('registerNotificationTapListener', () => {
  test('toque na notificação chama o callback de navegação (openDaily)', () => {
    const provider = createMemoryPushProvider();
    let taps = 0;
    registerNotificationTapListener(provider, () => {
      taps += 1;
    });
    provider.simulateNotificationTap();
    provider.simulateNotificationTap();
    expect(taps).toBe(2);
  });

  test('unsubscribe para de chamar o callback', () => {
    const provider = createMemoryPushProvider();
    let taps = 0;
    const unsubscribe = registerNotificationTapListener(provider, () => {
      taps += 1;
    });
    unsubscribe();
    provider.simulateNotificationTap();
    expect(taps).toBe(0);
  });
});
