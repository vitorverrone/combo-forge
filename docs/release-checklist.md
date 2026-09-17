# Checklist de Configuração de Produção (pré-release)

Guia passo a passo para levar o Combo Forge de dev (providers simulados) para
produção. Cada seção indica **o que configurar**, **onde** e **como verificar**
que ficou pronto. Sem estas configurações o app funciona, mas com fallbacks de
desenvolvimento — nada disso é opcional para um release real.

> Reescrito em 2026-09-08: decisão de produto de **lançar também no iOS**
> (antes "fora de escopo"). Este checklist agora cobre as duas lojas lado a
> lado — cada seção que já existia pro Android ganhou o equivalente iOS onde
> aplicável. Ver `docs/research/ios-launch-admob-revenuecat-appstore.md` pras
> fontes primárias (Apple/Google/RevenueCat) que embasam as decisões de
> compliance abaixo (ATT, SKAdNetwork, App Store Connect).
>
> Revisão anterior (2026-08-27) partiu de uma inspeção direta dos painéis do
> AdMob, RevenueCat e Play Console, e reflete a decisão de produto de **não
> vender mais o cosmético VFX "Golden Combo"** — a loja tem 3 skins pagas
> (Obsidian, Emerald, Royal) + a Classic grátis, fora a remoção de anúncios.

## Ordem recomendada — Android (contorna as dependências reais)

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

## Ordem recomendada — iOS (novo, 2026-09-08)

Não depende do calendário de 14 dias do Play Console — pode rodar em
paralelo com o roteiro Android acima. A App Store não tem um "teste fechado
com N dias" obrigatório antes de produção; o equivalente (TestFlight) é
opcional e sem prazo mínimo.

1. ~~**AdMob:** criar o app iOS + as 3 ad units (rewarded/banner/interstitial)
   reais.~~ ✅ Feito em 2026-09-08 — `ca-app-pub-7753200620000515~6706283181`
   + `.../2313059255` (rewarded), `.../8686895915` (banner),
   `.../4082999597` (interstitial). `.env`, EAS `preview`/`production` e o
   `iosAppId` do config plugin (`app.json`) já atualizados (seção 3).
2. ~~**Firebase:** adicionar o app iOS, baixar `GoogleService-Info.plist`.~~
   ✅ Feito em 2026-09-08 — arquivo na raiz (fora do git),
   `ios.googleServicesFile` ligado em `app.json` (seção 8).
3. ~~**ATT (App Tracking Transparency):** decidir e implementar.~~ ✅
   Decidido e implementado em 2026-09-08 — ver seção 3 "ATT" abaixo. Fecha a
   zona cinzenta de compliance da guideline 5.1.2 da Apple antes de
   submeter, mesmo o app só pedindo anúncio não-personalizado.
4. **SKAdNetworkItems:** pendente — copiar a lista atual de
   `developers.google.com/admob/ios/3p-skadnetworks` pro `app.json` antes do
   build de produção final (seção 3 "SKAdNetwork" — **deliberadamente não
   automatizado nesta sessão**, ver nota de risco lá).
5. ~~**RevenueCat → app "Combo Forge (App Store)":** criar os mesmos 4
   produtos + gerar e subir a **In-App Purchase Key**.~~ ✅ Feito em
   2026-09-08 — key, 4 produtos, entitlement, offering e chave de API
   (`appl_...`) tudo completo (seção 2 "App iOS real no RevenueCat").
6. ~~**App Store Connect → Produtos em app:** preencher Tradução da App
   Store + Review Information (screenshot) dos 4 IAPs.~~ ✅ Feito em
   2026-09-08 (seção 6 "Produtos em app (IAPs)") — falta só o passo 11
   (submeter pra revisão).
7. ~~**App Store Connect → Pricing and Availability:** restringir a
   disponibilidade pra excluir jurisdições tipo-GDPR.~~ ✅ Feito em
   2026-09-08 — desmarcados os 27 países da UE, Reino Unido, Islândia,
   Noruega (EEE) e Suíça (decisão registrada na ADR 0007 revisitada —
   mantém a política de "sem modal de consentimento GDPR" sem reabrir esse
   escopo agora).
8. ~~**App Store Connect → App Privacy:** preencher o questionário de
   privacidade.~~ ✅ Finalizado em 2026-09-08 (seção 6 "App Privacy").
9. ~~**`eas build --profile production --platform ios`**.~~ ✅ Sucesso em
   2026-09-08 na 6ª tentativa (5 falhas de build nativo resolvidas — ver
   seção 5 "Builds iOS" pro histórico completo).
10. ~~**`eas submit --platform ios --profile production`**.~~ ✅ Feito em
    2026-09-08 — build 1.0.0 (7) no App Store Connect, instalado e aberto
    no TestFlight (convite por e-mail precisou ser aceito manualmente).
    **Pendente agora:** validar de ponta a ponta no TestFlight (compra
    real sandbox, restore, os 3 formatos de anúncio, prompt de ATT) antes
    do próximo passo.
11. **Submeter o app + os 4 IAPs pra revisão da Apple** (App Store Connect →
    versão do app → "Add for Review", com os IAPs anexados à mesma
    submission — Apple revisa app e IAP juntos na primeira vez). Próximo
    passo real, depois da validação no TestFlight (item 10).
12. **Publicar em produção na App Store.**

---

## Estado atual (consolidado em 2026-09-08)

| Item | Onde está hoje | Próximo passo |
|---|---|---|
| Supabase | ✅ Projeto criado, migrations aplicadas, `.env` real e Desafio Diário validado de ponta a ponta | `submit_daily_score`/`get_weekly_leaderboard` pendem de um fim de Run (opcional: `verify:backend`) |
| RevenueCat — catálogo | ✅ 3 skins pagas + Classic grátis + Remove Ads (VFX "Golden Combo" **removido do escopo**, código e docs já atualizados); preços confirmados (Royal Deck = $0.99) | — |
| RevenueCat — Test Store | ✅ 4 produtos + offering `default` com 4 packages, tudo validado em dev build | — |
| RevenueCat — app Android real | ✅ **4 produtos criados** (Non-consumable), "Published", entitlement `remove_ads` anexada, offering `default` preenchida | — |
| RevenueCat — credencial do Google Play | ✅ Configurada, produtos "Published" | Check de assinatura ainda propagando (irrelevante — sem produtos de assinatura) |
| RevenueCat — chave da API (Android) | ✅ Igualada em `.env`, EAS `preview` e `production` | — |
| RevenueCat — **app iOS** | ⏳ Você já iniciou a criação — falta a **In-App Purchase Key** (seção 2) | Gerar `.p8` em ASC → Integrations → In-App Purchase, subir + Issuer ID no RevenueCat |
| AdMob — app Android | ⚠️ Criado, status ainda **"Requer revisão"**, app oculto | Só sai disso depois do vínculo com a loja (pós-produção) |
| AdMob — app **iOS** | ✅ Criado em 2026-09-08 (`ca-app-pub-7753200620000515~6706283181`) | Mesmo padrão do Android — "Requer revisão" até vincular a ficha da App Store (pós-publicação) |
| AdMob — perfil de pagamento | ✅ Corrigido (mesma conta AdSense cobre Android + iOS) | — |
| AdMob — ad units Android | ✅ Rewarded + Banner + Interstitial (as 3 reais) | — |
| AdMob — ad units **iOS** | ✅ Criadas em 2026-09-08 — as 3 reais, `.env`/EAS/`app.json` atualizados | Aguardar ~1h de propagação antes de testar anúncio real (mesmo padrão do Android) |
| AdMob — vínculo com a loja | ⏳ **Bloqueado, não pendente** (as duas plataformas) — só é possível pós-publicação em produção | Reordenado no roteiro de cada loja (item final) |
| App Tracking Transparency (iOS) | ✅ **Implementado em 2026-09-08** — `expo-tracking-transparency` + prompt no boot (`App.tsx`/`services/tracking.ts`), banner espera a resposta antes de montar | — |
| SKAdNetworkItems (iOS) | ⏳ **Não preenchido, deliberado** — lista muda com frequência, risco de transcrição errada via ferramenta automatizada (ver seção 3) | Copiar manualmente de `developers.google.com/admob/ios/3p-skadnetworks` antes do build de produção final |
| Google Play Console | ✅ App criado, teste fechado publicado, 1 testador ativo | Recrutar até 12 testadores + aguardar 14 dias corridos |
| Google Play Console — IAPs | ✅ 4 produtos únicos criados e ativos | — |
| App Store Connect — app + IAPs | ✅ App, 4 IAPs, Tradução/Review Info e App Privacy **completos** (2026-09-08) | Falta só submeter app + IAPs juntos pra revisão |
| App Store Connect — Availability | ✅ Restringido (UE + Reino Unido + Islândia + Noruega + Suíça, 2026-09-08) | — |
| App Store Connect — build/TestFlight | ✅ Build 1.0.0 (7) enviado via `eas submit`, instalado e testado no TestFlight (2026-09-08) | Validar compra/restore reais + demais fluxos de ponta a ponta |
| RevenueCat — app iOS real | ✅ In-App Purchase Key, 4 produtos, entitlement, offering e chave de API **completos** (2026-09-08) | Testar compra/restore reais no TestFlight |
| Firebase Analytics — app Android | ✅ Projeto criado, `google-services.json` na raiz (fora do git) | Rebuild + validar no DebugView |
| Firebase Analytics — app **iOS** | ✅ **Criado em 2026-09-08** — `GoogleService-Info.plist` na raiz (fora do git), `ios.googleServicesFile` ligado em `app.json` | Rebuild + validar no DebugView |
| Política de privacidade | ✅ Atualizada em 2026-09-08 — cobre iOS/IDFA/ATT e Firebase Analytics (estava faltando desde antes) | — |
| ADR 0007 (consentimento) | ✅ Revisitada em 2026-09-08 — mantém "sem modal GDPR" via restrição de território UE/RU, em vez de construir o modal | — |
| EAS | ✅ Projeto vinculado, builds `preview` validados no emulador Android | Build `production` iOS ainda não disparado (item 9 do roteiro iOS) |
| Identificadores `com.combocardforge.app` | ✅ Iguais em `app.json` (iOS + Android), AdMob (as 2 plataformas) e Play Console | Confirmar igual no App Store Connect |

---

## 0. Identificadores do app

- [x] Bundle identifier `com.combocardforge.app` no `app.json` (iOS + Android).
- [x] Confirmado igual no AdMob (Configurações do app, as 2 plataformas) e no
      Google Play Console (painel do app "Combo Forge").
- [ ] Confirmar igual no App Store Connect (o app já foi criado lá — só
      checar que o Bundle ID bate, não é algo editável depois de criado).

---

## 1. Supabase (Desafio Diário — ticket 12/13)

Sem mudanças desde a última revisão — seção estável, mesma pra Android e iOS
(o backend não distingue plataforma).

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

### Job semanal de queda de Tier (ADR 0012, ticket 03 — novo)

Primeira peça de infra agendada do projeto (`pg_cron` + `pg_net`, migration
`0008_league_tier_drop_notifications.sql`). A parte testável sem rede
(`_league_tier_drop_notification_candidates`) já passa em
`npm run verify:backend`; o disparo real via `pg_net` e o agendamento via
`pg_cron` não são verificáveis localmente (extensões do projeto Supabase,
ausentes num Postgres vanilla) nem antes do primeiro rollout de uma semana
real em produção.

- [ ] Extensões `pg_cron` e `pg_net` habilitadas no projeto Supabase
      (Database → Extensions) — sem isso a migration aplica normalmente
      (os `do $$ ... exception when others ...$$` guardam a falta delas),
      mas o job nunca é agendado nem despacha nada.
- [ ] `select * from cron.job where jobname = 'league-tier-drop-notifications'`
      confirma o agendamento (segunda 00:05 UTC) depois da migration aplicada.
- [ ] **Confirmar que o job rodou corretamente na primeira virada de semana
      real em produção** — não é verificável antes do primeiro rollout:
      conferir `cron.job_run_details` (sucesso/erro da última execução) e,
      pra pelo menos um dispositivo que caiu de Tier na semana, que a
      notificação chegou de fato (Expo Push, `push_tokens` populada).

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

### Decisão de escopo do MVP (2026-09-17): só 2 skins no lançamento

Das 3 skins pagas da tabela acima, o **v1.0 lança só com Classic (grátis) e
Obsidian** — Emerald e Royal (rebatizada "Gilded Set" no reskin, seção
"3ª rejeição") ficam **comentadas em `COSMETIC_CATALOG`**
(`engine/shop.ts`), não uma remoção: a intenção é liberar 1 delas numa
próxima versão, não descontinuar. Nenhuma ação nas lojas é necessária agora
— os produtos `combo_forge_skin_emerald`/`combo_forge_skin_royal` continuam
existindo no RevenueCat/App Store Connect/Play Console exatamente como
documentado acima, só não aparecem na Loja do app enquanto comentados no
catálogo local. Quando uma delas for liberada, é só descomentar o item —
sem precisar recriar produto em lugar nenhum.

Ajuste feito junto: 6 testes (`engine/shop.test.ts`,
`store/shopFlow.test.ts`, `store/gameStore.test.ts`) referenciavam
`deck-emerald`/`deck-royal` diretamente e quebraram com o catálogo reduzido
— reescritos pra usar só os 2 itens agora ativos (Classic/Obsidian),
mantendo a mesma cobertura de comportamento (equipar troca a skin atual,
restore ignora productId fora do catálogo). `npm run typecheck` limpo,
`npm test` 555/555 depois do ajuste.

### ✅ App Android real no RevenueCat

O dashboard tem três "apps" dentro do projeto Combo Forge: **Test Store**
(dev, 4 produtos, tudo funcionando), **Combo Forge (Play Store)** e agora
**Combo Forge (App Store)** (iOS, seção abaixo). O app Android tem os mesmos
4 produtos, criados como **Non-consumable** (nenhum é assinatura nem é
consumido/recomprado — compra única, restaurável):

- [x] Os 4 productIds criados em Products → app "Combo Forge (Play Store)"
      → New Product, um a um, batendo exatamente com o Play Console.
- [x] Entitlement `remove_ads` (Product catalog → Entitlements →
      `remove_ads` → Associated products) anexada ao produto Remove Ads
      real do Android.
- [x] Offering `default` (Product catalog → Offerings → `default` → Edit):
      os 4 packages já têm o produto Android correspondente anexado.

### ✅ Credencial de service account do Google Play

Resolvido o erro "Google Play service account credentials must be set
before using this feature" que bloqueava o "Import" e deixava os 4 produtos
Android com status "Could not check":

- [x] Service account `revenuecat-combo-forge@pessoal-463414.iam.gserviceaccount.com`
      criada no Google Cloud (projeto `pessoal-463414`), com a "Google Play
      Android Developer API" habilitada e uma chave JSON gerada.
- [x] Permissão concedida no Play Console — **Usuários e permissões →
      Gerenciar usuários → Convidar novos usuários**, adicionando o e-mail
      da service account como se fosse um usuário, com acesso de
      Administrador.
- [x] JSON subido em RevenueCat → Apps → "Combo Forge (Play Store)" →
      Service account credentials.
- [x] Os 4 produtos saíram de "Could not check" e foram para **"Published"**.
- [ ] **Pendência cosmética, não bloqueante:** o check "Can validate Google
      Play subscription purchases" no modal de validação da RevenueCat pode
      continuar vermelho por atraso de propagação (até 24–36h). Irrelevante
      pro Combo Forge (sem produto de assinatura).

### ✅ Chave da API (Android) — igualada em todos os ambientes

- [x] `.env` local, EAS `preview` e EAS `production` têm a mesma chave
      pública real (`goog_...`).

### App iOS real no RevenueCat — pendente a In-App Purchase Key

Você já criou o app "Combo Forge (App Store)" no RevenueCat e ele está
pedindo a **In-App Purchase Key** — este é o mecanismo atual da Apple/
RevenueCat pra validação de recibo server-to-server (substituiu o antigo
"shared secret"). Passos confirmados contra a documentação oficial (ver
`docs/research/ios-launch-admob-revenuecat-appstore.md`, seção 3):

**No App Store Connect:**
1. Users and Access → aba **Integrations** → menu lateral **Keys → In-App
   Purchase**. Precisa ser Account Holder ou Admin.
2. **Generate In-App Purchase Key** (ou o **+** se já existir uma key
   Active) → dar um nome (só referência interna, não editável depois — pra
   renomear precisa revogar e gerar outra) → **Generate**.
3. Na seção **Active** da key recém-criada: **Download Key** → confirmar.
   **A Apple só deixa baixar uma vez** — "Store the key in a safe place."
   Se perder o arquivo, tem que revogar e gerar uma nova (revogar quebra
   qualquer coisa que já use essa key).
4. Anotar o **Issuer ID** mostrado na mesma tela (Integrations → In-App
   Purchase) — precisa dele no passo seguinte.

**No RevenueCat:**
1. Apps → **Combo Forge (App Store)** → aba **In-app purchase key
   configuration**.
2. Upload do arquivo `.p8` baixado (não precisa renomear).
3. Colar o **Issuer ID** no campo correspondente.
4. **Save changes** — o RevenueCat valida a credencial.

- [x] Key `.p8` gerada e baixada.
- [x] Upload feito + Issuer ID preenchido no RevenueCat, validação passou.
- [x] Os 4 productIds criados em Products → app "Combo Forge (App Store)".
- [x] Entitlement `remove_ads` anexada ao Remove Ads do iOS.
- [x] Offering `default`: os 4 packages com o lado iOS anexado.
- [x] Chave pública do RevenueCat pro app iOS (`appl_inEramBKuacOfoWgaIcAvRLNEDD`)
      preenchida em 2026-09-08 — `.env` local + EAS `preview`/`production`
      (`EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`, nova variável). Confirmado que
      o projeto usa chave por plataforma (não cross-platform única), então
      `services/revenuecat.ts` foi ajustado pra escolher a chave certa via
      `Platform.OS` (Android continua na variável antiga, sem sufixo, por
      compatibilidade). `npm run typecheck` e `npm test` verdes depois da
      mudança.

### Verificar

- [x] Provider dev e Test Store validados de ponta a ponta (compra, equip,
      restore, remoção de anúncios) — ver histórico abaixo.
- [ ] Testar compra e restore **reais no Android** (produto + licença de
      teste do Play Console) — depende de tudo acima.
- [ ] Testar compra e restore **reais no iOS** — RevenueCat 100% configurado
      (✅ acima), falta só exercitar no build do TestFlight já instalado.

#### Histórico de validação (Test Store, dev build, 2026-08-15/16)

- Bugs corrigidos: `purchaseCosmetic`/`equipCosmetic`/`restorePurchases`
  usavam o provider/storage do closure em vez dos injetados via `get()`
  (hoje vivem em `store/shopFlow.ts`, fix permanece); `services/supabase.ts`
  com URL inválida derrubava o bootstrap inteiro em vez de degradar.
- Pin do Kotlin (`plugins/withKotlinVersionPin.js`) necessário para o build
  de nuvem do EAS — RN fixa 2.1.20, `play-services-ads` 25.4.0 exige 2.3.0+.

---

## 3. AdMob (recompensado, intersticial, banner)

### ✅ Perfil de pagamento

O painel mostrava, no topo: **"Configuração de pagamento incompleta —
Termine de configurar sua conta da AdMob preenchendo o perfil para
pagamentos..."** Isso bloqueava a revisão do app inteiro. A aba "Informações
dos pagamentos" (Pagamentos → conta AdSense Brasil, `pub-7753200620000515`)
está preenchida — mesma conta cobre Android e iOS (é uma conta AdMob única,
com apps das duas plataformas dentro).

- [x] Perfil de pagamento preenchido (conta AdSense Brasil vinculada).
- [x] Aba **"Verificação"** checada: pede identidade/endereço só quando os
      ganhos atingirem um certo limite — não bloqueia agora.
- [x] Banner de aviso de pagamento sumiu da Visão geral do app.
- [ ] Status em Configurações do aplicativo ainda em "Requer revisão" (as
      duas plataformas) — só deve sumir depois do vínculo com a loja, que só
      é possível pós-produção (ver "Detalhes da app store" abaixo).

### ✅ Ad units Android — as 3 criadas

| Nome no painel | Formato | Ad unit ID |
|---|---|---|
| Desafio Diário — tentativa extra | Premiado (Rewarded) | `ca-app-pub-7753200620000515/2212947942` |
| Remove ads | Banner | `ca-app-pub-7753200620000515/1366979567` |
| (novo) | Intersticial | `ca-app-pub-7753200620000515/8281372704` |

- [x] Variáveis preenchidas no `.env` local e no EAS (`preview` +
      `production`).

### ✅ App + ad units iOS — criados em 2026-09-08

| Nome | Formato | ID |
|---|---|---|
| App iOS | — | `ca-app-pub-7753200620000515~6706283181` |
| Rewarded | Premiado | `ca-app-pub-7753200620000515/2313059255` |
| Banner | Banner | `ca-app-pub-7753200620000515/8686895915` |
| Intersticial | Intersticial | `ca-app-pub-7753200620000515/4082999597` |

- [x] `iosAppId` do plugin `react-native-google-mobile-ads` em `app.json`
      atualizado (era o Test App ID oficial do Google, `ca-app-pub-3940256099942544~1458002511`).
- [x] `EXPO_PUBLIC_ADMOB_{REWARDED,BANNER,INTERSTITIAL}_AD_UNIT_ID_IOS`
      preenchidas no `.env` local e no EAS (`preview` + `production`).
- [ ] O AdMob avisa que blocos novos podem levar até 1h para começar a
      servir anúncios — não testar o real antes disso (as 3 ad units iOS).

### ✅ ATT (App Tracking Transparency) — decidido e implementado em 2026-09-08

A pesquisa (`docs/research/ios-launch-admob-revenuecat-appstore.md`, seção
1) não achou uma regra clara nas fontes primárias pra saber se um app que só
pede anúncio não-personalizado (`requestNonPersonalizedAdsOnly: true`, já
era o caso deste app) ainda precisa do prompt ATT — a guideline 5.1.2 da
Apple é redigida de forma ampla o bastante pra plausivelmente cobrir o
comportamento do AdMob mesmo em modo não-personalizado (frequency
capping/relatórios agregados usam identificador), mas o Google trata o ATT
como opcional, só necessário pra anúncio personalizado. Diante da zona
cinzenta, decidiu-se fechar o risco: implementar o prompt de qualquer forma.

- [x] `expo-tracking-transparency` instalado (`npx expo install`, versão
      compatível com Expo SDK 57).
- [x] Config plugin adicionado em `app.json` com
      `NSUserTrackingPermission` honesto ("used to measure ad performance...
      never shows personalized ads" — reflete o comportamento real, não
      promete personalização que o app nunca oferece).
- [x] `services/tracking.ts` (novo): `requestTrackingPermission()` — no-op
      no Android e em qualquer ambiente sem o módulo nativo, nunca lança.
- [x] `App.tsx`: chama o prompt uma vez no boot (`useEffect`), e só monta
      `<AdBanner />` depois da resposta resolver — banner é o único anúncio
      sempre montado (rewarded/intersticial já são sob demanda, o prompt já
      deve estar resolvido quando o jogador chega neles). Resto do app
      renderiza normalmente sem esperar — nunca bloqueia o jogo.
- [x] `npm run typecheck` e `npm test` verdes após a mudança (530 testes).
- [ ] Validar em device físico iOS (development build ou TestFlight): o
      prompt aparece uma vez no primeiro launch, o app funciona igual
      aceitando ou negando.

### ⏳ SKAdNetworkItems — pendente, deliberadamente não preenchido agora

Google recomenda adicionar a lista de `SKAdNetworkIdentifier` publicada em
**`developers.google.com/admob/ios/3p-skadnetworks`** ao `Info.plist` (via
`skAdNetworkItems` no plugin `react-native-google-mobile-ads` em
`app.json`) — habilita atribuição de instalação via SKAdNetwork quando o
IDFA não está disponível. **Confirmado que isso não é um requisito
documentado de App Review** (não bloqueia a submissão por si só) — é uma
recomendação do próprio Google pra atribuição/mensuração funcionar.

**Por que não foi preenchido nesta sessão:** a lista tem ~50 entradas
(identificadores alfanuméricos opacos de ~20 caracteres cada, sujeitos a
mudar — o próprio Google avisa "subject to change and should be updated
regularly") e duas tentativas automatizadas de ler essa mesma página nesta
sessão de pesquisa retornaram contagens diferentes (51 vs. 46). Colar uma
lista dessa via resumo automatizado é o tipo de erro que não aparece em
nenhum teste (um ID errado só falha silenciosamente em atribuir instalação,
nunca quebra o app) — preferível copiar direto da página no navegador na
hora de fazer o build de produção final, não hoje.

- [ ] Antes do build `production` final do iOS: abrir
      `developers.google.com/admob/ios/3p-skadnetworks`, copiar a lista
      atual, adicionar como `skAdNetworkItems: string[]` na config do
      plugin `react-native-google-mobile-ads` em `app.json`.

### Configurações do app (as 2 plataformas)

- [x] App ID real igual no `app.json` e no painel, pras duas plataformas —
      build de release não crasha.
- [x] Verificação de apps: "Não obrigatório" — nada a fazer.
- [ ] **Detalhes da app store: vazio** ("—" / "—") nas duas plataformas.
      Confirmado (comunidade AdMob/Play Console): **apps em teste
      fechado/TestFlight não aparecem na busca de vínculo do AdMob** — só
      depois de publicados em produção. Não é um passo pendente agora, é um
      passo **bloqueado até depois da publicação** de cada loja.
- [ ] Serviços vinculados: nada vinculado ainda — revisar pós-produção.
- [ ] **Consequência:** o status "Requer revisão" do app no AdMob (as duas
      plataformas) provavelmente só sai depois desse vínculo.

### Verificar

- [x] Dev: `TestIds` oficiais carregam sempre (rewarded, banner, iOS e
      Android).
- [x] Release build Android (emulador): App ID real sem crash; rewarded
      real devolve `NO_FILL` (esperado, app não aprovado ainda).
- [x] Banner em dev: visível em todas as telas, reserva de espaço, some após
      Remove Ads.
- [ ] Intersticial/rewarded/banner reais Android — depende do vínculo com a
      loja.
- [ ] Qualquer anúncio real iOS servindo de fato — depende do perfil de
      pagamento (✅) + revisão do app + vínculo com a loja (pós-produção).

---

## 4. `.env` final (resumo)

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_REVENUECAT_API_KEY=<revenuecat public sdk key — goog_... ou appl_... conforme a plataforma, ver seção 2>
EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID=<admob rewarded ad unit id (android)>
EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS=<admob rewarded ad unit id (ios)>
EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID=<admob banner ad unit id (android)>
EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_IOS=<admob banner ad unit id (ios)>
EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID=<admob interstitial ad unit id (android)>
EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_IOS=<admob interstitial ad unit id (ios)>
EXPO_PUBLIC_ADMOB_LIVE_ADS=false
```

- [x] `.env` local tem Supabase e RevenueCat (chave real `goog_...`) sem
      placeholder.
- [x] **Preenchido em 2026-09-08:** as 3 variáveis `*_AD_UNIT_ID_IOS`
      (rewarded/banner/interstitial) no `.env` local e nos dois ambientes
      do EAS (`preview` + `production`).
- [x] `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` (`appl_...`) preenchida em
      2026-09-08 — `.env` local + EAS `preview`/`production` (seção 2).
- [x] `.env` fora do git (`git check-ignore .env`).

---

## 5. Build e EAS

O EAS **não lê o `.env` local em builds de nuvem** — as `EXPO_PUBLIC_*` vêm
de EAS Environment Variables por ambiente (`eas env:list --environment
<env>`).

### Estado por ambiente

| Variável | `preview` | `production` |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` | ✅ real | ✅ real |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | ✅ `goog_...` (Android) | ✅ `goog_...` (Android) |
| `EXPO_PUBLIC_ADMOB_*_AD_UNIT_ID_ANDROID` (3) | ✅ (TestIds do Google em `preview`) | ✅ reais |
| `EXPO_PUBLIC_ADMOB_*_AD_UNIT_ID_IOS` (3) | ✅ (2026-09-08) | ✅ (2026-09-08) |

### Builds Android

- [x] `eas build --profile preview --platform android` — validado no
      emulador. ⚠️ Esse profile gera **APK** (`distribution: internal`) — o
      Play Console exige **AAB** pra qualquer track. Caminho combinado:
      sempre via profile `production` (AAB) + `eas submit`.
- [x] `eas.json` → `submit.production.android` configurado: reaproveita a
      service account criada pra RevenueCat
      (`revenuecat-combo-forge@pessoal-463414...`) via
      `serviceAccountKeyPath` apontando pra
      `google-play-service-account.json` (`.gitignore`, nunca commitar).
      `track: "alpha"` é o mapeamento padrão do EAS pra teste fechado.
- [x] `eas build --profile production --platform android` — build gerado,
      instalado num device físico.
- [ ] `eas submit --platform android --profile production --latest` —
      envia o AAB pro teste fechado.
- [ ] Validar de ponta a ponta no build de produção Android: Run normal,
      Desafio Diário completo, compra + restore reais de cada skin e do
      Remove Ads, anúncio recompensado, intersticial, banner.

### Builds iOS (novo)

`eas.json` hoje só tem `submit.production.android` — falta o equivalente
`submit.production.ios`, mas **não precisa criar esse bloco manualmente**:
na primeira chamada, `eas build --platform ios` e `eas submit --platform
ios` fazem login interativo na sua conta Apple Developer e guardam as
credenciais (certificado de distribuição + provisioning profile,
gerenciados pelo EAS) — só peça pra rodar interativamente (não em CI) na
primeira vez.

- [x] `eas build --profile production --platform ios` — ✅ **sucesso em
      2026-09-08** na 6ª tentativa (5 falhas antes, build time 6m59s).
      Credenciais
      Apple confirmadas/geradas via prompt interativo do EAS na primeira
      chamada. Histórico completo das 5 tentativas abaixo, pra referência
      futura se `@shopify/react-native-skia` ou `@react-native-firebase`
      forem atualizados e o problema reaparecer. As 3 primeiras falhas
      vieram do choque entre o Firebase (quer resolver via Swift Package
      Manager, exige frameworks dinâmicos) e o Google Mobile Ads SDK/UMP do
      AdMob (vendorizados como XCFramework **estático**, não dá pra mudar
      isso):
      1. 1ª falha: `[react-native-firebase] SPM + static linkage is not
         supported` — linkage estático (implícito, sem config explícita
         antes disso) não é compatível com o Firebase via SPM. Tentativa de
         fix: `disableSPM: true` no plugin `@react-native-firebase/app` pra
         manter linkage estático — resolveu essa mas destampou a próxima.
      2. 2ª falha (com SPM desabilitado): `FirebaseCoreInternal depends
         upon GoogleUtilities, which does not define modules` — pods Swift
         do Firebase não integram como biblioteca estática sem
         `use_modular_headers!`/`forceStaticLinking` explícitos. Tentativa
         de fix: trocar de lado — reverter `disableSPM` e usar
         `expo-build-properties` → `ios.useFrameworks: "dynamic"` (o que o
         SPM do Firebase pede) — resolveu essa mas quebrou o AdMob.
      3. 3ª falha (com frameworks dinâmicos): `The 'Pods-ComboForge' target
         has transitive dependencies that include statically linked
         binaries: .../GoogleUserMessagingPlatform/.../
         UserMessagingPlatform.xcframework` — o Google Mobile Ads SDK/UMP
         vem vendorizado estático, incompatível com projeto inteiro em
         linkage dinâmico.
      **Fix final adotado:** manter linkage **estático** (compatível
      nativamente com o AdMob, que não pode virar dinâmico) e resolver o
      lado do Firebase com a opção que o próprio `expo-build-properties`
      documenta pra esse exato conflito — `forceStaticLinking`, que força
      só os pods do Firebase a compilar como biblioteca estática com
      modular headers, sem mexer no resto do projeto:
      ```json
      ["@react-native-firebase/app", { "ios": { "disableSPM": true } }],
      ...
      ["expo-build-properties", {
        "android": { "kotlinVersion": "2.2.20" },
        "ios": {
          "useFrameworks": "static",
          "forceStaticLinking": ["RNFBApp", "RNFBAnalytics"]
        }
      }]
      ```
      (a lista do `forceStaticLinking` precisa crescer se algum
      `@react-native-firebase/*` novo — `/crashlytics`, `/auth` etc. — for
      adicionado depois; nome do pod segue o padrão `RNFB<Módulo>`).
      4. 4ª e 5ª falhas (`pod install` já passando, erros no compile/archive
         do Xcode, mesma causa raiz): `'third_party/base64.h' file not
         found` compilando `cpp/api/third_party/base64.cpp`, depois
         `'include/core/SkImage.h'`/`'include/core/SkRefCnt.h'` file not
         found compilando `cpp/api/third_party/SkottieUtils.cpp`. Bug real
         e conhecido do próprio `react-native-skia` **2.6.2**, não algo
         específico deste projeto — confirmado nos issues oficiais do
         repositório (`Shopify/react-native-skia#3895`, "Expo SDK 56 unable
         to build with Skia v2.6.2") e num PR ainda **não mergeado**
         (`#3904`) que corrige exatamente isso. Causa raiz: o `.podspec` do
         Skia declara `HEADER_SEARCH_PATHS` com um glob recursivo
         (`cpp/**`) em vez de listar as pastas-raiz explicitamente — o
         glob recursivo funciona pra build sem frameworks, mas não resolve
         de forma confiável includes relativos como `"third_party/base64.h"`
         ou `"include/core/SkImage.h"` quando o pod compila como framework
         estático (`use_frameworks! :linkage => :static`, o modo forçado
         pelo fix do item 3 acima) — supeita: com milhares de subpastas
         adicionadas via glob recursivo (a árvore do Skia é enorme), a
         resolução de include relativo fica na borda do que o Xcode
         processa de forma confiável.
      **Fix aplicado (sem esperar release oficial):** `patch-package` —
      adiciona `"$(PODS_TARGET_SRCROOT)/cpp/api"` e
      `"$(PODS_TARGET_SRCROOT)/cpp/skia"` explícitos no `HEADER_SEARCH_PATHS`
      do `.podspec` instalado (mesma ideia do PR `#3904`, aplicada
      localmente). `cpp/skia` sozinho cobre `include/`, `modules/` e `src/`
      — quase 2000 dos includes relativos da árvore inteira, confirmado
      varrendo todo `cpp/**` por padrão de include (`grep -rhoE '#include
      "[^"]+/[^"]+"'`) antes de aplicar, pra não precisar de mais uma
      rodada de build só pra achar o próximo arquivo faltante.
      `npm install -D patch-package` + `"postinstall": "patch-package"` em
      `package.json` (novo — projeto não tinha patch-package antes) +
      `patches/@shopify+react-native-skia+2.6.2.patch` commitado no repo —
      reaplicado automaticamente em qualquer `npm install`, inclusive no
      build de nuvem do EAS. **Remover este patch quando
      `@shopify/react-native-skia` for atualizado pra uma versão que já
      inclua o PR #3904** (checar o changelog antes de atualizar a versão —
      se a versão nova já tiver o fix, o patch vira no-op ou passa a falhar
      ao aplicar, sinal de que pode ser deletado).
      Refazer o build depois dessa mudança.
- [x] `eas submit --platform ios --profile production --latest` — ✅ feito
      em 2026-09-08, `.ipa` no App Store Connect (build 1.0.0 (7)).
- [~] Instalar via TestFlight — ✅ instalado e aberto em 2026-09-08 (aceitar
      o convite por e-mail foi o passo que faltava, não configuração).
      Falta validar de ponta a ponta: Run normal, Desafio Diário completo,
      compra + restore reais (depende da In-App Purchase Key do RevenueCat,
      seção 2), anúncio recompensado, intersticial, banner, prompt de ATT.

### Ambos

- [x] Alternativa pra ver anúncios de teste garantidos num device físico
      Android sem depender da aprovação do AdMob: `npx expo run:android`
      (modo debug, via USB) — `NODE_ENV=development` faz os 3 formatos
      usarem os `TestIds` oficiais do Google. Equivalente iOS: `npx expo
      run:ios` (precisa de Mac ou EAS cloud build — não roda localmente no
      Windows).
- [x] `npm run typecheck` limpo e `npm test` verde (21 suites, 530 testes —
      verificado 2026-09-08, após adicionar ATT).

---

## 6. Lojas (Google Play Console + App Store Connect)

### Google Play Console

O app **já existe**. Teste fechado (bloqueador de calendário):

- [x] Versão de teste fechado publicada.
- [ ] **12 testadores optados** — hoje só **1** está participando. Recrutar
      o quanto antes: pré-requisito pro próximo item, e só começa a contar
      depois de bater 12.
- [ ] **14 dias corridos** de teste fechado com no mínimo 12 testadores —
      não iniciado.
- [ ] Depois de completar os dois itens: "Solicitar a produção" (hoje
      desabilitado no painel).

Produtos em app (IAPs):

- [x] 4 produtos gerenciados criados e ativos com os mesmos productIds do
      RevenueCat/catálogo.

Outras pendências:

- [ ] **Data safety form**: declarar os SDKs de anúncios (AdMob),
      analytics (Firebase Analytics) e attribution (RevenueCat, Supabase) e
      os dados que coletam.
- [x] **Política de privacidade** (URL) — `docs/privacy.html`, atualizada
      em 2026-09-08 (cobre iOS/Firebase Analytics, que estavam faltando).
- [ ] **Assets de loja**: ícone, screenshots (portrait), descrição curta e
      longa.

### App Store Connect (novo, 2026-09-08)

O app e os 4 produtos em app (IAPs) já existem, mas ainda não foram
submetidos pra revisão. Você perguntou especificamente sobre 4 campos por
produto — a pesquisa confirmou o que é obrigatório vs. opcional pra cada um
(fonte: páginas oficiais de ajuda da Apple, ver
`docs/research/ios-launch-admob-revenuecat-appstore.md`, seção 4):

| Campo | Obrigatório pra revisão? | Nota |
|---|---|---|
| **Tradução da App Store** (Display Name + Description, ≥1 idioma) | ✅ **Sim** | Conteúdo já redigido abaixo — só copiar/colar. |
| **Informações para a equipe de revisão** — Screenshot | ✅ **Sim** | Instrução de captura abaixo. |
| **Informações para a equipe de revisão** — Notas | Opcional (mas recomendado) | Conteúdo já redigido abaixo. |
| **Imagem** (App Store Promotion, 1024×1024) | ⚠️ **Só se você quiser** promover o IAP na página do produto, configurar win-back offers, Contingent Pricing, ou exibir códigos de oferta/payment sheet | Não precisa preencher pra uma submissão simples. |
| **Códigos de oferta** | Opcional, recurso separado | Não faz parte do checklist de submissão. |

**Nota sobre a fonte:** a página de referência tabular da Apple ("Required,
localizable, and editable properties") marca "Image" como obrigatória de
forma mais ambígua que a página narrativa ("View and edit In-App Purchase
information"), que é explícita: *"To promote your In-App Purchase on your
App Store product page, set up win-back offers, set up Contingent Pricing,
or display your offer codes and payment sheet, **you must** provide an
image."* — condicional, não obrigatória pra toda submissão. Tratamos essa
segunda como mais confiável (frase completa e inequívoca vs. checkmark de
tabela que variou entre duas leituras automatizadas da mesma página). Se
quiser ter 100% de certeza antes de submeter, vale abrir as duas páginas e
comparar a linha "Image" com os próprios olhos.

#### Conteúdo pronto — Tradução da App Store + Review Information (copiar/colar)

Cada um dos 4 produtos tem limite de **30 caracteres pro Display Name** e
**45 pro Description** (limites padrão da Apple pra IAP — a UI mostra um
contador, confirme lá se mudou). Textos abaixo já cabem:

**`combo_forge_skin_obsidian`**
- Display Name: `Obsidian Deck`
- Description: `Charcoal deck skin, silver ink. Cosmetic.`
- Review Notes: *"Permanent cosmetic deck-skin purchase — swaps the card
  face/ink colors used throughout gameplay. No gameplay effect. To test:
  open the app → tap the Shop icon (top bar) → 'Obsidian Deck' is listed
  with a Buy button. Purchasing equips it immediately; it can be
  re-equipped anytime from the Shop without repurchasing."*

**`combo_forge_skin_emerald`**
- Display Name: `Emerald Deck`
- Description: `Deep green deck skin, gold ink. Cosmetic.`
- Review Notes: *(mesmo texto acima, trocando "Obsidian Deck" por "Emerald
  Deck")*

**`combo_forge_skin_royal`**
- Display Name: `Royal Deck`
- Description: `Navy deck skin, ivory ink. Cosmetic.`
- Review Notes: *(mesmo texto acima, trocando por "Royal Deck")*

**`combo_forge_remove_ads`**
- Display Name: `Remove Ads`
- Description: `Removes banner and interstitial ads.`
- Review Notes: *"Permanently removes the banner ad (footer, all screens)
  and the interstitial ad (shown between game Runs). Does NOT remove the
  optional rewarded ad (player-initiated, only used to get an extra Daily
  Challenge attempt) — that stays available by design, since the player
  opts into it rather than having it forced. To test: open the app → tap
  the Shop icon (top bar) → 'Remove Ads' is listed with a Buy button. After
  purchase, the banner disappears immediately and no interstitial shows
  between Runs."*

**Screenshot (Review Information):** a Apple pede uma captura mostrando o
produto em contexto no app. Como os 4 IAPs aparecem na mesma tela (Shop),
**a mesma screenshot serve pros 4** — não precisa ser 4 imagens diferentes:

- [x] Screenshot da tela **Shop** capturada (emulador Android, recortada
      pra 640×920) e usada nos 4 produtos — mesma imagem serve pros 4.
- [x] Upload feito no campo "Screenshot" de Review Information dos 4
      produtos.
- [x] **Tradução da App Store + Review Information dos 4 IAPs completos**
      (confirmado em 2026-09-08) — falta só clicar em enviar pra revisão
      (junto com a versão do app, seção "Ordem recomendada — iOS" item 11).

#### App Privacy (equivalente ao Data Safety do Play)

- [x] Questionário "App Privacy" **finalizado em 2026-09-08** — tipos de
      dado, vínculo à identidade e uso pra rastreamento decididos e
      registrados na ADR 0007 (seção "App Privacy — declarações de
      rastreamento"), com a tabela completa das 9 respostas (ID de usuário,
      ID do dispositivo, Histórico de compras, Interações com o produto,
      Dados de publicidade, Outras informações de uso, Localização
      aproximada, Dados de falhas, Dados de desempenho).

#### Availability

- [x] **Restringir território** — ✅ feito em 2026-09-08 (ver ADR 0007
      revisitado): desmarcados os 27 países da UE, Reino Unido, Islândia,
      Noruega e Suíça em Pricing and Availability → Availability (escopo
      final ficou "jurisdições tipo-GDPR", mais amplo que só UE+RU).

#### Assets de loja (App Store, separado do Play Store)

- [ ] Screenshots por tamanho de dispositivo exigido pela Apple (hoje:
      6.9" iPhone obrigatório; 13" iPad se `supportsTablet` for mantido —
      **é o caso**, `app.json` tem `supportsTablet: true` nas duas
      plataformas, então screenshots de iPad também serão pedidas).
- [x] Descrição, subtítulo, keywords, screenshots (iPhone 6,5" e iPad 13",
      geradas a partir da screenshot da Shop — funcionais, trocar por
      capturas melhores quando der), Direitos de conteúdo ("Não", sem
      conteúdo de terceiros) — tudo preenchido em 2026-09-08.
- [x] Ícone — já existe (`assets/icon.png`, mesmo usado no Play Console).

### iOS — submetido pra revisão em 2026-09-08

- [x] **App + os 4 IAPs enviados juntos pra revisão da Apple** (versão 1.0,
      lançamento configurado como manual). Próximo passo é só aguardar —
      normalmente 24-48h pra primeira revisão, podendo levar mais por
      incluir IAPs pela primeira vez. Status acompanhável em App Store
      Connect → Distribuição → Histórico.
- [ ] **Enquanto espera:** validar de ponta a ponta no TestFlight (compra
      real sandbox dos 4 produtos, restore, os 3 formatos de anúncio,
      prompt de ATT) — ainda não foi feito, e não depende da revisão pra
      poder testar agora.
- [x] Se a Apple rejeitar ou pedir alguma correção: registrar o motivo
      aqui antes de corrigir, mesmo padrão usado pros 5 erros de build
      nativo (seção 5) — ajuda a não repetir o mesmo problema depois.

### iOS — 1ª rejeição real (Guideline 2.1(b), 2026-09-11): Paid Apps Agreement pendente

Duas mensagens da Apple, mesma causa raiz:

1. **Guideline 2.1 (genérica, conta nova)**: pediu vídeo de tela + contexto
   geral — respondida (seção 6, conteúdo já redigido lá).
2. **Guideline 2.1(b) — "cannot locate the In-App Purchases"** (build 1.0
   (13), revisado num iPad Air 11" M3): o revisor não conseguiu **usar** os
   4 IAPs (Obsidian/Emerald/Royal Deck, Remove Ads) — não é bug de UI/
   navegação (o botão da Shop está visível e funcional), é porque o
   **RevenueCat não conseguia buscar produto nenhum da App Store Connect**.
   Confirmado reproduzindo no próprio device do usuário: a Shop mostra o
   erro `None of the products registered in the RevenueCat dashboard could
   be fetched from App Store Connect` e o botão "Buy" não faz nada.

**Causa raiz:** o **Paid Applications Agreement** nunca tinha sido assinado
em App Store Connect → Negócios → Contratos (status "Novo"/depois
"Informações do usuário pendentes") — sem esse contrato ativo, a Apple não
devolve informação de produto nenhuma pro StoreKit, então nenhum provider
(RevenueCat incluso) consegue buscar os IAPs, pagos ou não.

**Passos pra resolver** (conta pessoa física, Brasil):
1. Negócios → Contratos → completar a **Conformidade com o DSA** primeiro
   (bloqueava o resto) — marcado "Não sou um comerciante sob os termos do
   DSA / não pretendo distribuir na UE" (consistente com a restrição de
   território já feita, ver ADR 0007).
2. Negócios → "Editar pessoa jurídica" (link que só aparece depois do passo
   1) → completar dados da pessoa jurídica.
3. **Adicionar conta bancária**: usada uma conta **Wise**. Tentativa
   inicial foi em **BRL** — bancos brasileiros não emitem IBAN pronto
   (precisaria calcular a partir de código do banco/agência/conta/tipo,
   ferramenta tipo `wise.com/lv/iban/brazil`), e além disso conta em BRL
   **exige documentação extra com a StoneX** (parceiro bancário da Apple
   no Brasil — formulário online em `banco.stonex.com` + carta física
   impressa/assinada/enviada por correio, pagamentos ficam retidos até
   aprovação). **Trocado pra conta Wise em EUR (Bélgica)** — evita a StoneX
   inteira (exigência é específica de moeda BRL, não da nacionalidade do
   developer) e o IBAN já vem pronto da Wise, sem cálculo manual. Único
   cuidado: o campo "Account Number" do formulário da Apple **não aceita o
   IBAN inteiro** — é o IBAN sem os 4 primeiros caracteres (código do país
   + 2 dígitos verificadores), reformatado no padrão local (Bélgica:
   `XXX-YYYYYYY-ZZ`, 3-7-2 dígitos). SWIFT/BIC vai direto, sem transformar.
   Conta ficou "Processando" por algumas horas antes de virar "Ativa".
4. **Dois formulários fiscais** (Negócios → Formulários fiscais):
   - **Questionário fiscal dos EUA** = W-8BEN da Receita americana.
     Preenchido com CPF no campo "6.a Foreign Tax Identifying Number"
     (não tem TIN americano, campo 5 fica em branco). **Parte II (Claim of
     Tax Treaty Benefits) deixada em branco de propósito** — confirmado
     via pesquisa que **Brasil não tem tratado de bitributação com os
     EUA** (uma das poucas economias do G20 nessa situação), então não há
     benefício de alíquota reduzida pra reivindicar; a retenção padrão de
     30% sobre a receita de origem americana se aplica de qualquer jeito.
   - **Formulário fiscal do Brasil**: CPF + residência fiscal.
   - **Certificado próprio da Apple** ("U.S. Certificate of Foreign Status
     of Beneficial Owner"): tipo "Individual/Sole proprietor", campo
     "Title" preenchido como "Self" (pessoa física assinando por si mesma,
     não um cargo de empresa).
5. ✅ **Resolvido em 2026-09-11**: conta Wise (Bélgica, EUR) "Ativa", os 3
   formulários fiscais "Ativo" (Brasil, W-8BEN, certificado da Apple),
   conformidade DSA "Ativo" — **Acordo de apps pagos virou "Ativo"**.

- [x] **Confirmado**: Shop testada de novo no TestFlight (mesmo build, sem
      rebuild) — oferta carregou e a compra funcionou. Vídeo gravado e
      enviado pra Apple; a revisão já testou esse fluxo e não voltou a
      reclamar do Guideline 2.1(b) — considerado resolvido.

### iOS — 2ª rejeição real (Guideline 2.5.4, 2026-09-14): `UIBackgroundModes: audio` não usado

**Mensagem da Apple:** app declara a capability de áudio em background
(`UIBackgroundModes: audio`) mas não reproduz nenhum áudio em background —
sugeriu remover a capability, já que não é usada.

**Causa raiz:** `app.json` tinha `"expo-audio"` como string simples (sem
opções) no array de `plugins`. O plugin do `expo-audio`
(`node_modules/expo-audio/plugin/src/withAudio.ts`) tem
`enableBackgroundPlayback` com **default `true`** — herdado silenciosamente,
sem nenhuma linha em `app.json` pedindo isso. Confirmado via grep que o
código nunca usa nenhuma API de sessão de áudio em background/modo
silencioso (`setAudioModeAsync`, `staysActiveInBackground` etc. — zero
ocorrências) — o app de fato não precisa disso, consistente com o que a
Apple apontou.

**Fix:** `app.json` → `["expo-audio", { "enableBackgroundPlayback": false }]`.
Verificado: `npm run typecheck` limpo, `npm test` (22 suites, 555 testes)
passando.

**Correção considerada e descartada:** cogitou-se remover o pacote
`expo-audio` inteiro "pra não ter nenhum problema com a Apple". Investigado
via grep — `services/feedback.ts` usa `expo-audio`'s `createAudioPlayer` de
verdade, em **foreground**, pra tocar os tons sintetizados de SFX nas
jogadas/combos (ticket 15). Remover o pacote quebraria essa feature real.
Distinção que importa: a capability de **background** (não usada, causou a
rejeição, já corrigida acima) é diferente do uso de **foreground** (usado,
funcional, deve ficar).

### iOS — auditoria de código com `/app-store-review` (2026-09-15)

Rodada a skill `app-store-review` (auditoria estática local, sem rede)
contra o código do app, cruzando com este checklist. Achou 1 ponto crítico
+ 1 observação, ambos corrigidos no mesmo dia:

- [x] **Crítico — Guideline 5.1.1(i)**: a política de privacidade
      (`docs/privacy.html`, publicada via o remote `pages` em
      `https://vitorverrone.github.io/combo-forge/privacy.html`) só estava
      preenchida no App Store Connect/Play Console — a guideline exige o
      link **também dentro do app**, "easily accessible", não só no
      metadata da loja. Fix: link adicionado em `ProfileScreen.tsx` (chave
      i18n `profile.privacyPolicy`, `en`/`pt`), abre a URL real via
      `Linking.openURL`.
- [x] **Observação (não bloqueia a Apple, mas suja o Data Safety do
      Play)**: `android.permission.RECORD_AUDIO` e `MODIFY_AUDIO_SETTINGS`
      estavam declaradas manualmente em `app.json` (`android.permissions`)
      sem nenhum uso real de microfone no código — sobra do default do
      plugin `expo-audio`, que o app nunca precisou. `FOREGROUND_SERVICE` e
      `FOREGROUND_SERVICE_MEDIA_PLAYBACK` também sobravam ali, remanescentes
      de quando `enableBackgroundPlayback` ainda usava o default `true`
      (ver rejeição 2.5.4 acima). Fix: removidas as 3 permissões não usadas
      do array manual (`MODIFY_AUDIO_SETTINGS` ficou — plugin sempre
      adiciona, necessária pra playback normal) + `recordAudioAndroid:
      false` explícito na config do plugin `expo-audio`, pra parar de gerar
      `RECORD_AUDIO` de novo em builds futuros.

**Nenhum dos dois teria evitado as rejeições reais já enfrentadas** (Paid
Apps Agreement é processo de negócio/conta, não código; 2.5.4 foi
descoberto pela própria revisão da Apple antes desta auditoria) — a skill
serve como checagem estática complementar, não substitui a leitura das
mensagens reais de revisão nem a navegação do App Store Connect.

**Pendente após este fix:** novo build (`eas build --platform ios --profile
production`) e submit, já que mudança de permissões/plist é config nativa —
não dá pra corrigir só respondendo a Apple ou editando metadata.

### iOS — 3ª rejeição real (2026-09-16): "Simulated Gambling", bloqueio de conta individual

**Duas mensagens da Apple, mesma causa raiz:**

1. **Bloqueio de conta individual para apps com "simulated gambling"**: a
   Apple não aceita mais esse tipo de conteúdo vindo de contas de
   desenvolvedor pessoa física — só pessoa jurídica verificada pode publicar
   daqui pra frente.
2. **Guideline 2.3.6 — Accurate Metadata**: o revisor jogou o app (iPad Air
   11" M3, build 1.0 (15)) e decidiu que o Combo Forge tem "frequent
   simulated gambling", inconsistente com a resposta atual do questionário
   de Age Rating — pediu pra marcar "Frequent" em "Simulated Gambling".

**Causa raiz:** nada na *mecânica* do jogo é gambling (sem aposta, sem risco
de perder recurso por sorte, sem cash-out) — o problema é 100% na
*apresentação visual*, que lia como vídeo-pôquer/cassino pro revisor:

- os 7 padrões de pontuação usavam os nomes canônicos de mãos de pôquer
  (`Pair`, `Two Pair`, `Three of a Kind`, `Straight`, `Full House`, `Four of
  a Kind`), numa lista ordenada por força — visualmente uma tabela de
  pagamento de cassino;
- naipes reais (♠♥♦♣) com a convenção vermelho/preto de baralho
  (`isRedSuit`);
- anatomia de carta de baralho de verdade (valor girado 180° no canto
  oposto, como uma carta física legível dos dois lados);
- mão de exatamente 5 cartas;
- o nome do IAP "Royal Deck" (evoca "Royal Flush").

Precedente real conhecido: **Balatro** (mesma mecânica-base — baralho
padrão, mãos de pôquer, combos) recebeu a mesma classificação da Apple;
publica porque o developer é pessoa jurídica, não indivíduo — confirma que
é a apresentação, não a mecânica, que dispara a regra.

**Decisão tomada:** reskin temático (não reescrever o jogo do zero e não
contestar a classificação). `engine/patterns.ts` **não mudou uma linha** —
`PatternKind.FullHouse` etc. continuam os identificadores internos pra
sempre (chave de save, testes, DDA, relíquias); só a camada de exibição
mudou:

- **Padrões renomeados** (tema de ferraria, `i18n/en.json` +
  `i18n/pt.json`): High Card→Raw Ore, Pair→Twin Ingot, Two Pair→Double Weld,
  Three of a Kind→Triple Cast, Straight→Forged Chain, Full House→Master
  Alloy, Four of a Kind→Perfect Cast. Descrições de composição ("2 cards of
  the same value") mantidas — já eram neutras.
- **Naipes → 4 Materiais da forja**: Ferro (spades), Brasa (hearts), Cristal
  (diamonds), Carvão (clubs) — `SuitSymbol.tsx` reescrito com ícones
  próprios (lingote, chama, gema lapidada, nódulo), `theme.ts` ganhou
  `suitColors` com uma cor distinta por Material (rompe de propósito a
  convenção 2-vermelho/2-preto, que era um dos sinais lidos como cassino).
- **`isRedSuit` removido** de `format.ts`, `PlayingCard.tsx`, `RelicIcon.tsx`,
  `ForgeScreen.tsx` — substituído por `suitColor(suit, skin?)`, que lê a cor
  do Material (própria ou da skin equipada).
- **`DeckSkinPalette`** (`engine/shop.ts`) ganhou `suits: Record<Suit,
  string>` no lugar do único campo `red` — cada uma das 4 skins da Loja
  (Classic/Obsidian/Emerald/Royal) agora define as 4 cores de Material
  ajustadas à sua face. `productId` de cada uma **não mudou** (já registrados
  em ASC/Play Console/RevenueCat) — só o `name`/`description` exibidos no
  app: "Royal Deck" → "Gilded Set" (tirando a referência a Royal Flush),
  "Obsidian/Emerald Deck" → "Obsidian/Emerald Set".
- **`OnboardingOverlay.tsx`** (passo `selectCards` do tutorial): tinha 3
  cartas hardcoded com naipe Unicode + vermelho/preto (A♥, 7♠, 10♦) — **essa
  é a tela exata que apareceu num dos 2 screenshots que a Apple anexou na
  rejeição**. Trocado pra usar `SuitSymbol`/`suitColor` como o resto do app.
- Ícone de coroa do 1º lugar no ranking diário (`DailyChallengeScreen.tsx`)
  trocado de `♦` (lia como naipe) pra `★`.
- Vocabulário geral: "Deck" → "Set"/"Conjunto" nos textos de UI (Loja,
  Coleção, Conquista "Full Deck" → "Full Set").
- Identificadores internos (`'spades'`, `'hearts'` etc.) **não foram
  renomeados** — são chave de save no SQLite (`cardKey`, `stats.cardPlays`);
  mudar isso quebraria save existente por zero ganho de revisão (Apple avalia
  o binário rodando, não o código-fonte).

Verificado: `npm run typecheck` limpo, `npm test` (22 suites, 555 testes)
passando sem alteração — confirma que o motor de pontuação/regras não foi
tocado, só a apresentação.

- [ ] **Pendente (ação manual no portal, não é código)**: os "Display Name"
      dos 3 IAPs de skin em App Store Connect/RevenueCat ainda dizem
      "Obsidian/Emerald/Royal Deck" (seção 6 deste documento) — precisam
      virar "Obsidian/Emerald/Gilded Set" pra bater com o app, senão volta a
      inconsistência de metadata do Guideline 2.3.6.
- [ ] **Pendente**: screenshots da App Store/TestFlight foram tiradas com a
      UI antiga (cartas de baralho) — refazer depois do build novo.
- [ ] **Pendente**: novo build (`eas build --platform ios --profile
      production --auto-submit`) incorporando o reskin, e marcar "None" em
      Simulated Gambling no questionário de Age Rating **só depois** do
      build novo estar no ar (marcar antes seria a mesma inconsistência que
      a Apple já rejeitou).
- [ ] **Recomendado**: incluir uma nota curta na resubmissão explicando a
      mudança visual pro revisor não precisar adivinhar (nomes de Material
      em vez de naipe, nomes de padrão temáticos em vez de mãos de pôquer).

---

## 7. Checklist final pré-produção

### Android

- [ ] AdMob: perfil de pagamento completo (✅), ad unit Interstitial criada
      (✅). Vínculo com a ficha da Play Store e saída de "Requer revisão"
      ficam bloqueados até depois da publicação em produção.
- [x] RevenueCat: 4 produtos reais criados no app Android, anexados à
      offering `default` e à entitlement `remove_ads`, credencial de
      service account do Google Play configurada, chave igual em
      `preview`/`production`.
- [ ] Play Console: 4 produtos em app criados (✅); Data safety preenchido;
      assets de loja completos; teste fechado com 12 testadores por 14 dias
      concluído.
- [ ] Build de produção instalado em device físico com todo o fluxo
      validado (compra real, restore, os 3 formatos de anúncio).

### iOS (novo)

- [x] AdMob: app + 3 ad units reais criadas; ATT implementado.
- [ ] AdMob: SKAdNetworkItems preenchido antes do build de produção final.
- [x] RevenueCat: In-App Purchase Key gerada e configurada; 4 produtos
      criados no app "Combo Forge (App Store)"; entitlement e offering
      anexadas; chave de API do RevenueCat pro iOS no `.env`/EAS.
- [x] App Store Connect: Tradução + Review Information dos 4 IAPs
      preenchidos; App Privacy preenchido; Availability restringindo
      jurisdições tipo-GDPR.
- [ ] App Store Connect: assets de loja (screenshots iPhone/iPad,
      descrição, keywords) — ainda pendente, separado dos IAPs.
- [x] Build de produção (`eas build --platform ios --profile production`)
      gerado e enviado via `eas submit`; instalado no TestFlight.
- [ ] Validar de ponta a ponta no TestFlight: compra real sandbox, restore,
      os 3 formatos de anúncio, prompt de ATT.
- [ ] App + os 4 IAPs submetidos juntos pra revisão da Apple.

---

## 8. Firebase Analytics (telemetria — ADR 0007 / ticket 01)

O código já está pronto — port `TelemetryProvider` (`engine/telemetry.ts`),
implementação real em `services/firebaseAnalytics.ts` (API modular do
`@react-native-firebase/analytics`, import dinâmico com degradação
silenciosa pra no-op, mesmo padrão do AdMob):

- [x] Criar um projeto no [console do Firebase](https://console.firebase.google.com)
      (`combo-forge-1ac97`).
- [x] Adicionar um app **Android** com o package `com.combocardforge.app`
      (igual ao AdMob/Play Console). `google-services.json` na raiz (fora
      do git).
- [x] **Adicionar um app iOS** com o bundle ID `com.combocardforge.app`
      (igual ao AdMob/App Store Connect). `GoogleService-Info.plist` na
      raiz (fora do git, `.gitignore` atualizado em 2026-09-08).
- [x] Plugin `@react-native-firebase/app` no array `plugins` do `app.json`,
      com `googleServicesFile` ligado nas duas plataformas
      (`android.googleServicesFile` e `ios.googleServicesFile`, este último
      adicionado em 2026-09-08).
- [ ] Rebuild (`eas build`, as duas plataformas) e validar em device físico
      que eventos chegam no DebugView do Firebase Analytics.
- [ ] Declarar no Data Safety form (Play) e no App Privacy form (App Store
      Connect) — seção 6.

Sem o `google-services.json`/`GoogleService-Info.plist` (ausentes em
qualquer clone novo até alguém repetir os passos acima),
`services/firebaseAnalytics.ts` cai no `catch` — o app funciona
integralmente, só sem nenhum evento chegando no Firebase.

### Consentimento (ADR 0007, revisitada em 2026-09-08)

A decisão original de **não ter modal de consentimento bloqueante** (só
declaração via Data Safety/política de privacidade) tinha um gatilho de
revisita explícito: "se/quando a distribuição pra UE ou iOS entrar em
escopo". iOS entrou em escopo agora — a decisão foi **manter sem modal**,
restringindo a disponibilidade do app na App Store Connect pra excluir
UE + Reino Unido (seção 6, Availability) em vez de construir a tela de
consentimento. Ver ADR 0007 pro raciocínio completo.

---

## Referências no código

| Serviço | Fallback sem env | Onde |
|---|---|---|
| Supabase | `createUnavailableDailyBackend` (Desafio indisponível) | `services/supabase.ts` |
| RevenueCat | `createDevShopProvider` (compra simulada) | `services/revenuecat.ts` |
| AdMob | `createDevAdProvider` (anúncio sempre ok) | `services/ads.ts` |
| App Tracking Transparency (iOS) | No-op no Android/sem módulo nativo | `services/tracking.ts` |
| Firebase Analytics | Import dinâmico falha → no-op silencioso (sem `google-services.json`/`GoogleService-Info.plist`) | `services/firebaseAnalytics.ts`, `engine/telemetry.ts` |
| Banner (visibilidade) | oculto sem ad unit, com remoção comprada, ou antes do ATT resolver (iOS) | `engine/adProvider.ts`, `components/AdBanner.tsx`, `App.tsx` |
| Loja (orquestração) | — (fluxo com ports injetados) | `store/shopFlow.ts` |
| Produtos da loja | `COSMETIC_CATALOG` (3 skins pagas + Classic grátis) | `engine/shop.ts` |
| Remoção de anúncios | `REMOVE_ADS_PRODUCT_ID`/`REMOVE_ADS_ENTITLEMENT_ID` (fora do catálogo) | `engine/shop.ts` |
| Contrato Supabase | — | `supabase/README.md`, `supabase/contract.ts` |
| Pesquisa de compliance iOS (ATT/SKAdNetwork/ASC) | — | `docs/research/ios-launch-admob-revenuecat-appstore.md` |
