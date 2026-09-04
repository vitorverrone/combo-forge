/**
 * Contrato do backend do Desafio Diário (ticket 12) — espelho de referência
 * das funções SQL em `supabase/migrations/0001_daily_challenge.sql`.
 *
 * O SQL é a fonte da verdade (é o que roda no Supabase). Este módulo espelha
 * as fórmulas do contrato (seed diário, janela semanal) em TypeScript puro
 * para (a) travar o contrato em testes de unidade com valores dourados e (b)
 * servir de base ao cliente do Desafio Diário (ticket 13). Mudar a fórmula
 * SQL exige atualizar o espelho e os valores dourados — a verificação contra
 * um Postgres real (`npm run verify:backend`) pega qualquer divergência.
 *
 * Nome de Exibição (ADR 0005) é a exceção: não tem cópia própria aqui —
 * `engine/displayName.ts` já é um mirror RN-safe do SQL (sem depender de
 * `crypto`, ao contrário deste módulo), então esse é o único TS a manter em
 * sincronia com o SQL. Reexportado abaixo por compatibilidade com quem já
 * importava esses nomes deste módulo.
 */

import { createHash } from 'crypto';

// Nome de Exibição (ADR 0005): fonte única é engine/displayName.ts (mirror
// RN-safe do cliente); reexportado aqui só porque supabase/contract.test.ts
// e verify-contract.mjs já importavam esses nomes deste módulo.
export * from '../engine/displayName';

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

// ── Liga (ADR 0010, ticket 02) ──────────────────────────────────────────

/** Um dos 5 patamares nomeados da Liga — bronze é piso, diamond é teto. */
export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

const LEAGUE_TIERS: readonly LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

/** Tamanho-alvo de uma Divisão — espelho de `v_division_size` em `get_league_leaderboard`. */
export const LEAGUE_DIVISION_SIZE = 30;
/** Tamanho da zona de subida/descida — espelho de `v_zone_size`. */
export const LEAGUE_ZONE_SIZE = 5;
/** Participantes mínimos na semana pra Liga ativar — espelho de `v_threshold`. */
export const LEAGUE_POPULATION_THRESHOLD = 300;

/** Sobe um Tier; sem efeito em 'diamond' (teto) — espelho de `_league_tier_promote`. */
export function promoteLeagueTier(tier: LeagueTier): LeagueTier {
  const index = LEAGUE_TIERS.indexOf(tier);
  return LEAGUE_TIERS[Math.min(LEAGUE_TIERS.length - 1, index + 1)];
}

/** Desce um Tier; sem efeito em 'bronze' (piso) — espelho de `_league_tier_demote`. */
export function demoteLeagueTier(tier: LeagueTier): LeagueTier {
  const index = LEAGUE_TIERS.indexOf(tier);
  return LEAGUE_TIERS[Math.max(0, index - 1)];
}

/** Número da Divisão (1-based) de um rank dentro do Tier, em blocos de `divisionSize`. */
export function leagueDivisionNumber(rank: number, divisionSize: number = LEAGUE_DIVISION_SIZE): number {
  return Math.floor((rank - 1) / divisionSize) + 1;
}

/** Posição (1-based) dentro da própria Divisão — mesma fórmula do módulo em `_resolve_league_tier`. */
export function leagueDivisionPosition(rank: number, divisionSize: number = LEAGUE_DIVISION_SIZE): number {
  return ((rank - 1) % divisionSize) + 1;
}

/**
 * Resolve o novo Tier a partir da posição do dispositivo na Divisão da
 * semana anterior — espelho puro de `_resolve_league_tier` (SQL), sem a
 * parte de leitura do banco (resolvida por quem chama, com o rank/tamanho de
 * Divisão já calculados). Promoção tem prioridade sobre rebaixamento quando
 * a Divisão é pequena demais pra caber as duas zonas sem sobrepor.
 */
export function resolveLeagueTierFromDivision(
  previousTier: LeagueTier,
  positionInDivision: number,
  actualDivisionSize: number,
  zoneSize: number = LEAGUE_ZONE_SIZE,
): LeagueTier {
  if (positionInDivision <= zoneSize) return promoteLeagueTier(previousTier);
  if (positionInDivision > actualDivisionSize - zoneSize) return demoteLeagueTier(previousTier);
  return previousTier;
}

/** Resposta de `get_league_leaderboard` quando a Liga ainda não ativou (abaixo da massa crítica). */
export interface LeagueInactive {
  readonly active: false;
}

/** Resposta de `get_league_leaderboard` quando a Liga está ativa. */
export interface LeagueStanding {
  readonly active: true;
  /** Segunda-feira da semana (ISO), `YYYY-MM-DD`. */
  readonly week: string;
  readonly tier: LeagueTier;
  /** Número da Divisão (1-based); null se o dispositivo não pontuou na semana. */
  readonly division: number | null;
  /** Posição própria na Divisão (null se o dispositivo não pontuou na semana). */
  readonly own: LeaderboardEntry | null;
  /** Ranking completo da Divisão (não só um top 10) — vazio se `own` for null. */
  readonly top: readonly LeaderboardEntry[];
}

export type LeagueLeaderboardResponse = LeagueInactive | LeagueStanding;
