/**
 * Provider de compras real (ticket 14): implementa o port ShopProvider
 * (engine/shop.ts) com o SDK react-native-purchases (RevenueCat).
 *
 * Config via EXPO_PUBLIC_REVENUECAT_API_KEY (embutida no bundle; ver
 * .env.example). Sem a chave, devolve o provider dev (compra simulada) — a
 * loja continua navegável em desenvolvimento/testes. A compra de verdade
 * exige um development build (o SDK roda em "Preview API Mode" no Expo Go,
 * com mocks JS — ver README do react-native-purchases).
 *
 * A configuração é em runtime (Purchases.configure) e não usa config plugin,
 * porque esta versão do SDK não embute app.plugin.js.
 */

import Purchases from 'react-native-purchases';

import {
  COSMETIC_CATALOG,
  createDevShopProvider,
  REMOVE_ADS_PRODUCT_ID,
  ShopOffering,
  ShopProvider,
} from '../engine';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

/** Chave do RevenueCat configurada? */
export function isRevenueCatConfigured(): boolean {
  return Boolean(API_KEY);
}

/**
 * Provider real sobre o RevenueCat. Devolve null quando o env não está
 * presente (desenvolvimento/testes — usa-se o provider dev).
 */
export function createRevenueCatShopProvider(): ShopProvider | null {
  if (!isRevenueCatConfigured()) return null;

  let configured = false;
  const ensureConfigured = (): void => {
    if (configured) return;
    Purchases.configure({ apiKey: API_KEY as string });
    configured = true;
  };

  /** Mapeia o catálogo local (cosméticos + remove_ads) para o offering atual. */
  const currentPackages = async () => {
    ensureConfigured();
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  };

  const isCatalogProduct = (productId: string): boolean =>
    COSMETIC_CATALOG.some((item) => item.productId === productId) ||
    productId === REMOVE_ADS_PRODUCT_ID;

  return {
    loadOfferings: async (): Promise<ShopOffering[]> => {
      const packages = await currentPackages();
      return packages
        .filter((pkg) => isCatalogProduct(pkg.product.identifier))
        .map((pkg) => ({
          productId: pkg.product.identifier,
          price: pkg.product.priceString,
        }));
    },

    purchase: async (productId: string): Promise<boolean> => {
      const packages = await currentPackages();
      const pkg = packages.find((candidate) => candidate.product.identifier === productId);
      if (pkg === undefined) {
        throw new Error(`Produto fora das ofertas: ${productId}.`);
      }
      try {
        await Purchases.purchasePackage(pkg);
        return true;
      } catch (error) {
        // Cancelamento pelo jogador não é erro (userCancelled vem do SDK).
        if (isUserCancellation(error)) {
          return false;
        }
        throw error;
      }
    },

    hasEntitlement: async (entitlementId: string): Promise<boolean> => {
      ensureConfigured();
      const info = await Purchases.getCustomerInfo();
      return Boolean(info.entitlements.active[entitlementId]);
    },

    restore: async (): Promise<string[]> => {
      ensureConfigured();
      const info = await Purchases.restorePurchases();
      const catalogIds = new Set(COSMETIC_CATALOG.map((item) => item.productId));
      return info.allPurchasedProductIdentifiers.filter((id) => catalogIds.has(id));
    },
  };
}

/** Provider para o store: real se configurado; dev simulado se não. */
export function createAppShopProvider(): ShopProvider {
  return createRevenueCatShopProvider() ?? createDevShopProvider();
}

/** Detecta cancelamento pelo jogador no erro rejeitado pelo SDK. */
function isUserCancellation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { userCancelled?: unknown };
  return candidate.userCancelled === true;
}
