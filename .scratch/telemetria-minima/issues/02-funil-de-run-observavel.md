# 02 — Funil de Run observável

**What to build:** Os eventos que tornam o funil de uma Run observável de ponta a ponta — quando começa, quando termina, o resultado de cada Rodada, e a taxa do loop "só mais uma tentativa" (restart imediato pós-derrota). Depois deste ticket dá pra ver no Firebase quantas Runs começam, terminam, em qual Rodada, e com que margem.

**Blocked by:** 01 — Port de telemetria (Firebase Analytics) instalado e conectado.

**Status:** done

- [x] `startRun()` no `gameStore` dispara `run_started` com o forjador ativo e o número da Run (`runsStartedCount`, contador dedicado — ver nota abaixo).
- [x] O tratamento dos eventos `runWon`/`runLost` no `gameStore` (mesmo ponto que já chama `recordRunEnd`) dispara `run_ended` com resultado, rodada alcançada e pontuação.
- [x] O tratamento dos eventos `roundWon`/`roundLost` no `gameStore` dispara `round_result` com o número da Rodada, o resultado, a margem em relação à Meta e o número da tentativa (`attemptNumberForRound`, `engine/dda.ts`).
- [x] `restartRun()` dispara `restart_immediate` com os segundos desde o `runLost` anterior (limiar de 10s), só abaixo do limiar — acima, não dispara. Zera em toda vitória, pra não disparar por engano usando o timestamp de uma derrota antiga de uma Run anterior.
- [x] Testes cobrindo os 4 eventos acima com um `TelemetryProvider` fake injetado no `gameStore`, mesmo padrão de `gameStore.test.ts` (12 testes novos, incluindo casos negativos e a regressão do runNumber).

**Nota (achado do code-review):** o "número da Run" não usa `progression.stats.runsStarted` — esse campo só incrementa quando uma Run *termina*, então abandonar uma Run pelo `backToStart()` sem terminá-la repetiria o mesmo número na próxima. Novo campo `runsStartedCount` no `GameState`, incrementado em `startRun()`, cobre isso corretamente (teste de regressão incluso).
