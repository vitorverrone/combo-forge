/**
 * Testes do contrato do Desafio Diário (ticket 12).
 *
 * O espelho TS (`supabase/contract.ts`) é verificado aqui com valores
 * dourados — confirmados contra um Postgres REAL por
 * `npm run verify:backend` (que também pega qualquer divergência entre o
 * espelho e a SQL de `supabase/migrations/`).
 */
import { dailySeed, isoWeekStart } from './contract';
import type { LeaderboardEntry, WeeklyLeaderboard } from './contract';

describe('seed diário determinístico (get_daily_seed)', () => {
  test('valores dourados: fórmula md5(ISO) → int32 mascarado, conferida no Postgres real', () => {
    expect(dailySeed('2026-08-11')).toBe(1828299912);
    expect(dailySeed('2026-08-12')).toBe(2057563603);
    expect(dailySeed('2026-01-01')).toBe(1452783952);
    expect(dailySeed('2024-02-29')).toBe(1492001706);
    expect(dailySeed('1970-01-01')).toBe(202356402);
  });

  test('determinístico: a mesma data produz sempre o mesmo seed', () => {
    expect(dailySeed('2026-08-11')).toBe(dailySeed('2026-08-11'));
  });

  test('datas diferentes produzem seeds diferentes (amostras)', () => {
    const seeds = ['2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15'].map(dailySeed);
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  test('o seed está sempre em [0, 2^31-1]', () => {
    for (const date of ['1970-01-01', '2024-02-29', '2026-08-11', '2099-12-31']) {
      const seed = dailySeed(date);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(2147483647);
    }
  });

  test('o dia muda à meia-noite UTC (fronteira do Desafio Diário)', () => {
    expect(dailySeed('2026-08-11')).not.toBe(dailySeed('2026-08-12'));
  });
});

describe('janela semanal ISO (segunda a domingo)', () => {
  test('terça-feira pertence à semana que começa na segunda anterior', () => {
    expect(isoWeekStart('2026-08-11')).toBe('2026-08-10'); // terça → segunda
    expect(isoWeekStart('2026-08-13')).toBe('2026-08-10'); // quinta → segunda
  });

  test('segunda-feira inicia a própria semana', () => {
    expect(isoWeekStart('2026-08-10')).toBe('2026-08-10');
    expect(isoWeekStart('2026-08-17')).toBe('2026-08-17');
  });

  test('domingo ainda é a semana da segunda anterior', () => {
    expect(isoWeekStart('2026-08-16')).toBe('2026-08-10');
  });

  test('vira a semana entre domingo e segunda', () => {
    expect(isoWeekStart('2026-08-16')).not.toBe(isoWeekStart('2026-08-17'));
  });
});

describe('tipos do contrato (shape do leaderboard)', () => {
  test('WeeklyLeaderboard aceita own null (dispositivo sem pontuação)', () => {
    const withoutOwn: WeeklyLeaderboard = { week: '2026-08-10', own: null, top: [] };
    expect(withoutOwn.own).toBeNull();
    const entry: LeaderboardEntry = { rank: 1, score: 2500 };
    expect(entry).toEqual({ rank: 1, score: 2500 });
  });
});
