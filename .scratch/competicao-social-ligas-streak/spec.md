Status: ready-for-agent

# Liga e Sequência do Desafio Diário

Consolida a sessão de `/grill-with-docs` de 2026-09-04 (decisões em `docs/adr/0010-ligas-e-sequencia-desafio-diario.md` e vocabulário em `CONTEXT.md`) em spec de implementação.

## Problem Statement

O Desafio Diário hoje só tem um leaderboard semanal único (top 10 + posição própria). Isso funciona bem para quem está perto do topo, mas é invisível — e desmotivador — para a maioria dos jogadores, que nunca vê um rival alcançável. Além disso, depois de esgotar os 4 marcos originais de Meta-Progressão (por volta da 5ª Run vencida, dia 4-5 de uso), não sobra motivo de curto prazo para reabrir o app todo dia, o que ameaça as janelas de retenção D7/D30 que o GDD mira (§8).

## Solution

Duas extensões de competição social do Desafio Diário, sem tocar o pilar ético do GDD (nada vendido afeta poder; recompensa de progressão é cosmética/textual):

- **Liga**: quando a base de jogadores do Desafio Diário atingir massa crítica, o leaderboard único vira um sistema de 5 Tiers (Bronze → Prata → Ouro → Platina → Diamante) com Divisões de ~30 dispositivos, subida/descida semanal, dando a todo jogador — não só ao topo global — um rival próximo e alcançável.
- **Sequência**: um contador de dias consecutivos jogando o Desafio Diário, com Títulos nos marcos de 3, 7, 15 e 30 dias — os dois últimos espelhando de propósito as janelas D7/D30 do GDD, fazendo do marco jogável um proxy da métrica que a feature tenta mover.

## User Stories

### Liga — leaderboard único (antes da massa crítica)

1. Como jogador de um Desafio Diário recém-lançado (poucos participantes na semana), quero continuar vendo o leaderboard único de sempre (top 10 + minha posição), para que a experiência não fique vazia ou quebrada por falta de gente.
2. Como jogador, não quero notar nenhuma mudança na tela do Desafio Diário enquanto a Liga não estiver ativa, para que a transição não pareça um bug quando a Liga finalmente ligar.

### Liga — ativação e estrutura

3. Como jogador, quando a Liga ativa (massa crítica de participantes atingida na semana), quero ser automaticamente posicionado numa Divisão dentro de um Tier, para competir contra um grupo do meu nível em vez do ranking global inteiro.
4. Como jogador novo entrando na Liga pela primeira vez, quero começar sempre no Tier Bronze, para que minha posição inicial reflita desempenho sustentado, não uma única Run de estreia.
5. Como jogador, quero ver claramente em qual Tier e Divisão estou, e minha posição dentro dela, para acompanhar meu progresso competitivo.
6. Como jogador, quero ver o top da minha Divisão (não o ranking global), para que a comparação seja sempre contra rivais alcançáveis.

### Liga — subida e descida

7. Como jogador nas 5 melhores posições da minha Divisão ao fim da semana, quero subir de Tier automaticamente, para meu esforço na semana ser reconhecido.
8. Como jogador nas 5 piores posições da minha Divisão ao fim da semana, quero descer de Tier automaticamente, para a Liga se manter competitiva e dinâmica.
9. Como jogador em Bronze (o Tier mais baixo), não quero ser rebaixado mesmo terminando entre os últimos da minha Divisão, para sempre ter um chão e não ficar "preso caindo".
10. Como jogador no topo do Diamante (o Tier mais alto), quero disputar contra os outros melhores jogadores do Tier toda semana, sem expectativa de "subir" a lugar nenhum, para o topo da Liga ter um destino claro em vez de uma escada infinita.
11. Como jogador empatado exatamente na fronteira de subida ou descida (ex.: 3 pessoas empatadas na 5ª posição), quero que todos os empatados se movam juntos, para o desempate não depender de um critério arbitrário (ex.: quem jogou primeiro no dia).

### Liga — recompensa

12. Como jogador que atinge um novo Tier pela primeira vez (Prata, Ouro, Platina ou Diamante), quero ganhar um Título de reconhecimento no meu Perfil, para meu progresso na Liga ficar registrado permanentemente, mesmo que eu seja rebaixado depois.
13. Como jogador, não quero que nenhuma recompensa de Liga afete meu poder de jogo (cartas, Relíquias, Efeitos de Forja), para a competição continuar sendo sobre habilidade, não sobre quem gastou mais ou jogou mais vezes.

### Sequência — contagem

14. Como jogador, quero que qualquer pontuação que eu submeta ao Desafio Diário conte para minha Sequência, independente do quão bem eu jogar naquele dia, para um dia ruim não me custar a Sequência além da pontuação da semana.
15. Como jogador que usa uma tentativa extra via anúncio recompensado, quero que ela conte para a Sequência da mesma forma que a tentativa gratuita, para não ser penalizado por escolher jogar de novo no mesmo dia.
16. Como jogador que já submeteu pontuação hoje e joga de novo (melhorando meu próprio recorde do dia), não quero que isso conte a Sequência duas vezes, para o contador continuar representando dias, não submissões.
17. Como jogador que perde um dia sem jogar o Desafio Diário, quero que minha Sequência zere, para o contador refletir de fato constância diária (sem congelamento nesta versão).

### Sequência — marcos e exibição

18. Como jogador, quero ver minha Sequência atual na tela do Desafio Diário e no Perfil, para acompanhar meu progresso sem precisar calcular de cabeça.
19. Como jogador que atinge 3, 7, 15 ou 30 dias consecutivos, quero ganhar um novo Título automaticamente, para meu esforço de constância ser reconhecido.
20. Como jogador, quero que um Título de Sequência já conquistado permaneça no meu Perfil mesmo depois que a Sequência zerar, para meu recorde histórico não desaparecer por causa de um dia perdido no futuro.

## Implementation Decisions

### Sequência (seam confirmado com o time)

- `ProfileStats` (`engine/progression.ts`) ganha três campos novos: `dailyStreakCurrent` (contagem corrente), `dailyStreakBest` (recorde histórico — nunca decresce) e `dailyStreakLastDate` (`YYYY-MM-DD`, UTC, última data com submissão contabilizada; `null` se nunca submeteu). Segue a mesma disciplina de `save-systems` (schema/migração) que `winsByForger` já seguiu no ADR 0009.
- Nova função pura `recordDailySubmission(stats, todayIso)`, no mesmo formato de `recordRunEnd`: se `dailyStreakLastDate` for o dia anterior a `todayIso`, incrementa `dailyStreakCurrent`; se for igual a `todayIso` (resubmissão no mesmo dia), não altera a contagem; caso contrário (dia pulado ou primeira submissão), reinicia `dailyStreakCurrent` em 1. `dailyStreakBest = max(dailyStreakBest, dailyStreakCurrent)` sempre. `dailyStreakLastDate` atualiza para `todayIso` em todos os casos exceto resubmissão (já é igual).
- 4 novos `MILESTONES` (opção única, mesmo mecanismo de `claimReachedSingles`) checando `stats.dailyStreakBest >= 3/7/15/30`. Textos em inglês (texto de jogo), seguindo o padrão dos Títulos existentes (ex. "Seasoned Smith").
- Fiação: `gameStore.ts` já compõe `recordRunEnd` + `claimReachedSingles` + `saveProgression` num ponto único ao fim de uma Run normal. O comando `submit` do Desafio Diário (hoje só toca `DailyChallengeStorage`/`DailyBackend` via `dailyFlow.ts`) ganha a mesma composição logo após a submissão ter sucesso: chama `recordDailySubmission(progression.stats, todayIso)` no lugar de `recordRunEnd`, seguido de `claimReachedSingles` + `saveProgression`. Nenhum port novo — reaproveita o `ProgressionStorage` que já existe e já está disponível no escopo do `gameStore`.
- Sem congelamento/proteção de Sequência nesta versão — perder um dia sempre reinicia `dailyStreakCurrent` em 1 (não em 0; o próprio dia da nova submissão já conta como dia 1).
- Sem notificação push nesta rodada — Sequência é só contador in-app (tela do Desafio Diário + Perfil).

### Liga (seam confirmado com o time)

- **Schema novo** (`supabase/migrations/`): tabela de posicionamento semanal por dispositivo — `device_id`, semana ISO (segunda-feira), Tier, Divisão. Um dispositivo sem linha na semana atual é tratado como "ainda não posicionado" (ver regra de novo jogador abaixo).
- **RPC nova**: `get_league_leaderboard(p_device_id, p_now)`, ao lado da `get_weekly_leaderboard` existente (que continua servindo o leaderboard único). A função:
  1. Conta participantes distintos do Desafio Diário na semana ISO atual (mesma janela que `get_weekly_leaderboard` já calcula).
  2. Se abaixo do limiar de massa crítica (~300), devolve um indicador explícito de "Liga inativa" — o cliente cai de volta para `get_weekly_leaderboard`.
  3. Se acima do limiar, resolve o posicionamento do dispositivo: se não há linha para a semana atual, computa a partir do resultado final da Divisão do dispositivo na semana anterior (top 5 sobe, últimos 5 desce, respeitando o piso do Bronze e o teto do Diamante) ou, sem histórico algum, posiciona em Bronze. Essa resolução acontece de forma preguiçosa, na primeira leitura da semana — sem job agendado (pg_cron/Edge Function) — porque o posicionamento de um dispositivo só importa quando ele de fato consulta ou joga de novo, e evita depender de infraestrutura de agendamento que o projeto não usa hoje (contrato SQL-only via PostgREST, ADR 0001).
  4. Devolve Tier, Divisão, posição própria dentro da Divisão e o ranking completo da Divisão (mesmo formato de `LeaderboardEntry` já usado — `rank`, `score`, `name` — com rank "competition" para empates, igual a `get_weekly_leaderboard`).
- **Zona de subida/descida**: a fronteira usa o mesmo ranking "competition" (1, 1, 3) já usado em `get_weekly_leaderboard` — todo dispositivo com rank ≤ 5 sobe (exceto em Diamante), todo dispositivo cujo rank a partir do fim for ≤ 5 desce (exceto em Bronze); empates na fronteira movem-se juntos mesmo que isso resulte em mais ou menos de 5 movimentos.
- **Cliente**: o port `DailyBackend` (`engine/daily.ts`) ganha um método novo, `fetchLeagueLeaderboard(deviceId): Promise<LeagueStanding | null>` — `null` sinaliza "Liga inativa, use o leaderboard único". Implementado em `services/supabase.ts` chamando `get_league_leaderboard`, mesmo padrão dos métodos existentes.
- **Espelho TS do contrato**: `supabase/contract.ts` ganha o espelho da nova RPC (limiar de massa crítica, resolução de Tier/Divisão, zona de subida/descida), travado por valores dourados em `supabase/contract.test.ts` e verificado contra Postgres real via `npm run verify:backend` — mesma disciplina do contrato existente (ADR 0005).
- **Título de progressão de Tier**: como `MILESTONES` avalia condições sobre `ProfileStats` (estado local, SQLite), e o Tier da Liga é autoritativo no servidor (Supabase), `ProfileStats` ganha um campo novo `bestLeagueTierReached` (`TierId | null`), atualizado no cliente sempre que `fetchLeagueLeaderboard` devolve um Tier mais alto que o já registrado localmente. 4 novos `MILESTONES` de opção única (mesmo mecanismo dos demais Títulos) disparam na primeira vez que `bestLeagueTierReached` atinge Prata, Ouro, Platina ou Diamante — Bronze não gera Título, por ser o Tier de entrada, não uma conquista.
- **UI**: a seção de leaderboard da tela do Desafio Diário passa a exibir a visão de Tier/Divisão quando `fetchLeagueLeaderboard` devolver dados; cai para a visão global existente quando devolver `null`. Layout específico fica para a fase de implementação (`game-ui-ux`/`game-ui-taste`), não detalhado aqui.
- **Nomenclatura**: Bronze/Prata/Ouro/Platina/Diamante é o vocabulário de design (`CONTEXT.md`); o texto em jogo (rótulos de UI, Títulos) usa os nomes em inglês (Bronze/Silver/Gold/Platinum/Diamond), seguindo a regra de texto em jogo em inglês do `CLAUDE.md` raiz.

## Testing Decisions

Testes devem validar comportamento externo (entradas/saídas dos módulos), não detalhes internos — mesmo princípio já seguido em `daily.test.ts`/`progression.test.ts`.

- **`recordDailySubmission`** (`progression.test.ts`, ao lado dos testes existentes de `recordRunEnd`): casos de incremento (dia seguinte), reinício (dia pulado), idempotência (mesmo dia duas vezes), e recorde histórico não decrescendo após reinício.
- **Novos `MILESTONES`** (Sequência e Tier de Liga): reaproveita os testes já existentes de `pendingMilestones`/`claimReachedSingles`/`unlockStatuses` sobre um `ProfileStats` sintético com os campos novos.
- **Fiação em `gameStore`** (`gameStore.test.ts`, ao lado do teste existente de composição de fim de Run): dispatch do comando `submit` do Desafio Diário resulta em `recordDailySubmission` + `claimReachedSingles` + `saveProgression` chamados na ordem esperada, com o `ProgressionStorage` em memória refletindo o novo estado.
- **`get_league_leaderboard`** (`supabase/contract.test.ts` + `verify-contract.mjs`, mesmo padrão de `get_weekly_leaderboard`): valores dourados para (a) abaixo do limiar → indicador de Liga inativa, (b) jogador novo → Bronze, (c) resolução de subida/descida a partir da semana anterior, (d) empate exato na fronteira movendo todos os empatados, (e) piso do Bronze e teto do Diamante.
- **`fetchLeagueLeaderboard`** em `services/supabase.ts`: mesmo padrão dos demais métodos do serviço (chamada RPC, propagação de erro).

## Out of Scope

- Desafiar amigo via link (usando a mesma seed do dia)
- Lista de amigos / comparação por par — `device_id` não tem conta (ADR 0001/0005), precisaria resolver identidade entre dispositivos primeiro
- Season com reset e season pass cosmético (GDD §3, nunca especificado)
- Congelamento de Sequência (streak freeze)
- Notificação push de Sequência em risco (possivelmente a mesma infra do lembrete de pausa não-bloqueante do premortem de lançamento)
- Recompensa visual (moldura/borda) por Tier de Liga — só o Título textual nesta rodada
- Layout final de UI da visão de Liga na tela do Desafio Diário (fica para `game-ui-ux`/`game-ui-taste` na implementação)

## Further Notes

- Gatilho de revisão (ADR 0010): se a telemetria pós-lançamento mostrar Sequências quebrando majoritariamente por esquecimento (não abandono real), reabre o pipeline (`/grill-with-docs` → `/to-spec` → `/to-tickets`) para avaliar congelamento de Sequência e/ou notificação push — mesmo padrão de gatilho numérico já usado no ADR 0009 dos Títulos.
- O limiar de massa crítica (~300 participantes/semana) é uma estimativa de design, não um número travado por dado real — o projeto ainda não lançou. Vale revisitar assim que houver telemetria real de participação no Desafio Diário.
- Esta spec cobre duas features com dependências de infraestrutura bem diferentes (Sequência é 100% cliente/local; Liga precisa de schema e RPC novos no Supabase) — ao rodar `/to-tickets`, considerar dividir em dois tickets independentes em vez de um só, já que podem ser implementados e revisados em paralelo sem se bloquearem.
