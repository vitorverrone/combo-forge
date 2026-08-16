# Checklist de Configuração de Produção (pré-release)

Guia passo a passo para levar o Combo Forge de dev (providers simulados) para
produção. Cada seção indica **o que configurar**, **onde** e **como verificar**
que ficou pronto. Sem estas configurações o app funciona, mas com fallbacks de
desenvolvimento — nada disso é opcional para um release real.

## Estado atual (o que está faltando)

| Item | Onde está hoje | Consequência sem configurar |
|---|---|---|
| Supabase: `.env` preenchido com URL/anon key reais (sem placeholders) | `.env` (não versionado) — verificado 2026-08-16 | Desafio Diário funciona se as migrations foram aplicadas (ainda a validar) |
| RevenueCat: chave no `.env` é a **Test Store API key** | `.env` → `EXPO_PUBLIC_REVENUECAT_API_KEY` | Loja funciona com preços simulados; preço real e compra real exigem chave pública `goog_...` + IAPs nas lojas |
| AdMob **Android** configurado (App ID + ad unit reais) mas **sem fill**: request real → `NO_FILL` até o app ser aprovado no AdMob (readiness review + link à loja); **iOS pendente** (Test App ID e sem ad unit) | `.env` / `app.json` → plugin `react-native-google-mobile-ads` | No Android: anúncio só serve após aprovação do app no AdMob. No iOS (quando publicar): trocar App ID + ad unit antes do release |
| Produtos IAP reais não criados nas lojas (só no RevenueCat/Test Store) | App Store Connect / Play Console | Compra real falha (Test Store só simula) |
| Identificadores `com.comboforge.app` no `app.json` | `app.json` ✅ | — (falta só validar igualdade nas plataformas, seção 0) |

---

## 0. Identificadores do app (fazer PRIMEIRO)

AdMob, RevenueCat, EAS e as lojas se amarram ao identificador do app. Sem ele,
nada do restante pode ser criado de verdade.

- [x] Decidir o bundle identifier: **`com.comboforge.app`** (único, nunca muda
      depois de publicado) — aplicado ao iOS e ao Android.
- [x] Adicionar ao `app.json`:
  ```json
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.comboforge.app"
  },
  "android": {
    "package": "com.comboforge.app"
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
- [ ] Aplicar as migrations na ordem, via SQL editor ou CLI:
      `supabase/migrations/0001_daily_challenge.sql` → `0002_daily_challenge_access.sql`.
      ```bash
      supabase db push   # projeto vinculado (supabase link)
      ```
- [ ] Confirmar que as três funções RPC existem e estão expostas ao `anon`:
      `get_daily_seed`, `submit_daily_score`, `get_weekly_leaderboard`
      (a migration 0002 só dá `EXECUTE` nelas; a tabela permanece inacessível
      por RLS).

### Preencher o `.env`

- [x] `SUPABASE_URL` = URL real do projeto (verificado 2026-08-16, sem
      placeholder).
- [x] `SUPABASE_ANON_KEY` = chave `anon` pública preenchida (verificado
      2026-08-16).
- [x] Espelhado no prefixo do cliente Expo (obrigatório para o bundle):
      `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` com os
      mesmos valores (verificado 2026-08-16).

### Verificar

- [ ] `npm test` — trava o contrato (espelho TS vs. SQL) sem precisar de rede.
- [ ] `npm run verify:backend` — sobe Postgres 16 em Docker, aplica migrations e
      valida seed/submissão/leaderboard/caminho `anon` de ponta a ponta.
      (Requer Docker; se não tiver, o `npm test` + curl manual abaixo bastam
      como smoke test.)
- [ ] Smoke test manual do contrato:
      ```bash
      curl -X POST "$SUPABASE_URL/rest/v1/rpc/get_daily_seed" \
        -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
        -d '{}'    # → integer (mesmo valor para todos no mesmo dia UTC)
      ```

---

## 2. RevenueCat (loja cosmética — ticket 14)

A loja só vende cosméticos (4 itens do `COSMETIC_CATALOG`). **Sem a chave, o
app usa o provider dev (compra sempre simulada)** — navegável em dev, inútil
para monetizar de verdade.

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

- [ ] Vincular os produtos de loja (App Store Connect / Play Console) a cada
      produto do RevenueCat (pagina de produto → Store Integration).

### Criar os IAPs nas lojas (pré-requisito do vínculo)

- [ ] **App Store Connect:** criar 4 In-App Purchases consumíveis com os mesmos
      identificadores, preço e textos localizados; aceitar o contrato pago.
- [ ] **Play Console:** criar 4 produtos no Google Play Billing (produtos em
      app) com os mesmos IDs, preço e descrições; preencher a declaração de
      produtos em app.

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
- [ ] Testar `Restore` (restaurar compras) → itens voltam ao estado owned.

#### Validação no emulador (2026-08-15, dev build local)

- Test Store: 4 produtos cadastrados no dashboard + offering atual com os 4
  packages (um por tipo de intervalo — Weekly/Monthly/Three Months/Lifetime —
  porque o RC limita 1 package por tipo por offering; o app ignora o tipo e só
  casa `productId` com o catálogo).
- Bugs corrigidos nessa validação:
  - `store/gameStore.ts`: `purchaseCosmetic`/`equipCosmetic`/`restorePurchases`
    usavam o provider/storage do closure (dev/memória) em vez dos injetados via
    `get()` — a compra era simulada pelo provider dev e nada persistia no
    SQLite.
  - `services/supabase.ts`: URL do Supabase inválida derrubava o bootstrap
    inteiro (loja ficava presa no provider dev silenciosamente) em vez de
    degradar para "Desafio Diário indisponível".
- Nota de build local (não versionado): `android/local.properties` (sdk.dir com
  barras normais). O pin do Kotlin agora vai pelo plugin `expo-build-properties`
  no `app.json` (`kotlinVersion: 2.2.20` — o RN fixa Kotlin 2.1.20, que não lê
  o metadata 2.3.0 da play-services-ads 25.4.0); mudança adicionada em
  2026-08-16, ainda não commitada (working tree). `expo prebuild` regenera o
  `local.properties` — reaplicar se o build quebrar.

---

## 3. AdMob (anúncio recompensado — ticket 16)

O único anúncio é o recompensado opt-in da tentativa extra do Desafio Diário.
**Sem configurar, o provider dev responde (anúncio sempre concluído)**.

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
      `com.comboforge.app`; fluxo "unpublished" — app ainda não publicado).
      O app iOS fica pendente até publicar na App Store.
- [x] Criar a unidade de anúncio **Rewarded** do Android (2026-08-16).
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
# EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS=<...>  # quando publicar iOS
```

- [x] Nenhum valor de `.env` mantém `<...>` placeholder (verificado
      2026-08-16); porém a variável do AdMob ainda **não existe** — seção 3.
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
  eas env:set --name EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS --value <ad unit id ios> --environment preview --visibility plaintext   # quando publicar iOS
  ```
  (São chaves públicas por design — embutidas no bundle — por isso
  `plaintext`; nada de secret no código do cliente.)

### Rodar os builds

- [ ] `eas build --profile development --platform android|ios` — dev client
      (`expo-dev-client` já instalado; deep-link via scheme `comboforge`).
- [ ] `eas build --profile preview --platform android|ios` — build interno para
      testadores (com as chaves reais de `preview`).
- [ ] `eas build --profile production --platform android|ios` — build de loja
      (`distribution: store`, `autoIncrement` no número de build).
- [ ] Subir o development build num device físico e rodar o fluxo completo:
      1. Run normal (motor + DDA + Forja + derrota/restart).
      2. Desafio Diário: buscar seed → jogar → submeter → ver ranking (posição
         própria + top 10).
      3. Loja: ver preços reais do RevenueCat, comprar e restaurar.
      4. Anúncio: tentativa extra via anúncio recompensado concluído.
- [x] `npm run typecheck` limpo e `npm test` verde (16 suites, 303 testes) —
      verificado 2026-08-16.

---

## 6. Checklist pré-submissão às lojas

- [ ] **App Store Connect**
  - [ ] Bundle ID do app = `ios.bundleIdentifier` do `app.json`.
  - [ ] IAPs criados e aprovados (seção 2).
  - [ ] App Privacy ("nutrition label"): declarar dados de anúncios/identificadores
        usados pelos SDKs (AdMob/RevenueCat/Supabase).
- [ ] **Google Play Console**
  - [ ] `android.package` = package do app.
  - [ ] Produtos em app criados (seção 2).
  - [ ] Data safety form: SDKs de anúncios e analytics declarados.
  - [ ] App ID do AdMob real no `app.json` (seção 3) — sem isso o app crasha
        na abertura do build de release.
- [ ] **Assets de loja:** ícone, telas (portrait), descrição, privacy policy URL
      (obrigatória para apps com anúncios/IAP).
- [ ] **Testes em release build** (não dev): anúncio real, IAP real em sandbox
      (iOS: Sandbox tester; Android: licença de teste), restore, fluxo do
      Desafio Diário com o Supabase de produção.

---

## Referências no código

| Serviço | Fallback sem env | Onde |
|---|---|---|
| Supabase | `createUnavailableDailyBackend` (Desafio indisponível) | `services/supabase.ts` |
| RevenueCat | `createDevShopProvider` (compra simulada) | `services/revenuecat.ts` |
| AdMob | `createDevAdProvider` (anúncio sempre ok) | `services/ads.ts` |
| Produtos da loja | `COSMETIC_CATALOG` (productIds obrigatórios) | `engine/shop.ts` |
| Contrato Supabase | — | `supabase/README.md`, `supabase/contract.ts` |
