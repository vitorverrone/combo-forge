# 03 — Job semanal de queda de Tier (pg_cron + pg_net)

**What to build:** o gatilho que efetivamente notifica o jogador. Uma função SQL nova (ex.: `_run_league_tier_drop_notifications`), agendada via a extensão `pg_cron` pra rodar pouco depois da virada da semana ISO (ex.: segunda 00:05 UTC) — sem Edge Function (ADR-0001, "SQL-only via PostgREST"). Para todo dispositivo com uma linha em `league_placements` na semana anterior: reaproveita `_resolve_league_tier` (já existe, migration 0004) pra calcular o Tier novo e inserir em `league_placements` (`on conflict do nothing`, mesma idempotência que `get_league_leaderboard` já usa) — isso preenche a semana nova proativamente, antes de qualquer dispositivo consultar. Usa `didLeagueTierDrop` (ticket 01) pra comparar Tier antigo vs. novo; onde caiu e existe um token em `push_tokens` (ticket 02) pro `device_id`, despacha um push via a extensão `pg_net` (chamada HTTP assíncrona direto do Postgres pra Expo Push API), com copy nomeando o Tier novo por nome (ex.: "Você caiu para Prata"), em pt-br e en. A lógica de "quem caiu e tem token" deve ser separável da parte que efetivamente despacha via `pg_net`, pra ser testável sem depender de rede real. `get_league_leaderboard` (a RPC existente) não muda de comportamento — continua exatamente como hoje, servindo de rede de segurança pra qualquer dispositivo que o job não tenha coberto.

**Blocked by:** 01 — Espelhar `didLeagueTierDrop` no contrato TS; 02 — Registro de push token + toque na notificação navega pro Desafio Diário (o job precisa de `push_tokens` populada pra ter alguém a notificar).

**Status:** ready-for-agent

- [ ] Função SQL nova calcula o Tier novo de todo dispositivo com posição na semana anterior, reaproveitando `_resolve_league_tier`, e insere em `league_placements` com a mesma idempotência (`on conflict do nothing`) da RPC existente
- [ ] Agendamento via `pg_cron`, rodando pouco depois da virada da semana ISO
- [ ] Dispositivos cujo Tier caiu (via `didLeagueTierDrop`/lógica equivalente) e têm token em `push_tokens` recebem push via `pg_net`, com o Tier novo nomeado na mensagem, em pt-br e en
- [ ] Dispositivos sem queda de Tier, ou sem token registrado, não geram nenhuma tentativa de push (sem erro, sem noise)
- [ ] Bronze nunca gera notificação de queda (piso, sem rebaixamento) — mesmo teste vale pro caso trivial de Diamante nunca subir
- [ ] `get_league_leaderboard` continua se comportando exatamente como antes (verificado com os testes/contratos já existentes, sem regressão)
- [ ] A parte "quem caiu de Tier e tem token" é verificada contra Postgres real via `npm run verify:backend`, com cenários conhecidos de `league_placements`/`push_tokens`
- [ ] `docs/release-checklist.md` ganha um item novo: confirmar que o job rodou corretamente na primeira virada de semana real em produção (não é verificável antes do primeiro rollout)
