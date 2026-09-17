/**
 * Loja cosmética (ticket 14).
 *
 * A única forma de monetização é cosmética: skins de baralho vendidas como
 * IAP (via RevenueCat no app; provider dev nos testes). A garantia explícita
 * do produto: NENHUM item aqui afeta poder de jogo — o catálogo só carrega
 * dados visuais (paleta da skin), nunca regras de pontuação, Forja ou
 * estrutura de Run.
 *
 * Estado puro: itens comprados (owned) e a skin de baralho equipada.
 * Persistido entre sessões via port ShopStorage (SQLite no app; memória nos
 * testes). A compra em si é IO e acontece no port ShopProvider (RevenueCat no
 * app; dev simulado nos testes).
 */

import { Suit } from './cards';

/** Paleta de cores de uma skin de baralho (aplica na face das cartas). */
export interface DeckSkinPalette {
  /** Face da carta (substitui colors.cardFace). */
  readonly cardFace: string;
  /** Tinta do Valor impresso (substitui colors.cardInk). */
  readonly cardInk: string;
  /**
   * Cor do símbolo de cada Material, por identificador interno de naipe.
   * Cada skin traz as quatro porque uma face escura precisa de tons claros
   * que a face de pergaminho não usaria.
   */
  readonly suits: Readonly<Record<Suit, string>>;
  readonly border: string;
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
  /**
   * Grátis por padrão (ex.: o baralho Classic) — `isOwned` trata como
   * possuído mesmo sem estar em `PersistedShop.owned`. Único jeito de
   * "possuído sem compra" no catálogo, então fica explícito aqui em vez de
   * um id comparado por literal espalhado pelas camadas.
   */
  readonly free: boolean;
}

export type CosmeticItem = DeckSkinItem;

/** Catálogo da loja — SOMENTE cosméticos (nunca tocam poder de jogo). */
export const COSMETIC_CATALOG: readonly CosmeticItem[] = [
  {
    kind: 'deckSkin',
    id: 'deck-classic',
    name: 'Classic',
    description: 'Classic parchment set',
    productId: 'combo_forge_skin_classic',
    devPrice: '$0',
    palette: {
      cardFace: '#f2e9d8',
      cardInk: '#221a2e',
      suits: { spades: '#5c6b7a', hearts: '#c4542a', diamonds: '#2e8c88', clubs: '#3a3348' },
      border: 'transparent',
    },
    free: true,
  },
  {
    kind: 'deckSkin',
    id: 'deck-obsidian',
    name: 'Obsidian Set',
    description: 'Charcoal face with silver ink — forged in shadow.',
    productId: 'combo_forge_skin_obsidian',
    devPrice: '$0.99',
    palette: {
      cardFace: '#1a1724',
      cardInk: '#f1eef7',
      suits: { spades: '#9baab8', hearts: '#e87b4a', diamonds: '#5cc9c2', clubs: '#a9a3c4' },
      border: '#4a4560',
    },
    free: false,
  },
  // {
  //   kind: 'deckSkin',
  //   id: 'deck-emerald',
  //   name: 'Emerald Set',
  //   description: 'Deep green face with gold ink — forest alloy.',
  //   productId: 'combo_forge_skin_emerald',
  //   devPrice: '$0.99',
  //   palette: {
  //     cardFace: '#0f3a2c',
  //     cardInk: '#f4ecd2',
  //     suits: { spades: '#a8bcc4', hearts: '#e8a14a', diamonds: '#6fd9c0', clubs: '#b9b0d0' },
  //     border: '#2f6b52',
  //   },
  //   free: false,
  // },
  // {
  //   kind: 'deckSkin',
  //   id: 'deck-royal',
  //   name: 'Gilded Set',
  //   description: 'Violet face with gold ink — crown of the forge.',
  //   productId: 'combo_forge_skin_royal',
  //   devPrice: '$0.99',
  //   palette: {
  //     cardFace: '#3a1442',
  //     cardInk: '#eccd6e',
  //     suits: { spades: '#b4b9cc', hearts: '#e88a4a', diamonds: '#6fc9d9', clubs: '#c9b8e0' },
  //     border: '#caa15a',
  //   },
  //   free: false,
  // },
];

/**
 * Remoção de anúncios (ticket 02): IAP não-consumível "Remove Ads" (US$2,99),
 * FORA do COSMETIC_CATALOG — não é cosmético, então a garantia explícita do
 * catálogo ("itens 100% visuais, nunca tocam poder de jogo") permanece.
 * Vive no RevenueCat como entitlement própria (ADR 0004).
 */
export const REMOVE_ADS_PRODUCT_ID = 'combo_forge_remove_ads';
/** Entitlement do RevenueCat que a compra ativa (check no port). */
export const REMOVE_ADS_ENTITLEMENT_ID = 'remove_ads';
/** Preço exibido quando o provider real não está configurado (dev). */
export const REMOVE_ADS_DEV_PRICE = '$2.99';

/** Estado persistido da loja (comprado + equipado + remoção de anúncios). */
export interface PersistedShop {
  /** ids dos itens comprados (COSMETIC_CATALOG). */
  readonly owned: readonly string[];
  /** Skin de baralho equipada (id) ou null (clássica). */
  readonly equippedDeckSkin: string | null;
  /**
   * Remoção de anúncios comprada (entitlement ativa). Não é um item do
   * catálogo, mas persiste com o resto do estado da loja (mesmo port
   * ShopStorage, mesmo padrão do owned).
   */
  readonly adsRemoved: boolean;
}

export function createInitialShopState(): PersistedShop {
  return {
    owned: [],
    equippedDeckSkin: null,
    adsRemoved: false,
  };
}

/**
 * Estado carregado do storage, normalizado: saves antigos (antes da remoção
 * de anúncios) não têm adsRemoved — o default false é aplicado sem perder o
 * resto. Null (sem save) vira o estado inicial.
 */
export function normalizeShopState(state: PersistedShop | null): PersistedShop {
  if (state === null) return createInitialShopState();
  return { ...createInitialShopState(), ...state };
}

/** Item do catálogo pelo id (undefined se não existir). */
export function cosmeticItemById(id: string): CosmeticItem | undefined {
  return COSMETIC_CATALOG.find((item) => item.id === id);
}

/** Já comprado — ou grátis por padrão (ex.: o baralho Classic)? */
export function isOwned(state: PersistedShop, itemId: string): boolean {
  const item = cosmeticItemById(itemId);
  if (item !== undefined && item.free) return true;
  return state.owned.includes(itemId);
}

/** Registra a compra de um item (devolve o estado novo). */
export function purchaseItem(state: PersistedShop, itemId: string): PersistedShop {
  if (isOwned(state, itemId)) return state;
  return { ...state, owned: [...state.owned, itemId] };
}

/** Equipa uma skin de baralho comprada. Ignora item não comprado ou inexistente. */
export function equipItem(state: PersistedShop, itemId: string): PersistedShop {
  if (!isOwned(state, itemId)) return state;
  if (cosmeticItemById(itemId) === undefined) return state;
  return { ...state, equippedDeckSkin: itemId };
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
 * dev simulado nos testes). Lida com productId do catálogo e da remoção de
 * anúncios; nunca decide regra de jogo.
 */
export interface ShopProvider {
  /** Ofertas disponíveis (productId + preço formatado). */
  loadOfferings(): Promise<readonly ShopOffering[]>;
  /**
   * Compra um produto. Resolve true quando a compra foi concluída; false se
   * o jogador cancelou. Rejeita em falha de loja/rede.
   */
  purchase(productId: string): Promise<boolean>;
  /**
   * A entitlement está ativa (compra válida do não-consumível)? Check usado
   * na sincronização de restore/launch (ticket 03) — o store reflete o
   * resultado como adsRemoved.
   */
  hasEntitlement(entitlementId: string): Promise<boolean>;
  /** Restaura compras do dispositivo; devolve os productIds comprados. */
  restore(): Promise<readonly string[]>;
}

/**
 * Provider de desenvolvimento: ofertas do catálogo + remove_ads a US$2,99,
 * compra sempre aceita. A compra simulada do remove_ads marca a entitlement
 * (espelha o comportamento real do RevenueCat, testável sem SDK).
 */
export function createDevShopProvider(): ShopProvider {
  let removeAdsEntitlement = false;
  return {
    loadOfferings: async () => [
      ...COSMETIC_CATALOG.map((item) => ({
        productId: item.productId,
        price: item.devPrice,
      })),
      { productId: REMOVE_ADS_PRODUCT_ID, price: REMOVE_ADS_DEV_PRICE },
    ],
    purchase: async (productId) => {
      if (productId === REMOVE_ADS_PRODUCT_ID) removeAdsEntitlement = true;
      return true;
    },
    hasEntitlement: async (entitlementId) =>
      entitlementId === REMOVE_ADS_ENTITLEMENT_ID && removeAdsEntitlement,
    restore: async () => [],
  };
}
