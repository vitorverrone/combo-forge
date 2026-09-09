/**
 * Testes do fluxo de notificação push (store/pushFlow.ts, ADR 0012 —
 * atualização 2026-09-08, ticket 03) — permissão nativa pedida uma única vez
 * no cold start (sem soft-ask), registro de token quando concedida, e o
 * listener de toque chamando o callback de navegação. Mesmo padrão de
 * store/dailyFlow.test.ts/store/shopFlow.test.ts: o fluxo é exercitado
 * direto pela interface, sem zustand.
 */
import { createMemoryPushProvider, ExpoPushToken, PushBackend } from '../engine';

import {
  createMemoryPushFlowStorage,
  PushFlowDeps,
  registerNotificationTapListener,
  requestPushPermissionOnColdStart,
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

describe('requestPushPermissionOnColdStart', () => {
  test('permissão concedida: registra o token no backend e marca como já solicitado (persistido)', async () => {
    const storage = createMemoryPushFlowStorage();
    const backend = makeFakePushBackend();
    const deps = makeDeps({ storage, backend });
    await requestPushPermissionOnColdStart('device-1', deps);
    expect(backend.registered).toEqual([{ deviceId: 'device-1', token: 'tok-1', platform: 'android' }]);
    expect(storage.hasRequestedPushPermission()).toBe(true);
  });

  test('permissão negada: não registra token, mas marca como já solicitado (nunca mais pergunta)', async () => {
    const storage = createMemoryPushFlowStorage();
    const backend = makeFakePushBackend();
    const deps = makeDeps({ storage, provider: createMemoryPushProvider({ permission: 'denied' }), backend });
    await requestPushPermissionOnColdStart('device-1', deps);
    expect(backend.registered).toHaveLength(0);
    expect(storage.hasRequestedPushPermission()).toBe(true);
  });

  test('módulo indisponível (sem SDK nativo): não registra token, marca como já solicitado', async () => {
    const storage = createMemoryPushFlowStorage();
    const backend = makeFakePushBackend();
    const deps = makeDeps({ storage, provider: createMemoryPushProvider({ permission: 'unavailable' }), backend });
    await requestPushPermissionOnColdStart('device-1', deps);
    expect(backend.registered).toHaveLength(0);
    expect(storage.hasRequestedPushPermission()).toBe(true);
  });

  test('permissão concedida mas sem token disponível: não chama o backend, ainda marca como solicitado', async () => {
    const storage = createMemoryPushFlowStorage();
    const backend = makeFakePushBackend();
    const deps = makeDeps({
      storage,
      backend,
      provider: createMemoryPushProvider({ permission: 'granted', token: null }),
    });
    await requestPushPermissionOnColdStart('device-1', deps);
    expect(backend.registered).toHaveLength(0);
    expect(storage.hasRequestedPushPermission()).toBe(true);
  });

  test('falha do backend ao registrar: não quebra, ainda marca como solicitado (best-effort)', async () => {
    const storage = createMemoryPushFlowStorage();
    const backend = makeFakePushBackend(true);
    const deps = makeDeps({ storage, backend });
    await expect(requestPushPermissionOnColdStart('device-1', deps)).resolves.toBeUndefined();
    expect(storage.hasRequestedPushPermission()).toBe(true);
  });

  test('já solicitado antes: no-op, nenhuma chamada ao provider/backend', async () => {
    const storage = createMemoryPushFlowStorage(true);
    const backend = makeFakePushBackend();
    let permissionRequested = false;
    const deps = makeDeps({
      storage,
      backend,
      provider: {
        ...createMemoryPushProvider(),
        requestPermission: async () => {
          permissionRequested = true;
          return 'granted';
        },
      },
    });
    await requestPushPermissionOnColdStart('device-1', deps);
    expect(permissionRequested).toBe(false);
    expect(backend.registered).toHaveLength(0);
  });

  test('usa o deviceId recebido (não hardcoded) e a plataforma vinda do token', async () => {
    const storage = createMemoryPushFlowStorage();
    const backend = makeFakePushBackend();
    const iosToken: ExpoPushToken = { token: 'tok-ios', platform: 'ios' };
    const deps = makeDeps({
      storage,
      backend,
      provider: createMemoryPushProvider({ permission: 'granted', token: iosToken }),
    });
    await requestPushPermissionOnColdStart('device-9', deps);
    expect(backend.registered).toEqual([{ deviceId: 'device-9', token: 'tok-ios', platform: 'ios' }]);
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
