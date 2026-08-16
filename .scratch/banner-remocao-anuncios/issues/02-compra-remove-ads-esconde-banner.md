# 02 — Compra "Remove Ads" esconde o banner

**Status:** done

**What to build:** o jogador compra "Remove Ads" (US$2,99, IAP não-consumível) na Loja e o banner **desaparece na hora** de todas as telas, permanecendo oculto entre sessões. O anúncio recompensado do Desafio Diário não é afetado.

**Blocked by:** 01 — Banner em todas as telas (dev/test)

- [x] Port `ShopProvider` ganha check de entitlement (`remove_ads`): interface + provider dev (compra simulada marca a entitlement) + provider real do RevenueCat
- [x] Estado `adsRemoved` no store + ação `purchaseRemoveAds()` que compra, marca `adsRemoved: true` e persiste (mesmo padrão de persistência do `owned` da loja)
- [x] Card "Remove Ads" na Loja (preço do provider, US$2,99) com o padrão dos itens cosméticos (busy/estado); nada sobreposto ao banner
- [x] `<AdBanner/>` escondido quando `adsRemoved` (em todas as telas, imediatamente após a compra)
- [x] Produto `remove_ads` **fora** do `COSMETIC_CATALOG` (não é cosmético; a garantia do catálogo permanece)
- [x] Testes no seam: compra marca e persiste `adsRemoved`; cancelamento (provider false) não marca; `shouldShowBanner` oculto após compra
- [ ] Validação em dev build: compra simulada na Loja → banner some na hora e continua oculto após restart (passo manual — pendente)
