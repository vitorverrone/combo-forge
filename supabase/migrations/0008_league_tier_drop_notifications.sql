-- 0008 — Job semanal de queda de Tier na Liga (ADR 0012, ticket 03)
--
-- get_league_leaderboard (0004/0005) resolve o Tier da semana nova de forma
-- PREGUIÇOSA: só na primeira consulta daquela semana. Um push, por
-- definição, precisa alcançar o jogador ANTES dele abrir o app — antes de
-- qualquer consulta preguiçosa acontecer. Este job roda pouco depois da
-- virada da semana ISO (agendado via pg_cron) e resolve proativamente o
-- Tier de todo dispositivo com posição na semana anterior, reaproveitando
-- _resolve_league_tier (0004) com a MESMA idempotência (`on conflict do
-- nothing`) da RPC — não é uma segunda fonte de verdade, é a mesma regra
-- rodando mais cedo. get_league_leaderboard não muda de comportamento:
-- continua sendo a rede de segurança para qualquer dispositivo que o job
-- não tenha coberto (corrida no instante exato da virada de semana).
--
-- Duas partes deliberadamente separadas (spec.md, Testing Decisions):
-- _league_tier_drop_notification_candidates calcula "quem caiu de Tier e
-- tem token registrado" — entrada/saída determinística, testável direto
-- contra Postgres real (npm run verify:backend), sem rede. Só
-- _run_league_tier_drop_notifications depende de rede real (pg_net) — fica
-- fora dessa verificação automatizada, mesma fronteira que qualquer chamada
-- de rede real tem neste projeto (ex.: o SDK do AdMob em services/ads.ts).

-- Nome de exibição do Tier em pt-br/en — mesmas strings do espelho cliente
-- (components/format.ts → i18n/{pt,en}.json format.leagueTier.*). Cliente e
-- servidor não compartilham código (o job não passa pelo i18next), então
-- esta é a fonte da verdade do lado servidor, mantida em sincronia à mão.
create or replace function public._league_tier_display_name(p_tier text, p_lang text)
returns text
language sql
immutable
as $$
  select case p_lang
    when 'pt' then (case p_tier
      when 'bronze' then 'Bronze'
      when 'silver' then 'Prata'
      when 'gold' then 'Ouro'
      when 'platinum' then 'Platina'
      when 'diamond' then 'Diamante'
    end)
    else (case p_tier
      when 'bronze' then 'Bronze'
      when 'silver' then 'Silver'
      when 'gold' then 'Gold'
      when 'platinum' then 'Platinum'
      when 'diamond' then 'Diamond'
    end)
  end;
$$;

-- Quem caiu de Tier na virada da semana E tem um token de push registrado
-- (ticket 02) — a parte testável sem rede. Efeito colateral necessário:
-- resolve e persiste o Tier da semana nova de todo dispositivo com posição
-- na semana anterior (mesmo insert ... on conflict do nothing da RPC), o
-- que É o objetivo do job (preencher a semana proativamente) — não um efeito
-- colateral indesejado.
create or replace function public._league_tier_drop_notification_candidates(
  p_now timestamptz default now()
)
returns table (
  device_id text,
  prev_tier text,
  new_tier text,
  expo_push_token text
)
language plpgsql
volatile
as $$
#variable_conflict use_column
declare
  v_week date := (p_now::date - ((extract(dow from p_now)::int + 6) % 7));
  v_prev_week date := v_week - 7;
  v_division_size constant integer := 30;
  v_zone_size constant integer := 5;
  v_prev record;
  v_persisted_tier text;
begin
  -- `#variable_conflict use_column` acima: o parâmetro OUT `device_id` (de
  -- `returns table`) colide com a coluna real de league_placements dentro
  -- de `on conflict (device_id, week)` logo abaixo — ao contrário de uma
  -- expressão SQL comum, a lista de colunas de ON CONFLICT só aceita
  -- identificadores SEM qualificação de tabela/schema (gramática do
  -- Postgres), então nem `league_placements.device_id` resolveria a
  -- ambiguidade ali; confirmado batendo em
  -- "column reference \"device_id\" is ambiguous" sem a pragma, via
  -- `npm run verify:backend`. Seguro aqui: a função nunca lê o OUT var
  -- direto, só via `v_prev.device_id`/RETURN QUERY. Sem `security
  -- definer`/`search_path` (diferente de `_run_league_tier_drop_notifications`
  -- abaixo): mesmo padrão de `_resolve_league_tier`/`_league_division_view`
  -- em 0004 — só o ponto de entrada de verdade (chamado de fora, aqui pelo
  -- pg_cron) precisa de privilégio elevado; chamadas aninhadas herdam o
  -- contexto de quem chamou.
  for v_prev in
    select lp.device_id as device_id, lp.tier as prev_tier
    from public.league_placements lp
    where lp.week = v_prev_week
  loop
    insert into public.league_placements (device_id, week, tier)
    values (
      v_prev.device_id,
      v_week,
      public._resolve_league_tier(v_prev.device_id, v_week, v_prev_week, v_division_size, v_zone_size)
    )
    on conflict (device_id, week) do nothing;

    -- Relê (mesmo motivo do relê em get_league_leaderboard): numa corrida
    -- com a RPC preguiçosa resolvendo a mesma semana no instante exato da
    -- virada, o "do nothing" acima pode descartar o insert deste job —
    -- comparamos o valor REALMENTE persistido, não o que calculamos agora.
    select tier into v_persisted_tier
    from public.league_placements
    where league_placements.device_id = v_prev.device_id and week = v_week;

    -- Mesma comparação de didLeagueTierDrop (supabase/contract.ts, ticket
    -- 01): _league_tier_rank é a mesma ordem (bronze piso, diamond teto).
    if public._league_tier_rank(v_persisted_tier) < public._league_tier_rank(v_prev.prev_tier) then
      return query
        select v_prev.device_id, v_prev.prev_tier, v_persisted_tier, pt.expo_push_token
        from public.push_tokens pt
        where pt.device_id = v_prev.device_id;
    end if;
  end loop;
end;
$$;

-- Despacha o push via pg_net (rede real — fora da verificação automatizada
-- via Docker, ver nota no topo). Uma chamada HTTP assíncrona por
-- dispositivo caído; falha de rede num dispositivo não impede os demais
-- (o loop segue — net.http_post enfileira a requisição e não lança na
-- chamada em si).
create or replace function public._run_league_tier_drop_notifications(
  p_now timestamptz default now()
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_candidate record;
begin
  for v_candidate in
    select * from public._league_tier_drop_notification_candidates(p_now)
  loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := jsonb_build_object(
        'to', v_candidate.expo_push_token,
        'title', 'Combo Forge — Liga / League',
        'body', format(
          'Você caiu para %s na Liga. / You dropped to %s in the League.',
          public._league_tier_display_name(v_candidate.new_tier, 'pt'),
          public._league_tier_display_name(v_candidate.new_tier, 'en')
        ),
        'sound', 'default'
      ),
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json')
    );
  end loop;
end;
$$;

-- Funções internas — nenhuma faz parte do contrato exposto ao app (mesmo
-- padrão de _resolve_league_tier/_league_division_view em 0004).
revoke all on function public._league_tier_display_name(text, text) from public;
revoke all on function public._league_tier_drop_notification_candidates(timestamptz) from public;
revoke all on function public._run_league_tier_drop_notifications(timestamptz) from public;

-- pg_cron/pg_net: extensões do projeto Supabase, não disponíveis num
-- Postgres vanilla (ex.: a imagem postgres:16-alpine usada por
-- npm run verify:backend) — CREATE EXTENSION falha nesse ambiente porque o
-- arquivo de controle da extensão nem existe, não por já estar habilitada.
-- Guardado pra não derrubar o resto da migration (e a verificação local das
-- funções acima, que não dependem de nenhuma das duas) fora do Supabase.
do $$
begin
  create extension if not exists pg_cron;
exception when others then
  raise notice 'pg_cron indisponível neste ambiente (esperado fora do Supabase) — agendamento do job pulado.';
end
$$;

do $$
begin
  create extension if not exists pg_net;
exception when others then
  raise notice 'pg_net indisponível neste ambiente (esperado fora do Supabase) — _run_league_tier_drop_notifications só funciona onde pg_net está habilitada.';
end
$$;

-- Agenda o job pra rodar pouco depois da virada da semana ISO (segunda
-- 00:05 UTC — a resolução preguiçosa da RPC já usa a mesma fronteira de
-- semana). cron.schedule com nome explícito substitui o job existente do
-- mesmo nome em vez de duplicar (idempotente a re-aplicações desta
-- migration). Só roda se pg_cron foi habilitada com sucesso acima — sem
-- ela, `cron` nem existe como schema.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'league-tier-drop-notifications',
      '5 0 * * 1',
      $cron$select public._run_league_tier_drop_notifications()$cron$
    );
  else
    raise notice 'pg_cron não habilitada — agende manualmente (docs/release-checklist.md) depois de habilitar a extensão no projeto Supabase.';
  end if;
end
$$;
