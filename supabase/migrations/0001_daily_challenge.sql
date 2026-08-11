-- 0001 — Desafio Diário: entidades e funções (contrato mínimo, ADR 0001/0003)
--
-- Backend mínimo do Desafio Diário, exposto via PostgREST (endpoints RPC):
--   POST /rest/v1/rpc/get_daily_seed          → seed do dia (determinístico)
--   POST /rest/v1/rpc/submit_daily_score      → registra a pontuação do dia
--   POST /rest/v1/rpc/get_weekly_leaderboard  → top 10 + posição própria
--
-- Identidade: sem contas de usuário (out of scope do MVP). Cada dispositivo
-- gera um device_id (UUID) persistido localmente (SQLite, ticket 11) e o
-- backend deduplica por (dia, device_id): uma pontuação por tentativa válida
-- por dia, valendo sempre a melhor.

create table if not exists public.daily_submissions (
  id bigint generated always as identity primary key,
  -- Dia do Desafio (fronteira UTC — ver README).
  day date not null,
  -- Id do dispositivo (UUID gerado no cliente, opaco).
  device_id text not null,
  -- Pontuação final da Run (uma por dia por dispositivo; vale a melhor).
  score integer not null check (score >= 0),
  created_at timestamptz not null default now(),
  unique (day, device_id)
);

-- Índice do leaderboard semanal (dia desc → varre a semana, score desc).
create index if not exists daily_submissions_week_idx
  on public.daily_submissions (day desc, score desc);

-- Seed determinístico do dia: md5 da data em formato ISO (to_char garante
-- o formato independente do DateStyle do banco) interpretado como int32 sem
-- sinal e mascarado para [0, 2^31-1]. Idêntico para todos os jogadores do
-- mesmo dia (Desafio Diário = mesma Run para todos, ADR 0003) e equivalente
-- ao espelho TS em supabase/contract.ts.
create or replace function public.get_daily_seed(
  p_date date default (now() at time zone 'utc')::date
)
returns integer
language sql
stable
as $$
  select (('x' || substr(md5(to_char(p_date, 'YYYY-MM-DD')), 1, 8))::bit(32))::int & 2147483647;
$$;

-- Registra a pontuação do dia (best-score upsert): uma linha por
-- (dia, device_id); submissões do mesmo dia só sobem a pontuação. Devolve o
-- score armazenado para o dia (o melhor), que o cliente usa para confirmar.
create or replace function public.submit_daily_score(
  p_device_id text,
  p_score integer
)
returns integer
language plpgsql
volatile
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
begin
  insert into public.daily_submissions (day, device_id, score)
  values (v_day, p_device_id, p_score)
  on conflict (day, device_id)
  do update set score = greatest(public.daily_submissions.score, excluded.score);
  return (select score from public.daily_submissions
          where day = v_day and device_id = p_device_id);
end;
$$;

-- Leaderboard semanal (semana ISO, segunda a domingo): cada dispositivo entra
-- uma vez, pela MELHOR Run da semana. Devolve a semana, a posição própria
-- (null se o dispositivo não pontuou na semana) e o top 10 com rank e score
-- — sem expor identidades além da própria. Empates compartilham o rank
-- (classificação "competition": 1,1,3).
create or replace function public.get_weekly_leaderboard(
  p_device_id text,
  p_now timestamptz default now()
)
returns jsonb
language sql
stable
as $$
  with w as (
    -- segunda-feira da semana ISO de p_now
    select (p_now::date - ((extract(dow from p_now)::int + 6) % 7)) as ws
  ),
  weekly_best as (
    select s.device_id, max(s.score) as score
    from public.daily_submissions s, w
    where s.day >= w.ws and s.day < w.ws + 7
    group by s.device_id
  ),
  ranked as (
    select b.device_id, b.score,
           (select count(*) + 1 from weekly_best b2 where b2.score > b.score) as rank
    from weekly_best b
  )
  select jsonb_build_object(
    'week', to_char((select ws from w), 'YYYY-MM-DD'),
    'own', (
      select jsonb_build_object('rank', r.rank, 'score', r.score)
      from ranked r
      where r.device_id = p_device_id
    ),
    'top', coalesce(
      (
        -- jsonb_agg preserva a ordem de entrada (rank, device_id) da subconsulta
        select jsonb_agg(jsonb_build_object('rank', r.rank, 'score', r.score))
        from (select r.rank, r.score from ranked r order by r.rank, r.device_id limit 10) r
      ),
      '[]'::jsonb
    )
  );
$$;
