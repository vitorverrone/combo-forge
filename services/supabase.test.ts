/**
 * Testes do serviço Supabase (candidato B da revisão de arquitetura,
 * 2026-09-04): o resto do arquivo é composto de casts de uma linha sem
 * lógica (sem teste dedicado, correção garantida via verify-contract.mjs
 * contra Postgres real); toEngineLeagueStanding e roundScoreForSubmission são
 * as únicas conversões com lógica de verdade e por isso as únicas testadas
 * aqui.
 */
import { LeagueLeaderboardResponse } from '../supabase/contract';
import { roundScoreForSubmission, toEngineLeagueStanding } from './supabase';

describe('roundScoreForSubmission', () => {
  test('arredonda pontuação fracionária de Relíquias com multiplicador não-inteiro (ex.: Chain Reaction ×1.5)', () => {
    expect(roundScoreForSubmission(2367.5)).toBe(2368);
  });

  test('arredonda pra baixo quando a fração é menor que 0.5', () => {
    expect(roundScoreForSubmission(100.4)).toBe(100);
  });

  test('pontuação já inteira passa direto', () => {
    expect(roundScoreForSubmission(1500)).toBe(1500);
  });
});

describe('toEngineLeagueStanding', () => {
  test('Liga inativa (active: false) vira null', () => {
    const response: LeagueLeaderboardResponse = { active: false };
    expect(toEngineLeagueStanding(response)).toBeNull();
  });

  test('Liga ativa sem pontuação na semana: division/own null, top vazio', () => {
    const response: LeagueLeaderboardResponse = {
      active: true,
      week: '2026-09-07',
      tier: 'bronze',
      division: null,
      own: null,
      top: [],
    };
    expect(toEngineLeagueStanding(response)).toEqual({
      week: '2026-09-07',
      tier: 'bronze',
      division: null,
      own: null,
      top: [],
    });
  });

  test('Liga ativa com pontuação: mapeia todos os campos (sem o "active")', () => {
    const response: LeagueLeaderboardResponse = {
      active: true,
      week: '2026-09-07',
      tier: 'gold',
      division: 2,
      own: { rank: 34, score: 1200, name: 'Ana' },
      top: [
        { rank: 31, score: 1500, name: 'Carlos' },
        { rank: 34, score: 1200, name: 'Ana' },
      ],
    };
    const standing = toEngineLeagueStanding(response);
    expect(standing).toEqual({
      week: '2026-09-07',
      tier: 'gold',
      division: 2,
      own: { rank: 34, score: 1200, name: 'Ana' },
      top: [
        { rank: 31, score: 1500, name: 'Carlos' },
        { rank: 34, score: 1200, name: 'Ana' },
      ],
    });
    expect(standing).not.toHaveProperty('active');
  });
});
