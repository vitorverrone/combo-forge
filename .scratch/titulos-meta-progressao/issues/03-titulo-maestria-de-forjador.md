# 03 — Título de Maestria de Forjador

**What to build:** o Título "vencer ao menos uma Run com cada um dos 3 Forjadores" (ADR 0009) — o único dos 10 marcos novos que precisa de uma stat nova, já que hoje não existe nenhum registro de vitórias por Forjador. `ProfileStats` ganha `winsByForger: Readonly<Record<ForgerId, number>>` (default 0 para os 3 Forjadores); `recordRunEnd` ganha um parâmetro `forger: ForgerId`, incrementando `winsByForger[forger]` só em vitória; `store/gameStore.ts` passa `result.run.forger` (já disponível em `RunState.forger`) no call site dentro de `advanceProgression`. Ponta a ponta demoável: vencer uma Run com o Aprendiz, depois com o Martelo, depois com a Bigorna desbloqueia o Título, visível no Perfil e no banner de fim de Run.

**Blocked by:** 01 (mesmo motivo da ticket 02 — depende do tratamento de `kind: 'title'` em `computeUnlocks`).

**Status:** ready-for-agent

- [ ] `ProfileStats`/`DEFAULT_PROFILE_STATS` ganham `winsByForger` com os 3 Forjadores zerados por padrão.
- [ ] `recordRunEnd(stats, won, runScore, forger)` incrementa `winsByForger[forger]` só quando `won` é `true`; derrota não altera `winsByForger`.
- [ ] Vencer duas vezes com o mesmo Forjador incrementa a contagem (não duplica um registro booleano) — condição do marco usa algo como `Object.values(winsByForger).every((count) => count > 0)`, testada com 0, 1 e 3 Forjadores já vencidos.
- [ ] `store/gameStore.ts`: o call site de `recordRunEnd` dentro de `advanceProgression` passa `result.run.forger`.
- [ ] Regressão de fiação em `store/gameStore.test.ts`: uma Run vencida com um Forjador específico (via `chooseForger`) reflete o `forger` certo em `progression.stats.winsByForger` no estado final — mesmo padrão usado no ticket 02 da telemetria pra `runsStartedCount`/`lastRunLostAt`.
- [ ] `MILESTONES` ganha o marco de maestria de Forjador, reivindicado automaticamente por `claimReachedSingles`, disparando `milestone_unlocked` com o `milestoneId` correto.
- [ ] `i18n/en.json` e `i18n/pt.json` ganham `milestones.<id>.title`, `milestones.<id>.description` e `milestoneOptions.<id>.title` pro marco.
- [ ] Typecheck, testes (`engine/progression.test.ts`, `store/gameStore.test.ts`) e lint passam.
