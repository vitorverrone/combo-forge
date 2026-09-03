# 04 — Monetização observável

**What to build:** Os eventos que tornam a monetização observável — conversão de compra, descoberta da Loja e fill rate real do AdMob. Depois deste ticket dá pra correlacionar conversão de IAP com padrões de retenção e medir o fill rate real de cada formato de anúncio antes e depois da aprovação no readiness review do AdMob.

**Blocked by:** 01 — Port de telemetria (Firebase Analytics) instalado e conectado.

**Status:** ready-for-agent

- [ ] `purchaseCosmetic`/`purchaseRemoveAds` em `store/shopFlow.ts` disparam `purchase_completed` com o identificador do produto, só no caminho de sucesso — cancelamento ou erro não dispara.
- [ ] A montagem da `ShopScreen` dispara `shop_opened`.
- [ ] `requestRewardedAd`/`requestInterstitialAd` em `createAppAdProvider()` (`services/ads.ts`) disparam `ad_request_result` com o formato e se preencheu ou não.
- [ ] O carregamento do banner (`AdBanner`/hook associado) dispara `ad_request_result` com formato "banner" e se preencheu ou não.
- [ ] Testes cobrindo os eventos de compra e de abertura da Loja com o `TelemetryProvider` fake, mesmo padrão de `shopFlow.test.ts`.
