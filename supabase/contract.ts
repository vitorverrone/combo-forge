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
  /** Nome de Exibição do dispositivo; null se ainda não cadastrou (ADR 0005). */
  readonly name: string | null;
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

/** Tamanho mínimo/máximo do Nome de Exibição (ADR 0005) — igual à constraint SQL `players_display_name_length`. */
export const DISPLAY_NAME_MIN_LENGTH = 3;
export const DISPLAY_NAME_MAX_LENGTH = 16;

/**
 * Caracteres aceitos no Nome de Exibição: letras (incluindo acentuação
 * pt-br), números e espaço — sem emoji nem símbolo. Mesmo regex da
 * constraint SQL `players_display_name_charset` e da função `set_display_name`.
 */
const DISPLAY_NAME_CHARSET_REGEX =
  /^[a-zA-Z0-9 ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ]+$/;

/**
 * Termos proibidos no Nome de Exibição (pt-br + en) — lista própria, curada
 * pelo time (ADR 0005: libs prontas de profanity filter têm cobertura fraca
 * de pt-br). Fonte da verdade é a mesma lista embutida na função SQL
 * `set_display_name` (supabase/migrations); mantida sincronizada manualmente
 * e conferida contra o Postgres real por `npm run verify:backend`.
 */
export const PROHIBITED_DISPLAY_NAME_TERMS: readonly string[] = [
  'porra', 'caralho', 'merda', 'buceta', 'cacete', 'piroca', 'cuzao',
  'arrombado', 'arrombada', 'punheta', 'xoxota', 'putinha', 'corno',
  'fdp', 'desgracado', 'desgracada', 'viadinho', 'bosta',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'whore',
  'faggot', 'nigger', 'nigga', 'motherfucker', 'dickhead', 'slut',
  'retard', 'pussy',
];

/** Resultado da validação do Nome de Exibição, com o motivo da rejeição. */
export type DisplayNameValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: 'tooShort' | 'tooLong' | 'invalidChars' | 'profanity' };

/**
 * Espelho TS da validação SQL de `set_display_name` — mesma ordem de
 * checagem (tamanho → caracteres → termos proibidos), mesmo trim. Fonte da
 * verdade é o SQL; este espelho é conferido contra ele por
 * `npm run verify:backend`.
 */
export function validateDisplayName(rawName: string): DisplayNameValidation {
  const name = rawName.trim();
  if (name.length < DISPLAY_NAME_MIN_LENGTH) return { valid: false, reason: 'tooShort' };
  if (name.length > DISPLAY_NAME_MAX_LENGTH) return { valid: false, reason: 'tooLong' };
  if (!DISPLAY_NAME_CHARSET_REGEX.test(name)) return { valid: false, reason: 'invalidChars' };
  const lower = name.toLowerCase();
  if (PROHIBITED_DISPLAY_NAME_TERMS.some((term) => lower.includes(term))) {
    return { valid: false, reason: 'profanity' };
  }
  return { valid: true };
}
