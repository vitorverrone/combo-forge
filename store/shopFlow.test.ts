import {
  COSMETIC_CATALOG,
  createDevShopProvider,
  createInitialShopState,
  createMemoryShopStorage,
  REMOVE_ADS_ENTITLEMENT_ID,
  ShopProvider,
  ShopStorage,
} from '../engine';

import { equipCosmetic, runShopCommand, ShopFlowDeps, ShopFlowState } from './shopFlow';

/** Estado inicial da fatia da Loja (idle, sem compras). */
function makeState(overrides: Partial<ShopFlowState> = {}): ShopFlowState {
  return {
    shop: {
      owned: createInitialShopState(),
      offerings: [],
      status: 'idle',
      error: null,
      purchasing: null,
      restoring: false,
    },
    adsRemoved: false,
    ...overrides,
  };
}

/** Ports da Loja (mesmos fakes do gameStore.test.ts). */
function makeDeps(
  provider: ShopProvider = createDevShopProvider(),
  storage: ShopStorage = createMemoryShopStorage(),
): ShopFlowDeps {
  return { provider, storage };
}

describe('loja cosmética (ticket 14) — fluxo', () => {
  test('load carrega as ofertas do provider (catálogo + remoção)', async () => {
    const state = await runShopCommand(makeState(), makeDeps(), { type: 'load' });
    expect(state.shop.status).toBe('ready');
    // Catálogo cosmético + a oferta de remoção de anúncios (ticket 02).
    expect(state.shop.offerings).toHaveLength(COSMETIC_CATALOG.length + 1);
  });

  test('purchaseCosmetic compra, persiste e auto-equipa a skin', async () => {
    const storage = createMemoryShopStorage();
    let state = await runShopCommand(makeState(), makeDeps(createDevShopProvider(), storage), {
      type: 'purchaseCosmetic',
      itemId: 'deck-obsidian',
    });
    expect(state.shop.owned.owned).toContain('deck-obsidian');
    expect(state.shop.owned.equippedDeckSkin).toBe('deck-obsidian'); // aplicada na hora
    expect(storage.load()?.owned).toContain('deck-obsidian');
    // VFX não interfere na skin.
    state = await runShopCommand(state, makeDeps(createDevShopProvider(), storage), {
      type: 'purchaseCosmetic',
      itemId: 'vfx-golden-combo',
    });
    expect(state.shop.owned.owned).toContain('vfx-golden-combo');
    expect(state.shop.owned.equippedComboVfx).toBe('vfx-golden-combo');
    expect(state.shop.owned.equippedDeckSkin).toBe('deck-obsidian');
  });

  test('equipCosmetic equipa apenas itens comprados e troca a skin atual', async () => {
    let state = makeState();
    // sem comprar, não equipa
    state = equipCosmetic(state, makeDeps(), 'deck-obsidian');
    expect(state.shop.owned.equippedDeckSkin).toBeNull();
    state = await runShopCommand(state, makeDeps(), { type: 'purchaseCosmetic', itemId: 'deck-obsidian' });
    state = await runShopCommand(state, makeDeps(), { type: 'purchaseCosmetic', itemId: 'deck-emerald' });
    state = equipCosmetic(state, makeDeps(), 'deck-obsidian');
    expect(state.shop.owned.equippedDeckSkin).toBe('deck-obsidian');
    state = equipCosmetic(state, makeDeps(), 'deck-emerald');
    expect(state.shop.owned.equippedDeckSkin).toBe('deck-emerald');
  });

  test('purchaseCosmetic ignora item já comprado (sem chamar o provider)', async () => {
    const provider = createDevShopProvider();
    const spy = jest.spyOn(provider, 'purchase');
    let state = makeState();
    state = await runShopCommand(state, makeDeps(provider), { type: 'purchaseCosmetic', itemId: 'deck-obsidian' });
    state = await runShopCommand(state, makeDeps(provider), { type: 'purchaseCosmetic', itemId: 'deck-obsidian' });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('restore junta compras do servidor às locais', async () => {
    const provider = {
      ...createDevShopProvider(),
      restore: async () => ['combo_forge_skin_royal', 'combo_forge_skin_obsidian'],
    };
    let state = await runShopCommand(makeState(), makeDeps(provider), {
      type: 'purchaseCosmetic',
      itemId: 'deck-obsidian',
    });
    state = await runShopCommand(state, makeDeps(provider), { type: 'restore' });
    expect(state.shop.owned.owned).toContain('deck-obsidian');
    expect(state.shop.owned.owned).toContain('deck-royal');
  });

  test('falha do provider marca erro e não adiciona o item', async () => {
    const provider = {
      ...createDevShopProvider(),
      purchase: async () => {
        throw new Error('loja fora do ar');
      },
    };
    const state = await runShopCommand(makeState(), makeDeps(provider), {
      type: 'purchaseCosmetic',
      itemId: 'deck-obsidian',
    });
    expect(state.shop.error).toBe('loja fora do ar');
    expect(state.shop.owned.owned).toHaveLength(0);
    expect(state.shop.purchasing).toBeNull();
  });

  test('item inexistente é rejeitado sem quebrar o estado', async () => {
    const state = await runShopCommand(makeState(), makeDeps(), {
      type: 'purchaseCosmetic',
      itemId: 'nao-existe',
    });
    expect(state.shop.error).toBeDefined();
    expect(state.shop.owned.owned).toHaveLength(0);
    expect(state.shop.purchasing).toBeNull();
  });
});

describe('remoção de anúncios (ticket 02) — fluxo', () => {
  test('purchaseRemoveAds compra, marca adsRemoved e persiste (mesmo padrão do owned)', async () => {
    const storage = createMemoryShopStorage();
    const state = await runShopCommand(makeState(), makeDeps(createDevShopProvider(), storage), {
      type: 'purchaseRemoveAds',
    });
    expect(state.adsRemoved).toBe(true);
    expect(state.shop.purchasing).toBeNull();
    expect(storage.load()?.adsRemoved).toBe(true);
  });

  test('cancelamento (provider false) não marca adsRemoved nem persiste', async () => {
    const storage = createMemoryShopStorage();
    const provider = { ...createDevShopProvider(), purchase: async () => false };
    const state = await runShopCommand(makeState(), makeDeps(provider, storage), {
      type: 'purchaseRemoveAds',
    });
    expect(state.adsRemoved).toBe(false);
    expect(state.shop.purchasing).toBeNull();
    expect(storage.load()).toBeNull(); // nada persistido
  });

  test('falha do provider marca erro e não marca adsRemoved', async () => {
    const provider = {
      ...createDevShopProvider(),
      purchase: async () => {
        throw new Error('loja fora do ar');
      },
    };
    const state = await runShopCommand(makeState(), makeDeps(provider), {
      type: 'purchaseRemoveAds',
    });
    expect(state.adsRemoved).toBe(false);
    expect(state.shop.error).toBe('loja fora do ar');
    expect(state.shop.purchasing).toBeNull();
  });

  test('já comprado: purchaseRemoveAds não chama o provider de novo', async () => {
    const provider = createDevShopProvider();
    const spy = jest.spyOn(provider, 'purchase');
    let state = makeState();
    state = await runShopCommand(state, makeDeps(provider), { type: 'purchaseRemoveAds' });
    state = await runShopCommand(state, makeDeps(provider), { type: 'purchaseRemoveAds' });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('restore da remoção de anúncios (ticket 03) — fluxo', () => {
  test('restore marca adsRemoved quando a entitlement remove_ads vem do restore', async () => {
    const storage = createMemoryShopStorage();
    const provider = {
      ...createDevShopProvider(),
      restore: async () => [],
      hasEntitlement: async (entitlementId: string) => entitlementId === REMOVE_ADS_ENTITLEMENT_ID,
    };
    const state = await runShopCommand(makeState(), makeDeps(provider, storage), { type: 'restore' });
    expect(state.adsRemoved).toBe(true);
    expect(state.shop.restoring).toBe(false);
    expect(storage.load()?.adsRemoved).toBe(true);
  });

  test('restore sem a entitlement não marca adsRemoved', async () => {
    const storage = createMemoryShopStorage();
    const provider = { ...createDevShopProvider(), restore: async () => [], hasEntitlement: async () => false };
    const state = await runShopCommand(makeState(), makeDeps(provider, storage), { type: 'restore' });
    expect(state.adsRemoved).toBe(false);
    expect(state.shop.restoring).toBe(false);
    expect(storage.load()?.adsRemoved ?? false).toBe(false); // sem marcação
  });

  test('restore sem a entitlement não regride uma remoção já comprada', async () => {
    const owned = { ...createInitialShopState(), adsRemoved: true };
    const storage = createMemoryShopStorage(owned);
    const provider = { ...createDevShopProvider(), hasEntitlement: async () => false };
    const state = await runShopCommand(
      makeState({ shop: { ...makeState().shop, owned }, adsRemoved: true }),
      makeDeps(provider, storage),
      { type: 'restore' },
    );
    expect(state.adsRemoved).toBe(true);
    expect(storage.load()?.adsRemoved).toBe(true);
  });

  test('syncEntitlement marca e persiste quando a entitlement está ativa (launch)', async () => {
    const storage = createMemoryShopStorage();
    const provider = {
      ...createDevShopProvider(),
      hasEntitlement: async (entitlementId: string) => entitlementId === REMOVE_ADS_ENTITLEMENT_ID,
    };
    const state = await runShopCommand(makeState(), makeDeps(provider, storage), {
      type: 'syncEntitlement',
    });
    expect(state.adsRemoved).toBe(true);
    expect(storage.load()?.adsRemoved).toBe(true);
  });

  test('syncEntitlement sem a entitlement não altera nada', async () => {
    const provider = { ...createDevShopProvider(), hasEntitlement: async () => false };
    const state = await runShopCommand(makeState(), makeDeps(provider), { type: 'syncEntitlement' });
    expect(state.adsRemoved).toBe(false);
  });

  test('syncEntitlement não regride quando já removido', async () => {
    const owned = { ...createInitialShopState(), adsRemoved: true };
    const storage = createMemoryShopStorage(owned);
    const provider = { ...createDevShopProvider(), hasEntitlement: async () => false };
    const state = await runShopCommand(
      makeState({ shop: { ...makeState().shop, owned }, adsRemoved: true }),
      makeDeps(provider, storage),
      { type: 'syncEntitlement' },
    );
    expect(state.adsRemoved).toBe(true);
    expect(storage.load()?.adsRemoved).toBe(true);
  });
});
