# Checklist de Configuração de Produção (pré-release)

Guia passo a passo para levar o Combo Forge de dev (providers simulados) para
produção. Cada seção indica **o que configurar**, **onde** e **como verificar**
que ficou pronto. Sem estas configurações o app funciona, mas com fallbacks de
desenvolvimento — nada disso é opcional para um release real.

## Estado atual (consolidado em 2026-08-16)

| Item | Onde está hoje | Próximo passo |
|---|---|---|
| Supabase | ✅ Projeto criado, migrations aplicadas, `.env` real (URL + anon) e Desafio Diário validado de ponta a ponta no app (seed real em release local e no preview do EAS) | `submit_daily_score`/`get_weekly_leaderboard` pendem de um fim de Run (opcional: `verify:backend` com Docker) |
| RevenueCat | ✅ App + 5 produtos no dashboard (4 cosméticos + Remove Ads), chave **Test Store** no `.env` e no EAS; compra/persistência validadas | Chave pública real (`goog_...`) + Play Console (app em validação) + App Store Connect + vínculo + testar Restore real |
| AdMob **Android** | ✅ App + unidade rewarded + banner + App ID real no `app.json`, env no `.env` e no EAS; request real validado (NO_FILL esperado até aprovar) | Vincular à loja + readiness review → revalidar recompensa |
| Banner em todas as telas (ticket banner-01) | ✅ Implementado + ad unit real criada + env setada no EAS (preview + production) | Vincular AdMob à loja (readiness review) |
| Intersticial entre Runs (ticket 02) | ⚠️ Implementado, mas **sem ad unit própria** — usava por engano o ad unit de rewarded (`services/ads.ts`), corrigido em 2026-08-26 para ler `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_*` | Criar a unidade **Interstitial** do Android no dashboard AdMob e setar `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID` no `.env` e no EAS (preview + production) — sem isso, produção não serve intersticial real |
| Remove Ads (tickets 02/03) | ✅ Implementado + produto `combo_forge_remove_ads` criado no RevenueCat | Play Console (em validação) → criar IAP + vínculo |
| AdMob **iOS** | ⏳ Pendente (Test App ID, sem ad unit) | Quando publicar na App Store |
| IAPs reais nas lojas | ⏳ Play Console em validação (app não criado ainda); App Store Connect pendente | Aguardar validação do Play Console → criar 5 IAPs → vincular ao RevenueCat |
| EAS | ✅ Projeto vinculado (`projectId`), variáveis em preview+production, build preview OK e validado no emulador | `eas build development` e `production` |
| Identificadores `com.combocardforge.app` | ✅ no `app.json` | Validar igualdade em AdMob/RC/ASC/Play (seção 0) |
| Pin do Kotlin (build de nuvem) | ✅ Versionado via `plugins/withKotlinVersionPin.js` | — |

---

## 0. Identificadores do app (fazer PRIMEIRO)

AdMob, RevenueCat, EAS e as lojas se amarram ao identificador do app. Sem ele,
nada do restante pode ser criado de verdade.

- [x] Decidir o bundle identifier: **`com.combocardforge.app`** (único, nunca muda
      depois de publicado) — aplicado ao iOS e ao Android.
- [x] Adicionar ao `app.json`:
  ```json
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.combocardforge.app"
  },
  "android": {
    "package": "com.combocardforge.app"
  }
  ```
      (validado com `npx expo config --type public`)
- [ ] Validar que o identificador é o mesmo em AdMob, RevenueCat, App Store
      Connect e Play Console (todas as seções abaixo usam o mesmo).

---

## 1. Supabase (Desafio Diário — ticket 12/13)

O backend só serve o contrato do Desafio Diário: seed do dia, submissão de
pontuação e ranking semanal. **Sem configurar, o Desafio Diário aparece como
indisponível no app** (`createUnavailableDailyBackend`).

### Criar o projeto e aplicar as migrations

- [x] Criar projeto em https://supabase.com/dashboard (plano gratuito basta
      para o MVP) — projeto existe (URL real no `.env`, verificado 2026-08-16).
- [x] Aplicar as migrations na ordem, via SQL editor ou CLI:
      `supabase/migrations/0001_daily_challenge.sql` → `0002_daily_challenge_access.sql`.
      ```bash
      supabase db push   # projeto vinculado (supabase link)
      ```
      (validado de ponta a ponta em 2026-08-16: o app buscou o seed real do dia
      e iniciou a Run do Desafio no release local e no preview do EAS)
- [x] `get_daily_seed` exposta ao `anon` e respondendo (provado pelo app acima).
      `submit_daily_score` / `get_weekly_leaderboard` ainda não exercitadas —
      dependem de terminar uma Run / abrir o leaderboard (a migration 0002 só
      dá `EXECUTE` nelas; a tabela permanece inacessível por RLS).

### Preencher o `.env`

- [x] `SUPABASE_URL` = URL real do projeto (verificado 2026-08-16, sem
      placeholder).
- [x] `SUPABASE_ANON_KEY` = chave `anon` pública preenchida (verificado
      2026-08-16).
- [x] Espelhado no prefixo do cliente Expo (obrigatório para o bundle):
      `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` com os
      mesmos valores (verificado 2026-08-16).

### Verificar

- [x] `npm test` — trava o contrato (espelho TS vs. SQL) sem precisar de rede
      (verde em 2026-08-16, 329 testes).
- [ ] `npm run verify:backend` — sobe Postgres 16 em Docker, aplica migrations e
      valida seed/submissão/leaderboard/caminho `anon` de ponta a ponta.
      (Opcional: o seed já foi validado pelo app; este cobre submit/leaderboard
      sem depender de terminar uma Run.)
- [x] Smoke test do contrato — **substituído pela validação no app** (2026-08-16):
      `get_daily_seed` retornou o seed real (Run do Desafio iniciou) em release
      local e no preview do EAS.

---

## 2. RevenueCat (loja — cosméticos + remoção de anúncios — tickets 14, 02/03)

A loja vende cosméticos (4 itens do `COSMETIC_CATALOG` — 100% visuais) e a
remoção de anúncios (IAP não-consumível `combo_forge_remove_ads`, **fora** do
catálogo por design — não é cosmético, ADR 0004). **Sem a chave, o app usa o
provider dev (compra sempre simulada)** — navegável em dev, inútil para
monetizar de verdade.

### Criar o app no RevenueCat

- [x] App criado em https://app.revenuecat.com usando o bundle identifier da
      seção 0 — configurado e validado em dev build (Test Store API key
      funcionando, 2026-08-15/16).
- [x] 4 produtos criados com **exatamente** os `productId` do catálogo
      (`engine/shop.ts` — o provider filtra as ofertas por eles; 4 packages
      cadastrados no offering de Test Store):

  | productId | Nome exibido | Preço de referência |
  |---|---|---|
  | `combo_forge_skin_obsidian` | Obsidian Deck | $0.99 |
  | `combo_forge_skin_emerald` | Emerald Deck | $0.99 |
  | `combo_forge_skin_royal` | Royal Deck | $1.99 |
  | `combo_forge_vfx_golden_combo` | Golden Combo | $0.99 |

- [x] Produto não-consumível **`combo_forge_remove_ads`** (Remove Ads, US$2,99)
      criado no dashboard do RevenueCat (2026-08-21, productId exato + package
      no offering de Test Store).

- [ ] Vincular os produtos de loja (App Store Connect / Play Console) a cada
      produto do RevenueCat (pagina de produto → Store Integration).

### Criar os IAPs nas lojas (pré-requisito do vínculo)

- [ ] **App Store Connect:** criar os 5 IAPs (4 cosméticos consumíveis + o
      não-consumível `combo_forge_remove_ads`) com os mesmos identificadores,
      preço e textos localizados; aceitar o contrato pago.
- [ ] **Play Console:** ⏳ App em validação — não é possível criar o app nem
      os 5 produtos em app ainda. Aguardar aprovação para proceder (4
      consumíveis + 1 não-consumível `combo_forge_remove_ads`); preencher a
      declaração de produtos em app.

### Preencher o `.env`

- [x] `EXPO_PUBLIC_REVENUECAT_API_KEY` preenchida — por enquanto com a
      **Test Store API key** (preços simulados). Para preços reais, trocar
      pela chave pública do app (RevenueCat → app → Settings → API Keys →
      Public SDK key, formato `goog_...`) + Play Console/App Store Connect
      com produtos reais. Pública por design, embutida no bundle.

### Verificar

- [x] Rodar em **development build** (Expo Go roda o SDK em "Preview API Mode"
      com mocks JS — compra real não acontece lá). Ver seção 5. Validado em
      dev build Android no emulador (`expo run:android`) em 2026-08-15.
- [x] Na loja: preços vêm do RevenueCat (`ShopOffering.price`), não o `devPrice`
      do catálogo — validado com **Test Store API key** (preços simulados;
      para preços reais, chave pública `goog_...` + Play Console).
- [x] Comprar um item → some do catálogo e aparece em "owned" (persistido em
      SQLite — sobrevive a restart do app).
- [x] Comprar "Remove Ads" → banner some na hora e permanece oculto após
      restart (validado no emulador com provider dev, tickets 02/03).
- [x] `Restore` implementado e validado em dev (ticket 03): sem entitlement não
      altera; com a compra feita não regride; sync automático no launch
      (emulador, provider dev).
- [ ] Testar `Restore` **real** (Test Store key): cosméticos voltam ao "owned"
      + a entitlement `remove_ads` reentregue → banner oculto (depende de
      criar os IAPs nas lojas e vincular ao RevenueCat — seção 2).

#### Validação no emulador (2026-08-15, dev build local)

- Test Store: 4 produtos cadastrados no dashboard + offering atual com os 4
  packages (um por tipo de intervalo — Weekly/Monthly/Three Months/Lifetime —
  porque o RC limita 1 package por tipo por offering; o app ignora o tipo e só
  casa `productId` com o catálogo).
- Bugs corrigidos nessa validação:
  - `store/gameStore.ts`: `purchaseCosmetic`/`equipCosmetic`/`restorePurchases`
    usavam o provider/storage do closure (dev/memória) em vez dos injetados via
    `get()` — a compra era simulada pelo provider dev e nada persistia no
    SQLite. (Esses fluxos hoje vivem em `store/shopFlow.ts` — refactor de
    2026-08-16; o fix permanece.)
  - `services/supabase.ts`: URL do Supabase inválida derrubava o bootstrap
    inteiro (loja ficava presa no provider dev silenciosamente) em vez de
    degradar para "Desafio Diário indisponível".
- Nota de build local (não versionado): `android/local.properties` (sdk.dir com
  barras normais — o `expo prebuild` o apaga; reaplicar se o build quebrar).
- Pin do Kotlin (o RN fixa 2.1.20, que não lê o metadata 2.3.0 da
  play-services-ads 25.4.0) é **versionado** via o config plugin
  `plugins/withKotlinVersionPin.js` (registrado no `app.json`): pina
  `kotlin-gradle-plugin:2.2.20` no `build.gradle` raiz durante o prebuild —
  sobrevive ao build de nuvem do EAS (o `expo-build-properties` só escreve a
  propriedade `android.kotlinVersion`, não o classpath do plugin). Validado
  localmente com prebuild fresco (2026-08-16).

---

## 3. AdMob (recompensado — ticket 16 · intersticial — ticket 02)

Dois formatos de anúncio: o recompensado opt-in da tentativa extra do Desafio
Diário, e o intersticial entre Runs (a cada 2 Runs concluídas, sem remoção de
anúncios comprada). **Sem configurar, o provider dev responde (anúncio sempre
concluído)**.

> ⚠️ **Bug corrigido em 2026-08-26:** `services/ads.ts` usava o ad unit de
> **rewarded** também para o intersticial (mesma variável de env para os dois
> formatos) — em produção isso não serve anúncio, já que ad units do AdMob são
> específicos por formato. Corrigido para ler
> `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_*`, uma variável própria. **A
> unidade de anúncio Interstitial ainda não foi criada no dashboard AdMob** —
> ver checklist abaixo.

> **Configuração guiada:** `scripts/setup-admob.sh` é um wizard que abre o
> dashboard, captura o App ID + ad unit rewarded do **Android** e grava no
> `app.json` + `.env` automaticamente. Os passos abaixo são o manual
> equivalente. Ad unit IDs são por plataforma (`EXPO_PUBLIC_..._ANDROID` /
> `_IOS`), selecionados via `Platform.OS` em `services/ads.ts`; o iOS fica
> para quando o app for publicado na App Store.

### ⚠️ Trocar os Test App IDs do `app.json` (crítico para release)

O config plugin hoje usa os **Test App IDs do Google**:
`ca-app-pub-3940256099942544~3347511713` (Android) e
`ca-app-pub-3940256099942544~1458002511` (iOS). Consequências de não trocar:
- App nativo **crasha no start** sem um App ID válido da sua conta;
- Com App ID de teste, o Ad Unit real **não serve anúncios** (só os de teste).

- [x] Criar o app **Android** em https://apps.admob.com (2026-08-16, package
      `com.combocardforge.app`; fluxo "unpublished" — app ainda não publicado).
      O app iOS fica pendente até publicar na App Store.
- [x] Criar a unidade de anúncio **Rewarded** do Android (2026-08-16).
- [x] Criar a unidade de anúncio **Banner** do Android (separada da rewarded;
      mesmo app) — (2026-08-21, ad unit `ca-app-pub-7753200620000515/1366979567`).
- [ ] Criar a unidade de anúncio **Interstitial** do Android (separada da
      rewarded e da banner; mesmo app) — pendente desde a correção do bug
      acima (2026-08-26).
- [x] Substituir o **App ID do Android** no `app.json` (validado com
      `npx expo config --type public`):
  ```json
  ["react-native-google-mobile-ads", {
    "androidAppId": "ca-app-pub-7753200620000515~2190419729",
    "iosAppId": "ca-app-pub-3940256099942544~1458002511"  // ← trocar quando publicar iOS
  }]
  ```
- [ ] (Opcional mas recomendado) adicionar o `ios`/`android` do AdMob aos
      `app.json` extras se o projeto exigir (formato `ca-app-pub-...`).

### Preencher o `.env`

- [x] `EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID` preenchido no `.env`
      (2026-08-16) = `ca-app-pub-7753200620000515/2212947942`.
      O `_IOS` fica para a publicação na App Store.
- [x] `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID` preenchido no `.env`
      (2026-08-21) e refletido no EAS (preview + production).
- [ ] `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID` preenchido no `.env`
      e refletido no EAS (preview + production) — depende da unidade
      Interstitial acima existir.

### Verificar

- [x] Em dev (NODE_ENV ≠ production) o SDK usa o `TestIds.REWARDED` oficial —
      não gasta impressão real (por design do código; validado no dev build).
- [x] **Release build (2026-08-16, emulador Android):** bundle embute o ad unit
      real (`ca-app-pub-7753200620000515/2212947942`); app abre sem crash com
      o App ID real; o botão WATCH AD aparece após usar a gratuita e dispara
      um request real ao AdMob (emulador = test device automático). Resultado:
      **`Ad failed to load: 3` (NO_FILL)** — esperado enquanto o app AdMob não
      for aprovado (fluxo "unpublished"/app readiness review). Degradação
      graciosa validada: sem anúncio o fluxo resolve `false`, a UI volta
      intacta e não crasha (tentativas seguem 1/2, botão reabilitado).
- [x] **Banner em dev (2026-08-16, emulador):** `Test Ad` visível no rodapé de
      todas as telas (início, loja, Desafio Diário), reserva de 50dp, sem
      sobreposição (ticket banner-01); some na hora após comprar Remove Ads e
      permanece oculto após restart (tickets 02/03).
- [ ] **Após aprovação do app no AdMob** (vincular à loja + readiness review):
      assistir ao anúncio até o fim libera a tentativa extra. A lógica de
      recompensa/desistência já é coberta por `store/dailyFlow.test.ts`;
      falta só validar com anúncio servindo.

---

## 4. `.env` final (resumo)

Copie de `.env.example`, preencha todos os valores e **nunca commite** (`.env`
já está no `.gitignore`):

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_REVENUECAT_API_KEY=<revenuecat public sdk key>
EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID=<admob rewarded ad unit id (android)>
# EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID=<admob banner ad unit id (android)>  # quando criar a ad unit (seção 3)
# EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID=<admob interstitial ad unit id (android)>  # quando criar a ad unit (seção 3)
# EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS=<...>  # quando publicar iOS
```

- [x] Nenhum valor de `.env` mantém `<...>` placeholder (verificado 2026-08-16,
      banner adicionado 2026-08-21) e todas as variáveis existem (Supabase,
      RevenueCat, AdMob Android rewarded + banner).
- [ ] `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID` preenchido (pendente
      — depende da unidade Interstitial ser criada, seção 3).
- [x] `.env` fora do git (confirmado por `git check-ignore .env`).

---

## 5. Build de desenvolvimento e teste integrado (EAS)

O `eas.json` já existe com os perfis `development`, `preview` e `production`
(`environment` de cada um: `development` / `preview` / `production`).

O projeto EAS foi vinculado em 2026-08-16: `projectId`
`e1c84c4c-b160-4fa8-ae87-4054fd87299c` adicionado ao `app.json`
(`npx eas-cli init --account vitorverrones-team --non-interactive`).

### Como as variáveis chegam ao build

O EAS **não lê o `.env` local nos builds em nuvem** — as `EXPO_PUBLIC_*` são
injetadas de **EAS Environment Variables** (por ambiente). Os providers do app
caem no fallback de dev quando a variável não existe, então:

- **`development`** — não precisa de variáveis: usa os fallbacks de dev
  (Desafio Diário indisponível, loja simulada, anúncio dev).
- **`preview`/`production`** — ✅ variáveis reais setadas (2026-08-16, via
  `npx eas-cli env:set`, visibilidade `plaintext`): Supabase (URL + anon key),
  RevenueCat e AdMob Android — em ambos os ambientes (confirmado com
  `eas env:list`).
  ⚠️ A `EXPO_PUBLIC_REVENUECAT_API_KEY` setada é a **Test Store key** — trocar
  pela chave pública (`goog_...`) antes do build de produção real. A
  `EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS` fica para a publicação na App
  Store. Comandos equivalentes (repetir com `--environment production`):
  ```bash
  eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value <url> --environment preview --visibility plaintext
  eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon key> --environment preview --visibility plaintext
  eas env:set --name EXPO_PUBLIC_REVENUECAT_API_KEY --value <sdk key> --environment preview --visibility plaintext
  eas env:set --name EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID --value <ad unit id android> --environment preview --visibility plaintext
  eas env:set --name EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID --value <banner ad unit id android> --environment preview --visibility plaintext   # ✅ setado 2026-08-21
  eas env:set --name EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID --value <interstitial ad unit id android> --environment preview --visibility plaintext   # pendente — criar a unidade primeiro (seção 3)
  eas env:set --name EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS --value <ad unit id ios> --environment preview --visibility plaintext   # quando publicar iOS
  ```
  (São chaves públicas por design — embutidas no bundle — por isso
  `plaintext`; nada de secret no código do cliente.)

### Rodar os builds

- [ ] `eas build --profile development --platform android|ios` — dev client
      (`expo-dev-client` já instalado; deep-link via scheme `comboforge`).
- [x] `eas build --profile preview --platform android` (2026-08-16) — build
      interno para testadores. O 1º build falhou (`EAS_BUILD_UNKNOWN_GRADLE_ERROR`
      — metadata Kotlin 2.3.0 do play-services-ads vs compilador 2.1.x); fix via
      `plugins/withKotlinVersionPin.js` (commit `8483d25`). Build OK depois; as
      4 variáveis reais confirmadas no bundle do APK baixado (ad unit AdMob,
      Supabase URL, RevenueCat Test Store key).
- [ ] `eas build --profile production --platform android|ios` — build de loja
      (`distribution: store`, `autoIncrement` no número de build).
- [ ] Subir o development build num device físico e rodar o fluxo completo:
      1. Run normal (motor + DDA + Forja + derrota/restart).
      2. Desafio Diário: buscar seed → jogar → submeter → ver ranking (posição
         própria + top 10).
      3. Loja: ver preços reais do RevenueCat, comprar e restaurar (cosméticos
         + Remove Ads).
      4. Anúncio: tentativa extra via anúncio recompensado concluído.
- [x] Sem device físico disponível: o build **preview** (assinatura do EAS) foi
      validado no emulador Android em 2026-08-16 com as variáveis injetadas
      pela nuvem: Desafio Diário com seed real (Supabase do EAS), persistência
      de tentativas e botão WATCH AD disparando request real (NO_FILL até o
      AdMob aprovar o app).
- [x] `npm run typecheck` limpo e `npm test` verde (18 suites, 329 testes) —
      verificado 2026-08-16.

---

## 6. Checklist pré-submissão às lojas

- [ ] **App Store Connect**
  - [ ] Bundle ID do app = `ios.bundleIdentifier` do `app.json`.
  - [ ] IAPs criados e aprovados (seção 2).
  - [ ] App Privacy ("nutrition label"): declarar dados de anúncios/identificadores
        usados pelos SDKs (AdMob/RevenueCat/Supabase).
- [ ] **Google Play Console** ⏳ App em validação — aguardar aprovação para
      configurar.
  - [ ] `android.package` = package do app.
  - [ ] Produtos em app criados (seção 2).
  - [ ] Data safety form: SDKs de anúncios e analytics declarados.
  - [x] App ID do AdMob real no `app.json` (seção 3) — validado em build de
        release sem crash. (Só o Android; iOS fica para a publicação.)
- [ ] **Assets de loja:** ícone, telas (portrait), descrição, privacy policy URL
      (obrigatória para apps com anúncios/IAP).
- [ ] **Testes em release build** (não dev): anúncio real (rewarded + banner +
      intersticial — este último só depois de criar a unidade Interstitial e
      preencher o env, seção 3), IAP real em sandbox (iOS: Sandbox tester;
      Android: licença de teste), restore (incluindo a reentrega do
      `remove_ads`), fluxo do Desafio Diário com o Supabase de produção.

---

## Referências no código

| Serviço | Fallback sem env | Onde |
|---|---|---|
| Supabase | `createUnavailableDailyBackend` (Desafio indisponível) | `services/supabase.ts` |
| RevenueCat | `createDevShopProvider` (compra simulada) | `services/revenuecat.ts` |
| AdMob | `createDevAdProvider` (anúncio sempre ok) | `services/ads.ts` |
| Banner (visibilidade) | oculto sem ad unit ou com remoção comprada (`shouldShowBanner`) | `engine/adProvider.ts`, `components/AdBanner.tsx` |
| Loja (orquestração) | — (fluxo com ports injetados) | `store/shopFlow.ts` |
| Produtos da loja | `COSMETIC_CATALOG` (productIds obrigatórios) | `engine/shop.ts` |
| Remoção de anúncios | `REMOVE_ADS_PRODUCT_ID`/`REMOVE_ADS_ENTITLEMENT_ID` (fora do catálogo) | `engine/shop.ts` |
| Contrato Supabase | — | `supabase/README.md`, `supabase/contract.ts` |
