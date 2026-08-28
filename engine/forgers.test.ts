import { ForgerId, FORGERS, getForger } from './forgers';
import { PatternKind } from './patterns';
import { RELIC_POOL } from './relics';

describe('Forjadores', () => {
  test('os três Forjadores do MVP estão no pool', () => {
    expect(FORGERS.map((forger) => forger.id)).toEqual(['apprentice', 'hammer', 'anvil']);
  });

  test('Aprendiz explora com +1 carta na Mão (identidade própria pós rebalance)', () => {
    const apprentice = getForger('apprentice');
    expect(apprentice.startingRelic).toMatchObject({ category: 'mechanic', rarity: 'common' });
    expect(apprentice.startingRelic?.effect).toEqual({ kind: 'handSize', amount: 1 });
  });

  test('Martelo fortalece Trinca com bônus dobrado (10 → 20, pós rebalance)', () => {
    const hammer = getForger('hammer');
    expect(hammer.startingRelic).toMatchObject({ category: 'pattern', rarity: 'common' });
    expect(hammer.startingRelic?.effect).toEqual({
      kind: 'pattern',
      pattern: PatternKind.ThreeOfAKind,
      bonus: 20,
    });
  });

  test('Bigorna mexe no Multiplicador de Combo com início reduzido (×2 → ×1.5, pós rebalance)', () => {
    const anvil = getForger('anvil');
    expect(anvil.startingRelic).toMatchObject({ category: 'combo', rarity: 'common' });
    expect(anvil.startingRelic?.effect).toEqual({ kind: 'comboStart', multiplier: 1.5 });
  });

  test('as Relíquias de largada não estão no pool de ofertas da Forja', () => {
    const startingIds = FORGERS.flatMap((forger) =>
      forger.startingRelic ? [forger.startingRelic.id] : [],
    );
    expect(startingIds).toHaveLength(3);
    expect(RELIC_POOL.some((relic) => startingIds.includes(relic.id))).toBe(false);
  });

  test('getForger lança erro para id desconhecido', () => {
    expect(() => getForger('unknown' as ForgerId)).toThrow();
  });
});
