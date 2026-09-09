Status: ready-for-agent

# Onboarding de Liga, permissão de notificação no cold start, e fix do ranking de Divisão vazio

Referências: [ADR-0012](../../docs/adr/0012-notificacao-queda-tier-liga.md) (atualização 2026-09-08), [ADR-0010](../../docs/adr/0010-ligas-e-sequencia-desafio-diario.md), `CONTEXT.md` (termos Liga, Tier, Divisão, Notificação).

## Problem Statement

Três problemas observados na tela do Desafio Diário/Liga (ADR 0010, ADR 0012):

1. Ao entrar no Desafio Diário, o jogador é bloqueado imediatamente pelo modal de Nome de Exibição, antes de qualquer explicação sobre o que é a Liga/Tiers/Divisão que aparece logo abaixo. Não existe hoje nenhum onboarding específico da Liga — só o onboarding geral do jogo (`OnboardingOverlay`), que não fala de Liga.
2. A notificação de queda de Tier depende de um soft-ask dentro do próprio app (`PushSoftAskBanner`) que precede o prompt nativo do SO, mostrado só quando a Liga ativa pro dispositivo. Isso adia (e em muitos casos nunca chega a pedir) a permissão nativa, reduzindo quantos dispositivos ficam de fato habilitados a receber a notificação — o produto agora prioriza simplicidade (pedir cedo, como a maioria dos apps) sobre a taxa de opt-in.
3. O ranking de uma Divisão aparece vazio para um jogador que ainda não pontuou na semana corrente, mesmo quando outros dispositivos do mesmo Tier já pontuaram nessa mesma semana — dá a impressão de que "ninguém jogou" quando na verdade já existe gente posicionada.

## Solution

1. Um modal de onboarding novo, específico da Liga (`DailyOnboardingOverlay`), mostrado uma única vez por dispositivo ao entrar no Desafio Diário, explicando Tiers, Divisão semanal e Sequência antes de qualquer outra interação. O modal de Nome de Exibição deixa de abrir sozinho ao montar a tela — passa a abrir apenas quando o jogador toca no botão de jogar, e só então (com o nome salvo) a Run começa.
2. A permissão de notificação passa a ser pedida via o prompt nativo do sistema operacional, direto, no cold start absoluto da primeira sessão do app — sem soft-ask nem nenhum card/banner do jogo antes. Instalações que já responderam ao soft-ask (já em produção) não são reafetadas.
3. O ranking de uma Divisão passa a sempre mostrar uma lista: a própria Divisão do jogador quando ele já pontuou na semana, ou a Divisão 1 do seu Tier como prévia quando ainda não pontuou — nunca mais uma lista vazia com outros jogadores já posicionados.

## User Stories

1. Como um jogador novo entrando no Desafio Diário pela primeira vez, quero ver uma explicação da Liga (Tiers/Divisão/Sequência) antes de qualquer outra coisa, para entender o sistema de competição antes de jogar.
2. Como um jogador que já viu o onboarding de Liga, não quero vê-lo de novo toda vez que abro o Desafio Diário, para não ser interrompido repetidamente numa tela que visito todo dia.
3. Como um jogador que esqueceu como a Liga funciona, quero reabrir a explicação a qualquer momento tocando num botão "?" ao lado do botão de voltar na tela do Desafio Diário, para relembrar sem precisar perguntar a alguém.
4. Como um jogador vendo o onboarding de Liga, quero poder fechá-lo a qualquer momento tocando num X, para não ser forçado a ler tudo se já entendi o sistema.
5. Como um jogador entrando no Desafio Diário pela primeira vez, não quero ser bloqueado por um pedido de Nome de Exibição antes de decidir se vou jogar, para poder só olhar o ranking/Liga sem compromisso.
6. Como um jogador tocando em "jogar" pela primeira vez, quero que me peçam um Nome de Exibição nesse momento, para que meu nome apareça no ranking quando eu pontuar.
7. Como um jogador que acabou de salvar o Nome de Exibição depois de tocar em "jogar", quero que minha Run comece automaticamente, para não precisar tocar em "jogar" de novo.
8. Como um jogador que já tem um Nome de Exibição salvo, quero que tocar em "jogar" inicie a Run direto, sem nenhum modal extra, para manter o fluxo rápido de todo dia.
9. Como um jogador que tenta salvar um Nome de Exibição inválido (formato ou termo proibido) depois de tocar em "jogar", quero ver o erro e poder tentar de novo, sem perder minha intenção de jogar assim que corrigir o nome.
10. Como um jogador abrindo o app pela primeira vez, quero que o próprio sistema operacional me pergunte se posso receber notificações, para decidir usando a interface nativa em que já confio.
11. Como um jogador, não quero ver nenhum card ou banner do próprio jogo pedindo pra eu ativar notificações, para não ter uma segunda camada de pedido em cima da do sistema operacional.
12. Como um jogador que já respondeu (concedeu ou negou) a permissão de notificação numa sessão anterior, não quero ser perguntado de novo em cada abertura do app, para não ser incomodado repetidamente.
13. Como um jogador em qualquer plataforma (iOS ou Android), quero que o pedido de permissão de notificação funcione do mesmo jeito (prompt nativo, uma vez, cedo), para ter uma experiência consistente independente do meu aparelho.
14. Como um jogador que desceu de Tier na semana e havia concedido a permissão, quero continuar recebendo a notificação de queda de Tier normalmente, para saber que preciso jogar mais pra recuperar a posição.
15. Como um jogador tocando numa notificação de queda de Tier, quero ser levado direto pra tela do Desafio Diário, para ver minha nova posição sem precisar navegar manualmente.
16. Como um jogador em qualquer Tier, quero ver o ranking da minha Divisão populado com quem já pontuou essa semana, mesmo antes de eu mesmo pontuar, para saber contra quem estou competindo antes de decidir jogar.
17. Como um jogador que ainda não pontuou na semana, quero ver a Divisão 1 do meu Tier como referência, para ter uma ideia de quem são os melhores da minha faixa mesmo sem minha própria posição calculada ainda.
18. Como um jogador que já pontuou na semana, quero ver minha própria Divisão (a que realmente contém minha posição), não a Divisão 1 genérica, para saber exatamente contra quem estou competindo de verdade.
19. Como um jogador numa semana em que a Liga ainda não ativou (base abaixo do limiar), quero ver o leaderboard único de sempre sem nenhuma mudança, para que o sistema continue funcionando normalmente até a Liga ativar.
20. Como um jogador novo, quero que minha pontuação de estreia não determine meu Tier inicial (sempre Bronze, ADR 0010, comportamento já existente e sem mudança nesta spec), para que a competição valorize desempenho sustentado, não uma única run — e quero que o onboarding novo deixe essa regra clara desde o início.

## Implementation Decisions

### Onboarding de Liga + gate do Nome de Exibição

- `store/dailyFlow.ts`: `DailyState` ganha dois campos — `dailyOnboardingSeen: boolean` e `pendingPlayIntent: boolean` (ambos persistidos/derivados via o port existente, default `false`).
- `DailyChallengeStorage` (port) ganha `loadDailyOnboardingSeen(): boolean` / `saveDailyOnboardingSeen(): void`, carregado no boot junto com `attempts`/`deviceId` (mesmo ponto de `store/bootstrap.ts`).
- Novo `DailyCommand`: `{ type: 'requestPlay' }`, tratado em `runDailyCommand`:
  - `displayName !== null`: comportamento idêntico ao `{ type: 'start' }` de hoje (reaproveita a mesma função interna).
  - `displayName === null`: não mexe em tentativas/seed; devolve o mesmo `DailyState` com `pendingPlayIntent: true` e `run: null`.
- `{ type: 'setDisplayName', name }`: ao salvar com sucesso, se `pendingPlayIntent` estava `true`, encadeia a mesma lógica interna de início de Run (reaproveitada de `requestPlay`/`start`) e devolve `pendingPlayIntent: false`. Falha na validação/salvamento não mexe em `pendingPlayIntent` — a intenção de jogar continua pendente até o nome ser salvo com sucesso.
- `components/DailyChallengeScreen.tsx`: `DisplayNameModal` passa a renderizar quando `daily.displayName === null && daily.pendingPlayIntent` (em vez de só `daily.displayName === null`). O botão de jogar (CTA principal) chama uma action nova `requestPlay()` no `gameStore` (espelha `startDailyChallenge`) em vez de `startDailyChallenge()` direto.
- Novo componente `components/DailyOnboardingOverlay.tsx`, mesmo padrão visual/estrutural de `components/OnboardingOverlay.tsx` (Modal com X pra fechar, não bloqueante, sem tela de progresso obrigatória). Conteúdo (i18n): explica os 5 Tiers, a mecânica de subida/descida por Divisão semanal, que a pontuação de estreia não define o Tier inicial, e a Sequência — sempre o mesmo conteúdo, independente do estado atual da Liga pro dispositivo (decisão do grill: a base de jogadores já passa do limiar de ativação).
- `DailyChallengeScreen` renderiza `DailyOnboardingOverlay` quando `!daily.dailyOnboardingSeen`; fechar (X) chama uma action nova `completeDailyOnboarding()` que seta `dailyOnboardingSeen: true` e persiste via o storage port.
- Botão "?" novo na topbar da `DailyChallengeScreen`, ao lado do `TopButton` de voltar, que reabre `DailyOnboardingOverlay` sob demanda — controlado por estado local do componente (não depende de `dailyOnboardingSeen`, mesmo padrão do "?" que já existe na `GameScreen` para o onboarding geral).

### Notificação — permissão nativa no cold start

- Removidos: `PushSoftAskState` e `shouldShowPushSoftAsk` (`engine/pushProvider.ts`); `acceptPushSoftAsk` e `declinePushSoftAsk` (`store/pushFlow.ts`); `PushSoftAskBanner` e seu uso (`components/DailyChallengeScreen.tsx`); as actions `acceptPushSoftAsk`/`declinePushSoftAsk` do `gameStore.ts`.
- `PushFlowStorage` troca `loadSoftAskState`/`saveSoftAskState` (3 estados: unresolved/accepted/declined) por `hasRequestedPushPermission(): boolean` / `saveRequestedPushPermission(): void` — não há mais escolha do jogador dentro do app, só "o prompt do SO já foi disparado ou não".
- Nova função em `store/pushFlow.ts`: `requestPushPermissionOnColdStart(deviceId: string, deps: PushFlowDeps): Promise<void>`. Se `storage.hasRequestedPushPermission()` for `true`, no-op. Senão: chama `provider.requestPermission()`; se `'granted'`, busca o token via `provider.getExpoPushToken()` e registra com `backend.registerToken`; ao final, sempre chama `storage.saveRequestedPushPermission()` (concedida, negada, ou indisponível — nunca pede de novo, mesmo raciocínio de "nunca mais pergunta" do soft-ask antigo). Nunca lança — mesmo contrato de falha-silenciosa dos outros providers (`AdProvider`, `TelemetryProvider`).
- `store/bootstrap.ts` (`initializeSqlitePersistence`): chama `void requestPushPermissionOnColdStart(deviceId, pushFlowDeps)` fire-and-forget, no mesmo ponto onde já dispara `void gameStore.getState().syncRemoveAdsEntitlement()` — roda antes de qualquer tela montar. Mesmo espírito do fire-and-forget já usado por `services/tracking.ts` (`requestTrackingPermission`, popup nativo de ATT no iOS, chamado num efeito do primeiro render de `AppShell` em `App.tsx`), só que este dispara ainda mais cedo, na avaliação do módulo.
- `PushState` (fatia do store) perde `softAskState` — passa a não carregar nenhum estado de UI de push (nenhuma tela mostra mais nada sobre push).
- Sem mudança: listener de toque em notificação (`registerNotificationTapListener` → `openDaily`) e o job semanal de queda de Tier (ADR 0012, ticket 03).
- Documentação: ADR 0012 recebe uma nota de "Atualização (2026-09-08)" inline (já aplicada nesta sessão) e o termo "Notificação" do `CONTEXT.md` foi atualizado (já aplicado) — sem ADR novo.

### Fix do ranking de Divisão vazio

- Nova migration `supabase/migrations/0009_league_division_default_bracket.sql`, redefinindo `_league_division_view` (mesma observação de "`create or replace function` não preserva `SECURITY DEFINER`/`search_path`" já registrada em migrations anteriores, se a função precisar ser redefinida por completo).
- Troca o join implícito `select r.* from ranked r, own_row o where ...` (que devolve zero linhas quando `own_row` está vazio) por uma comparação contra um bucket com fallback: usa a divisão de `own_row` quando ela existir, senão o bucket `0` (Divisão 1) do Tier.
- `own` e `division` (número) no JSON de resposta continuam `null` quando o dispositivo não pontuou na semana (sem mudança) — só o array `top` deixa de vir vazio nesse caso.
- `supabase/contract.test.ts` ganha um cenário novo (golden-value): dispositivo sem pontuação na semana corrente, mas com outros dispositivos do mesmo Tier já pontuados — espera `own: null`, `division: null`, `top` populado com a Divisão 1.
- `npm run verify:backend` roda contra Postgres real cobrindo esse cenário (mesma exigência já registrada no ticket original da Liga).

## Testing Decisions

- Boa prática já estabelecida no repo: testar via as interfaces dos flows (`runDailyCommand`, funções de `pushFlow.ts`) com ports fake em memória, nunca renderizando componentes React — não há nem nunca houve testes de componente neste projeto (só `*.test.ts`, nenhum `*.test.tsx` próprio do código do jogo).
- `store/dailyFlow.test.ts`: novos casos para `requestPlay` (com `displayName` presente vs. ausente), para o encadeamento `setDisplayName` → início automático de Run quando `pendingPlayIntent` é `true` (sucesso e também falha de validação, que não deve iniciar Run nem perder o pending), e para round-trip de `dailyOnboardingSeen` via o storage port. Mesmo padrão dos testes existentes de `start`/`setDisplayName` já no arquivo.
- `store/pushFlow.test.ts`: reescreve os testes de `acceptPushSoftAsk`/`declinePushSoftAsk` para `requestPushPermissionOnColdStart` — cenários: concedida (registra token), negada (não registra, mas marca "já solicitado"), indisponível (idem), falha do backend ao registrar (best-effort, não quebra), e já solicitado antes (no-op, nenhuma chamada aos ports). Mesma estrutura de mocks já usada no arquivo (`makeFakePushBackend`, `createMemoryPushProvider`).
- `engine/pushProvider.test.ts`: remove os testes de `shouldShowPushSoftAsk` (função removida, sem substituto — não há mais predicado de UI para push).
- `supabase/contract.test.ts` + `npm run verify:backend`: cenário novo do fallback de Divisão (golden-value test + verificação contra Postgres real), mesmo padrão dos cenários de Liga já cobertos (piso Bronze, teto Diamante, empate na fronteira de subida/descida).
- Sem testes dedicados para `DailyOnboardingOverlay` nem para o botão "?" novo — mesmo tratamento que `OnboardingOverlay` já recebe hoje (verificação manual/visual).

## Out of Scope

- Congelamento de Sequência, notificação de "Sequência em risco", lembrete de pausa não-bloqueante — já registrados como backlog nos ADRs 0010/0012, sem mudança nesta spec.
- Copy ou texto customizado no prompt nativo de permissão de notificação — não é tecnicamente possível (limitação do próprio SO) e não é desejado pelo produto.
- Mudanças na cadência ou no gatilho da notificação de queda de Tier em si (ADR 0012, ticket 03 — job semanal) — só a captação da permissão muda, o disparo da notificação continua igual.
- Season pass, reset de temporada, recompensa visual (moldura/borda) por Tier — já fora de escopo do ADR 0010.
- Qualquer mudança na regra de subida/descida de Tier ou no cálculo de qual Divisão cada dispositivo pertence (migration 0004) além do fallback de exibição quando o dispositivo não pontuou — a lógica de ranking/promoção/rebaixamento em si não muda.
- Reprocessamento de dado histórico em `league_placements` — o fix é só na consulta de exibição (`_league_division_view`), não precisa reprocessar nada já gravado.
- Onboarding geral do jogo (`OnboardingOverlay`) — continua exatamente como está, sem relação com o onboarding novo da Liga.

## Further Notes

- O soft-ask (`PushSoftAskBanner`, `acceptPushSoftAsk`/`declinePushSoftAsk`) já está em produção (ADR 0012, ticket 02, mergeado) — esta spec reverte um comportamento já usado por jogadores reais, não uma feature ainda não lançada. Instalações que já responderam ao soft-ask não são reafetadas: o SO não reabre um prompt nativo pra uma decisão já tomada, então `requestPushPermissionOnColdStart` é um no-op de fato pra esses dispositivos (mesmo sem checar `hasRequestedPushPermission`, mas essa flag evita a chamada redundante ao provider em todo cold start).
- O bug do ranking de Divisão vazio (`_league_division_view`) foi descoberto durante esta sessão de grill, a partir de um relato real: o autor entrou no Desafio Diário antes de jogar e viu o ranking do Bronze vazio, apesar de outras pessoas já terem pontuado nessa mesma semana; ao submeter sua própria pontuação, a lista passou a aparecer. A causa raiz é um join SQL que zera quando o próprio dispositivo ainda não tem uma linha em `ranked` — documentado com mais detalhe na sessão de `/grill-with-docs` que precedeu esta spec.
- As decisões de notificação foram registradas como nota de "Atualização (2026-09-08)" inline no ADR 0012 (mesmo padrão já usado pelo ADR 0010 quando o limiar de participantes mudou de ~300 para ~30), e o termo "Notificação" do `CONTEXT.md` foi atualizado — ambas as edições já aplicadas antes desta spec ser escrita, sem branch/commit ainda (aguardando o fluxo normal de implementação).
