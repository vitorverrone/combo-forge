# Checklist de Configuração de Produção (pré-release)

Guia passo a passo para levar o Combo Forge de dev (providers simulados) para
produção. Cada seção indica **o que configurar**, **onde** e **como verificar**
que ficou pronto. Sem estas configurações o app funciona, mas com fallbacks de
desenvolvimento — nada disso é opcional para um release real.

## Estado atual (o que está faltando)

| Item | Onde está hoje | Consequência sem configurar |
|---|---|---|
| `.env` com placeholders (`<project-ref>`, `<anon public key>`, chaves vazias) | `.env` (não versionado) | Desafio Diário indisponível; loja e anúncio em modo dev |
| `app.json` sem `ios.bundleIdentifier` / `android.package` | `app.json` | Não existe build assinável; AdMob/RevenueCat não têm app a vincular |
| AdMob com **Test App IDs** do Google | `app.json` → plugin `react-native-google-mobile-ads` | Em release: crash nativo no start ou anúncio real não serve |
| Produtos IAP não criados nas lojas | RevenueCat / App Store / Play Console | Compra real falha (provider dev só simula) |

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

- [ ] Criar projeto em https://supabase.com/dashboard (plano gratuito basta
      para o MVP).
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

- [ ] `SUPABASE_URL` = `https://<project-ref>.supabase.co`
      (Dashboard → Settings → API → Project URL).
- [ ] `SUPABASE_ANON_KEY` = chave `anon` pública (Dashboard → Settings → API →
      Project API keys). É pública por design — embutida no bundle do app.
- [ ] Espelhar no prefixo do cliente Expo (obrigatório para o bundle):
      `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` com os
      mesmos valores.

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

- [ ] Criar o app em https://app.revenuecat.com usando o bundle identifier da
      seção 0 (um app por plataforma: iOS e Android).
- [ ] Criar os 4 produtos com **exatamente** os `productId` do catálogo
      (`engine/shop.ts` — o provider filtra as ofertas por eles):

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

- [ ] `EXPO_PUBLIC_REVENUECAT_API_KEY` = chave pública do app
      (RevenueCat → app → Settings → API Keys → Public SDK key). Pública por
      design, embutida no bundle.

### Verificar

- [ ] Rodar em **development build** (Expo Go roda o SDK em "Preview API Mode"
      com mocks JS — compra real não acontece lá). Ver seção 5.
- [ ] Na loja: preços vêm do RevenueCat (`ShopOffering.price`), não o `devPrice`
      do catálogo.
- [ ] Comprar um item → some do catálogo e aparece em "owned" (persistido em
      SQLite).
- [ ] Testar `Restore` (restaurar compras) → itens voltam ao estado owned.

---

## 3. AdMob (anúncio recompensado — ticket 16)

O único anúncio é o recompensado opt-in da tentativa extra do Desafio Diário.
**Sem configurar, o provider dev responde (anúncio sempre concluído)**.

### ⚠️ Trocar os Test App IDs do `app.json` (crítico para release)

O config plugin hoje usa os **Test App IDs do Google**:
`ca-app-pub-3940256099942544~3347511713` (Android) e
`ca-app-pub-3940256099942544~1458002511` (iOS). Consequências de não trocar:
- App nativo **crasha no start** sem um App ID válido da sua conta;
- Com App ID de teste, o Ad Unit real **não serve anúncios** (só os de teste).

- [ ] Criar o app no https://apps.admob.com com o bundle identifier da seção 0
      (Android e iOS separadamente).
- [ ] Criar uma unidade de anúncio **Rewarded** por plataforma.
- [ ] Pegar o **App ID** de cada plataforma (AdMob → App settings) e substituir
      no `app.json`:
  ```json
  ["react-native-google-mobile-ads", {
    "androidAppId": "ca-app-pub-XXXXXXXX~YYYYYYYYYY",
    "iosAppId": "ca-app-pub-XXXXXXXX~ZZZZZZZZZZ"
  }]
  ```
- [ ] (Opcional mas recomendado) adicionar o `ios`/`android` do AdMob aos
      `app.json` extras se o projeto exigir (formato `ca-app-pub-...`).

### Preencher o `.env`

- [ ] `EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID` = ID da unidade rewarded
      (AdMob → sua app → Ad units → Ad unit ID).

### Verificar

- [ ] Em dev (NODE_ENV ≠ production) o SDK usa o `TestIds.REWARDED` oficial —
      não gasta impressão real. Comportamento esperado.
- [ ] Em build de produção: assistir ao anúncio até o fim libera a 1 tentativa
      extra do Desafio Diário; desistir/falhar não quebra o fluxo (o código
      resolve `false` e a UI volta ao estado anterior).

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
EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID=<admob rewarded ad unit id>
```

- [ ] Nenhum valor de `.env` mantém `<...>` placeholder.
- [ ] `.env` fora do git (`git status` limpo para ele).

---

## 5. Build de desenvolvimento e teste integrado (EAS)

O `eas.json` já existe com os perfis `development`, `preview` e `production`
(`environment` de cada um: `development` / `preview` / `production`).

### Como as variáveis chegam ao build

O EAS **não lê o `.env` local nos builds em nuvem** — as `EXPO_PUBLIC_*` são
injetadas de **EAS Environment Variables** (por ambiente). Os providers do app
caem no fallback de dev quando a variável não existe, então:

- **`development`** — não precisa de variáveis: usa os fallbacks de dev
  (Desafio Diário indisponível, loja simulada, anúncio dev).
- **`preview`/`production`** — criar as variáveis reais por ambiente:
  ```bash
  eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value <url> --environment preview --visibility plaintext
  eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon key> --environment preview --visibility plaintext
  eas env:set --name EXPO_PUBLIC_REVENUECAT_API_KEY --value <sdk key> --environment preview --visibility plaintext
  eas env:set --name EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID --value <ad unit id> --environment preview --visibility plaintext
  # repetir com --environment production para o perfil de store
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
- [ ] Confirmar `npm run typecheck` e `npm test` verdes (303 testes) antes de
      qualquer build de release.

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
