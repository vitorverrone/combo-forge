# 03 — Restore reentrega a remoção

**Status:** ready-for-agent

**What to build:** o jogador que comprou a remoção de anúncios e trocou de aparelho/reinstalou recupera o estado "sem banner" — pelo botão "Restaurar compras" na Loja e automaticamente no launch (o RevenueCat reentrega a entitlement).

**Blocked by:** 02 — Compra "Remove Ads" esconde o banner

- [ ] `restorePurchases()` marca `adsRemoved: true` quando a entitlement `remove_ads` vem do restore (e persiste)
- [ ] Sincronização automática no launch: a entitlement reentregue pelo RevenueCat reflete `adsRemoved` sem interação do jogador
- [ ] Restore sem a entitlement não altera `adsRemoved` (não regride compras)
- [ ] Testes no seam: restore com entitlement marca e persiste; sem entitlement não altera
- [ ] Validação em dev build: restore dev entrega a entitlement → banner continua oculto
