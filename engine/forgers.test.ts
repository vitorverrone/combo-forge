import { ForgerId, FORGERS, getForger } from './forgers';
import { PatternKind } from './patterns';
import { RELIC_POOL } from './relics';

describe('Forjadores', () => {
  test('os três Forjadores do MVP estão no pool', () => {
    expect(FORGERS.map((forger) => forger.id)).toEqual(['apprentice', 'hammer', 'anvil']);
  });

  test('Aprendiz começa sem Relíquia (onboarding neutro)', () => {
    const apprentice = getForger('apprentice');
    expect(apprentice.startingRelic).toBeUndefined();
  });

  test('Martelo fortalece um Padrão com Relíquia exclusiva', () => {
    const hammer = getForger('hammer');
    expect(hammer.startingRelic).toMatchObject({ category: 'pattern', rarity: 'common' });
    expect(hammer.startingRelic?.effect).toEqual({
      kind: 'pattern',
      pattern: PatternKind.ThreeOfAKind,
      bonus: 10,
    });
  });

  test('Bigorna mexe no Multiplicador de Combo com Relíquia exclusiva', () => {
    const anvil = getForger('anvil');
    expect(anvil.startingRelic).toMatchObject({ category: 'combo', rarity: 'common' });
    expect(anvil.startingRelic?.effect).toEqual({ kind: 'comboStart', multiplier: 2 });
  });

  test('as Relíquias de largada não estão no pool de ofertas da Forja', () => {
    const startingIds = FORGERS.flatMap((forger) =>
      forger.startingRelic ? [forger.startingRelic.id] : [],
    );
    expect(startingIds).toHaveLength(2);
    expect(RELIC_POOL.some((relic) => startingIds.includes(relic.id))).toBe(false);
  });

  test('getForger lança erro para id desconhecido', () => {
    expect(() => getForger('unknown' as ForgerId)).toThrow();
  });
});
