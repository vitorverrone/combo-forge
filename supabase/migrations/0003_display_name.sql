-- 0003 — Nome de Exibição no ranking do Desafio Diário (ticket 01, ADR 0005)
--
-- Tabela public.players (chave device_id, independente das submissões
-- diárias — nome é propriedade do dispositivo, não de um dia específico) +
-- função set_display_name (upsert com validação de formato e moderação
-- contra uma lista de termos proibidos própria, pt-br + en). A moderação
-- roda aqui, no servidor, além do cliente (engine/displayName.ts, ticket
-- 02): a anon key do Supabase é pública por natureza, então validar só no
-- app deixaria qualquer chamada direta à API sujar o ranking compartilhado.
--
-- get_weekly_leaderboard (0001) passa a fazer join em players e devolver o
-- nome de cada entrada (própria e top 10); null quando o dispositivo ainda
-- não tem nome cadastrado — fallback previsível, decidido pelo cliente como
-- renderizar (sem string hardcoded em inglês no backend).
--
-- O jogo ainda não foi lançado — a migração zera daily_submissions, sem
-- preocupação com dado legado sem Nome de Exibição.

create table if not exists public.players (
  device_id text primary key,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Mesmos limites da validação embutida em set_display_name — redundante
  -- de propósito (defesa em profundidade contra qualquer futuro caminho de
  -- escrita que não passe pela função).
  constraint players_display_name_length check (char_length(display_name) between 3 and 16),
  constraint players_display_name_charset check (
    display_name ~ '^[a-zA-Z0-9 ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ]+$'
  )
);

-- Lista de termos proibidos (pt-br + en) — fonte da verdade deste contrato,
-- isolada numa função só pra poder ser conferida diretamente por
-- verify-contract.mjs contra o espelho TS (supabase/contract.ts), em vez de
-- só comparar o resultado de alguns nomes de amostra. Não faz parte do
-- contrato do app (não é chamada pelo cliente) — só por set_display_name e
-- pelo script de verificação. Curada pelo time (ADR 0005): libs prontas de
-- profanity filter têm cobertura fraca de pt-br. Mantida pequena de
-- propósito — não é pra ser exaustiva.
create or replace function public._display_name_prohibited_terms()
returns text[]
language sql
immutable
as $$
  select array[
    'porra', 'caralho', 'merda', 'buceta', 'cacete', 'piroca', 'cuzao',
    'arrombado', 'arrombada', 'punheta', 'xoxota', 'putinha', 'corno',
    'fdp', 'desgracado', 'desgracada', 'viadinho', 'bosta',
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'whore',
    'faggot', 'nigger', 'nigga', 'motherfucker', 'dickhead', 'slut',
    'retard', 'pussy'
  ];
$$;

-- Grava/atualiza o Nome de Exibição do dispositivo (upsert). Rejeita com
-- exceção quando o nome é inválido — tamanho, caractere fora do permitido
-- ou termo da lista de proibidos — nunca grava um nome inválido. Não exige
-- unicidade entre dispositivos: duplicados são permitidos (ADR 0005).
create or replace function public.set_display_name(
  p_device_id text,
  p_name text
)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_name text := trim(p_name);
  v_lower text := lower(v_name);
  v_term text;
begin
  if v_name is null or char_length(v_name) < 3 or char_length(v_name) > 16 then
    raise exception 'invalid_display_name: length must be between 3 and 16 characters';
  end if;
  if v_name !~ '^[a-zA-Z0-9 ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ]+$' then
    raise exception 'invalid_display_name: only letters, numbers and spaces are allowed';
  end if;
  foreach v_term in array public._display_name_prohibited_terms() loop
    if v_lower like '%' || v_term || '%' then
      raise exception 'invalid_display_name: prohibited term';
    end if;
  end loop;

  insert into public.players (device_id, display_name)
  values (p_device_id, v_name)
  on conflict (device_id) do update
    set display_name = excluded.display_name, updated_at = now();

  return v_name;
end;
$$;

-- get_weekly_leaderboard (0001): passa a incluir o Nome de Exibição de cada
-- entrada via left join em players (null se o dispositivo ainda não
-- cadastrou). SECURITY DEFINER + search_path precisam ser redeclarados
-- aqui — create or replace function não preserva esses atributos.
create or replace function public.get_weekly_leaderboard(
  p_device_id text,
  p_now timestamptz default now()
)
returns jsonb
language sql
stable
security definer
set search_path = public
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
    select b.device_id, b.score, p.display_name as name,
           (select count(*) + 1 from weekly_best b2 where b2.score > b.score) as rank
    from weekly_best b
    left join public.players p on p.device_id = b.device_id
  )
  select jsonb_build_object(
    'week', to_char((select ws from w), 'YYYY-MM-DD'),
    'own', (
      select jsonb_build_object('rank', r.rank, 'score', r.score, 'name', r.name)
      from ranked r
      where r.device_id = p_device_id
    ),
    'top', coalesce(
      (
        -- jsonb_agg preserva a ordem de entrada (rank, device_id) da subconsulta
        select jsonb_agg(jsonb_build_object('rank', r.rank, 'score', r.score, 'name', r.name))
        from (select r.rank, r.score, r.name, r.device_id from ranked r order by r.rank, r.device_id limit 10) r
      ),
      '[]'::jsonb
    )
  );
$$;

-- Tabela inacessível diretamente (mesmo padrão de daily_submissions, 0002).
alter table public.players enable row level security;
revoke all on public.players from public;
revoke all on public.players from anon, authenticated;

-- Helper de moderação: uso interno (set_display_name) + verify-contract.mjs
-- (conferir a lista contra o espelho TS). Não é parte do contrato do app.
revoke all on function public._display_name_prohibited_terms() from public;

-- Contrato exposto via RPC (mesmo padrão de 0002, grants batched no fim).
grant execute on function public.set_display_name(text, text) to anon, authenticated;
grant execute on function public.get_weekly_leaderboard(text, timestamptz) to anon, authenticated;

-- Jogo ainda não lançado (sem jogadores reais): zera as submissões — sem
-- preocupação com dado legado sem Nome de Exibição (ADR 0005).
truncate table public.daily_submissions;
