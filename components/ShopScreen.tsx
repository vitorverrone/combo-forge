import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COSMETIC_CATALOG, isDeckSkinItem, isOwned } from '../engine';

import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

/**
 * Loja cosmética (ticket 14). Única forma de monetização (junto dos anúncios
 * opt-in do ticket 16). Garantia explícita: itens são 100% visuais — nunca
 * afetam poder de jogo. Compras são IAP via RevenueCat (provider real); em
 * desenvolvimento sem chave, o provider dev simula a compra.
 */
export function ShopScreen() {
  const shop = useGameStore((state) => state.shop);
  const backToStart = useGameStore((state) => state.backToStart);
  const purchaseCosmetic = useGameStore((state) => state.purchaseCosmetic);
  const equipCosmetic = useGameStore((state) => state.equipCosmetic);
  const restorePurchases = useGameStore((state) => state.restorePurchases);

  const priceOf = (productId: string): string | undefined =>
    shop.offerings.find((offering) => offering.productId === productId)?.price;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.eyebrow}>SHOP</Text>
      <Text style={styles.title}>Cosmetic Only</Text>
      <Text style={styles.guarantee}>
        ✓ Never affects gameplay power — deck skins and combo effects are purely visual.
      </Text>

      <SectionHeader label="Deck Skins" />
      {COSMETIC_CATALOG.filter(isDeckSkinItem).map((item) => (
        <ItemRow
          key={item.id}
          label={item.name}
          description={item.description}
          price={priceOf(item.productId) ?? item.devPrice}
          owned={isOwned(shop.owned, item.id)}
          equipped={shop.owned.equippedDeckSkin === item.id}
          busy={shop.purchasing === item.id}
          onBuy={() => void purchaseCosmetic(item.id)}
          onEquip={() => equipCosmetic(item.id)}
        />
      ))}

      <SectionHeader label="Combo Effects" />
      {COSMETIC_CATALOG.filter((item) => !isDeckSkinItem(item)).map((item) => (
        <ItemRow
          key={item.id}
          label={item.name}
          description={item.description}
          price={priceOf(item.productId) ?? item.devPrice}
          owned={isOwned(shop.owned, item.id)}
          equipped={shop.owned.equippedComboVfx === item.id}
          busy={shop.purchasing === item.id}
          onBuy={() => void purchaseCosmetic(item.id)}
          onEquip={() => equipCosmetic(item.id)}
        />
      ))}

      {shop.status === 'loading' && (
        <Text style={styles.statusText}>Loading prices…</Text>
      )}
      {shop.status === 'error' && <Text style={styles.errorText}>⚠ {shop.error}</Text>}

      <Pressable
        accessibilityLabel="Restore purchases"
        disabled={shop.restoring}
        onPress={() => void restorePurchases()}
        style={({ pressed }) => [styles.restoreButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.restoreButtonText}>
          {shop.restoring ? 'RESTORING…' : 'RESTORE PURCHASES'}
        </Text>
      </Pressable>
      <Text style={styles.restoreHint}>
        Bought on another device? Restore to unlock here too.
      </Text>

      <Pressable
        accessibilityLabel="Back to home"
        onPress={backToStart}
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.backButtonText}>BACK</Text>
      </Pressable>
    </ScrollView>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function ItemRow({
  label,
  description,
  price,
  owned,
  equipped,
  busy,
  onBuy,
  onEquip,
}: {
  readonly label: string;
  readonly description: string;
  readonly price: string;
  readonly owned: boolean;
  readonly equipped: boolean;
  readonly busy: boolean;
  readonly onBuy: () => void;
  readonly onEquip: () => void;
}) {
  return (
    <View style={[styles.itemRow, equipped && styles.itemRowEquipped]}>
      <View style={styles.itemText}>
        <Text style={styles.itemName}>{label}</Text>
        <Text style={styles.itemDesc}>{description}</Text>
      </View>
      {!owned && (
        <Pressable
          accessibilityLabel={`Buy ${label}`}
          disabled={busy}
          onPress={onBuy}
          style={({ pressed }) => [styles.buyButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buyButtonText}>{busy ? '…' : price}</Text>
        </Pressable>
      )}
      {owned && !equipped && (
        <Pressable
          accessibilityLabel={`Equip ${label}`}
          onPress={onEquip}
          style={({ pressed }) => [styles.equipButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.equipButtonText}>EQUIP</Text>
        </Pressable>
      )}
      {owned && equipped && (
        <View style={styles.equippedBadge}>
          <Text style={styles.equippedBadgeText}>EQUIPPED</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  guarantee: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 12,
    marginBottom: 8,
  },
  itemRowEquipped: {
    borderColor: colors.gold,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  itemDesc: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  buyButton: {
    borderRadius: 10,
    backgroundColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buyButtonText: {
    color: '#241a05',
    fontSize: 13,
    fontWeight: '900',
  },
  equipButton: {
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  equipButtonText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  equippedBadge: {
    borderRadius: 10,
    backgroundColor: 'rgba(127,201,138,0.15)',
    borderWidth: 1,
    borderColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  equippedBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  statusText: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  restoreButton: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  restoreHint: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  backButton: {
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
