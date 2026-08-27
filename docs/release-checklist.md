# Checklist de Configuração de Produção (pré-release)

Guia passo a passo para levar o Combo Forge de dev (providers simulados) para
produção. Cada seção indica **o que configurar**, **onde** e **como verificar**
que ficou pronto. Sem estas configurações o app funciona, mas com fallbacks de
desenvolvimento — nada disso é opcional para um release real.

> Reescrito em 2026-08-27 a partir de uma inspeção direta dos painéis do
> AdMob, RevenueCat e Play Console (a versão anterior estava desatualizada em
> vários pontos — o app já existe no Play Console, por exemplo). Também
> reflete a decisão de produto de **não vender mais o cosmético VFX "Golden
> Combo"** — a loja agora tem 3 skins pagas (Obsidian, Emerald, Royal) + a
> Classic grátis, fora a remoção de anúncios.

## Ordem recomendada (contorna as dependências reais)

A ordem abaixo evita trabalho retrabalhado e põe o item mais lento (o teste
fechado de 14 dias) rodando o quanto antes:

1. **AdMob → Pagamentos:** completar o perfil de pagamento. **Bloqueia a
   revisão do app inteiro** — enquanto pendente, nenhum anúncio real sai do
   `NO_FILL`, não importa o resto (seção 3).
2. **Play Console → convidar testadores:** chegar a 12 testadores optados no
   teste fechado. É o item mais demorado (14 dias corridos **depois** de
   bater 12) — comece agora para não ser o gargalo do calendário (seção 6).
3. **Play Console → Monetizar com o Google Play:** criar os 4 produtos
   gerenciados (3 skins + Remove Ads) com os productIds exatos do catálogo
   (seção 2).
4. **RevenueCat → app "Combo Forge (Play Store)":** criar os mesmos 4
   produtos, anexar o produto Remove Ads à entitlement `remove_ads`, e
   anexar cada produto Android ao package correspondente na offering
   `default` (hoje só têm produto do Test Store) (seção 2).
5. **EAS → corrigir a chave do RevenueCat no ambiente `production`** — ainda
   é a chave de Test Store; `preview` e o `.env` local já têm a chave
   `goog_...` real, mas os produtos por trás dela não existem ainda (ver
   ⚠️ na seção 2 — a Loja do build preview atual deve estar quebrada para
   quem já está testando).
6. **AdMob:** criar a ad unit **Interstitial** do Android; preencher
   `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID` no `.env` e no EAS
   (seção 3).
7. **AdMob → Configurações do app → Detalhes da app store:** vincular a
   ficha da Play Store (já existe, mesmo em teste fechado) — pré-requisito
   da revisão de prontidão que libera o inventário de anúncios (seção 3).
8. **`eas build --profile production --platform android`** com tudo acima no
   lugar; instalar num device físico e validar de ponta a ponta: compra real
   de cada skin + Remove Ads, restore, anúncio recompensado, intersticial,
   banner (seção 5).
9. **Play Console:** preencher o Data Safety form e os assets de loja
   (ícone, screenshots, descrição, política de privacidade) (seção 6/7).
10. Quando o teste fechado completar **12 testadores × 14 dias**: clicar em
    "Solicitar a produção" (hoje desabilitado no painel) (seção 6).
11. Publicar em produção.

---

## Estado atual (consolidado em 2026-08-27)

| Item | Onde está hoje | Próximo passo |
|---|---|---|
| Supabase | ✅ Projeto criado, migrations aplicadas, `.env` real e Desafio Diário validado de ponta a ponta | `submit_daily_score`/`get_weekly_leaderboard` pendem de um fim de Run (opcional: `verify:backend`) |
| RevenueCat — catálogo | ✅ 3 skins pagas + Classic grátis + Remove Ads (VFX "Golden Combo" **removido do escopo**, código e docs já atualizados); preços confirmados (Royal Deck = $0.99) | — |
| RevenueCat — Test Store | ✅ 4 produtos + offering `default` com 4 packages, tudo validado em dev build | — |
| RevenueCat — app Android real | ❌ App "Combo Forge (Play Store)" existe no dashboard mas **sem nenhum produto** | Criar os 4 IAPs no Play Console primeiro, depois espelhar aqui e anexar aos packages |
| RevenueCat — chave da API | ⚠️ **Inconsistente**: `.env` local e EAS `preview` já têm a chave `goog_...` real; EAS `production` ainda tem a chave `test_...` antiga | Igualar em `production`; mas os produtos reais precisam existir antes de fazer diferença |
| AdMob — app Android | ⚠️ Criado (`ca-app-pub-7753200620000515~2190419729`), status **"Requer revisão"**, app oculto | Bloqueado pela pendência de pagamento abaixo |
| AdMob — perfil de pagamento | 🔴 **Incompleto** — banner do painel: "os apps em análise vão permanecer sem revisão" | **Corrigir agora** (Pagamentos → preencher perfil) |
| AdMob — ad units | ✅ Rewarded + Banner criadas e reais; ❌ **Interstitial ainda não existe** | Criar a unidade Interstitial |
| AdMob — vínculo com a loja | ❌ "Detalhes da app store" vazio nas Configurações do app | Vincular à ficha da Play Store (já existe) |
| Google Play Console | ✅ **App já criado** (`com.combocardforge.app`), teste fechado publicado, 1 testador ativo | Recrutar até 12 testadores + aguardar 14 dias corridos |
| Google Play Console — IAPs | ❌ Produtos em app ainda não criados | Criar os 4 (3 skins + Remove Ads) em "Monetizar com o Google Play" |
| App Store (iOS) | ⏳ Fora de escopo por enquanto (Test App ID no AdMob, sem app no ASC) | Retomar quando decidir publicar iOS |
| EAS | ✅ Projeto vinculado, builds `preview` validados no emulador | `production` build só depois dos itens acima |
| Identificadores `com.combocardforge.app` | ✅ Iguais em `app.json`, AdMob e Play Console | — |

---

## 0. Identificadores do app

- [x] Bundle identifier `com.combocardforge.app` no `app.json` (iOS + Android).
- [x] Confirmado igual no AdMob (Configurações do app) e no Google Play
      Console (painel do app "Combo Forge").
- [ ] App Store Connect: pendente (iOS fora de escopo por enquanto).

---

## 1. Supabase (Desafio Diário — ticket 12/13)

Sem mudanças desde a última revisão — seção estável.

- [x] Projeto criado, migrations `0001_daily_challenge.sql` e
      `0002_daily_challenge_access.sql` aplicadas.
- [x] `.env` preenchido (`SUPABASE_URL`/`SUPABASE_ANON_KEY` e os espelhos
      `EXPO_PUBLIC_*`), sem placeholder.
- [x] `get_daily_seed` exposta e validada de ponta a ponta no app (release
      local e preview do EAS).
- [ ] `submit_daily_score`/`get_weekly_leaderboard` — não exercitadas por um
      fim de Run real ainda. Opcional: `npm run verify:backend` (Docker) para
      validar sem depender de terminar uma Run.
- [x] `npm test` verde sem depender de rede (contrato TS ↔ SQL travado).

---

## 2. RevenueCat (loja — cosméticos + remoção de anúncios)

### O catálogo mudou: 3 skins, não 4

O item `combo_forge_vfx_golden_combo` (VFX "Golden Combo") **saiu do
catálogo** — decisão de produto, não estava mais alinhado com a proposta da
loja. Já removido de `engine/shop.ts`, da UI (`ShopScreen`/`GameScreen`), dos
testes e da documentação viva (CONTEXT/PRD/SRS/ESPECIFICACAO_FUNCIONAL). O
RevenueCat já reflete isso — o offering `default` (Test Store) tem só os 4
packages abaixo, nunca teve um 5º para o VFX:

| productId | Nome exibido | Preço de referência |
|---|---|---|
| `combo_forge_skin_obsidian` | Obsidian Deck | $0.99 |
| `combo_forge_skin_emerald` | Emerald Deck | $0.99 |
| `combo_forge_skin_royal` | Royal Deck | $0.99 |
| `combo_forge_remove_ads` | Remove Ads (não-consumível) | $2.99 |

Preços confirmados (Royal Deck = $0.99, igual às outras duas skins — o PRD
antes documentava $1.99 por engano, já corrigido).

### O app Android real no RevenueCat está vazio

O dashboard tem dois "apps" dentro do projeto Combo Forge: **Test Store**
(usado em dev, 4 produtos, tudo funcionando) e **Combo Forge (Play Store)**
— este último **sem nenhum produto cadastrado ainda** (tela "Add products,
create a new product or import existing ones to get started"). E na
offering `default`, cada um dos 4 packages tem produto do Test Store
anexado, mas a coluna do app Android mostra "+ New Product" — ou seja,
**nenhum package tem produto real do Play Store anexado**.

- [ ] **Play Console primeiro:** criar os 4 IAPs gerenciados (seção 6) — o
      RevenueCat não deixa (ou não faz sentido) criar o produto do lado do
      Android antes de o produto existir na loja.
- [ ] **RevenueCat depois:** para cada um dos 4 productIds, ir em Products →
      app "Combo Forge (Play Store)" → New Product (ou Import) e criar/
      importar o produto espelhando o Play Console.
- [ ] Anexar o entitlement `remove_ads` (Product catalog → Entitlements →
      `remove_ads` → Associated products → Attach) ao produto Remove Ads
      real do Android — hoje só está anexado ao do Test Store.
- [ ] Editar a offering `default` (Product catalog → Offerings → `default` →
      Edit) e, em cada um dos 4 packages, anexar o produto Android
      correspondente na coluna "Combo Forge (Play St...)".

### Chave da API — inconsistência entre ambientes

- ⚠️ **`.env` local** e **EAS `preview`** já têm a chave pública real
  (`goog_...`) — alguém trocou a Test Store key antes desta revisão.
- ⚠️ **EAS `production`** ainda tem a chave de Test Store (`test_...`) —
  desatualizada em relação ao `preview`.
- ⚠️ **Risco atual:** como o app Android no RevenueCat não tem nenhum
  produto/package anexado (seção acima), o build **preview** já em teste
  fechado (com testadores reais) provavelmente está com a Loja
  funcionalmente quebrada: `loadOfferings()` deve devolver preços vazios ou
  cair no `devPrice`, e tentar comprar deve falhar com o erro "Produto fora
  das ofertas" (`services/revenuecat.ts`) — não trava o app, mas ninguém
  consegue comprar nada no build que os testadores têm em mãos agora.
- [ ] Depois de completar os produtos Android (passos acima), igualar a
      chave em `production`:
      ```bash
      eas env:set --name EXPO_PUBLIC_REVENUECAT_API_KEY --value <goog_... key> --environment production --visibility plaintext
      ```

### Verificar

- [x] Provider dev e Test Store validados de ponta a ponta (compra, equip,
      restore, remoção de anúncios) — ver histórico abaixo.
- [ ] Testar compra e restore **reais** (produto Android + licença de teste
      do Play Console) — depende de tudo acima.

#### Histórico de validação (Test Store, dev build, 2026-08-15/16)

- Bugs corrigidos: `purchaseCosmetic`/`equipCosmetic`/`restorePurchases`
  usavam o provider/storage do closure em vez dos injetados via `get()`
  (hoje vivem em `store/shopFlow.ts`, fix permanece); `services/supabase.ts`
  com URL inválida derrubava o bootstrap inteiro em vez de degradar.
- Pin do Kotlin (`plugins/withKotlinVersionPin.js`) necessário para o build
  de nuvem do EAS — RN fixa 2.1.20, `play-services-ads` 25.4.0 exige 2.3.0+.

---

## 3. AdMob (recompensado, intersticial, banner)

### 🔴 Bloqueador: perfil de pagamento incompleto

O painel do AdMob mostra, no topo: **"Configuração de pagamento
incompleta — Termine de configurar sua conta da AdMob preenchendo o perfil
para pagamentos. Os apps em análise vão permanecer sem revisão até que você
adicione as informações solicitadas."** Isso bloqueia a revisão do app
inteiro (status hoje: "Requer revisão", ícone de app oculto) — sem revisão
aprovada, o inventário real nunca sai do `NO_FILL`, não importa o que mais
esteja configurado.

- [ ] **Ir em Pagamentos → clicar em "Corrigir"** e preencher o que for
      pedido (entidade legal, endereço, forma de pagamento, informações
      fiscais).

### Ad units: falta o Interstitial

O app tem hoje só 2 ad units criadas:

| Nome no painel | Formato | Ad unit ID |
|---|---|---|
| Desafio Diário — tentativa extra | Premiado (Rewarded) | `ca-app-pub-7753200620000515/2212947942` |
| Remove ads | Banner | `ca-app-pub-7753200620000515/1366979567` |

- [ ] Criar a ad unit **Interstitial** (Blocos de anúncios → Adicionar bloco
      de anúncios → Intersticial) — `services/ads.ts` já lê
      `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID` desde a correção
      de 2026-08-26; falta só a ad unit existir.
- [ ] Preencher a variável no `.env` (hoje ausente) e no EAS (`preview` +
      `production`, hoje ausente nos dois):
      ```bash
      eas env:set --name EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID --value <novo ad unit id> --environment preview --visibility plaintext
      eas env:set --name EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID --value <novo ad unit id> --environment production --visibility plaintext
      ```

### Configurações do app

- [x] App ID real (`ca-app-pub-7753200620000515~2190419729`) igual no
      `app.json` e no painel — build de release não crasha.
- [x] Verificação de apps: "Não obrigatório" — nada a fazer.
- [ ] **Detalhes da app store: vazio** ("—" / "—", botão "Adicionar"). Agora
      que o app existe no Play Console (mesmo em teste fechado), vincular a
      ficha — pré-requisito da revisão de prontidão que libera o inventário
      pago.
- [ ] Serviços vinculados: nada vinculado ainda — revisar depois de linkar a
      app store acima.

### Verificar

- [x] Dev: `TestIds` oficiais carregam sempre (rewarded, banner).
- [x] Release build (emulador, 2026-08-16): App ID real sem crash; rewarded
      real devolve `NO_FILL` (esperado, app não aprovado ainda).
- [x] Banner em dev: visível em todas as telas, reserva de espaço, some após
      Remove Ads.
- [ ] Intersticial real — depende da ad unit acima existir.
- [ ] Qualquer anúncio real servindo de fato — depende do perfil de
      pagamento + revisão do app + vínculo com a loja, todos acima.

---

## 4. `.env` final (resumo)

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_REVENUECAT_API_KEY=<revenuecat public sdk key — goog_...>
EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID=<admob rewarded ad unit id (android)>
EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID=<admob banner ad unit id (android)>
EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID=<admob interstitial ad unit id (android)>  # pendente — criar a ad unit (seção 3)
# EXPO_PUBLIC_ADMOB_*_AD_UNIT_ID_IOS=<...>  # quando publicar iOS
```

- [x] `.env` local sem placeholder para Supabase, RevenueCat (já com a chave
      real `goog_...`) e AdMob Android rewarded/banner.
- [ ] Interstitial ausente — depende da seção 3.
- [x] `.env` fora do git (`git check-ignore .env`).

---

## 5. Build e EAS

O EAS **não lê o `.env` local em builds de nuvem** — as `EXPO_PUBLIC_*` vêm
de EAS Environment Variables por ambiente (`eas env:list --environment
<env>`).

### Estado por ambiente (verificado 2026-08-27)

| Variável | `preview` | `production` |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` | ✅ real | ✅ real |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | ✅ `goog_...` (real, mas sem produtos por trás — ver seção 2) | ⚠️ `test_...` (desatualizada) |
| `EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID` | ✅ | ✅ |
| `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID` | ✅ | ✅ |
| `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID` | ❌ ausente | ❌ ausente |

- [ ] Igualar `EXPO_PUBLIC_REVENUECAT_API_KEY` em `production` (comando na
      seção 2) — só depois de os produtos Android existirem, senão troca uma
      chave quebrada por outra.
- [ ] Adicionar a variável do Interstitial nos dois ambientes (seção 3).

### Builds

- [x] `eas build --profile preview --platform android` — validado no
      emulador (2026-08-16); atualmente em teste fechado no Play Console com
      testadores reais.
- [ ] `eas build --profile production --platform android` — só depois dos
      itens pendentes das seções 2 e 3 (senão o build de loja sai com a
      mesma Loja/anúncios quebrados que o preview tem hoje).
- [ ] Instalar o build de produção num device físico e validar de ponta a
      ponta: Run normal, Desafio Diário completo, compra + restore reais de
      cada skin e do Remove Ads, anúncio recompensado, intersticial, banner.
- [x] `npm run typecheck` limpo e `npm test` verde (19 suites, 354 testes —
      verificado 2026-08-27, após a remoção do VFX "Golden Combo").

---

## 6. Google Play Console

O app **já existe** — isto mudou desde a última revisão deste checklist (a
versão anterior assumia "app em validação, não criado ainda").

### Teste fechado (bloqueador de calendário)

- [x] Versão de teste fechado publicada.
- [ ] **12 testadores optados** — hoje só **1** está participando. Recrutar
      o quanto antes: é pré-requisito para o próximo item, e só começa a
      contar depois de bater 12.
- [ ] **14 dias corridos** de teste fechado com no mínimo 12 testadores —
      não iniciado (depende do item acima).
- [ ] Depois de completar os dois itens: "Solicitar a produção" (hoje
      desabilitado no painel).

### Produtos em app (IAPs)

- [ ] Ir em "Monetizar com o Google Play" → Produtos em app e criar os 4
      produtos gerenciados com os mesmos productIds do RevenueCat/catálogo:
      `combo_forge_skin_obsidian`, `combo_forge_skin_emerald`,
      `combo_forge_skin_royal` (preço a confirmar, seção 2),
      `combo_forge_remove_ads`.
- [ ] Preencher título/descrição localizados de cada um.

### Outras pendências

- [ ] **Data safety form**: declarar os SDKs de anúncios (AdMob) e
      analytics/attribution (RevenueCat, Supabase) e os dados que coletam.
- [ ] **Política de privacidade** (URL) — obrigatória para apps com
      anúncios/IAP.
- [ ] **Assets de loja**: ícone, screenshots (portrait), descrição curta e
      longa.

---

## 7. Checklist final pré-produção

- [ ] AdMob: perfil de pagamento completo, app aprovado (fora de "Requer
      revisão"), ad unit Interstitial criada, vinculado à ficha da Play
      Store.
- [ ] RevenueCat: 4 produtos reais criados no app Android, anexados à
      offering `default` e à entitlement `remove_ads`; chave `production`
      igual à `preview`.
- [ ] Play Console: 4 produtos em app criados; Data safety preenchido;
      assets de loja completos; teste fechado com 12 testadores por 14 dias
      concluído.
- [ ] Build de produção instalado em device físico com todo o fluxo
      validado (compra real, restore, os 3 formatos de anúncio).
- [ ] App Store (iOS): fora de escopo por enquanto — retomar quando decidir
      publicar iOS (AdMob ainda usa Test App ID, seguro).

---

## Referências no código

| Serviço | Fallback sem env | Onde |
|---|---|---|
| Supabase | `createUnavailableDailyBackend` (Desafio indisponível) | `services/supabase.ts` |
| RevenueCat | `createDevShopProvider` (compra simulada) | `services/revenuecat.ts` |
| AdMob | `createDevAdProvider` (anúncio sempre ok) | `services/ads.ts` |
| Banner (visibilidade) | oculto sem ad unit ou com remoção comprada (`shouldShowBanner`) | `engine/adProvider.ts`, `components/AdBanner.tsx` |
| Loja (orquestração) | — (fluxo com ports injetados) | `store/shopFlow.ts` |
| Produtos da loja | `COSMETIC_CATALOG` (3 skins pagas + Classic grátis) | `engine/shop.ts` |
| Remoção de anúncios | `REMOVE_ADS_PRODUCT_ID`/`REMOVE_ADS_ENTITLEMENT_ID` (fora do catálogo) | `engine/shop.ts` |
| Contrato Supabase | — | `supabase/README.md`, `supabase/contract.ts` |
