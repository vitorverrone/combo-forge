-- 0007 — Notificação push: token por dispositivo (ADR 0012, ticket 02)
--
-- Infra de push nasce genérica (token por device_id), mas só o gatilho de
-- Queda de Tier (ticket 03, job semanal) é implementado nesta rodada. Tabela
-- push_tokens: token mais recente sobrescreve o anterior (upsert, sem
-- histórico) — mesmo espírito de players (0003) e league_placements (0004).
-- RPC register_push_token, mesmo padrão de segurança do resto do contrato
-- (SECURITY DEFINER, search_path travado, tabela sem acesso direto).

create table if not exists public.push_tokens (
  device_id text primary key,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);

-- Registra/atualiza o Expo push token do dispositivo (upsert). Rejeita com
-- exceção quando token ou platform são inválidos — nunca grava um token
-- vazio nem uma plataforma fora de ('ios', 'android').
create or replace function public.register_push_token(
  p_device_id text,
  p_token text,
  p_platform text
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'invalid_push_token: token must not be empty';
  end if;
  if p_platform not in ('ios', 'android') then
    raise exception 'invalid_push_token: platform must be ios or android';
  end if;

  insert into public.push_tokens (device_id, expo_push_token, platform)
  values (p_device_id, p_token, p_platform)
  on conflict (device_id) do update
    set expo_push_token = excluded.expo_push_token,
        platform = excluded.platform,
        updated_at = now();
end;
$$;

-- Tabela inacessível diretamente (mesmo padrão de players/league_placements).
alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from public;
revoke all on public.push_tokens from anon, authenticated;

-- Contrato exposto ao app: anon (authenticated preparado para o futuro).
grant execute on function public.register_push_token(text, text, text) to anon, authenticated;
