# 04 — Fix: ranking de Divisão vazio quando o jogador ainda não pontuou

**What to build:** corrige `_league_division_view` (`supabase/migrations/0004_league.sql`) para sempre devolver uma lista de ranking (`top`), mesmo quando o dispositivo que consulta ainda não pontuou na semana corrente. Hoje, um join implícito contra a própria posição do dispositivo zera a lista inteira nesse caso, mesmo havendo outros dispositivos do mesmo Tier já pontuados — dá a falsa impressão de que "ninguém jogou".

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Nova migration `supabase/migrations/0009_league_division_default_bracket.sql`, redefinindo `_league_division_view`: troca o join implícito `select r.* from ranked r, own_row o where ((r.rank-1)/p_division_size) = ((o.rank-1)/p_division_size)` (zera quando `own_row` está vazio) por uma comparação com fallback — usa o bucket de `own_row` quando ela existir, senão o bucket `0` (Divisão 1) do Tier.
- [x] `own` e `division` (número) no JSON de resposta continuam `null` quando o dispositivo não pontuou na semana (sem mudança neste comportamento) — só o array `top` deixa de vir vazio nesse caso.
- [x] Dispositivo que já pontuou na semana continua vendo sua própria Divisão real (sem regressão no caso já coberto hoje) — garantido por construção (`coalesce` só entra em ação quando `own_row` está vazio) e coberto pelos casos "com own" de `leagueDivisionBucketToShow` em `contract.test.ts`.
- [x] `supabase/contract.test.ts` ganha um cenário novo (golden-value) — via o helper puro `leagueDivisionBucketToShow` (ver Comments: escopo do seam ajustado com o usuário antes de implementar).
- [ ] `npm run verify:backend` roda contra Postgres real cobrindo esse cenário — **não executado nesta sessão** (Docker indisponível); código já ajustado em `verify-contract.mjs`, fica pendente de execução real antes do próximo release.
- [x] Sem mudança na regra de subida/descida de Tier ou no cálculo de qual Divisão cada dispositivo pertence — só o fallback de exibição.

## Comments

Implementado direto no `master` (sem branch própria — mesmo combinado dos tickets anteriores).

- **Seam ajustado com o usuário antes de implementar**: `supabase/contract.ts` não espelhava a lógica de junção da `_league_division_view` (só fórmulas puras de Tier/Divisão) — não havia nada de golden-value pra travar essa query especificamente sem um Postgres real. Extraí a decisão do fix como helper puro novo, `leagueDivisionBucketToShow(ownRank, divisionSize)`, testado com TDD real (RED→GREEN, 2 testes) em `contract.test.ts`; a migration SQL usa a mesma fórmula (`coalesce((select (rank-1)/p_division_size from own_row), 0)`).
- `supabase/migrations/0009_league_division_default_bracket.sql`: redefine `_league_division_view` — não é `SECURITY DEFINER`, então `create or replace function` não perde nada (ao contrário do caso já registrado em `0003_display_name.sql`).
- `supabase/contract.ts`: comentário de `LeagueStanding.top` atualizado (dizia "vazio se own for null" — não é mais verdade).
- `supabase/scripts/verify-contract.mjs`: **achado durante a implementação** — a asserção existente (linha ~330) checava `top === '[]'` como comportamento *esperado*, ou seja, o próprio script de verificação validava o bug como certo. Corrigido: os 30 dispositivos "bulk" agora também chamam `get_league_leaderboard` (não só inserem `daily_submissions`) antes da consulta do dispositivo novo, reproduzindo o cenário real (outros já jogaram e têm `league_placements`, o dispositivo consultante ainda não) — nova asserção espera `top.length === 30`. **Não executado**: sem Docker nesta sessão, mesma ressalva já registrada no ticket 02 do ADR 0012. Precisa rodar `npm run verify:backend` antes do próximo release.
