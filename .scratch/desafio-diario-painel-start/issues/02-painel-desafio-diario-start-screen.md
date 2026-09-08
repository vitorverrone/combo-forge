# 02 — Painel do Desafio Diário na Start Screen + rebaixar "Iniciar Run"

**What to build:** inverter a hierarquia visual da Start Screen para priorizar o Desafio Diário (ADR-0011), visando retenção D7/D30. Um painel novo do Desafio Diário — visualmente destacado, mesmo peso que hoje só "Iniciar Run" tem — entra entre o leque de cartas e o seletor de Forjador, mostrando: label "Desafio Diário" (`start.dailyChallenge`), contador de tentativas restantes (`dailyAttemptsForDay(daily.attempts, utcDateIso())`, mesma fonte que o hint atual), o texto de estado correspondente via `dailyCallToActionState` (ticket 01), e uma linha de Sequência (`daily.streakLabel` + `progression.stats.dailyStreakCurrent`) **somente quando `dailyStreakCurrent > 0`** — omitida por completo quando é 0. Tocar em qualquer parte do painel dispara a mesma action `openDaily` que o botão secundário atual já usa — sem lógica de anúncio, Nome de Exibição ou navegação nova. O botão "Iniciar Run" perde o estilo `btnPrimary` (dourado) e passa a usar o estilo hoje aplicado ao Desafio Diário (secundário), mantendo posição e comportamento — só o estilo muda. Aplica-se desde a primeira abertura do app; o `OnboardingOverlay` não é alterado.

**Blocked by:** 01 — Extrair `dailyCallToActionState` e refatorar `DailyChallengeScreen` (o painel precisa consumir essa função, não duplicar a lógica de estado).

**Status:** done

- [x] Painel novo do Desafio Diário renderizado entre o leque de cartas (`titleCardFan`) e o seletor de Forjador (`forgerRow`) na `StartScreen`
- [x] Painel mostra label, contador de tentativas, e texto de estado correto nos 3 casos (`free-ready`/`extra-ready`/`watch-ad`) via `dailyCallToActionState`
- [x] Linha de Sequência aparece quando `dailyStreakCurrent > 0` e desaparece por completo quando é 0 (sem linha vazia ou "0" visível)
- [x] Tocar em qualquer parte do painel navega para `DailyChallengeScreen` (via `openDaily`) — sem atalho de anúncio direto da Start Screen
- [x] Botão "Iniciar Run" perde o destaque dourado (`btnPrimary`) e passa a usar o estilo secundário, sem mudar de posição ou comportamento (`startRun` continua funcionando)
- [x] Nenhuma chamada de rede nova disparada pela `StartScreen` (Tier de Liga e ranking continuam exclusivos da `DailyChallengeScreen`)
- [x] Onboarding (`OnboardingOverlay`, `hasSeenOnboarding()`) inalterado — continua rodando normalmente na primeira abertura
- [ ] Verificação funcional real em emulador/simulador cobrindo os 3 estados do painel e os dois casos de Sequência (> 0 e = 0) — **não realizada**: sem emulador Android disponível no ambiente do agente, e `expo export --platform web` falha por uma dependência nativa pré-existente (`sp-react-native-in-app-updates`), não relacionada a esta mudança. Vale uma checagem visual rápida antes de considerar o ticket totalmente fechado.
- [x] `tsc --noEmit` limpo, `eslint .` sem problemas, suíte de testes passando

## Comments

- O ticket/spec não deixavam explícito o destino do antigo botão secundário "Daily Challenge · X/Y attempts used" na CTA stack depois que o painel novo entra em cena. Perguntado, o usuário confirmou: remover o botão antigo — o painel novo já cobre 100% da sua função (mesmo contador/estado, mesma navegação via `openDaily`), então mantê-lo duplicaria informação e ação na mesma tela. A CTA stack ficou só com "Iniciar Run" (agora estilo secundário) + Coleção. A chave de i18n `start.attemptsUsed`, órfã depois dessa remoção, foi apagada de `en.json`/`pt.json`.
