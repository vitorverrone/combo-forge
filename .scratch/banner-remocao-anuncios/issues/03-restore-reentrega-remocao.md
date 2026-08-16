# 03 — Restore reentrega a remoção

**Status:** done

**What to build:** o jogador que comprou a remoção de anúncios e trocou de aparelho/reinstalou recupera o estado "sem banner" — pelo botão "Restaurar compras" na Loja e automaticamente no launch (o RevenueCat reentrega a entitlement).

**Blocked by:** 02 — Compra "Remove Ads" esconde o banner

- [x] `restorePurchases()` marca `adsRemoved: true` quando a entitlement `remove_ads` vem do restore (e persiste)
- [x] Sincronização automática no launch: a entitlement reentregue pelo RevenueCat reflete `adsRemoved` sem interação do jogador (ação `syncRemoveAdsEntitlement()` chamada no bootstrap)
- [x] Restore sem a entitlement não altera `adsRemoved` (não regride compras)
- [x] Testes no seam: restore com entitlement marca e persiste; sem entitlement não altera
- [x] Validação em dev build no emulador (2026-08-16, dev build local com provider dev): estado limpo (`pm clear`) → banner visível; Loja → RESTORE PURCHASES → banner **continua visível** (sem entitlement não altera nada, sem erro); comprar Remove Ads → PURCHASED e banner some; RESTORE PURCHASES de novo → **banner continua oculto** (restore não regride, PURCHASED mantido); force-stop + relaunch → **banner continua oculto** e o sync de launch roda sem impacto. Nota: no provider dev a entitlement só existe na sessão (sem reentrega entre sessões — o caso cross-device real é do RevenueCat, coberto por `hasEntitlement` → `getCustomerInfo` e pelos testes do seam; o build local rodou sem `EXPO_PUBLIC_REVENUECAT_API_KEY`)
