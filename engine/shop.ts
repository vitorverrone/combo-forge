/**
 * Loja cosmética (ticket 14).
 *
 * A única forma de monetização é cosmética: skins de baralho e efeitos
 * visuais de combo vendidos como IAP (via RevenueCat no app; provider dev nos
 * testes). A garantia explícita do produto: NENHUM item aqui afeta poder de
 * jogo — o catálogo só carrega dados visuais (paleta da skin, cor de acento
 * do VFX), nunca regras de pontuação, Forja ou estrutura de Run.
 *
 * Estado puro: itens comprados (owned) e o que está equipado (uma skin de
 * baralho + um VFX de combo por vez). Persistido entre sessões via port
 * ShopStorage (SQLite no app; memória nos testes). A compra em si é IO e
 * acontece no port ShopProvider (RevenueCat no app; dev simulado nos testes).
 */

/** Paleta de cores de uma skin de baralho (aplica na face das cartas). */
export interface DeckSkinPalette {
  /** Face da carta (substitui colors.cardFace). */
  readonly cardFace: string;
  /** Tinta dos valores/naipes pretos (substitui colors.cardInk). */
  readonly cardInk: string;
  /** Naipes vermelhos (substitui colors.red). */
  readonly red: string;
}

export interface DeckSkinItem {
  readonly kind: 'deckSkin';
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Identificador do produto no RevenueCat (productIdentifier). */
  readonly productId: string;
  /** Preço exibido quando o provider real não está configurado (dev). */
  readonly devPrice: string;
  readonly palette: DeckSkinPalette;
}

export interface ComboVfxItem {
  readonly kind: 'comboVfx';
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly productId: string;
  readonly devPrice: string;
  /** Cor de acento do efeito visual de combo. */
  readonly accent: string;
}

export type CosmeticItem = DeckSkinItem | ComboVfxItem;

/** Tipo de item cosmético. */
export type CosmeticKind = CosmeticItem['kind'];

/** Catálogo da loja — SOMENTE cosméticos (nunca tocam poder de jogo). */
export const COSMETIC_CATALOG: readonly CosmeticItem[] = [
  {
    kind: 'deckSkin',
    id: 'skin-obsidian',
    name: 'Obsidian Deck',
    description: 'Charcoal face with silver ink — forged in shadow.',
    productId: 'combo_forge_skin_obsidian',
    devPrice: '$0.99',
    palette: { cardFace: '#23202e', cardInk: '#e8e2f2', red: '#e05c4e' },
  },
  {
    kind: 'deckSkin',
    id: 'skin-emerald',
    name: 'Emerald Deck',
    description: 'Deep green face with gold ink — forest alloy.',
    productId: 'combo_forge_skin_emerald',
    devPrice: '$0.99',
    palette: { cardFace: '#1c2f26', cardInk: '#f0e6c8', red: '#d98c3a' },
  },
  {
    kind: 'deckSkin',
    id: 'skin-royal',
    name: 'Royal Deck',
    description: 'Navy face with ivory ink — crown of the forge.',
    productId: 'combo_forge_skin_royal',
    devPrice: '$1.99',
    palette: { cardFace: '#1c2440', cardInk: '#f2ecd8', red: '#c1352c' },
  },
  {
    kind: 'comboVfx',
    id: 'vfx-golden-combo',
    name: 'Golden Combo',
    description: 'Combo meter and accents burn in molten gold.',
    productId: 'combo_forge_vfx_golden_combo',
    devPrice: '$0.99',
    accent: '#ffd166',
  },
];

/** Estado persistido da loja (comprado + equipado). */
export interface PersistedShop {
  /** ids dos itens comprados (COSMETIC_CATALOG). */
  readonly owned: readonly string[];
  /** Skin de baralho equipada (id) ou null (clássica). */
  readonly equippedDeckSkin: string | null;
  /** VFX de combo equipado (id) ou null (clássico). */
  readonly equippedComboVfx: string | null;
}

export function createInitialShopState(): PersistedShop {
  return { owned: [], equippedDeckSkin: null, equippedComboVfx: null };
}

/** Item do catálogo pelo id (undefined se não existir). */
export function cosmeticItemById(id: string): CosmeticItem | undefined {
  return COSMETIC_CATALOG.find((item) => item.id === id);
}

/** Item é uma skin de baralho? */
export function isDeckSkinItem(item: CosmeticItem): item is DeckSkinItem {
  return item.kind === 'deckSkin';
}

/** Já comprado? */
export function isOwned(state: PersistedShop, itemId: string): boolean {
  return state.owned.includes(itemId);
}

/** Registra a compra de um item (devolve o estado novo). */
export function purchaseItem(state: PersistedShop, itemId: string): PersistedShop {
  if (isOwned(state, itemId)) return state;
  return { ...state, owned: [...state.owned, itemId] };
}

/**
 * Equipa um item cosmético comprado. Skins de baralho trocam a skin atual;
 * VFX de combo trocam o VFX atual. Ignora item não comprado ou inexistente.
 */
export function equipItem(state: PersistedShop, itemId: string): PersistedShop {
  if (!isOwned(state, itemId)) return state;
  const item = cosmeticItemById(itemId);
  if (item === undefined) return state;
  if (item.kind === 'deckSkin') {
    return { ...state, equippedDeckSkin: itemId };
  }
  return { ...state, equippedComboVfx: itemId };
}

/** Junta os ids comprados no servidor (restore) aos locais. */
export function mergeOwned(state: PersistedShop, itemIds: readonly string[]): PersistedShop {
  const fresh = itemIds.filter(
    (id) => cosmeticItemById(id) !== undefined && !state.owned.includes(id),
  );
  if (fresh.length === 0) return state;
  return { ...state, owned: [...state.owned, ...fresh] };
}

/** Port de persistência da loja (SQLite no app; memória nos testes). */
export interface ShopStorage {
  load(): PersistedShop | null;
  save(state: PersistedShop): void;
}

export function createMemoryShopStorage(initial?: PersistedShop | null): ShopStorage {
  let stored = initial ?? null;
  return {
    load: () => stored,
    save: (state) => {
      stored = state;
    },
  };
}

/** Uma oferta exibível na loja (produto do provider + preço). */
export interface ShopOffering {
  readonly productId: string;
  /** Preço formatado (ex.: "$0.99") vindo do provider real ou dev. */
  readonly price: string;
}

/**
 * Port do provider de compras (RevenueCat no app — services/revenuecat.ts;
 * dev simulado nos testes). Só lida com productId do catálogo; nunca decide
 * regra de jogo.
 */
export interface ShopProvider {
  /** Ofertas disponíveis (productId + preço formatado). */
  loadOfferings(): Promise<readonly ShopOffering[]>;
  /**
   * Compra um produto. Resolve true quando a compra foi concluída; false se
   * o jogador cancelou. Rejeita em falha de loja/rede.
   */
  purchase(productId: string): Promise<boolean>;
  /** Restaura compras do dispositivo; devolve os productIds comprados. */
  restore(): Promise<readonly string[]>;
}

/** Provider de desenvolvimento: ofertas do catálogo, compra sempre aceita. */
export function createDevShopProvider(): ShopProvider {
  return {
    loadOfferings: async () =>
      COSMETIC_CATALOG.map((item) => ({
        productId: item.productId,
        price: item.devPrice,
      })),
    purchase: async () => true,
    restore: async () => [],
  };
}
