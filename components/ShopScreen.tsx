import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  COSMETIC_CATALOG,
  DeckSkinItem,
  isOwned,
  REMOVE_ADS_DEV_PRICE,
  REMOVE_ADS_PRODUCT_ID,
} from '../engine';

import { useTranslation } from '../i18n';
import { deckSkinDescription } from './format';
import { SuitSymbol } from './SuitSymbol';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';
import TopButton from './TopButton';

export function ShopScreen() {
  const { t } = useTranslation();
  const shop = useGameStore((state) => state.shop);
  const adsRemoved = useGameStore((state) => state.adsRemoved);
  const backToStart = useGameStore((state) => state.backToStart);
  const purchaseCosmetic = useGameStore((state) => state.purchaseCosmetic);
  const purchaseRemoveAds = useGameStore((state) => state.purchaseRemoveAds);
  const equipCosmetic = useGameStore((state) => state.equipCosmetic);
  const restorePurchases = useGameStore((state) => state.restorePurchases);

  const priceOf = (productId: string): string | undefined =>
    shop.offerings.find((offering) => offering.productId === productId)?.price;
  const removeAdsPrice = priceOf(REMOVE_ADS_PRODUCT_ID) ?? REMOVE_ADS_DEV_PRICE;
  const removeAdsBusy = shop.purchasing === REMOVE_ADS_PRODUCT_ID;

  return (
    <View style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TopButton onPress={backToStart} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>{t('shop.eyebrow')}</Text>
        <Text style={styles.title}>{t('shop.title')}</Text>
        <Text style={styles.subtitle}>{t('shop.subtitle')}</Text>

        {/* Deck Skins */}
        <SectionHeader label={t('shop.decks')} count={`${COSMETIC_CATALOG.filter((item) => isOwned(shop.owned, item.id)).length}/${COSMETIC_CATALOG.length}`} />
        {COSMETIC_CATALOG.map((item) => {
          const owned = isOwned(shop.owned, item.id);
          const equipped = shop.owned.equippedDeckSkin === item.id;
          const busy = shop.purchasing === item.id;
          return (
            <View key={item.id} style={[styles.shopRow, equipped && styles.shopRowEquipped]}>
              <DeckPreview item={item} />
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{item.name}</Text>
                <Text style={styles.shopSub}>{deckSkinDescription(item)}</Text>
              </View>
              <View style={styles.shopAction}>
                {owned && equipped ? (
                  <Text style={styles.shopEquippedLabel}>{t('common.equipped')}</Text>
                ) : owned && !equipped ? (
                  <Pressable
                    accessibilityLabel={t('a11y.equipItem', { name: item.name })}
                    onPress={() => equipCosmetic(item.id)}
                    style={({ pressed }) => [styles.equipBtn, pressed && styles.btnPressed]}
                  >
                    <Text style={styles.equipBtnText}>{t('common.equip')}</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityLabel={t('a11y.buyItem', { name: item.name })}
                    disabled={busy}
                    onPress={() => void purchaseCosmetic(item.id)}
                    style={({ pressed }) => [styles.priceBtn, pressed && styles.btnPressed]}
                  >
                    <Text style={styles.priceBtnText}>{busy ? '…' : (priceOf(item.productId) ?? item.devPrice)}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        {/* Remove Ads */}
        <SectionHeader label={t('shop.removeAds')} />
        <View style={[styles.offerCard, adsRemoved && styles.shopRowEquipped]}>
          <Text style={styles.offerTitle}>{t('shop.removeAds')}</Text>
          <Text style={styles.offerDesc}>
            {t('shop.removeAdsDesc')}
          </Text>
          {!adsRemoved ? (
            <Pressable
              accessibilityLabel={t('a11y.buyItem', { name: t('shop.removeAds') })}
              accessibilityRole="button"
              accessibilityState={{ disabled: removeAdsBusy }}
              disabled={removeAdsBusy}
              onPress={() => void purchaseRemoveAds()}
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
            >
              <Text style={styles.btnPrimaryText}>{removeAdsBusy ? '…' : t('shop.buyFor', { price: removeAdsPrice })}</Text>
            </Pressable>
          ) : (
            <Text style={styles.purchasedLabel}>{t('shop.purchased')}</Text>
          )}
        </View>

        {/* Restore Purchases */}
        <Pressable
          accessibilityLabel={t('shop.restorePurchases')}
          accessibilityRole="button"
          accessibilityState={{ disabled: shop.restoring }}
          disabled={shop.restoring}
          onPress={() => void restorePurchases()}
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnSecondaryText}>
            {shop.restoring ? t('shop.restoring') : t('shop.restorePurchases')}
          </Text>
        </Pressable>

        {shop.status === 'loading' && (
          <Text style={styles.statusText}>{t('shop.loadingPrices')}</Text>
        )}
        {shop.status === 'error' && <Text style={styles.errorText}>⚠ {shop.error}</Text>}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ label, count }: { label: string; count?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{label}</Text>
      {count !== undefined && <Text style={styles.sectionCount}>{count}</Text>}
    </View>
  );
}

/** Deck skin preview thumbnail showing a card face. */
function DeckPreview({ item }: { item: DeckSkinItem }) {
  return (
    <View style={[styles.deckPreview, { backgroundColor: item.palette.cardFace, borderColor: item.palette.border }]}>
      <SuitSymbol suit="spades" color={item.palette.cardInk} size={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[8],
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: radius[10],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPressed: {
    opacity: 0.85,
  },
  navBtnText: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 16,
  },
  scroll: {
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[0],
  },
  eyebrow: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    color: colors.gold,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: spacing[14],
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.gold,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing[8],
    maxWidth: 280,
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing[22],
    marginBottom: spacing[10],
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
  },
  /* ── Shop rows ── */
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[10],
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[12],
    marginBottom: spacing[8],
    minHeight: 64,
  },
  shopRowEquipped: {
    borderColor: colors.gold,
  },
  deckPreview: {
    width: 40,
    height: 56,
    borderRadius: radius[6],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1
  },
  deckPreviewSuit: {
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '900',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  shopSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: spacing[2],
  },
  shopAction: {
    alignItems: 'flex-end',
  },
  priceBtn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[10],
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
  },
  priceBtnText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  equipBtn: {
    borderRadius: radius[10],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
  },
  equipBtnText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  shopEquippedLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  btnPressed: {
    opacity: 0.8,
  },
  /* ── Remove Ads offer ── */
  offerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[12],
    padding: spacing[16],
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.text,
  },
  offerDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textDim,
    lineHeight: 20,
    marginTop: spacing[6],
    marginBottom: spacing[14],
  },
  btnPrimary: {
    borderRadius: radius[12],
    backgroundColor: colors.gold,
    paddingVertical: spacing[16],
    alignItems: 'center',
  },
  btnPrimaryPressed: {
    backgroundColor: colors.goldDark,
    opacity: 0.85,
  },
  btnPrimaryText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  purchasedLabel: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  btnSecondary: {
    marginTop: spacing[22],
    marginBottom: spacing[8],
    borderRadius: radius[12],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing[14],
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusText: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing[8],
  },
});
