/**
 * Testes do serviço Supabase (candidato B da revisão de arquitetura,
 * 2026-09-04): o resto do arquivo é composto de casts de uma linha sem
 * lógica (sem teste dedicado, correção garantida via verify-contract.mjs
 * contra Postgres real); toEngineLeagueStanding é a única conversão com
 * lógica de verdade (active → null ou objeto) e por isso a única testada
 * aqui.
 */
import { LeagueLeaderboardResponse } from '../supabase/contract';
import { toEngineLeagueStanding } from './supabase';

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
