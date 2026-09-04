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

1. ~~**AdMob → Pagamentos:** completar o perfil de pagamento.~~ ✅ Feito em
   2026-08-28 (aba "Verificação" checada — não bloqueia agora, só quando os
   ganhos atingirem um limite). O app segue em "Requer revisão" mesmo assim
   — provavelmente também depende do vínculo com a loja, que só é possível
   pós-produção (item 12, seção 3).
2. **Play Console → convidar testadores:** chegar a 12 testadores optados no
   teste fechado. É o item mais demorado (14 dias corridos **depois** de
   bater 12) — comece agora para não ser o gargalo do calendário (seção 6).
3. ~~**Play Console → Monetizar com o Google Play:** criar os 4 produtos
   gerenciados.~~ ✅ Feito em 2026-08-28 — os 4 produtos únicos (Remove Ads,
   Royal/Emerald/Obsidian Deck) estão criados e ativos, productIds batendo
   com o catálogo (seção 2).
4. ~~**RevenueCat → app "Combo Forge (Play Store)":** criar os mesmos 4
   produtos.~~ ✅ Feito em 2026-08-28 — os 4 produtos existem como
   Non-consumable, a entitlement `remove_ads` está anexada ao Remove Ads
   real, e os 4 packages da offering `default` já têm o lado Android
   preenchido (seção 2).
5. ~~**RevenueCat → credencial de service account do Google Play.**~~ ✅
   Feito em 2026-08-28 — os 4 produtos já mostram "Published". Só falta um
   check de assinatura (irrelevante pro Combo Forge, sem produtos de
   assinatura) terminar de propagar do lado do Google, sem ação necessária
   (seção 2).
6. ~~**EAS → corrigir a chave do RevenueCat no ambiente `production`.**~~ ✅
   Feito em 2026-08-28 — `production` agora tem a mesma chave `goog_...` de
   `preview` e do `.env` local (seção 2).
7. ~~**AdMob:** criar a ad unit **Interstitial** do Android.~~ ✅ Feito em
   2026-08-28 (`ca-app-pub-7753200620000515/8281372704`), `.env` e os dois
   ambientes do EAS já atualizados (seção 3).
8. **`eas build --profile production --platform android`** com tudo acima no
   lugar; instalar num device físico e validar de ponta a ponta: compra real
   de cada skin + Remove Ads, restore, anúncio recompensado, intersticial,
   banner (o rewarded/intersticial/banner reais provavelmente continuam
   `NO_FILL` até o item 11 — ver nota abaixo) (seção 5).
9. **Play Console:** preencher o Data Safety form e os assets de loja
   (ícone, screenshots, descrição, política de privacidade) (seção 6/7).
10. Quando o teste fechado completar **12 testadores × 14 dias**: clicar em
    "Solicitar a produção" (hoje desabilitado no painel) (seção 6).
11. **Publicar em produção na Play Store.**
12. **Só agora** — AdMob → Configurações do app → Detalhes da app store:
    vincular a ficha da Play Store. **Reordenado em 2026-08-28:** tentamos
    antes e o app não aparecia na busca do AdMob nem por nome nem por
    pacote — confirmado que apps em teste fechado (ou aberto) **não são
    pesquisáveis/vinculáveis no AdMob**, só depois de publicados em
    produção. É só depois desse vínculo que a revisão de prontidão do
    AdMob libera o inventário real de anúncios (seção 3).

---

## Estado atual (consolidado em 2026-08-28)

| Item | Onde está hoje | Próximo passo |
|---|---|---|
| Supabase | ✅ Projeto criado, migrations aplicadas, `.env` real e Desafio Diário validado de ponta a ponta | `submit_daily_score`/`get_weekly_leaderboard` pendem de um fim de Run (opcional: `verify:backend`) |
| RevenueCat — catálogo | ✅ 3 skins pagas + Classic grátis + Remove Ads (VFX "Golden Combo" **removido do escopo**, código e docs já atualizados); preços confirmados (Royal Deck = $0.99) | — |
| RevenueCat — Test Store | ✅ 4 produtos + offering `default` com 4 packages, tudo validado em dev build | — |
| RevenueCat — app Android real | ✅ **4 produtos criados** (Non-consumable) em 2026-08-28, "Published", entitlement `remove_ads` anexada ao Remove Ads real, os 4 packages da offering `default` já têm o lado Android preenchido | — |
| RevenueCat — credencial do Google Play | ✅ **Configurada em 2026-08-28**, produtos "Published" | Check de assinatura ainda propagando (irrelevante — sem produtos de assinatura) |
| RevenueCat — chave da API | ✅ **Igualada em 2026-08-28**: `.env` local, EAS `preview` e EAS `production` com a mesma chave `goog_...` real | — |
| AdMob — app Android | ⚠️ Criado (`ca-app-pub-7753200620000515~2190419729`), status ainda **"Requer revisão"** em 2026-08-28, app oculto | Provavelmente só sai disso depois do vínculo com a loja (que só é possível pós-produção — ver linha abaixo) |
| AdMob — perfil de pagamento | ✅ Corrigido em 2026-08-28 (aba "Informações dos pagamentos" preenchida) | — |
| AdMob — ad units | ✅ Rewarded + Banner + **Interstitial** (criada 2026-08-28, `.../8281372704`) — as 3 reais | — |
| AdMob — vínculo com a loja | ⏳ **Bloqueado, não pendente** — tentamos vincular em 2026-08-28 e o app não aparece na busca do AdMob (nem por nome, nem por pacote); confirmado que apps em teste fechado não são pesquisáveis lá | Só é possível depois de publicar em produção na Play Store (item 12 do roteiro) |
| Google Play Console | ✅ **App já criado** (`com.combocardforge.app`), teste fechado publicado, 1 testador ativo | Recrutar até 12 testadores + aguardar 14 dias corridos |
| Google Play Console — IAPs | ✅ **4 produtos únicos criados e ativos** (2026-08-28): Remove Ads, Royal Deck, Emerald Deck, Obsidian Deck | — |
| App Store (iOS) | ⏳ Fora de escopo por enquanto (Test App ID no AdMob, sem app no ASC) | Retomar quando decidir publicar iOS |
| Firebase Analytics (telemetria — ADR 0007 / ticket 01) | ✅ Projeto criado (`combo-forge-1ac97`), app Android (`com.combocardforge.app`) adicionado, `google-services.json` na raiz (fora do git — ver `.gitignore`) e plugin `@react-native-firebase/app` + `googleServicesFile` ligados em `app.json` | Rebuild (`eas build`) + validar no DebugView do Firebase Analytics em device físico; declarar no Data Safety form do Play Console |
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

### ✅ App Android real no RevenueCat — populado em 2026-08-28

O dashboard tem dois "apps" dentro do projeto Combo Forge: **Test Store**
(usado em dev, 4 produtos, tudo funcionando) e **Combo Forge (Play Store)**.
Este último agora tem os mesmos 4 produtos, criados como **Non-consumable**
(nenhum é assinatura nem é consumido/recomprado — compra única, restaurável,
igual às 3 skins e ao Remove Ads):

- [x] Os 4 productIds criados em Products → app "Combo Forge (Play Store)"
      → New Product, um a um, batendo exatamente com o Play Console.
- [x] Entitlement `remove_ads` (Product catalog → Entitlements →
      `remove_ads` → Associated products) anexada ao produto Remove Ads
      real do Android — a tela já mostra os dois (Test Store + Play Store)
      na lista de "Associated products".
- [x] Offering `default` (Product catalog → Offerings → `default` → Edit):
      os 4 packages já têm o produto Android correspondente anexado ao lado
      do produto do Test Store.

### ✅ Credencial de service account do Google Play — configurada em 2026-08-28

Resolvido o erro "Google Play service account credentials must be set
before using this feature" que bloqueava o "Import" e deixava os 4 produtos
Android com status "Could not check":

- [x] Service account `revenuecat-combo-forge@pessoal-463414.iam.gserviceaccount.com`
      criada no Google Cloud (projeto `pessoal-463414`), com a "Google Play
      Android Developer API" habilitada e uma chave JSON gerada.
- [x] Permissão concedida no Play Console — **não fica mais em
      "Configurações → Acesso à API"** nas contas mais novas: o caminho
      atual é **Usuários e permissões → Gerenciar usuários → Convidar
      novos usuários**, adicionando o e-mail da service account como se
      fosse um usuário. Concedido acesso de Administrador (cobre "Ver
      dados financeiros, pedidos e histórico de cancelamento" +
      "Gerenciar pedidos e assinaturas", as duas exigidas pela RevenueCat).
- [x] JSON subido em RevenueCat → Apps → "Combo Forge (Play Store)" →
      Service account credentials.
- [x] Os 4 produtos saíram de "Could not check" e foram para **"Published"**
      — confirma que a credencial já valida o catálogo/produtos.
- [ ] **Pendência cosmética, não bloqueante:** o check "Can validate Google
      Play subscription purchases" no modal de validação da RevenueCat
      ainda aparece vermelho. Isso é conhecido — a comunidade da RevenueCat
      reporta que é atraso de propagação de permissão do lado do Google,
      podendo levar até 24–36h mesmo com tudo certo (já estamos com
      Administrador, mais que suficiente). Como o Combo Forge não tem
      nenhum produto de assinatura (todos Non-consumable), esse check
      específico nem é exercitado pelo fluxo real de compra do app. Truque
      pra tentar acelerar: editar a descrição de um produto no Play
      Console, salvar, reverter e salvar de novo. Sem ação necessária além
      de checar de novo depois de um tempo.

### ✅ Chave da API — igualada em todos os ambientes (2026-08-28)

- [x] `.env` local, EAS `preview` e EAS `production` têm a mesma chave
      pública real (`goog_...`) — `production` estava com a chave de Test
      Store (`test_...`) antiga, corrigida via:
      ```bash
      eas env:set --name EXPO_PUBLIC_REVENUECAT_API_KEY --value <goog_... key> --environment production --visibility plaintext --non-interactive
      ```
      (confirmado com `eas env:list --environment production`).
- ✅ Como os produtos e packages do app Android já existem (seção acima),
  `loadOfferings()` deve devolver preços reais em `preview` e `production` —
  a compra em si ainda depende só do fluxo normal de Google Play Billing
  (credencial de service account já resolvida acima, cobre a validação
  server-to-server).

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

### ✅ Perfil de pagamento — corrigido em 2026-08-28

O painel mostrava, no topo: **"Configuração de pagamento incompleta —
Termine de configurar sua conta da AdMob preenchendo o perfil para
pagamentos. Os apps em análise vão permanecer sem revisão até que você
adicione as informações solicitadas."** Isso bloqueava a revisão do app
inteiro. A aba "Informações dos pagamentos" (Pagamentos → conta AdSense
Brasil, `pub-7753200620000515`) já está preenchida.

- [x] Perfil de pagamento preenchido (conta AdSense Brasil vinculada).
- [x] Aba **"Verificação"** checada (2026-08-28): pede identidade/endereço
      só quando os ganhos atingirem um certo limite — não bloqueia agora.
- [x] Banner de aviso de pagamento sumiu da Visão geral do app.
- [ ] Status em Configurações do aplicativo ainda em "Requer revisão" —
      **não é mais esperado que suma só com o pagamento corrigido**: ver a
      seção "Ad units"/"Detalhes da app store" abaixo, provavelmente
      depende do vínculo com a loja, que só é possível pós-produção.

### ✅ Ad units — as 3 criadas (2026-08-28)

| Nome no painel | Formato | Ad unit ID |
|---|---|---|
| Desafio Diário — tentativa extra | Premiado (Rewarded) | `ca-app-pub-7753200620000515/2212947942` |
| Remove ads | Banner | `ca-app-pub-7753200620000515/1366979567` |
| (novo) | Intersticial | `ca-app-pub-7753200620000515/8281372704` |

- [x] Ad unit **Interstitial** criada (Blocos de anúncios → Adicionar bloco
      de anúncios → Intersticial) — `services/ads.ts` já lê
      `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID` desde a correção
      de 2026-08-26.
- [x] Variável preenchida no `.env` local e no EAS (`preview` + `production`):
      ```bash
      eas env:set --name EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID --value ca-app-pub-7753200620000515/8281372704 --environment preview --visibility plaintext --non-interactive
      eas env:set --name EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID --value ca-app-pub-7753200620000515/8281372704 --environment production --visibility plaintext --non-interactive
      ```
- [ ] O AdMob avisa que blocos novos podem levar até 1h para começar a
      servir anúncios — não testar o intersticial real antes disso.

### Configurações do app

- [x] App ID real (`ca-app-pub-7753200620000515~2190419729`) igual no
      `app.json` e no painel — build de release não crasha.
- [x] Verificação de apps: "Não obrigatório" — nada a fazer.
- [ ] **Detalhes da app store: vazio** ("—" / "—", botão "Adicionar").
      **Tentado em 2026-08-28 e não funcionou** — a busca do AdMob não
      encontrou o app nem por nome ("Combo Forge") nem por pacote
      (`com.combocardforge.app`). Confirmado (relatos da comunidade do
      AdMob/Play Console): **apps em teste fechado (ou aberto) não aparecem
      na busca de vínculo do AdMob** — esse recurso só encontra apps já
      publicados em produção na Play Store. Não é um passo pendente agora,
      é um passo **bloqueado até depois da publicação** (item 12 do
      roteiro, seção "Ordem recomendada").
- [ ] Serviços vinculados: nada vinculado ainda — revisar depois de linkar a
      app store acima (ou seja, pós-produção).
- [ ] **Consequência:** o status "Requer revisão" do app no AdMob
      provavelmente só sai depois desse vínculo — ou seja, a revisão de
      prontidão pode depender do app já estar público, não só do perfil de
      pagamento corrigido. Anúncios reais (rewarded/intersticial/banner)
      devem continuar em `NO_FILL` até esse ponto, mesmo com tudo o mais
      configurado.

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
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_REVENUECAT_API_KEY=<revenuecat public sdk key — goog_...>
EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID=<admob rewarded ad unit id (android)>
EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID=<admob banner ad unit id (android)>
EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID=<admob interstitial ad unit id (android)>
# EXPO_PUBLIC_ADMOB_*_AD_UNIT_ID_IOS=<...>  # quando publicar iOS
```

- [x] `.env` local tem Supabase e RevenueCat (chave real `goog_...`) sem
      placeholder; `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID`
      adicionado em 2026-08-28.
- ⚠️ **Achado ao revisar o `.env` local em 2026-08-28:** ele não tem
      `EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID` nem
      `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID` — ao contrário do que
      revisões anteriores deste checklist afirmavam. Não bloqueia nada (em
      dev o app cai no `TestIds` do Google de qualquer forma quando a
      variável da plataforma/formato atual não existe — `services/ads.ts`),
      mas deixa o `.env` local inconsistente com o EAS. Baixa prioridade;
      resolver quando for mexer no `.env` de novo.
- [x] `.env` fora do git (`git check-ignore .env`).

---

## 5. Build e EAS

O EAS **não lê o `.env` local em builds de nuvem** — as `EXPO_PUBLIC_*` vêm
de EAS Environment Variables por ambiente (`eas env:list --environment
<env>`).

### Estado por ambiente (verificado 2026-08-28)

| Variável | `preview` | `production` |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` | ✅ real | ✅ real |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | ✅ `goog_...` real, produtos Android já existem | ✅ `goog_...` real (igualada em 2026-08-28) |
| `EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID` | ✅ | ✅ |
| `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID` | ✅ | ✅ |
| `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID` | ✅ (2026-08-28) | ✅ (2026-08-28) |

- [x] `EXPO_PUBLIC_REVENUECAT_API_KEY` igualada em `production` (2026-08-28).
- [x] Variável do Interstitial adicionada nos dois ambientes (2026-08-28).

### Builds

- [x] `eas build --profile preview --platform android` — validado no
      emulador (2026-08-16). ⚠️ **Nota de 2026-08-28:** esse profile gera
      **APK** (`distribution: internal`) — o Play Console exige **AAB** pra
      qualquer track, inclusive teste fechado. Não está claro como a build
      hoje em teste fechado chegou lá (não documentado neste checklist);
      daqui pra frente o caminho combinado é sempre via profile
      `production` (AAB) + `eas submit` (abaixo).
- [x] `eas.json` → `submit.production.android` configurado (2026-08-28):
      reaproveita a mesma service account criada pra RevenueCat
      (`revenuecat-combo-forge@pessoal-463414...`, já com acesso de
      Administrador no Play Console) via `serviceAccountKeyPath` apontando
      pra `google-play-service-account.json` (copiado do Downloads,
      **no `.gitignore`, nunca commitar**). `track: "alpha"` é o mapeamento
      padrão do EAS pra teste fechado — **a confirmar** quando o
      `eas submit` rodar (se a track não existir com esse nome, o comando
      deve listar as tracks reais do app).
- [~] `eas build --profile production --platform android` — **disparado em
      2026-08-28**, rodando em background.
- [ ] `eas submit --platform android --profile production --latest` — depois
      do build acima terminar, envia o AAB pro teste fechado.
- [ ] Instalar o build de produção num device físico e validar de ponta a
      ponta: Run normal, Desafio Diário completo, compra + restore reais de
      cada skin e do Remove Ads, anúncio recompensado, intersticial, banner.
- [x] Alternativa pra ver anúncios de teste garantidos num device físico sem
      depender da aprovação do AdMob: `npx expo run:android` (modo debug,
      via USB) — `NODE_ENV=development` faz os 3 formatos usarem os
      `TestIds` oficiais do Google, com Supabase/RevenueCat reais (não são
      afetados pelo modo debug).
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

- [ ] AdMob: perfil de pagamento completo (✅ 2026-08-28), ad unit
      Interstitial criada (✅ 2026-08-28). Vínculo com a ficha da Play Store
      e saída de "Requer revisão" ficam **bloqueados até depois da
      publicação em produção** (não são mais um pré-requisito — são
      pós-requisito, ver seção 3).
- [x] RevenueCat: 4 produtos reais criados no app Android, anexados à
      offering `default` e à entitlement `remove_ads`, credencial de
      service account do Google Play configurada, chave igual em
      `preview`/`production` — tudo ✅ em 2026-08-28.
- [ ] Play Console: 4 produtos em app criados; Data safety preenchido;
      assets de loja completos; teste fechado com 12 testadores por 14 dias
      concluído.
- [ ] Build de produção instalado em device físico com todo o fluxo
      validado (compra real, restore, os 3 formatos de anúncio).
- [ ] App Store (iOS): fora de escopo por enquanto — retomar quando decidir
      publicar iOS (AdMob ainda usa Test App ID, seguro).

---

## 8. Firebase Analytics (telemetria — ADR 0007 / ticket 01)

O código já está pronto — port `TelemetryProvider` (`engine/telemetry.ts`),
implementação real em `services/firebaseAnalytics.ts` (API modular do
`@react-native-firebase/analytics`, import dinâmico com degradação
silenciosa pra no-op, mesmo padrão do AdMob):

- [x] Criar um projeto no [console do Firebase](https://console.firebase.google.com)
      (`combo-forge-1ac97`).
- [x] Adicionar um app Android com o package `com.combocardforge.app` (igual
      ao AdMob/Play Console).
- [x] Baixar o `google-services.json` gerado e colocar na raiz do projeto
      (mesmo nível de `app.json`) — mantido fora do git (`.gitignore`) pra
      não acoplar o repo a este projeto Firebase específico; quem clonar o
      repo do zero precisa repetir estes passos e gerar o próprio arquivo.
- [x] Adicionar `@react-native-firebase/app` ao array `plugins` do
      `app.json`, com `googleServicesFile: "./google-services.json"` em
      `android`.
- [ ] Rebuild (`eas build`) e validar em device físico que eventos chegam
      no DebugView do Firebase Analytics.
- [ ] Data Safety form do Play Console (seção 6): declarar o Firebase
      Analytics como SDK de analytics, junto com RevenueCat/Supabase.

Sem o `google-services.json` (ausente em qualquer clone novo até alguém
repetir os passos acima), `services/firebaseAnalytics.ts` cai no `catch` —
o app funciona integralmente, só sem nenhum evento chegando no Firebase.

---

## Referências no código

| Serviço | Fallback sem env | Onde |
|---|---|---|
| Supabase | `createUnavailableDailyBackend` (Desafio indisponível) | `services/supabase.ts` |
| RevenueCat | `createDevShopProvider` (compra simulada) | `services/revenuecat.ts` |
| AdMob | `createDevAdProvider` (anúncio sempre ok) | `services/ads.ts` |
| Firebase Analytics | Import dinâmico falha → no-op silencioso (sem `google-services.json`) | `services/firebaseAnalytics.ts`, `engine/telemetry.ts` |
| Banner (visibilidade) | oculto sem ad unit ou com remoção comprada (`shouldShowBanner`) | `engine/adProvider.ts`, `components/AdBanner.tsx` |
| Loja (orquestração) | — (fluxo com ports injetados) | `store/shopFlow.ts` |
| Produtos da loja | `COSMETIC_CATALOG` (3 skins pagas + Classic grátis) | `engine/shop.ts` |
| Remoção de anúncios | `REMOVE_ADS_PRODUCT_ID`/`REMOVE_ADS_ENTITLEMENT_ID` (fora do catálogo) | `engine/shop.ts` |
| Contrato Supabase | — | `supabase/README.md`, `supabase/contract.ts` |
