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
import {
  dailySeed,
  demoteLeagueTier,
  didLeagueTierDrop,
  isoWeekStart,
  leagueDivisionNumber,
  leagueDivisionPosition,
  LEAGUE_POPULATION_THRESHOLD,
  promoteLeagueTier,
  PROHIBITED_DISPLAY_NAME_TERMS,
  resolveLeagueTierFromDivision,
  validateDisplayName,
} from './contract';
import type { LeaderboardEntry, LeagueStanding, LeagueTier, WeeklyLeaderboard } from './contract';

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

  test('LeagueStanding aceita division/own null (dispositivo sem pontuação na semana)', () => {
    const standing: LeagueStanding = {
      active: true,
      week: '2026-09-07',
      tier: 'bronze',
      division: null,
      own: null,
      top: [],
    };
    expect(standing.division).toBeNull();
    expect(standing.own).toBeNull();
  });
});

describe('Liga: ordem dos Tiers (promoteLeagueTier/demoteLeagueTier, ADR 0010, ticket 02)', () => {
  const ORDER: readonly LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

  test('promoteLeagueTier sobe um Tier por vez', () => {
    for (let i = 0; i < ORDER.length - 1; i += 1) {
      expect(promoteLeagueTier(ORDER[i])).toBe(ORDER[i + 1]);
    }
  });

  test('promoteLeagueTier não tem efeito no teto (diamond)', () => {
    expect(promoteLeagueTier('diamond')).toBe('diamond');
  });

  test('demoteLeagueTier desce um Tier por vez', () => {
    for (let i = ORDER.length - 1; i > 0; i -= 1) {
      expect(demoteLeagueTier(ORDER[i])).toBe(ORDER[i - 1]);
    }
  });

  test('demoteLeagueTier não tem efeito no piso (bronze)', () => {
    expect(demoteLeagueTier('bronze')).toBe('bronze');
  });
});

describe('Liga: detecção de queda de Tier (didLeagueTierDrop, ticket 01)', () => {
  const ORDER: readonly LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

  test('queda real: par consecutivo descendo é detectado', () => {
    for (let i = ORDER.length - 1; i > 0; i -= 1) {
      expect(didLeagueTierDrop(ORDER[i], ORDER[i - 1])).toBe(true);
    }
  });

  test('subida não conta como queda', () => {
    for (let i = 0; i < ORDER.length - 1; i += 1) {
      expect(didLeagueTierDrop(ORDER[i], ORDER[i + 1])).toBe(false);
    }
  });

  test('mesmo Tier não conta como queda', () => {
    for (const tier of ORDER) {
      expect(didLeagueTierDrop(tier, tier)).toBe(false);
    }
  });

  test('piso do Bronze: nunca há queda "abaixo" dele', () => {
    expect(didLeagueTierDrop('bronze', 'bronze')).toBe(false);
  });

  test('teto do Diamond: cair de diamond é queda como qualquer outra', () => {
    expect(didLeagueTierDrop('diamond', 'platinum')).toBe(true);
    expect(didLeagueTierDrop('diamond', 'diamond')).toBe(false);
  });
});

describe('Liga: aritmética de Divisão (leagueDivisionNumber/leagueDivisionPosition, ADR 0010, ticket 02)', () => {
  test('rank 1 e rank 30 caem na Divisão 1 (blocos de 30)', () => {
    expect(leagueDivisionNumber(1)).toBe(1);
    expect(leagueDivisionNumber(30)).toBe(1);
  });

  test('rank 31 vira a Divisão 2', () => {
    expect(leagueDivisionNumber(31)).toBe(2);
    expect(leagueDivisionNumber(60)).toBe(2);
    expect(leagueDivisionNumber(61)).toBe(3);
  });

  test('posição dentro da Divisão reinicia em 1 a cada bloco', () => {
    expect(leagueDivisionPosition(1)).toBe(1);
    expect(leagueDivisionPosition(30)).toBe(30);
    expect(leagueDivisionPosition(31)).toBe(1);
    expect(leagueDivisionPosition(60)).toBe(30);
  });
});

describe('Liga: resolução de Tier a partir da Divisão (resolveLeagueTierFromDivision, ADR 0010, ticket 02)', () => {
  test('top 5 de uma Divisão de 30 sobe de Tier', () => {
    for (let position = 1; position <= 5; position += 1) {
      expect(resolveLeagueTierFromDivision('silver', position, 30)).toBe('gold');
    }
  });

  test('meio da Divisão (posições 6 a 25) mantém o Tier', () => {
    expect(resolveLeagueTierFromDivision('silver', 6, 30)).toBe('silver');
    expect(resolveLeagueTierFromDivision('silver', 25, 30)).toBe('silver');
  });

  test('últimos 5 de uma Divisão de 30 (posições 26 a 30) descem de Tier', () => {
    for (let position = 26; position <= 30; position += 1) {
      expect(resolveLeagueTierFromDivision('silver', position, 30)).toBe('bronze');
    }
  });

  test('piso do Bronze: rebaixamento não tem efeito', () => {
    expect(resolveLeagueTierFromDivision('bronze', 30, 30)).toBe('bronze');
  });

  test('teto do Diamond: promoção não tem efeito', () => {
    expect(resolveLeagueTierFromDivision('diamond', 1, 30)).toBe('diamond');
  });

  test('Divisão pequena demais pra caber as duas zonas sem sobrepor: promoção tem prioridade sobre rebaixamento', () => {
    // Divisão de 8 (zona de 5): as posições 4 e 5 satisfariam a condição de
    // rebaixamento (posição > 8 - 5 = 3) SE a promoção não fosse checada
    // primeiro — aqui a zona de 5 já cobre a Divisão inteira de um lado, sem
    // sobrar nenhuma posição "no meio" que mantenha o Tier.
    for (let position = 1; position <= 5; position += 1) {
      expect(resolveLeagueTierFromDivision('silver', position, 8)).toBe('gold');
    }
    for (let position = 6; position <= 8; position += 1) {
      expect(resolveLeagueTierFromDivision('silver', position, 8)).toBe('bronze');
    }
  });
});

describe('Liga: constantes do contrato (ADR 0010, ticket 02)', () => {
  test('limiar de massa crítica documentado em 30 participantes/semana', () => {
    expect(LEAGUE_POPULATION_THRESHOLD).toBe(30);
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
  test('lista embutida na migração 0006_display_name_prohibited_terms.sql (redefinição mais recente) bate com o espelho TS (engine/displayName.ts)', () => {
    const sql = readFileSync(join(__dirname, 'migrations', '0006_display_name_prohibited_terms.sql'), 'utf8');
    expect(extractSqlProhibitedTerms(sql).sort()).toEqual([...PROHIBITED_DISPLAY_NAME_TERMS].sort());
  });

  test('lista duplicada em verify-contract.mjs bate com o espelho TS (engine/displayName.ts)', () => {
    const script = readFileSync(join(__dirname, 'scripts', 'verify-contract.mjs'), 'utf8');
    expect(extractScriptProhibitedTerms(script).sort()).toEqual([...PROHIBITED_DISPLAY_NAME_TERMS].sort());
  });
});
