/**
 * Fluxo da Loja — orquestração entre o store e os ports de compra (refactor:
 * módulo profundo extraído do gameStore, espelhando store/dailyFlow.ts).
 *
 * O engine (engine/shop.ts) guarda o catálogo puro, o estado persistido
 * (PersistedShop) e os ports; este módulo orquestra o ciclo de vida da Loja:
 * carga de ofertas, compra de cosmético, compra da remoção de anúncios,
 * restore e sincronização de entitlement no launch — via provider (RevenueCat
 * no app) e persistência (ShopStorage), com busy/erro nos campos de status.
 *
 * Interface pequena para muita orquestração: um único comando (runShopCommand)
 * cobre load / purchaseCosmetic / purchaseRemoveAds / restore /
 * syncEntitlement. O equip de cosmético é síncrono e puro (sem IO), então é
 * uma função própria (equipCosmetic) — prometer assíncrono para algo que não
 * faz IO seria mentir na interface. Nada deste módulo conhece zustand, telas
 * ou navegação: o IO acontece só através dos ports injetados (ShopFlowDeps) e
 * a fatia nova é aplicada pelo store com set(...). Nunca lança: loading/erro
 * ficam nos campos de status (mesma regra do dailyFlow).
 */

import {
  COSMETIC_CATALOG,
  cosmeticItemById,
  equipItem as engineEquipItem,
  isOwned,
  mergeOwned,
  PersistedShop,
  purchaseItem as enginePurchaseItem,
  REMOVE_ADS_ENTITLEMENT_ID,
  REMOVE_ADS_PRODUCT_ID,
  ShopOffering,
  ShopProvider,
  ShopStorage,
  TelemetryProvider,
} from '../engine';

/** Estado da Loja no store (movido do gameStore — refactor). */
export interface ShopState {
  /** Itens comprados + equipados (persistido entre sessões). */
  readonly owned: PersistedShop;
  /** Ofertas (preços) carregadas do provider; vazio até loadShop. */
  readonly offerings: readonly ShopOffering[];
  /** Carga das ofertas. */
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly error: string | null;
  /** Item com compra em andamento (id) ou null. */
  readonly purchasing: string | null;
  /** Restauração de compras em andamento. */
  readonly restoring: boolean;
}

/** Fatia da Loja no store: estado da Loja + remoção de anúncios no topo. */
export interface ShopFlowState {
  readonly shop: ShopState;
  readonly adsRemoved: boolean;
}

/** Ports que o fluxo precisa (injetados pelo store; memória nos testes). */
export interface ShopFlowDeps {
  /** Persistência dos comprados/equipados + remoção (SQLite no app). */
  readonly storage: ShopStorage;
  /** Provider de compras (RevenueCat no app; dev simulado nos testes). */
  readonly provider: ShopProvider;
  /** Telemetria (ticket 04/ADR 0007) — no-op em dev/testes. */
  readonly telemetry: TelemetryProvider;
}

/** Comandos do ciclo de vida da Loja (todos com IO; equip é função própria). */
export type ShopCommand =
  | { type: 'load' }
  | { type: 'purchaseCosmetic'; itemId: string }
  | { type: 'purchaseRemoveAds' }
  | { type: 'restore' }
  | { type: 'syncEntitlement' };

/**
 * Executa um comando do fluxo da Loja. Sempre devolve a fatia nova (nunca
 * lança): busy/erro ficam nos campos de status, e a persistência acontece via
 * port quando há mutação.
 */
export async function runShopCommand(
  state: ShopFlowState,
  deps: ShopFlowDeps,
  command: ShopCommand,
): Promise<ShopFlowState> {
  switch (command.type) {
    case 'load':
      return loadShop(state, deps);
    case 'purchaseCosmetic':
      return purchaseCosmetic(state, deps, command.itemId);
    case 'purchaseRemoveAds':
      return purchaseRemoveAds(state, deps);
    case 'restore':
      return restorePurchases(state, deps);
    case 'syncEntitlement':
      return syncRemoveAdsEntitlement(state, deps);
  }
}

/**
 * Equipa uma skin de baralho comprada. Síncrono e puro (sem IO de provider):
 * devolve a fatia nova, persistindo via port quando houve mudança. Ignora
 * item não comprado ou inexistente.
 */
export function equipCosmetic(
  state: ShopFlowState,
  deps: ShopFlowDeps,
  itemId: string,
): ShopFlowState {
  const owned = engineEquipItem(state.shop.owned, itemId);
  if (owned === state.shop.owned) return state; // não comprado ou inválido
  deps.storage.save(owned);
  return { ...state, shop: { ...state.shop, owned } };
}

/** Carrega as ofertas (preços) do provider. */
async function loadShop(state: ShopFlowState, deps: ShopFlowDeps): Promise<ShopFlowState> {
  const loading = { ...state, shop: { ...state.shop, status: 'loading' as const, error: null } };
  try {
    const offerings = await deps.provider.loadOfferings();
    return { ...loading, shop: { ...loading.shop, offerings, status: 'ready' } };
  } catch (error) {
    return { ...loading, shop: { ...loading.shop, status: 'error', error: messageOf(error) } };
  }
}

/** Compra um item cosmético (IAP via provider); a compra auto-equipa. */
async function purchaseCosmetic(
  state: ShopFlowState,
  deps: ShopFlowDeps,
  itemId: string,
): Promise<ShopFlowState> {
  const { shop } = state;
  if (shop.purchasing !== null || isOwned(shop.owned, itemId)) return state;
  const busy = { ...state, shop: { ...shop, purchasing: itemId, error: null } };
  try {
    const productId = requireCatalogProductId(itemId);
    const purchased = await deps.provider.purchase(productId);
    if (purchased) {
      // A skin comprada é equipada na hora (aplicada ao Baralho nas próximas
      // Runs — ticket 14).
      let owned = enginePurchaseItem(state.shop.owned, itemId);
      owned = engineEquipItem(owned, itemId);
      deps.storage.save(owned);
      void deps.telemetry.logEvent('purchase_completed', { productId });
      return { ...busy, shop: { ...busy.shop, owned, purchasing: null } };
    }
    // Cancelamento pelo jogador: sem adicionar nada.
    return { ...busy, shop: { ...busy.shop, purchasing: null } };
  } catch (error) {
    return { ...busy, shop: { ...busy.shop, purchasing: null, error: messageOf(error) } };
  }
}

/** Compra a remoção de anúncios (IAP não-consumível, ticket 02). */
async function purchaseRemoveAds(
  state: ShopFlowState,
  deps: ShopFlowDeps,
): Promise<ShopFlowState> {
  const { shop } = state;
  // Uma compra por vez (mesmo busy do catálogo) e não recompra.
  if (shop.purchasing !== null || state.adsRemoved) return state;
  const busy = { ...state, shop: { ...shop, purchasing: REMOVE_ADS_PRODUCT_ID, error: null } };
  try {
    const purchased = await deps.provider.purchase(REMOVE_ADS_PRODUCT_ID);
    if (purchased) {
      // Marca a remoção no estado persistido (mesmo blob da loja) e na fatia —
      // o banner some na hora (ADR 0004).
      const owned = { ...state.shop.owned, adsRemoved: true };
      deps.storage.save(owned);
      void deps.telemetry.logEvent('purchase_completed', { productId: REMOVE_ADS_PRODUCT_ID });
      return { ...busy, shop: { ...busy.shop, owned, purchasing: null }, adsRemoved: true };
    }
    // Cancelamento pelo jogador: sem marcar nada.
    return { ...busy, shop: { ...busy.shop, purchasing: null } };
  } catch (error) {
    return { ...busy, shop: { ...busy.shop, purchasing: null, error: messageOf(error) } };
  }
}

/**
 * Sincroniza a entitlement remove_ads com o provider (launch, ticket 03):
 * marca adsRemoved quando o RevenueCat reentrega a entitlement, sem interação
 * do jogador. Nunca regride uma remoção já ativa.
 */
async function syncRemoveAdsEntitlement(
  state: ShopFlowState,
  deps: ShopFlowDeps,
): Promise<ShopFlowState> {
  // Já removido: nada a sincronizar (e nunca regride).
  if (state.adsRemoved) return state;
  try {
    const active = await deps.provider.hasEntitlement(REMOVE_ADS_ENTITLEMENT_ID);
    if (active) {
      const owned = { ...state.shop.owned, adsRemoved: true };
      deps.storage.save(owned);
      return { ...state, shop: { ...state.shop, owned }, adsRemoved: true };
    }
    return state;
  } catch {
    // Provider indisponível/sem rede no launch: nada muda agora; o botão
    // "Restaurar compras" da Loja e o próximo launch tentam de novo.
    return state;
  }
}

/** Restaura compras do dispositivo (novo aparelho) + a remoção, se reentregue. */
async function restorePurchases(
  state: ShopFlowState,
  deps: ShopFlowDeps,
): Promise<ShopFlowState> {
  const { shop } = state;
  if (shop.restoring) return state;
  const busy = { ...state, shop: { ...shop, restoring: true, error: null } };
  try {
    const productIds = await deps.provider.restore();
    const catalogId = (productId: string) =>
      COSMETIC_CATALOG.find((item) => item.productId === productId)?.id;
    const itemIds = productIds.map(catalogId).filter((id): id is string => id !== undefined);
    let owned = mergeOwned(state.shop.owned, itemIds);
    // Remoção de anúncios (ticket 03): a entitlement remove_ads reentregue
    // pelo restore também marca adsRemoved — sem a entitlement, nada muda
    // (o restore nunca regride uma compra já feita).
    const removeAdsActive = await deps.provider.hasEntitlement(REMOVE_ADS_ENTITLEMENT_ID);
    if (removeAdsActive) owned = { ...owned, adsRemoved: true };
    deps.storage.save(owned);
    return {
      ...busy,
      shop: { ...busy.shop, owned, restoring: false },
      adsRemoved: owned.adsRemoved,
    };
  } catch (error) {
    return { ...busy, shop: { ...busy.shop, restoring: false, error: messageOf(error) } };
  }
}

/** productId do catálogo para o item (defesa da UI); lança se inexistente. */
function requireCatalogProductId(itemId: string): string {
  const item = cosmeticItemById(itemId);
  if (item === undefined) {
    throw new Error(`Item cosmético inexistente: ${itemId}.`);
  }
  return item.productId;
}

/** Mensagem de erro estável para a UI (mesma regra do store/dailyFlow). */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
