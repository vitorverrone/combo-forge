# 04 — Monetização observável

**What to build:** Os eventos que tornam a monetização observável — conversão de compra, descoberta da Loja e fill rate real do AdMob. Depois deste ticket dá pra correlacionar conversão de IAP com padrões de retenção e medir o fill rate real de cada formato de anúncio antes e depois da aprovação no readiness review do AdMob.

**Blocked by:** 01 — Port de telemetria (Firebase Analytics) instalado e conectado.

**Status:** done

- [x] `purchaseCosmetic`/`purchaseRemoveAds` em `store/shopFlow.ts` disparam `purchase_completed` com o identificador do produto, só no caminho de sucesso — cancelamento ou erro não dispara. `telemetry` entrou em `ShopFlowDeps`, mesmo padrão de `storage`/`provider`.
- [x] A abertura da Loja dispara `shop_opened` — disparado em `openShop()` (`gameStore.ts`), o único ponto que define `screen: 'shop'`, em vez de um `useEffect` na `ShopScreen`, mantendo a telemetria fora de componentes React (mesmo padrão dos tickets 01-03).
- [x] `requestRewardedAd`/`requestInterstitialAd` em `createAppAdProvider()` (`services/ads.ts`) disparam `ad_request_result` com o formato e se preencheu ou não — nos eventos `LOADED`/`ERROR` do SDK (sinal real de fill rate), não no catch de módulo nativo indisponível (evitaria poluir a métrica com ambiente de dev/teste).
- [x] O carregamento do banner (`AdBanner.tsx`, via `onAdLoaded`/`onAdFailedToLoad` do `BannerAd`) dispara `ad_request_result` com formato "banner" — única exceção do feature onde a telemetria dispara direto de um componente React, porque esse evento nativo não passa por nenhum port.
- [x] Testes cobrindo os eventos de compra (sucesso, cancelamento e erro, para os dois produtos) e de abertura da Loja com o `TelemetryProvider` fake, mesmo padrão de `shopFlow.test.ts` — 10 testes novos. `services/ads.ts`/`AdBanner.tsx` não têm teste (nenhum arquivo em `services/`/componentes nativos tem hoje — dependem de módulo nativo, validados só em device físico).
