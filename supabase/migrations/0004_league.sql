-- 0004 — Liga: Tiers e Divisões do Desafio Diário (ADR 0010, ticket 02)
--
-- Quando o Desafio Diário atinge massa crítica (~300 participantes numa
-- semana ISO), o leaderboard único (get_weekly_leaderboard, 0001/0003) dá
-- lugar à Liga: 5 Tiers nomeados (bronze/silver/gold/platinum/diamond), cada
-- um dividido em Divisões de ~30 dispositivos. Abaixo do limiar, a Liga fica
-- inativa e o cliente cai de volta para get_weekly_leaderboard — nenhuma
-- mudança nas funções de 0001/0003.
--
-- Resolução preguiçosa, sem job agendado (contrato SQL-only via PostgREST,
-- ADR 0001): o Tier de um dispositivo pra uma semana nova só é calculado na
-- primeira consulta daquela semana, a partir do resultado final da Divisão
-- dele na semana anterior — não há rollover disparado por cron/Edge
-- Function. Um dispositivo sem posicionamento na semana anterior (novo, ou
-- retomando depois de uma pausa) sempre entra em 'bronze' — sem seed pela
-- pontuação de estreia (ADR 0010).
--
-- Divisão não é um agrupamento persistido com identidade própria: é uma
-- fatia computada do ranking do Tier na semana, em blocos de
-- LEAGUE_DIVISION_SIZE (blocos de rank 1–30 = Divisão 1, 31–60 = Divisão 2,
-- etc.) — o rank usa a mesma classificação "competition" (empates
-- compartilham rank) de get_weekly_leaderboard, então dispositivos empatados
-- na fronteira de subida/descida sempre se movem juntos.

create table if not exists public.league_placements (
  device_id text not null,
  -- Semana ISO (segunda-feira) a que este Tier se refere.
  week date not null,
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  created_at timestamptz not null default now(),
  primary key (device_id, week)
);

create index if not exists league_placements_week_tier_idx
  on public.league_placements (week, tier);

-- Ordem dos Tiers (bronze=piso, diamond=teto) — usada por promote/demote pra
-- travar a subida/descida nos extremos sem decisão espalhada em vários
-- lugares.
create or replace function public._league_tier_rank(p_tier text)
returns integer
language sql
immutable
as $$
  select case p_tier
    when 'bronze' then 1
    when 'silver' then 2
    when 'gold' then 3
    when 'platinum' then 4
    when 'diamond' then 5
  end;
$$;

create or replace function public._league_tier_at(p_rank integer)
returns text
language sql
immutable
as $$
  select case p_rank
    when 1 then 'bronze'
    when 2 then 'silver'
    when 3 then 'gold'
    when 4 then 'platinum'
    when 5 then 'diamond'
  end;
$$;

-- Sem efeito acima de 'diamond' (teto) — mesmo espelho TS em contract.ts.
create or replace function public._league_tier_promote(p_tier text)
returns text
language sql
immutable
as $$
  select public._league_tier_at(least(5, public._league_tier_rank(p_tier) + 1));
$$;

-- Sem efeito abaixo de 'bronze' (piso).
create or replace function public._league_tier_demote(p_tier text)
returns text
language sql
immutable
as $$
  select public._league_tier_at(greatest(1, public._league_tier_rank(p_tier) - 1));
$$;

-- Resolve o Tier de um dispositivo pra semana nova a partir do resultado da
-- Divisão dele na semana anterior. Sem Tier na semana anterior (novo, ou
-- retomando após uma pausa) → 'bronze'. Com Tier mas sem pontuação na semana
-- anterior (não há Divisão pra avaliar) → mantém o Tier, nem sobe nem desce.
-- Promoção tem prioridade sobre rebaixamento no caso raro de uma Divisão
-- pequena demais pra caber as duas zonas de 5 sem sobrepor (ex.: menos de 10
-- dispositivos na última Divisão de um Tier) — decisão de implementação, o
-- grill original assumiu Divisões de ~30 e não cobriu esse extremo.
create or replace function public._resolve_league_tier(
  p_device_id text,
  p_week date,
  p_prev_week date,
  p_division_size integer,
  p_zone_size integer
)
returns text
language plpgsql
stable
as $$
declare
  v_prev_tier text;
  v_prev_rank integer;
  v_actual_division_size integer;
  v_position_in_division integer;
begin
  select tier into v_prev_tier
  from public.league_placements
  where device_id = p_device_id and week = p_prev_week;

  if v_prev_tier is null then
    return 'bronze';
  end if;

  with prev_tier_scores as (
    select lp.device_id, max(ds.score) as score
    from public.league_placements lp
    join public.daily_submissions ds
      on ds.device_id = lp.device_id and ds.day >= p_prev_week and ds.day < p_prev_week + 7
    where lp.week = p_prev_week and lp.tier = v_prev_tier
    group by lp.device_id
  ),
  ranked as (
    select device_id, score,
           (select count(*) + 1 from prev_tier_scores b2 where b2.score > b.score) as rank
    from prev_tier_scores b
  )
  select r.rank, (
    select count(*) from ranked r2
    where ((r2.rank - 1) / p_division_size) = ((r.rank - 1) / p_division_size)
  )
  into v_prev_rank, v_actual_division_size
  from ranked r
  where r.device_id = p_device_id;

  if v_prev_rank is null then
    return v_prev_tier;
  end if;

  v_position_in_division := ((v_prev_rank - 1) % p_division_size) + 1;

  if v_position_in_division <= p_zone_size then
    return public._league_tier_promote(v_prev_tier);
  elsif v_position_in_division > v_actual_division_size - p_zone_size then
    return public._league_tier_demote(v_prev_tier);
  else
    return v_prev_tier;
  end if;
end;
$$;

-- Ranking + Divisão do dispositivo dentro do próprio Tier, na semana pedida.
-- own/division ficam null quando o dispositivo ainda não pontuou na semana
-- (mesmo comportamento de get_weekly_leaderboard) — sem pontuação não há
-- rank pra saber em qual bloco de p_division_size ele cai.
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
    select r.* from ranked r, own_row o
    where ((r.rank - 1) / p_division_size) = ((o.rank - 1) / p_division_size)
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

-- Contrato exposto ao app: ver docs no topo do arquivo. Devolve
-- {"active": false} abaixo do limiar de massa crítica — o cliente cai de
-- volta para get_weekly_leaderboard. LEAGUE_DIVISION_SIZE/ZONE/THRESHOLD são
-- constantes locais (espelhadas em contract.ts); não há necessidade de uma
-- tabela de configuração pra 3 números que não mudam em runtime.
create or replace function public.get_league_leaderboard(
  p_device_id text,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_week date := (p_now::date - ((extract(dow from p_now)::int + 6) % 7));
  v_prev_week date;
  v_participant_count integer;
  v_division_size constant integer := 30;
  v_zone_size constant integer := 5;
  v_threshold constant integer := 300;
  v_tier text;
begin
  v_prev_week := v_week - 7;

  select count(distinct device_id) into v_participant_count
  from public.daily_submissions
  where day >= v_week and day < v_week + 7;

  if v_participant_count < v_threshold then
    return jsonb_build_object('active', false);
  end if;

  select tier into v_tier
  from public.league_placements
  where device_id = p_device_id and week = v_week;

  if v_tier is null then
    v_tier := public._resolve_league_tier(p_device_id, v_week, v_prev_week, v_division_size, v_zone_size);
    insert into public.league_placements (device_id, week, tier)
    values (p_device_id, v_week, v_tier)
    on conflict (device_id, week) do nothing;
    -- Relê: numa corrida entre duas chamadas concorrentes do mesmo
    -- dispositivo, o "do nothing" acima pode descartar o nosso insert —
    -- devolvemos o valor realmente persistido, não necessariamente o que
    -- calculamos agora.
    select tier into v_tier
    from public.league_placements
    where device_id = p_device_id and week = v_week;
  end if;

  return public._league_division_view(p_device_id, v_week, v_tier, v_division_size);
end;
$$;

-- Acesso anônimo (mesmo padrão de 0002/0003): tabela inacessível diretamente,
-- contrato exposto só via RPC.
alter table public.league_placements enable row level security;
revoke all on public.league_placements from public;
revoke all on public.league_placements from anon, authenticated;

revoke all on function public._league_tier_rank(text) from public;
revoke all on function public._league_tier_at(integer) from public;
revoke all on function public._league_tier_promote(text) from public;
revoke all on function public._league_tier_demote(text) from public;
revoke all on function public._resolve_league_tier(text, date, date, integer, integer) from public;
revoke all on function public._league_division_view(text, date, text, integer) from public;

grant execute on function public.get_league_leaderboard(text, timestamptz) to anon, authenticated;
