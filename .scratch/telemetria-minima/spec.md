# Combo Forge: telemetria mínima de produto

Status: ready-for-agent

## Problem Statement

O jogo não tem telemetria nenhuma. O premortem de lançamento (`.scratch/premortem-lancamento/`) achou que nenhum dos 8 modos de falha identificados é hoje observável: não dá pra saber a retenção D1/D7/D30 nem segmentá-la por dispositivo, não dá pra saber se o DDA está calibrado pra jogadores reais (só foi calibrado contra perfis simulados do `game-health-check`), não dá pra saber se o loop de restart imediato virou compulsivo, não dá pra saber quantas sessões um jogador leva até esgotar a meta-progressão, e não dá pra saber o fill rate real do AdMob. O time descobriria qualquer um desses problemas tarde demais — só quando a retenção agregada já tivesse caído — porque hoje não existe nenhum sinal granular pra investigar a causa.

## Solution

Instrumentar o app com Firebase Analytics (ADR 0007): 9 eventos customizados nos pontos de orquestração que já existem no `gameStore`/`shopFlow`/`ads`, mais o que o Firebase já coleta automaticamente (sessão, dispositivo, tela). Sem modal de consentimento — só declaração no Data Safety form do Play Console e na política de privacidade, consistente com os outros SDKs do app (AdMob, RevenueCat, Supabase), nenhum dos quais tem gate de consentimento hoje. A identidade do usuário no Firebase é o mesmo `device_id` anônimo que o Desafio Diário já usa no Supabase, permitindo cruzar um caso específico de ranking com o funil de retenção dele. A telemetria entra como mais uma port injetada no `gameStore` (mesmo padrão de `AdProvider`/`DailyBackend`/`ShopProvider`), com uma implementação de desenvolvimento que não faz nada — sem tocar o Firebase de verdade fora de build de produção.

## User Stories

1. Como jogador, eu quero que meu início de Run gere um evento `run_started` com o forjador escolhido e o número da Run, para que o time consiga medir quantas Runs cada jogador realmente inicia.
2. Como jogador, eu quero que o fim da minha Run (vitória ou derrota) gere um evento `run_ended` com o resultado, a rodada alcançada e a pontuação, para que o time consiga medir profundidade média de Run e correlacionar com retenção.
3. Como jogador, eu quero que cada Rodada vencida ou perdida gere um evento `round_result` com o número da Rodada, o resultado, a margem em relação à Meta e o número da tentativa, para que o time consiga detectar se o DDA está deixando jogadores entediados ou frustrados.
4. Como jogador, eu quero que todo ajuste do DDA (Meta reduzida após 3 derrotas seguidas, ou aumentada após 5 vitórias fáceis) gere um evento `dda_adjustment` com a direção e o gatilho, para que o time consiga medir a distribuição real de ajustes por coorte de habilidade.
5. Como jogador, eu quero que todo marco de meta-progressão desbloqueado gere um evento `milestone_unlocked` com o identificador do marco, para que o time consiga medir quantas sessões um jogador leva até esgotar o conteúdo desbloqueável.
6. Como jogador, eu quero que reiniciar uma Run logo após perder gere um evento `restart_immediate` com os segundos desde a derrota anterior, para que o time consiga medir a taxa do loop "só mais uma tentativa" e detectar se virou compulsivo.
7. Como jogador, eu quero que toda solicitação de anúncio (recompensado, intersticial ou banner) gere um evento `ad_request_result` com o formato e se preencheu ou não, para que o time consiga medir o fill rate real do AdMob antes e depois da aprovação no readiness review.
8. Como jogador, eu quero que toda compra concluída (skin ou remoção de anúncios) gere um evento `purchase_completed` com o identificador do produto, para que o time consiga correlacionar conversão com padrões de retenção.
9. Como jogador, eu quero que abrir a Loja gere um evento `shop_opened`, para que o time consiga medir a taxa de descoberta da Loja entre quem nunca comprou nada.
10. Como jogador, eu quero que meu identificador anônimo de telemetria seja o mesmo `device_id` do Desafio Diário, para que, se eu reportar um problema, o time consiga cruzar meu histórico de ranking com meu funil de retenção sem me pedir nenhum dado pessoal.
11. Como jogador, eu quero que nada disso apareça como um modal ou tela nova no app, para que a experiência de jogo não mude em nada — só declaração no Data Safety form e na política de privacidade, como os outros SDKs já fazem.
12. Como desenvolvedor rodando testes ou build de desenvolvimento, eu quero que a telemetria não toque o Firebase de verdade, para que os testes continuem determinísticos e o dev build não polua os dados de produção.
13. Como product owner, eu quero a telemetria funcionando **antes** de recrutar os 12 testadores do teste fechado do Google Play, para que essa janela de 14 dias corridos — a única com jogadores reais antes da produção — gere dados observáveis em vez de ser desperdiçada.

## Implementation Decisions

- **Novo port `TelemetryProvider` em `engine/`** (mesmo molde de `AdProvider` em `engine/adProvider.ts`): interface com um método `logEvent(name, params)` genérico — os 9 eventos da taxonomia são chamadas desse método com nomes e parâmetros fixos, não 9 métodos separados na interface — e um método `setUserId(deviceId)`. Inclui `createDevTelemetryProvider()`, implementação no-op (`logEvent`/`setUserId` não fazem nada), usada por padrão em testes e dev build.
- **Implementação real em `services/firebaseAnalytics.ts`**: `createAppTelemetryProvider()` usando `@react-native-firebase/analytics`, mesmo padrão de `createAppAdProvider()` em `services/ads.ts` (seleção de implementação real vs. dev por ambiente, não por env var — Firebase Analytics não tem um "Test Store" como o RevenueCat).
- **Novas dependências**: `@react-native-firebase/app` + `@react-native-firebase/analytics`, integração nativa via config plugin do Expo (mesmo padrão de `react-native-google-mobile-ads`/`react-native-purchases` — exige EAS dev client, não roda em Expo Go puro, e precisa de entrada em `app.json`/`plugins/` e novo arquivo `google-services.json` do projeto Firebase).
- **Injeção no `gameStore`**: novo campo `telemetry: TelemetryProvider` no estado, com o dev provider como padrão (mesmo padrão de `adProvider`/`dailyBackend`/`shopProvider`). `store/bootstrap.ts` substitui pelo `createAppTelemetryProvider()` e chama `telemetry.setUserId(deviceId)` no mesmo ponto onde `deviceId` já é resolvido (carregado do storage ou criado via `createDeviceId()`).
- **Pontos de disparo dos eventos, todos em orquestração já existente (nenhum seam novo além do port acima)**:
  - `run_started`: dentro de `startRun()` no `gameStore`, com o forjador ativo e o número da Run.
  - `run_ended`: no tratamento dos eventos `runWon`/`runLost` do `gameStore` (mesmo ponto que já chama `recordRunEnd`), com resultado, rodada alcançada e pontuação.
  - `round_result`: no tratamento dos eventos `roundWon`/`roundLost` do `gameStore`, com número da Rodada, resultado, margem (calculada a partir da pontuação e da Meta) e número da tentativa.
  - `dda_adjustment`: no ponto do `gameStore` que chama `persistDda`/`updateDda` (`engine/dda.ts`) após uma Rodada — dispara só quando o ajuste resultante muda a Meta (não a cada Rodada).
  - `milestone_unlocked`: no ponto do `gameStore` que chama `claimOption`/`claimReachedSingles` (`engine/progression.ts`).
  - `restart_immediate`: em `restartRun()` no `gameStore` — calcula o tempo desde o `runLost` anterior (timestamp guardado no estado da Run) e só dispara abaixo de um limiar curto (ex.: alguns segundos), não em todo restart.
  - `ad_request_result`: dentro de `requestRewardedAd`/`requestInterstitialAd` em `createAppAdProvider()` (`services/ads.ts`), e no carregamento do banner (`components/AdBanner.tsx` ou o hook que ele usa) — cada chamada real ao AdMob loga formato + preenchido/`NO_FILL`.
  - `purchase_completed`: nos caminhos de sucesso de `purchaseCosmetic`/`purchaseRemoveAds` em `store/shopFlow.ts`.
  - `shop_opened`: na montagem de `components/ShopScreen.tsx`.
- **Sem UI nova**: nenhum modal, tela de configurações ou toggle de opt-out — decisão do grilling (ADR 0007), consistente com o app hoje.
- **Sem mudança em `engine/`**: os pontos de disparo vivem nos flows do `store` e nos serviços, nunca dentro das funções puras do `engine` (`run.ts`, `dda.ts`, `progression.ts` continuam sem efeito colateral).

## Testing Decisions

- Um bom teste verifica o comportamento externo: dado um comando/ação no `gameStore` ou no `shopFlow`, verifica-se que o `TelemetryProvider` fake recebeu a chamada esperada (nome do evento + parâmetros relevantes) — nunca a implementação interna do Firebase.
- Módulos testados, no seam mais alto do projeto (mesmo padrão de `gameStore.test.ts`/`shopFlow.test.ts`/`dailyFlow.test.ts`, com um `TelemetryProvider` fake que grava as chamadas recebidas):
  - `startRun()` dispara `run_started`.
  - O tratamento de `runWon`/`runLost` dispara `run_ended` com o resultado certo.
  - O tratamento de `roundWon`/`roundLost` dispara `round_result` com a margem calculada certa.
  - O ponto de ajuste do DDA dispara `dda_adjustment` só quando a Meta muda de fato.
  - `claimOption`/`claimReachedSingles` disparam `milestone_unlocked` com o identificador certo do marco.
  - `restartRun()` dispara `restart_immediate` só abaixo do limiar de tempo definido; acima do limiar, não dispara.
  - `purchaseCosmetic`/`purchaseRemoveAds` disparam `purchase_completed` só no caminho de sucesso — cancelamento/erro não dispara.
- Prior art: `store/gameStore.test.ts` (fakes de `AdProvider`/`ShopProvider` injetados) e `store/shopFlow.test.ts` — o mesmo padrão de fake ganha um `TelemetryProvider` de teste.
- Fora do teste unitário: a integração real com `@react-native-firebase/analytics` (módulo nativo) — validada em build de produção instalado em device físico, como já é o caso de AdMob/RevenueCat no checklist de release.

## Out of Scope

- **Modal ou tela de consentimento** — decisão do grilling (ADR 0007): só declaração, sem gate na UI. Revisitar se/quando UE ou iOS entrarem em escopo.
- **Toggle de opt-out no Perfil** — o app não tem nenhuma tela de configurações hoje; criar uma só pra isso é escopo maior que "telemetria mínima".
- **Dashboards ou relatórios customizados** — usa o console do Firebase Analytics como veio (cohorts de retenção, funis), sem construir nada por cima.
- **Instrumentação de ASO/aquisição de usuários** (atribuição de campanha, UTM) — fora do escopo desta spec; é outro dos 8 modos de falha do premortem, mas não observável via evento in-app.
- **iOS** — Firebase Analytics entra só para Android nesta spec, mesmo escopo do resto do app hoje (`docs/release-checklist.md` já marca iOS como fora de escopo).
- **Atualização do `docs/release-checklist.md`** para refletir que a telemetria precisa entrar antes de recrutar os 12 testadores — é uma mudança de processo, não de código; fica para quem for executar o release, não para este ticket.

## Further Notes

- **Base de design:** ADR 0007 (`docs/adr/0007-telemetria-firebase-analytics.md`) registra as decisões do grilling — este spec é a tradução delas em contrato implementável.
- **Origem:** premortem de lançamento (`.scratch/premortem-lancamento/premortem-transcript-20260903-162414.md`), que identificou a ausência total de telemetria como o gargalo transversal que impede detectar qualquer um dos outros 7 modos de falha.
- **Urgência de sequenciamento:** esta spec deveria ser implementada e publicada em build antes de o release-checklist avançar no recrutamento dos 12 testadores do teste fechado — ver User Story 13.
