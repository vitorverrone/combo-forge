-- 0002 — Desafio Diário: acesso anônimo ao contrato mínimo
--
-- Sem contas de usuário (out of scope do MVP), o app acessa via chave anon do
-- Supabase. As três funções do contrato são SECURITY DEFINER (rodam como dono,
-- burlando o RLS da tabela) com search_path travado; a tabela fica com RLS e
-- sem políticas — inacessível diretamente para qualquer role. O contrato RPC
-- é o único caminho de leitura/escrita.
--
-- As roles anon/authenticated existem em todo projeto Supabase; este bloco
-- apenas garante que a migration também rode num Postgres puro (ex.: na
-- verificação local via Docker), sendo um no-op no Supabase.
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

alter function public.get_daily_seed(date)
  security definer set search_path = public;
alter function public.submit_daily_score(text, integer)
  security definer set search_path = public;
alter function public.get_weekly_leaderboard(text, timestamptz)
  security definer set search_path = public;

alter table public.daily_submissions enable row level security;

-- Tabela inacessível diretamente (nem para anon, nem para autenticados).
revoke all on public.daily_submissions from public;
revoke all on public.daily_submissions from anon, authenticated;

-- Contrato exposto apenas via RPC (anon para o app; authenticated fica
-- preparado para um futuro opt-in real).
grant execute on function public.get_daily_seed(date) to anon, authenticated;
grant execute on function public.submit_daily_score(text, integer) to anon, authenticated;
grant execute on function public.get_weekly_leaderboard(text, timestamptz) to anon, authenticated;
