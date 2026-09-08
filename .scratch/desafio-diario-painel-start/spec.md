Status: ready-for-agent

# Painel do Desafio Diário na Start Screen

Referências: [ADR-0011](../../docs/adr/0011-desafio-diario-prioridade-start-screen.md), [ADR-0003](../../docs/adr/0003-desafio-diario-seed-completo-sem-dda.md), [ADR-0010](../../docs/adr/0010-ligas-e-sequencia-desafio-diario.md), `CONTEXT.md` (termos Desafio Diário, Sequência).

## Problem Statement

Hoje, ao abrir o app, o jogador vê o botão "Iniciar Run" (Run normal) em destaque dourado, com o Desafio Diário reduzido a um botão secundário cinza abaixo dele — só com um contador de tentativas como pista ("· 0/1 tentativas usadas"). Isso não comunica que o Desafio Diário é a razão estrutural pra voltar ao app no dia seguinte (seed único do dia, ranking semanal, Sequência de dias consecutivos): a hierarquia visual atual da Start Screen empurra o jogador pro modo errado quando o objetivo é fazer ele voltar amanhã.

## Solution

A Start Screen ganha um painel dedicado do Desafio Diário — visualmente destacado, com o mesmo peso que hoje só o botão "Iniciar Run" tem — posicionado entre o leque de cartas e o seletor de Forjador. O painel mostra tentativas restantes e, quando existir, a Sequência atual de dias consecutivos, com um texto de convite que muda conforme o estado do dia (tentativa grátis pronta, tentativa extra pronta, ou pode assistir anúncio por outra). O botão "Iniciar Run" perde o destaque dourado e passa a ser o botão secundário. Tocar o painel sempre navega para a tela do Desafio Diário — a lógica de assistir anúncio, Nome de Exibição obrigatório e leaderboard continua só lá, sem duplicação.

## User Stories

1. Como jogador que nunca abriu o Desafio Diário, ao abrir o app quero ver um convite claro e visualmente dominante para o Desafio Diário, para que eu entenda desde a primeira sessão que existe um motivo pra eu voltar amanhã.
2. Como jogador que ainda não jogou o Desafio Diário hoje, quero que o painel deixe claro que tenho uma tentativa gratuita pronta, para que eu saiba que a ação está disponível agora.
3. Como jogador que já usou a tentativa gratuita de hoje mas já assistiu um anúncio e tem uma tentativa extra liberada, quero que o painel me diga que essa tentativa está pronta pra jogar, para que eu não pense que preciso assistir outro anúncio antes.
4. Como jogador que já jogou a tentativa liberada de hoje e pode assistir outro anúncio por mais uma, quero que o painel me convide a isso, para que eu saiba que ainda posso continuar competindo hoje sem esperar até amanhã.
5. Como jogador com uma Sequência de dias consecutivos ativa (Sequência > 0), quero ver esse número no painel da Start Screen, para que o "não quero quebrar a sequência" me puxe de volta todo dia sem precisar abrir a tela do Desafio Diário pra checar.
6. Como jogador sem Sequência ativa (Sequência = 0, nunca jogou ou quebrou ontem), quero que o painel não mostre uma linha de Sequência vazia ou com zero, para que o painel não pareça quebrado ou desmotivador.
7. Como jogador, ao tocar em qualquer lugar do painel quero ser levado para a tela do Desafio Diário (`DailyChallengeScreen`), para que eu possa ver o ranking, a Sequência completa, e jogar ou assistir o anúncio a partir de lá — sem esse fluxo ser duplicado na Start Screen.
8. Como jogador que abre o app pela primeira vez, quero que o onboarding continue me ensinando o loop principal através da Run normal, para que eu entenda a mecânica do jogo antes de ser levado a competir no Desafio Diário — a mudança de hierarquia não deve pular ou alterar o onboarding existente.
9. Como jogador, quero continuar podendo iniciar uma Run normal facilmente a partir da Start Screen (agora como ação secundária, não mais em destaque dourado), para que eu não perca acesso rápido ao loop principal do jogo mesmo com o Desafio Diário em destaque.
10. Como desenvolvedor mantendo o código, quero que a lógica dos 3 estados do CTA do Desafio Diário (grátis pronta / extra pronta / assistir anúncio) exista em um único lugar testável, para que `StartScreen` e `DailyChallengeScreen` nunca divirjam sobre qual estado mostrar.

## Implementation Decisions

- **Novo seam em `engine/daily.ts`**: função pura `dailyCallToActionState(attempts: DailyAttempts): 'free-ready' | 'extra-ready' | 'watch-ad'`, substituindo o `if/else` hoje calculado inline dentro de `DailyChallengeScreen.tsx` (baseado em `rem = unlockedTotal - attemptsUsed` e `attemptsUsed`). As três saídas mapeiam para as chaves de i18n já existentes: `free-ready` → `daily.freeReady`, `extra-ready` → `daily.extraReady`, `watch-ad` → `daily.watchAdHint`.
- **`DailyChallengeScreen.tsx` é refatorada** para consumir `dailyCallToActionState` em vez do cálculo inline atual — remove a duplicação, sem mudar o comportamento visível da tela.
- **Novo componente na Start Screen** (ex.: `DailyChallengePanel`, dentro de `components/StartScreen.tsx` ou extraído para `components/DailyChallengePanel.tsx` — decisão de organização de arquivo fica a critério de quem implementa) renderizado entre o bloco do leque de cartas (`titleCardFan`) e o seletor de Forjador (`sectionLabel`/`forgerRow`) na `StartScreen`.
  - Conteúdo: label "Desafio Diário" (reaproveita `start.dailyChallenge`), contador de tentativas restantes (mesma fonte de dado que o hint atual, `dailyAttemptsForDay(daily.attempts, utcDateIso())`), texto de estado (via `dailyCallToActionState`), e linha de Sequência (`daily.streakLabel` + `progression.stats.dailyStreakCurrent`) **apenas quando `dailyStreakCurrent > 0`** — omitida por completo quando é 0.
  - Sem Tier de Liga e sem posição no ranking — nenhum fetch de rede novo na `StartScreen`; esses dados continuam exclusivos da `DailyChallengeScreen` (só busca ao abrir a tela, per `CONTEXT.md`/ADR-0010).
  - Tocar em qualquer parte do painel dispara `openDaily` (já existe no `gameStore`, mesma action que o botão secundário atual usa) — nenhuma lógica de anúncio, Nome de Exibição ou navegação nova.
- **Botão "Iniciar Run" perde o estilo `btnPrimary`** (dourado) e passa a usar o estilo hoje aplicado ao Desafio Diário (`btnSecondary`), permanecendo na pilha de CTA abaixo do seletor de Forjador, junto com o item de navegação da Coleção — só ele muda de estilo, sem mudar de posição ou comportamento.
- **Aplica-se desde a primeira abertura do app** — o `OnboardingOverlay` (gate via `hasSeenOnboarding()`) não é alterado; a hierarquia nova só afeta o que é visualmente dominante na Start Screen depois do onboarding, nunca durante.
- **Novas chaves de i18n** (pt.json/en.json) apenas as que faltarem para o painel — texto de label e estado devem reaproveitar `start.dailyChallenge`, `daily.freeReady`, `daily.extraReady`, `daily.watchAdHint` e `daily.streakLabel`, já existentes. Qualquer chave nova (ex.: rótulo curto do CTA do painel) segue o namespace `start.*`, mesmo padrão das chaves atuais dessa tela.
- **Fora de escopo desta spec**: `RunWonScreen`/`RunLostScreen` (ver ADR-0011, "Considered Options"); Tier de Liga no painel; qualquer notificação push (tema de uma spec separada).

## Testing Decisions

- Um teste só deve verificar comportamento externo (input → output), não detalhes de implementação — mesmo princípio já seguido em `engine/daily.test.ts`.
- `dailyCallToActionState` ganha testes novos em `engine/daily.test.ts`, cobrindo os 3 estados a partir de `DailyAttempts` (mesmo padrão table-driven das funções vizinhas nesse arquivo: `canPlayDaily`, `canWatchExtraAd`, `hasFreeAttempt`) — inclusive os casos de transição já cobertos indiretamente pelos testes existentes (ex.: "usar a gratuita consome a tentativa e trava a próxima sem anúncio" deve corresponder a `watch-ad`).
- A refatoração de `DailyChallengeScreen.tsx` para usar `dailyCallToActionState` não deve mudar nenhum texto renderizado — não há teste automatizado de UI cobrindo essa tela hoje (`docs/analise-melhorias.md`, item 8 já registra a ausência de `@testing-library/react-native` no projeto), então a verificação de que o texto continua idêntico é manual/visual, mesmo padrão já usado em mudanças anteriores de UI neste repo.
- O painel novo na `StartScreen` (`DailyChallengePanel` ou equivalente) não recebe teste automatizado dedicado — mesma convenção já estabelecida no projeto pra componentes finos (lógica no motor, UI sem framework de teste de componente).
- Verificação funcional real (não só `tsc`/testes) via emulador/simulador, cobrindo os 3 estados do painel (tentativa grátis pronta, extra pronta, watch-ad) e o caso `dailyStreakCurrent > 0` vs `= 0`.

## Out of Scope

- `RunWonScreen`/`RunLostScreen` não recebem nenhum convite novo pro Desafio Diário nesta spec (backlog futuro, ver ADR-0011).
- Tier de Liga (ADR-0010) não aparece no painel — continua exclusivo da `DailyChallengeScreen`.
- Atalho de assistir anúncio direto da Start Screen — o painel sempre navega pra `DailyChallengeScreen`, nunca dispara `watchAdForExtraAttempt` diretamente.
- Qualquer mudança no `OnboardingOverlay` ou no fluxo de onboarding.
- Notificação (push ou local) de qualquer tipo relacionada ao Desafio Diário, Sequência ou Liga — tema de uma spec separada.

## Further Notes

- Nomenclatura: o elemento é chamado de "painel" em toda documentação pt-br (specs, tickets, ADRs) — nunca "card"/"cartão" — porque "Carta" já é termo reservado no glossário do projeto pra carta de baralho (`CONTEXT.md`). Identificadores de código em inglês (`DailyChallengePanel`, por exemplo) não têm esse conflito.
- Objetivo de produto declarado (ADR-0011): mover as métricas de retenção D7/D30 do GDD (§8), não D1 nem engajamento com anúncio recompensado — isso deve calibrar qualquer decisão de copy/estilo não coberta explicitamente aqui (ex.: preferir linguagem de "volte amanhã"/Sequência a linguagem de urgência de compra ou de "assista mais anúncios").
