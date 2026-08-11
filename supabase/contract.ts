/**
 * Contrato do backend do Desafio Diário (ticket 12) — espelho de referência
 * das funções SQL em `supabase/migrations/0001_daily_challenge.sql`.
 *
 * O SQL é a fonte da verdade (é o que roda no Supabase). Este módulo espelha
 * as fórmulas do contrato em TypeScript puro para (a) travar o contrato em
 * testes de unidade com valores dourados e (b) servir de base ao cliente do
 * Desafio Diário (ticket 13). Mudar a fórmula SQL exige atualizar o espelho
 * e os valores dourados — a verificação contra um Postgres real
 * (`npm run verify:backend`) pega qualquer divergência.
 */

import { createHash } from 'crypto';

/**
 * Seed do dia, idêntico à função SQL `get_daily_seed`:
 * `(('x' || substr(md5(to_char(p_date, 'YYYY-MM-DD')), 1, 8))::bit(32))::int
 * & 2147483647`. Recebe a data no formato ISO `YYYY-MM-DD` (o mesmo que o
 * `to_char` da SQL) e devolve um inteiro em [0, 2^31-1] — a semente da Run
 * do Desafio Diário (embaralhamento + Forjas).
 */
export function dailySeed(dateIso: string): number {
  const hex = createHash('md5').update(dateIso).digest('hex').slice(0, 8);
  return parseInt(hex, 16) & 0x7fffffff;
}

/**
 * Segunda-feira da semana ISO (igual à função SQL `get_weekly_leaderboard`:
 * `p_now::date - ((extract(dow from p_now)::int + 6) % 7)`). Recebe uma data
 * ISO e devolve a data ISO da segunda-feira que inicia a semana.
 */
export function isoWeekStart(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = (date.getUTCDay() + 6) % 7; // 0 = segunda
  date.setUTCDate(date.getUTCDate() - dow);
  return date.toISOString().slice(0, 10);
}

/** Uma entrada do leaderboard: rank (1-based, empates compartilham) + score. */
export interface LeaderboardEntry {
  readonly rank: number;
  readonly score: number;
}

/** Resposta de `get_weekly_leaderboard` (JSONB da função SQL). */
export interface WeeklyLeaderboard {
  /** Segunda-feira da semana (ISO), `YYYY-MM-DD`. */
  readonly week: string;
  /** Posição própria na semana (null se o dispositivo não pontuou). */
  readonly own: LeaderboardEntry | null;
  /** Top 10 da semana, ordenado por rank. */
  readonly top: readonly LeaderboardEntry[];
}
