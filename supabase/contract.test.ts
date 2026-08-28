/**
 * Testes do contrato do Desafio Diário (ticket 12).
 *
 * O espelho TS (`supabase/contract.ts`) é verificado aqui com valores
 * dourados — confirmados contra um Postgres REAL por
 * `npm run verify:backend` (que também pega qualquer divergência entre o
 * espelho e a SQL de `supabase/migrations/`).
 */
import { readFileSync } from 'fs';
import { join } from 'path';

import { validateDisplayName as engineValidateDisplayName } from '../engine/displayName';
import { dailySeed, isoWeekStart, PROHIBITED_DISPLAY_NAME_TERMS, validateDisplayName } from './contract';
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
    const entry: LeaderboardEntry = { rank: 1, score: 2500, name: 'Fulano' };
    expect(entry).toEqual({ rank: 1, score: 2500, name: 'Fulano' });
  });

  test('LeaderboardEntry aceita name null (dispositivo sem Nome de Exibição cadastrado)', () => {
    const entry: LeaderboardEntry = { rank: 4, score: 900, name: null };
    expect(entry.name).toBeNull();
  });
});

describe('Nome de Exibição — reexportado de engine/displayName.ts (suíte completa de comportamento em engine/displayName.test.ts)', () => {
  test('validateDisplayName reexportado é a mesma função do espelho TS único, não uma cópia', () => {
    expect(validateDisplayName).toBe(engineValidateDisplayName);
  });
});

/** Extrai o array `_display_name_prohibited_terms()` do texto da migração SQL, sem precisar de Postgres. */
function extractSqlProhibitedTerms(sql: string): string[] {
  const match = sql.match(/_display_name_prohibited_terms[\s\S]*?array\[([\s\S]*?)\]/);
  if (match === null) throw new Error('Não encontrou o array de termos proibidos na migração SQL.');
  return match[1]
    .split(',')
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
    .map((term) => term.replace(/^'|'$/g, ''));
}

/** Extrai o array PROHIBITED_DISPLAY_NAME_TERMS do texto de verify-contract.mjs, sem executá-lo. */
function extractScriptProhibitedTerms(script: string): string[] {
  const match = script.match(/PROHIBITED_DISPLAY_NAME_TERMS = \[([\s\S]*?)\]/);
  if (match === null) throw new Error('Não encontrou o array de termos proibidos no script de verificação.');
  return match[1]
    .split(',')
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
    .map((term) => term.replace(/^'|'$/g, ''));
}

describe('Nome de Exibição — termos proibidos sem drift entre SQL, script e espelho TS (sem Postgres, ao contrário de npm run verify:backend)', () => {
  test('lista embutida na migração 0003_display_name.sql bate com o espelho TS (engine/displayName.ts)', () => {
    const sql = readFileSync(join(__dirname, 'migrations', '0003_display_name.sql'), 'utf8');
    expect(extractSqlProhibitedTerms(sql).sort()).toEqual([...PROHIBITED_DISPLAY_NAME_TERMS].sort());
  });

  test('lista duplicada em verify-contract.mjs bate com o espelho TS (engine/displayName.ts)', () => {
    const script = readFileSync(join(__dirname, 'scripts', 'verify-contract.mjs'), 'utf8');
    expect(extractScriptProhibitedTerms(script).sort()).toEqual([...PROHIBITED_DISPLAY_NAME_TERMS].sort());
  });
});
