# 03 — Liga: Título de progressão de Tier

**What to build:** Jogador que atinge um novo Tier da Liga pela primeira vez (Prata, Ouro, Platina ou Diamante) ganha um Título permanente no Perfil, reconhecendo o progresso mesmo que seja rebaixado depois.

**Blocked by:** 02 — Liga: leaderboard por Tier e Divisão (precisa que a consulta ao Tier do jogador já exista para observar quando ele sobe).

**Status:** done

- [x] Jogador que atinge Prata, Ouro, Platina ou Diamante pela primeira vez recebe um Título automaticamente (opção única, mesmo mecanismo dos Títulos existentes).
- [x] Bronze não gera Título — é o Tier de entrada, não uma conquista.
- [x] O Título permanece no Perfil mesmo que o jogador seja rebaixado de volta a um Tier inferior depois.
- [x] O maior Tier já alcançado é registrado localmente e atualizado sempre que uma consulta à Liga revelar um Tier mais alto que o já registrado.
- [x] Nenhum item vendido ou recompensa desta feature afeta poder de jogo.
- [x] Testes cobrem os novos marcos de Título sobre um estado de progressão sintético (sem depender de uma consulta real à Liga).

## Comments

Implementado em `feat/03-liga-titulo-progressao-tier`, mesclado em `master`. `/code-review` (Standards + Spec) rodou limpo — zero achados de Spec, e um único smell de julgamento em Standards (a lista de ordem dos Tiers duplicada entre `engine/daily.ts` e `supabase/contract.ts`), considerado inevitável já que o contrato SQL roda isolado do cliente. Nenhuma correção necessária antes do merge.

Isso fecha o spec completo de competição social desta rodada (`.scratch/competicao-social-ligas-streak/`): Sequência (01), Liga leaderboard (02) e Título de Tier (03), todos `done`.
