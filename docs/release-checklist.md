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
5. **RevenueCat → app "Combo Forge (App Store)":** criar os mesmos 4
   produtos (mesmos productIds do catálogo/Android) + gerar e subir a
   **In-App Purchase Key** (seção 2 "App iOS real no RevenueCat").
6. **App Store Connect → Produtos em app:** os 4 IAPs já existem (você
   confirmou) — falta preencher Tradução da App Store + Review Information
   (screenshot) de cada um antes de submeter pra revisão (seção 6 "Produtos
   em app (IAPs)" — conteúdo já redigido, só copiar/colar).
7. ~~**App Store Connect → Pricing and Availability:** restringir a
   disponibilidade pra excluir jurisdições tipo-GDPR.~~ ✅ Feito em
   2026-09-08 — desmarcados os 27 países da UE, Reino Unido, Islândia,
   Noruega (EEE) e Suíça (decisão registrada na ADR 0007 revisitada —
   mantém a política de "sem modal de consentimento GDPR" sem reabrir esse
   escopo agora).
8. **App Store Connect → App Privacy:** preencher o questionário de
   privacidade (equivalente ao Data Safety do Play) — mesmos SDKs/dados já
   declarados na política de privacidade (seção 6 "App Privacy").
9. **`eas build --profile production --platform ios`** — primeira vez:
   confirma/gera certificado de distribuição + provisioning profile via EAS
   (fluxo interativo, precisa da sua conta Apple Developer logada uma vez).
10. **`eas submit --platform ios --profile production`** — envia o `.ipa`
    pro App Store Connect (primeira vez também pede login Apple/ASC API
    Key). Testar em TestFlight antes de submeter pra revisão (opcional, mas
    recomendado — sem prazo mínimo diferente do Play Console).
11. **Submeter o app + os 4 IAPs pra revisão da Apple** (App Store Connect →
    versão do app → "Add for Review", com os IAPs anexados à mesma
    submission — Apple revisa app e IAP juntos na primeira vez).
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
| App Store Connect — app + IAPs | ✅ **Criados** (você confirmou, 2026-09-08) | Faltam campos de revisão dos IAPs (seção 6) e o App Privacy form |
| App Store Connect — Availability | ⏳ Pendente | Restringir UE + Reino Unido (decisão de 2026-09-08, ver ADR 0007) |
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

- [ ] Key `.p8` gerada e baixada (guardar em local seguro, ex.: gerenciador
      de senhas — não vai pro git, mesmo padrão do
      `google-play-service-account.json`).
- [ ] Upload feito + Issuer ID preenchido no RevenueCat, validação passou.
- [ ] Os 4 productIds criados em Products → app "Combo Forge (App Store)"
      → New Product (mesmos productIds do catálogo — ver tabela acima).
- [ ] Entitlement `remove_ads` anexada ao Remove Ads do iOS (mesma
      entitlement já usada pro Android — a RevenueCat mostra os dois
      produtos, Android + iOS, na lista de "Associated products").
- [ ] Offering `default`: os 4 packages ganham o lado iOS anexado ao lado
      do Android/Test Store já existentes.
- [ ] Chave pública do RevenueCat pro app iOS (`appl_...`) preenchida no
      `.env`/EAS — **atenção:** é uma chave diferente da `goog_...` usada
      hoje (essa é específica do app Android). Pode ser necessário separar
      por plataforma via `Platform.OS` em `services/revenuecat.ts` se o
      RevenueCat não usar uma única chave "cross-platform" pro projeto —
      checar no dashboard qual modelo esse projeto usa antes de mexer no
      código.

### Verificar

- [x] Provider dev e Test Store validados de ponta a ponta (compra, equip,
      restore, remoção de anúncios) — ver histórico abaixo.
- [ ] Testar compra e restore **reais no Android** (produto + licença de
      teste do Play Console) — depende de tudo acima.
- [ ] Testar compra e restore **reais no iOS** (produto + sandbox tester do
      App Store Connect) — depende da In-App Purchase Key acima.

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
- [ ] `EXPO_PUBLIC_REVENUECAT_API_KEY` do iOS — pendente até a chave `appl_...`
      (ou equivalente cross-platform) existir no RevenueCat (seção 2).
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
- [ ] Instalar via TestFlight (upload automático do `eas submit`, ou
      manual) e validar de ponta a ponta: Run normal, Desafio Diário
      completo, compra + restore reais (sandbox tester do App Store
      Connect), anúncio recompensado, intersticial, banner, prompt de ATT.
- [ ] `eas submit --platform ios --profile production --latest` — envia o
      `.ipa` pro App Store Connect.

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

- [ ] Abrir o app (dev build ou TestFlight) → ir pra tela **Shop** (ícone
      no topo) → tirar um screenshot mostrando os 4 itens com preço/botão
      de compra visíveis.
- [ ] Fazer upload da mesma imagem no campo "Screenshot" de Review
      Information dos 4 produtos.

*(Se preferir, posso rodar o app numa build local e capturar essa tela
automaticamente via `/run` — mais rápido pra você tirar você mesmo agora
com o app já aberto, mas avise se quiser que eu gere.)*

#### App Privacy (equivalente ao Data Safety do Play)

- [~] Questionário "App Privacy" em preenchimento (2026-09-08) — tipos de
      dado, vínculo à identidade e uso pra rastreamento decididos e
      registrados na ADR 0007 (seção "App Privacy — declarações de
      rastreamento"), com a tabela completa das 9 respostas (ID de usuário,
      ID do dispositivo, Histórico de compras, Interações com o produto,
      Dados de publicidade, Outras informações de uso, Localização
      aproximada, Dados de falhas, Dados de desempenho). Falta só terminar
      de clicar na UI da App Store Connect.

#### Availability

- [ ] **Restringir território:** excluir União Europeia + Reino Unido
      (decisão de 2026-09-08 — ver ADR 0007 revisitado). Pricing and
      Availability → Availability → desmarcar os países da UE + UK.

#### Assets de loja (App Store, separado do Play Store)

- [ ] Screenshots por tamanho de dispositivo exigido pela Apple (hoje:
      6.9" iPhone obrigatório; 13" iPad se `supportsTablet` for mantido —
      **é o caso**, `app.json` tem `supportsTablet: true` nas duas
      plataformas, então screenshots de iPad também serão pedidas).
- [ ] Descrição, subtítulo, keywords (equivalente à descrição curta/longa
      do Play, mas com limites de caracteres próprios da Apple — confirmar
      na UI do App Store Connect ao preencher).
- [ ] Ícone — já existe (`assets/icon.png`, mesmo usado no Play Console).

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
- [ ] RevenueCat: In-App Purchase Key gerada e configurada; 4 produtos
      criados no app "Combo Forge (App Store)"; entitlement e offering
      anexadas; chave de API do RevenueCat pro iOS no `.env`/EAS.
- [ ] App Store Connect: Tradução + Review Information dos 4 IAPs
      preenchidos (conteúdo pronto na seção 6); App Privacy preenchido;
      Availability restringindo UE/RU; assets de loja (screenshots
      iPhone/iPad, descrição, keywords) completos.
- [ ] Build de produção (`eas build --platform ios --profile production`)
      instalado via TestFlight com todo o fluxo validado (compra real
      sandbox, restore, os 3 formatos de anúncio, prompt de ATT).
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
