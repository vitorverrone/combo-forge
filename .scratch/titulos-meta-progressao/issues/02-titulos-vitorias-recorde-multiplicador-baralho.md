# 02 — Títulos de Vitórias, Recorde de Pontuação, Multiplicador e Maestria de Baralho

**What to build:** os 8 Títulos (ADR 0009) que reempacotam estatísticas de perfil já rastreadas, sem stat nova: vencer a 10ª/15ª/25ª Run (`runsWon`), bater 4.000/6.000/9.000 pontos numa Run (`bestRunScore`), alcançar Multiplicador de Combo ×8/×12 numa Jogada (`maxMultiplier`), e jogar as 40 cartas do Baralho ao menos uma vez cada (derivado de `cardPlays`). Cada um é uma `Milestone` de opção única, reivindicada automaticamente ao fim da Run (mesmo mecanismo de `firstRunWon`/`thirdRunWon`/`scoreRecord2500` — `claimReachedSingles`). Ponta a ponta demoável: vencer Runs, bater pontuação ou multiplicador desbloqueia o Título correspondente, visível na lista de marcos do Perfil e no banner de "novo desbloqueio" ao fim da Run — ambos já genéricos, sem UI nova.

**Blocked by:** 01 (`UnlockKind: 'title'` e o tratamento correto em `computeUnlocks` precisam existir antes de qualquer marco `kind: 'title'` ser adicionado a `MILESTONES`).

**Status:** ready-for-agent

- [ ] `MILESTONES` ganha os 8 marcos, cada um com condição correta no limiar exato (teste cobrindo abaixo do limiar, no limiar, acima dele — mesmo padrão dos testes existentes de `scoreRecord2500`).
- [ ] Marco de maestria de Baralho: condição `Object.keys(stats.cardPlays).length >= 40` (falso com 39 cartas distintas jogadas, verdadeiro com as 40).
- [ ] Todos os 8 são reivindicados automaticamente por `claimReachedSingles`, disparando `milestone_unlocked` (telemetria já existente, ADR 0007/ticket 03) com o `milestoneId` correto — sem instrumentação nova.
- [ ] `i18n/en.json` e `i18n/pt.json` ganham `milestones.<id>.title`, `milestones.<id>.description` e `milestoneOptions.<id>.title` para os 8 marcos — copy em inglês (texto de jogo) no `en.json`, tradução em `pt.json`.
- [ ] Os 8 marcos aparecem na lista de marcos do Perfil e no banner de fim de Run sem nenhuma mudança em `ProfileScreen.tsx`/`RunWonScreen.tsx`/`RunLostScreen.tsx` (verificação manual/smoke, já que esses componentes renderizam `MILESTONES`/`recentUnlocks` genericamente).
- [ ] Typecheck, testes (`engine/progression.test.ts`) e lint passam.
