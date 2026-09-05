-- 0005 — Liga: baixa o limiar de massa crítica de 300 para 30 (ADR 0010)
--
-- O ADR 0010 já registrava 300 como "uma estimativa de design, não um número
-- travado por dado real". Baixado pra 30 (== LEAGUE_DIVISION_SIZE) porque o
-- jogo ainda não lançou e não há como saber quanto tempo levaria pra
-- acumular 300 participantes/semana — com 30, a Liga ativa assim que existir
-- gente suficiente pra preencher uma única Divisão cheia, em vez de ficar
-- invisível por tempo indeterminado. Redefine a função inteira porque
-- create or replace function não preserva SECURITY DEFINER/search_path
-- (mesma observação já registrada em 0003_display_name.sql).

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
  v_threshold constant integer := 30;
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

grant execute on function public.get_league_leaderboard(text, timestamptz) to anon, authenticated;
