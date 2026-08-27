import {
  COSMETIC_CATALOG,
  cosmeticItemById,
  createDevShopProvider,
  createInitialShopState,
  createMemoryShopStorage,
  equipItem,
  isOwned,
  mergeOwned,
  normalizeShopState,
  PersistedShop,
  purchaseItem,
  REMOVE_ADS_ENTITLEMENT_ID,
  REMOVE_ADS_PRODUCT_ID,
} from './shop';

describe('catálogo cosmético (ticket 14)', () => {
  test('tem 4 skins de baralho e 1 VFX de combo', () => {
    expect(COSMETIC_CATALOG.filter((item) => item.kind === 'deckSkin')).toHaveLength(4);
    expect(COSMETIC_CATALOG.filter((item) => item.kind === 'comboVfx')).toHaveLength(1);
  });

  test('garantia explícita: itens só carregam dados visuais, nunca poder', () => {
    for (const item of COSMETIC_CATALOG) {
      // Keys do item: identidade + rótulo + loja + visual. Qualquer chave de
      // regra de jogo (score, multiplier, target, forge...) quebraria aqui.
      const keys = [...Object.keys(item)].sort();
      const expected = [...
        item.kind === 'deckSkin'
          ? ['description', 'devPrice', 'free', 'id', 'kind', 'name', 'palette', 'productId']
          : ['accent', 'description', 'devPrice', 'id', 'kind', 'name', 'productId'],
      ].sort();
      expect(keys).toEqual(expected);
    }
  });

  test('todos os itens têm productId distinto (contrato com o RevenueCat)', () => {
    const ids = new Set(COSMETIC_CATALOG.map((item) => item.productId));
    expect(ids.size).toBe(COSMETIC_CATALOG.length);
  });
});

describe('estado da loja', () => {
  test('compra adiciona ao owned e equipa troca a skin atual', () => {
    let state = createInitialShopState();
    state = purchaseItem(state, 'deck-obsidian');
    expect(isOwned(state, 'deck-obsidian')).toBe(true);
    state = equipItem(state, 'deck-obsidian');
    expect(state.equippedDeckSkin).toBe('deck-obsidian');
    state = purchaseItem(state, 'deck-emerald');
    state = equipItem(state, 'deck-emerald');
    expect(state.equippedDeckSkin).toBe('deck-emerald');
  });

  test('não equipa item não comprado nem inexistente', () => {
    const state = createInitialShopState();
    expect(equipItem(state, 'deck-obsidian').equippedDeckSkin).toBeNull();
    expect(equipItem(state, 'nao-existe').equippedDeckSkin).toBeNull();
  });

  test('deck-classic (free: true) conta como possuído e equipável sem compra', () => {
    const state = createInitialShopState();
    expect(state.owned).not.toContain('deck-classic'); // nunca entra no owned persistido
    expect(isOwned(state, 'deck-classic')).toBe(true); // mas isOwned já reconhece
    expect(equipItem(state, 'deck-classic').equippedDeckSkin).toBe('deck-classic');
  });

  test('VFX de combo equipa separadamente da skin', () => {
    let state = purchaseItem(createInitialShopState(), 'vfx-golden-combo');
    state = equipItem(state, 'vfx-golden-combo');
    expect(state.equippedComboVfx).toBe('vfx-golden-combo');
    expect(state.equippedDeckSkin).toBeNull();
  });

  test('mergeOwned junta ids do servidor (restore) sem duplicar', () => {
    let state = purchaseItem(createInitialShopState(), 'deck-obsidian');
    state = mergeOwned(state, ['deck-emerald', 'deck-obsidian', 'desconhecido']);
    expect([...state.owned].sort()).toEqual(['deck-emerald', 'deck-obsidian']);
  });

  test('storage em memória persiste o estado', () => {
    const storage = createMemoryShopStorage();
    expect(storage.load()).toBeNull();
    const state = purchaseItem(createInitialShopState(), 'deck-royal');
    storage.save(state);
    expect(storage.load()).toEqual(state);
  });
});

describe('provider dev', () => {
  test('lista ofertas do catálogo com preço e compra sempre aceita', async () => {
    const provider = createDevShopProvider();
    const offerings = [...(await provider.loadOfferings())];
    expect(offerings).toHaveLength(COSMETIC_CATALOG.length + 1); // + remove_ads
    const obsidian = offerings.find((offering) => offering.productId === 'combo_forge_skin_obsidian');
    expect(obsidian?.price).toBe('$0.99');
    expect(await provider.purchase('combo_forge_skin_obsidian')).toBe(true);
    expect(await provider.restore()).toEqual([]);
    expect(cosmeticItemById('deck-obsidian')?.kind).toBe('deckSkin');
  });
});

describe('remoção de anúncios (ticket 02)', () => {
  test('remove_ads fica fora do COSMETIC_CATALOG (não é cosmético; a garantia do catálogo permanece)', () => {
    expect(COSMETIC_CATALOG.some((item) => item.productId === REMOVE_ADS_PRODUCT_ID)).toBe(false);
  });

  test('estado inicial tem adsRemoved false', () => {
    expect(createInitialShopState().adsRemoved).toBe(false);
  });

  test('provider dev: remove_ads a US$2,99 e a compra simulada marca a entitlement', async () => {
    const provider = createDevShopProvider();
    const removeAds = (await provider.loadOfferings()).find(
      (offering) => offering.productId === REMOVE_ADS_PRODUCT_ID,
    );
    expect(removeAds?.price).toBe('$2.99');
    expect(await provider.hasEntitlement(REMOVE_ADS_ENTITLEMENT_ID)).toBe(false);
    expect(await provider.purchase(REMOVE_ADS_PRODUCT_ID)).toBe(true);
    expect(await provider.hasEntitlement(REMOVE_ADS_ENTITLEMENT_ID)).toBe(true);
    // entitlement de outro id não existe
    expect(await provider.hasEntitlement('outra-entitlement')).toBe(false);
  });

  test('normalizeShopState aplica default false a saves antigos sem adsRemoved', () => {
    const oldSave = {
      owned: ['deck-obsidian'],
      equippedDeckSkin: 'deck-obsidian',
      equippedComboVfx: null,
    } as unknown as PersistedShop;
    const normalized = normalizeShopState(oldSave);
    expect(normalized.adsRemoved).toBe(false);
    expect(normalized.owned).toEqual(['deck-obsidian']);
    expect(normalizeShopState(null)).toEqual(createInitialShopState());
  });
});
