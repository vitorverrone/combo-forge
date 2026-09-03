# 02 — Funil de Run observável

**What to build:** Os eventos que tornam o funil de uma Run observável de ponta a ponta — quando começa, quando termina, o resultado de cada Rodada, e a taxa do loop "só mais uma tentativa" (restart imediato pós-derrota). Depois deste ticket dá pra ver no Firebase quantas Runs começam, terminam, em qual Rodada, e com que margem.

**Blocked by:** 01 — Port de telemetria (Firebase Analytics) instalado e conectado.

**Status:** ready-for-agent

- [ ] `startRun()` no `gameStore` dispara `run_started` com o forjador ativo e o número da Run.
- [ ] O tratamento dos eventos `runWon`/`runLost` no `gameStore` (mesmo ponto que já chama `recordRunEnd`) dispara `run_ended` com resultado, rodada alcançada e pontuação.
- [ ] O tratamento dos eventos `roundWon`/`roundLost` no `gameStore` dispara `round_result` com o número da Rodada, o resultado, a margem em relação à Meta e o número da tentativa.
- [ ] `restartRun()` dispara `restart_immediate` com os segundos desde o `runLost` anterior, só quando esse tempo fica abaixo de um limiar curto definido na implementação — acima do limiar, não dispara.
- [ ] Testes cobrindo os 4 eventos acima com um `TelemetryProvider` fake injetado no `gameStore`, mesmo padrão de `gameStore.test.ts` (fakes de `AdProvider`/`ShopProvider` já injetados hoje).
