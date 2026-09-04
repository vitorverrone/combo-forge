# 02 — Títulos de Vitórias, Recorde de Pontuação, Multiplicador e Maestria de Baralho

**What to build:** os 9 Títulos (ADR 0009) que reempacotam estatísticas de perfil já rastreadas, sem stat nova: vencer a 10ª/15ª/25ª Run (`runsWon`), bater 4.000/6.000/9.000 pontos numa Run (`bestRunScore`), alcançar Multiplicador de Combo ×8/×12 numa Jogada (`maxMultiplier`), e jogar as 40 cartas do Baralho ao menos uma vez cada (derivado de `cardPlays`). Cada um é uma `Milestone` de opção única, reivindicada automaticamente ao fim da Run (mesmo mecanismo de `firstRunWon`/`thirdRunWon`/`scoreRecord2500` — `claimReachedSingles`). Ponta a ponta demoável: vencer Runs, bater pontuação ou multiplicador desbloqueia o Título correspondente, visível na lista de marcos do Perfil e no banner de "novo desbloqueio" ao fim da Run — ambos já genéricos, sem UI nova.

**Blocked by:** 01 (`UnlockKind: 'title'` e o tratamento correto em `computeUnlocks` precisam existir antes de qualquer marco `kind: 'title'` ser adicionado a `MILESTONES`).

**Status:** done

- [x] `MILESTONES` ganha os 9 marcos, cada um com condição correta no limiar exato (`test.each` cobrindo abaixo do limiar, no limiar, acima dele, pros 8 numéricos + teste dedicado do `deckMastery`).
- [x] Marco de maestria de Baralho: condição `Object.keys(stats.cardPlays).length >= 40` (falso com 39 cartas distintas jogadas, verdadeiro com as 40).
- [x] Todos os 9 são reivindicados automaticamente por `claimReachedSingles`, disparando `milestone_unlocked` (telemetria já existente, ADR 0007/ticket 03) com o `milestoneId` correto — sem instrumentação nova. Achado do code-review (eixo Spec): o teste de auto-claim inicialmente não cobria `deckMastery`/`title-full-deck` (faltava preencher `cardPlays` com as 40 chaves) — corrigido.
- [x] `i18n/en.json` e `i18n/pt.json` ganham `milestones.<id>.title`, `milestones.<id>.description` e `milestoneOptions.<id>.title` para os 9 marcos — copy em inglês (texto de jogo) no `en.json`, tradução em `pt.json`.
- [x] Os 9 marcos aparecem na lista de marcos do Perfil e no banner de fim de Run sem nenhuma mudança em `ProfileScreen.tsx`/`RunWonScreen.tsx`/`RunLostScreen.tsx` (confirmado por leitura — ambos os componentes renderizam `MILESTONES`/`recentUnlocks` genericamente, sem alteração nesta ticket).
- [x] Typecheck, testes (`engine/progression.test.ts`) e lint passam — 465 testes, suíte inteira verde.
