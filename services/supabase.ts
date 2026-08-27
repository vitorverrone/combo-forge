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

import { createClient } from '@supabase/supabase-js';

import {
  createUnavailableDailyBackend,
  DailyBackend,
  DailyLeaderboard,
} from '../engine';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** URL e anon key configuradas? (anon é pública por design, embutida no app.) */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Backend real do Desafio Diário sobre o projeto Supabase configurado.
 * Devolve null quando o env não está presente (desenvolvimento/testes).
 */
export function createSupabaseDailyBackend(): DailyBackend | null {
  if (!isSupabaseConfigured()) return null;

  let client;
  try {
    client = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
  } catch {
    // URL inválida (ex.: placeholder do .env.example ainda não preenchido):
    // trata como não configurado — o Desafio Diário fica indisponível em
    // vez de derrubar o bootstrap inteiro (que injeta loja e demais ports).
    return null;
  }

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
        p_score: score,
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
  };
}

/** Backend para o store: real se configurado; indisponível (erros claros) se não. */
export function createAppDailyBackend(): DailyBackend {
  return createSupabaseDailyBackend() ?? createUnavailableDailyBackend();
}
