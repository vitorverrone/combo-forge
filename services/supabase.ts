/**
 * Serviço Supabase do Desafio Diário (tickets 12 + 13): implementa o port
 * DailyBackend (engine/daily.ts) com o cliente @supabase/supabase-js,
 * chamando as funções RPC do contrato (get_daily_seed, submit_daily_score,
 * get_weekly_leaderboard — supabase/migrations/0001_daily_challenge.sql).
 *
 * Config via variáveis de ambiente EXPO_PUBLIC_* (embutidas no bundle do
 * Expo; ver .env.example). Sem env configurado, devolve null — a UI mostra o
 * Desafio Diário como indisponível em vez de quebrar.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import {
  createUnavailableDailyBackend,
  createUnavailablePushBackend,
  DailyBackend,
  DailyLeaderboard,
  LeagueStanding,
  PushBackend,
} from '../engine';
import { LeagueLeaderboardResponse } from '../supabase/contract';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** URL e anon key configuradas? (anon é pública por design, embutida no app.) */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * `run.runScore` (engine/run.ts) pode ser fracionário — Relíquias com
 * multiplicador não-inteiro (comboStart/comboGrowth, ex.: ×1.5 do Anvil e da
 * Chain Reaction, engine/relics.ts) — mas `submit_daily_score` declara
 * `p_score integer`: o PostgREST rejeita qualquer número com casa decimal
 * antes mesmo de a função rodar (erro 22P02). Arredonda na borda com o
 * backend, não no engine (a matemática fracionária de combo é intencional e
 * teste próprio em relics.test.ts) nem no ranking (que já é um inteiro por
 * natureza, sem perda de informação relevante pra competir).
 */
export function roundScoreForSubmission(score: number): number {
  return Math.round(score);
}

/**
 * Converte a resposta do contrato (`get_league_leaderboard` — supabase/contract.ts)
 * pra forma que o engine usa (`LeagueStanding | null`): a Liga inativa vira
 * null (mesma convenção de "sem dado" que fetchLeaderboard já usa pro
 * leaderboard único), ativa vira o objeto sem o campo `active`. Extraída
 * como função nomeada — ao contrário dos outros mapeamentos deste arquivo
 * (casts de uma linha), este tem uma decisão real (active → null ou
 * objeto) que merece nome e teste próprios.
 */
export function toEngineLeagueStanding(response: LeagueLeaderboardResponse): LeagueStanding | null {
  if (!response.active) return null;
  return {
    week: response.week,
    tier: response.tier,
    division: response.division,
    own: response.own,
    top: response.top,
  };
}

/**
 * Cliente Supabase configurado, ou null sem env presente (dev/testes) ou
 * URL inválida (ex.: placeholder do .env.example ainda não preenchido) —
 * compartilhado por todos os backends deste arquivo (Desafio Diário, Push)
 * pra não duplicar o mesmo try/catch em cada um.
 */
function createConfiguredClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
  } catch {
    return null;
  }
}

/**
 * Backend real do Desafio Diário sobre o projeto Supabase configurado.
 * Devolve null quando o env não está presente (desenvolvimento/testes).
 */
export function createSupabaseDailyBackend(): DailyBackend | null {
  const client = createConfiguredClient();
  if (client === null) return null;

  return {
    fetchSeed: async (dateIso: string): Promise<number> => {
      const { data, error } = await client.rpc('get_daily_seed', {
        p_date: dateIso,
      });
      if (error) throw new Error(error.message);
      return data as number;
    },

    submitScore: async (deviceId: string, score: number): Promise<number> => {
      const { data, error } = await client.rpc('submit_daily_score', {
        p_device_id: deviceId,
        p_score: roundScoreForSubmission(score),
      });
      if (error) throw new Error(error.message);
      return data as number;
    },

    fetchLeaderboard: async (deviceId: string): Promise<DailyLeaderboard> => {
      const { data, error } = await client.rpc('get_weekly_leaderboard', {
        p_device_id: deviceId,
      });
      if (error) throw new Error(error.message);
      return data as DailyLeaderboard;
    },

    fetchLeagueLeaderboard: async (deviceId: string): Promise<LeagueStanding | null> => {
      const { data, error } = await client.rpc('get_league_leaderboard', {
        p_device_id: deviceId,
      });
      if (error) throw new Error(error.message);
      return toEngineLeagueStanding(data as LeagueLeaderboardResponse);
    },

    setDisplayName: async (deviceId: string, name: string): Promise<string> => {
      const { data, error } = await client.rpc('set_display_name', {
        p_device_id: deviceId,
        p_name: name,
      });
      if (error) throw new Error(error.message);
      return data as string;
    },
  };
}

/** Backend para o store: real se configurado; indisponível (erros claros) se não. */
export function createAppDailyBackend(): DailyBackend {
  return createSupabaseDailyBackend() ?? createUnavailableDailyBackend();
}

/**
 * Backend real de push (ADR 0012, ticket 02) sobre o projeto Supabase
 * configurado: implementa PushBackend com a RPC register_push_token
 * (supabase/migrations/0007_push_tokens.sql). Devolve null sem env presente
 * (dev/testes) — mesma regra do backend do Desafio Diário.
 */
export function createSupabasePushBackend(): PushBackend | null {
  const client = createConfiguredClient();
  if (client === null) return null;

  return {
    registerToken: async (deviceId: string, token: string, platform: 'ios' | 'android'): Promise<void> => {
      const { error } = await client.rpc('register_push_token', {
        p_device_id: deviceId,
        p_token: token,
        p_platform: platform,
      });
      if (error) throw new Error(error.message);
    },
  };
}

/** Backend de push para o store: real se configurado; indisponível se não. */
export function createAppPushBackend(): PushBackend {
  return createSupabasePushBackend() ?? createUnavailablePushBackend();
}
