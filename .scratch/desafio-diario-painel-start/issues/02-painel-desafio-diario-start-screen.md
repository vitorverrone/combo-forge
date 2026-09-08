# 02 — Painel do Desafio Diário na Start Screen + rebaixar "Iniciar Run"

**What to build:** inverter a hierarquia visual da Start Screen para priorizar o Desafio Diário (ADR-0011), visando retenção D7/D30. Um painel novo do Desafio Diário — visualmente destacado, mesmo peso que hoje só "Iniciar Run" tem — entra entre o leque de cartas e o seletor de Forjador, mostrando: label "Desafio Diário" (`start.dailyChallenge`), contador de tentativas restantes (`dailyAttemptsForDay(daily.attempts, utcDateIso())`, mesma fonte que o hint atual), o texto de estado correspondente via `dailyCallToActionState` (ticket 01), e uma linha de Sequência (`daily.streakLabel` + `progression.stats.dailyStreakCurrent`) **somente quando `dailyStreakCurrent > 0`** — omitida por completo quando é 0. Tocar em qualquer parte do painel dispara a mesma action `openDaily` que o botão secundário atual já usa — sem lógica de anúncio, Nome de Exibição ou navegação nova. O botão "Iniciar Run" perde o estilo `btnPrimary` (dourado) e passa a usar o estilo hoje aplicado ao Desafio Diário (secundário), mantendo posição e comportamento — só o estilo muda. Aplica-se desde a primeira abertura do app; o `OnboardingOverlay` não é alterado.

**Blocked by:** 01 — Extrair `dailyCallToActionState` e refatorar `DailyChallengeScreen` (o painel precisa consumir essa função, não duplicar a lógica de estado).

**Status:** ready-for-agent

- [ ] Painel novo do Desafio Diário renderizado entre o leque de cartas (`titleCardFan`) e o seletor de Forjador (`forgerRow`) na `StartScreen`
- [ ] Painel mostra label, contador de tentativas, e texto de estado correto nos 3 casos (`free-ready`/`extra-ready`/`watch-ad`) via `dailyCallToActionState`
- [ ] Linha de Sequência aparece quando `dailyStreakCurrent > 0` e desaparece por completo quando é 0 (sem linha vazia ou "0" visível)
- [ ] Tocar em qualquer parte do painel navega para `DailyChallengeScreen` (via `openDaily`) — sem atalho de anúncio direto da Start Screen
- [ ] Botão "Iniciar Run" perde o destaque dourado (`btnPrimary`) e passa a usar o estilo secundário, sem mudar de posição ou comportamento (`startRun` continua funcionando)
- [ ] Nenhuma chamada de rede nova disparada pela `StartScreen` (Tier de Liga e ranking continuam exclusivos da `DailyChallengeScreen`)
- [ ] Onboarding (`OnboardingOverlay`, `hasSeenOnboarding()`) inalterado — continua rodando normalmente na primeira abertura
- [ ] Verificação funcional real em emulador/simulador cobrindo os 3 estados do painel e os dois casos de Sequência (> 0 e = 0)
- [ ] `tsc --noEmit` limpo, `eslint .` sem problemas, suíte de testes passando
