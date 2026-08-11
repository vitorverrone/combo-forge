import {
  COSMETIC_CATALOG,
  cosmeticItemById,
  createDevShopProvider,
  createInitialShopState,
  createMemoryShopStorage,
  equipItem,
  isOwned,
  mergeOwned,
  purchaseItem,
} from './shop';

describe('catálogo cosmético (ticket 14)', () => {
  test('tem 3 skins de baralho e 1 VFX de combo', () => {
    expect(COSMETIC_CATALOG.filter((item) => item.kind === 'deckSkin')).toHaveLength(3);
    expect(COSMETIC_CATALOG.filter((item) => item.kind === 'comboVfx')).toHaveLength(1);
  });

  test('garantia explícita: itens só carregam dados visuais, nunca poder', () => {
    for (const item of COSMETIC_CATALOG) {
      // Keys do item: identidade + rótulo + loja + visual. Qualquer chave de
      // regra de jogo (score, multiplier, target, forge...) quebraria aqui.
      const keys = [...Object.keys(item)].sort();
      const expected = [...
        item.kind === 'deckSkin'
          ? ['description', 'devPrice', 'id', 'kind', 'name', 'palette', 'productId']
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
    state = purchaseItem(state, 'skin-obsidian');
    expect(isOwned(state, 'skin-obsidian')).toBe(true);
    state = equipItem(state, 'skin-obsidian');
    expect(state.equippedDeckSkin).toBe('skin-obsidian');
    state = purchaseItem(state, 'skin-emerald');
    state = equipItem(state, 'skin-emerald');
    expect(state.equippedDeckSkin).toBe('skin-emerald');
  });

  test('não equipa item não comprado nem inexistente', () => {
    const state = createInitialShopState();
    expect(equipItem(state, 'skin-obsidian').equippedDeckSkin).toBeNull();
    expect(equipItem(state, 'nao-existe').equippedDeckSkin).toBeNull();
  });

  test('VFX de combo equipa separadamente da skin', () => {
    let state = purchaseItem(createInitialShopState(), 'vfx-golden-combo');
    state = equipItem(state, 'vfx-golden-combo');
    expect(state.equippedComboVfx).toBe('vfx-golden-combo');
    expect(state.equippedDeckSkin).toBeNull();
  });

  test('mergeOwned junta ids do servidor (restore) sem duplicar', () => {
    let state = purchaseItem(createInitialShopState(), 'skin-obsidian');
    state = mergeOwned(state, ['skin-emerald', 'skin-obsidian', 'desconhecido']);
    expect([...state.owned].sort()).toEqual(['skin-emerald', 'skin-obsidian']);
  });

  test('storage em memória persiste o estado', () => {
    const storage = createMemoryShopStorage();
    expect(storage.load()).toBeNull();
    const state = purchaseItem(createInitialShopState(), 'skin-royal');
    storage.save(state);
    expect(storage.load()).toEqual(state);
  });
});

describe('provider dev', () => {
  test('lista ofertas do catálogo com preço e compra sempre aceita', async () => {
    const provider = createDevShopProvider();
    const offerings = [...(await provider.loadOfferings())];
    expect(offerings).toHaveLength(COSMETIC_CATALOG.length);
    expect(offerings[0].price).toBe('$0.99');
    expect(await provider.purchase('combo_forge_skin_obsidian')).toBe(true);
    expect(await provider.restore()).toEqual([]);
    expect(cosmeticItemById('skin-obsidian')?.kind).toBe('deckSkin');
  });
});
