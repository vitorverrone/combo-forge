-- 0009 — Liga: Divisão 1 como prévia quando o dispositivo ainda não pontuou
-- na semana (ticket 04 de onboarding-liga-notificacao-cold-start)
--
-- Bug: `_league_division_view` (migration 0004) monta a lista `top` com um
-- join implícito entre `ranked` (todo mundo do Tier) e `own_row` (só o
-- dispositivo que está consultando). Sem pontuação própria na semana,
-- `own_row` vem vazio — e um join contra uma tabela vazia devolve ZERO
-- linhas, mesmo que outros dispositivos do mesmo Tier já tenham pontuado
-- essa semana. Resultado: o jogador abre o Desafio Diário antes de jogar e
-- vê o ranking do próprio Tier vazio, como se ninguém tivesse jogado ainda.
--
-- Fix: troca o join implícito por uma comparação contra um bucket com
-- fallback — usa a Divisão de `own_row` quando ela existir, senão o bucket
-- 0 (Divisão 1) do Tier, como prévia. Mesma fórmula do espelho TS
-- `leagueDivisionBucketToShow` (supabase/contract.ts). `own`/`division`
-- (número) no JSON de resposta continuam null sem pontuação própria — só o
-- array `top` deixa de vir vazio nesse caso.
--
-- `_league_division_view` não é SECURITY DEFINER (só `get_league_leaderboard`
-- é) — `create or replace function` preserva o resto sem precisar redefinir
-- grants, ao contrário do caso já registrado em 0003_display_name.sql.

create or replace function public._league_division_view(
  p_device_id text,
  p_week date,
  p_tier text,
  p_division_size integer
)
returns jsonb
language sql
stable
as $$
  with tier_scores as (
    select lp.device_id, max(ds.score) as score, pl.display_name as name
    from public.league_placements lp
    join public.daily_submissions ds
      on ds.device_id = lp.device_id and ds.day >= p_week and ds.day < p_week + 7
    left join public.players pl on pl.device_id = lp.device_id
    where lp.week = p_week and lp.tier = p_tier
    group by lp.device_id, pl.display_name
  ),
  ranked as (
    select device_id, score, name,
           (select count(*) + 1 from tier_scores b2 where b2.score > b.score) as rank
    from tier_scores b
  ),
  own_row as (
    select * from ranked where device_id = p_device_id
  ),
  division as (
    select r.* from ranked r
    where ((r.rank - 1) / p_division_size) = coalesce(
      (select (rank - 1) / p_division_size from own_row),
      0
    )
  )
  select jsonb_build_object(
    'active', true,
    'week', to_char(p_week, 'YYYY-MM-DD'),
    'tier', p_tier,
    'division', (select ((rank - 1) / p_division_size) + 1 from own_row),
    'own', (select jsonb_build_object('rank', rank, 'score', score, 'name', name) from own_row),
    'top', coalesce(
      (select jsonb_agg(jsonb_build_object('rank', rank, 'score', score, 'name', name) order by rank, device_id)
       from division),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public._league_division_view(text, date, text, integer) from public;
