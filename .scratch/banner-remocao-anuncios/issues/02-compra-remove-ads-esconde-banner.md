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
- [x] Validação em dev build no emulador (2026-08-16, dev build local `expo run:android` com provider dev): banner de teste (`Test Ad` do AdMob, rodapé y≈2219) visível no início e na Loja; card "Remove Ads" com preço `$2.99` do provider dev; toque em comprar → badge `PURCHASED` e o banner **some na hora**; sem banner no início nem no Desafio Diário (último elemento `BACK` em y≈1580, sem conteúdo abaixo); **após force-stop + relaunch o banner continua oculto** (persistido no SQLite). Recompensado do Desafio Diário intacto (tela normal). Nota: build local rodou sem `EXPO_PUBLIC_REVENUECAT_API_KEY` (compra simulada — o produto `remove_ads` ainda não existe no dashboard do RevenueCat; com a Test Store key o fluxo real depende de criar o produto lá)
