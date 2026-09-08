# Telemetria de produto via Firebase Analytics, sem gate de consentimento

O premortem de lançamento (2026-09-03, `.scratch/premortem-lancamento/`) achou que nenhum dos 8 modos de falha identificados é hoje observável, porque o projeto não tem telemetria nenhuma — nem retenção D1/D7/D30, nem calibração do DDA, nem fill rate real do AdMob. Decidimos instrumentar com **Firebase Analytics** (`@react-native-firebase/app` + `@react-native-firebase/analytics`, integração nativa via config plugin, mesmo padrão de AdMob/RevenueCat) em vez de uma tabela própria no Supabase ou de um terceiro como PostHog: cohorts de retenção D1/D7/D30, funis e segmentação por dispositivo já vêm prontos no console, sem exigir SQL/dashboard escrito à mão por uma equipe de uma pessoa só.

Consentimento fica só por declaração — Data Safety form do Play Console + política de privacidade — sem modal bloqueante na UI. Nenhum outro SDK do app (AdMob, RevenueCat, Supabase) tem gate de consentimento hoje, e o escopo original era Android/teste fechado no Brasil (a própria conta AdSense é brasileira), com iOS/UE marcados como gatilho de revisita.

**Revisitado em 2026-09-08** (decisão de lançar no iOS): em vez de adicionar o modal de consentimento GDPR, a App Store Connect vai **restringir a disponibilidade do app** (Pricing and Availability → Availability) — mantém a decisão original intacta (sem modal bloqueante) sem reabrir esse escopo maior agora. A exclusão aplicada não foi só "UE + Reino Unido" no sentido estrito de bloco político: também exclui **Islândia, Noruega** (EEE — incorporam o GDPR na legislação local, mesma exposição legal da UE) e **Suíça** (lei de proteção de dados própria, nFADP, princípios equivalentes) — ou seja, a fronteira real da restrição é "jurisdições com regime tipo-GDPR", não o bloco da União Europeia isolado. O gatilho de revisita passa a ser "se algum dia decidirmos distribuir numa dessas jurisdições", não mais "iOS" isoladamente — iOS por si só (fora dessas jurisdições) não muda a análise de consentimento, só o Data Safety/App Privacy form correspondente (App Store tem o seu próprio, "App Privacy", equivalente ao Data Safety do Play).

A identidade do usuário no Firebase (`setUserId`) é o mesmo `device_id` anônimo já usado pelo Desafio Diário no Supabase — permite cruzar um caso específico de ranking com o funil de retenção dele, útil pra suporte sendo uma equipe pequena; não introduz PII, mantém a mesma superfície de anonimato que o Desafio Diário já tem.

## Eventos customizados (v1)

Além do que o Firebase já coleta automaticamente (sessão, dispositivo, tela): `run_started`, `run_ended`, `round_result`, `dda_adjustment`, `milestone_unlocked`, `restart_immediate`, `ad_request_result`, `purchase_completed`, `shop_opened`. Cobrem 6 dos 8 modos de falha do premortem que são observáveis via evento in-app — ASO/aquisição de usuários e capacidade de equipe não são.

## Alternativas consideradas

- **Tabela própria no Supabase** (mesmo padrão de port do Desafio Diário): descartada pra v1 — zero SDK novo e zero entrada extra no Data Safety form, mas cohort de retenção e funil precisam ser SQL escrito à mão, trabalho real demais pra uma pessoa só sustentar.
- **PostHog**: descartado — dashboards de produto prontos, mas é mais um serviço terceiro pra gerenciar (conta, chave de API) e menos focado em mobile/jogos que Firebase.
- **Modal de consentimento bloqueante antes da coleta**: descartado pra v1 — mais seguro pra expansão internacional futura, mas introduz uma tela nova (o app não tem nenhuma tela de configurações hoje) e um fluxo de opt-out que nada mais no app tem — escopo maior que "telemetria mínima". Revisitado em 2026-09-08: mantido descartado, optou-se por restringir a disponibilidade do app pra fora das jurisdições tipo-GDPR (UE, Reino Unido, Islândia, Noruega, Suíça) em vez de construir o modal (ver acima).

## App Privacy (App Store Connect) — declarações de rastreamento, 2026-09-08

Ao preencher o formulário App Privacy da App Store Connect (equivalente ao
Data Safety do Play, seção 6 do `release-checklist.md`), a Apple pergunta
por tipo de dado se ele é **vinculado à identidade** e se é **usado para
rastreamento** — essa segunda pergunta cai na mesma zona cinzenta do ATT
(seção 1 de `docs/research/ios-launch-admob-revenuecat-appstore.md`): a
definição de "rastreamento" da Apple inclui vinculação a dados de terceiros
pra fins de "medição de publicidade", não só anúncio direcionado, e o
próprio Google admite que o modo não-personalizado do AdMob ainda usa
identificador pra "frequency capping e relatórios agregados" — o que se
encaixa nessa definição. Decisão: responder de forma **consistente com a
decisão do ATT** (fechar a zona cinzenta de forma conservadora) para os
dados que passam pelo AdMob, e responder com base no comportamento real do
app pros dados próprios (Supabase/Firebase/RevenueCat, que nunca saem pra um
terceiro com fins de publicidade):

| Dado | Vinculado à identidade? | Usado para rastreamento? | Finalidade marcada |
|---|---|---|---|
| ID de usuário (`device_id` anônimo) | Sim | Não | Funcionalidade do app + Análise |
| ID do dispositivo (AdMob) | Não | Sim | Publicidade de terceiros |
| Histórico de compras (RevenueCat) | Sim | Não | Funcionalidade do app |
| Interações com o produto (Firebase Analytics) | Sim | Não | Análise |
| Dados de publicidade (AdMob) | Não | Sim | Publicidade de terceiros |
| Outras informações de uso (score do Desafio Diário) | Sim | Não | Funcionalidade do app |
| Localização aproximada (AdMob, via IP) | Não | Sim | Publicidade de terceiros |
| Dados de falhas (AdMob SDK) | Não | Não | Funcionalidade do app |
| Dados de desempenho (AdMob SDK) | Não | Não | Funcionalidade do app |

Raciocínio por grupo:
- **Dados próprios do app** (ID de usuário, Interações com o produto,
  Histórico de compras, Outras informações de uso) — "Sim" vinculado
  porque a vinculação a um dispositivo específico ao longo do tempo é o
  próprio propósito (ranking do Desafio Diário, funil de retenção,
  restore de compra). "Não" rastreamento porque nenhum desses é
  compartilhado com terceiro pra fins de publicidade — ficam só no
  Supabase/Firebase/RevenueCat, como infraestrutura do próprio app.
- **Dados do AdMob** (ID do dispositivo, Dados de publicidade, Localização
  aproximada) — "Não" vinculado porque o app está configurado NPA-only
  (`requestNonPersonalizedAdsOnly: true`), o que a comunidade do AdMob
  confirma que evita a vinculação à identidade. "Sim" rastreamento por
  consistência com a decisão do ATT acima — zona cinzenta resolvida na
  direção conservadora.
- **Dados de falhas/desempenho do AdMob SDK** — o próprio Google descreve
  como "non-user related", puramente diagnóstico técnico, fora da
  definição de rastreamento da Apple.

## Consequências

- A telemetria entra na arquitetura como mais uma port injetada nos `store/*Flow.ts` (mesmo padrão de `DailyBackend`/`revenuecat`/`ads.ts`, com provider no-op em dev/teste) — `engine/` permanece puro, sem efeito colateral de telemetria.
- Sequenciamento: a instrumentação precisa estar no app **antes** de recrutar os 12 testadores do teste fechado do Google Play — essa janela de 14 dias corridos é a única com jogadores reais antes da produção, e hoje ficaria sem nenhum dado observável se a telemetria entrasse depois.
