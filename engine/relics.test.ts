import { DISCARDS_PER_ROUND, HAND_SIZE } from './deck';
import { PatternKind } from './patterns';
import { activeRelics, comboMultiplier, RELIC_POOL, scoreModifiers, structureModifiers } from './relics';

describe('scoreModifiers', () => {
  test('agrega multiplicadores de Naipe e bônus de Padrão das Relíquias ativas', () => {
    const mods = scoreModifiers([RELIC_POOL[0], RELIC_POOL[4]]); // espadas ×2 + Par +10
    expect(mods.suitMultipliers).toEqual({ spades: 2 });
    expect(mods.patternBonuses).toEqual({ [PatternKind.Pair]: 10 });
  });

  test('Mecânica e Combo não alteram o Valor-Base', () => {
    const mods = scoreModifiers([RELIC_POOL[6], RELIC_POOL[8]]);
    expect(mods.suitMultipliers).toEqual({});
    expect(mods.patternBonuses).toEqual({});
  });
});

describe('structureModifiers', () => {
  test('+1 Descarte e +1 carta na Mão alteram a estrutura da Rodada', () => {
    const structure = structureModifiers([RELIC_POOL[6], RELIC_POOL[7]]);
    expect(structure.handSize).toBe(HAND_SIZE + 1);
    expect(structure.discardsPerRound).toBe(DISCARDS_PER_ROUND + 1);
  });

  test('sem Relíquias de Mecânica mantém a estrutura base', () => {
    expect(structureModifiers([])).toEqual({ handSize: HAND_SIZE, discardsPerRound: DISCARDS_PER_ROUND });
  });
});

describe('comboMultiplier', () => {
  test('sem Relíquias de Combo: ×1, ×2, ×3, ×4', () => {
    expect(comboMultiplier(1, [])).toBe(1);
    expect(comboMultiplier(2, [])).toBe(2);
    expect(comboMultiplier(4, [])).toBe(4);
  });

  test('comboStart: a 1ª Jogada já é ×2', () => {
    const relics = [RELIC_POOL[8]];
    expect(comboMultiplier(1, relics)).toBe(2);
    expect(comboMultiplier(4, relics)).toBe(5);
  });

  test('comboGrowth: cresce em passos de 2 (×1, ×3, ×5, ×7)', () => {
    const relics = [RELIC_POOL[9]];
    expect(comboMultiplier(1, relics)).toBe(1);
    expect(comboMultiplier(2, relics)).toBe(3);
    expect(comboMultiplier(3, relics)).toBe(5);
    expect(comboMultiplier(4, relics)).toBe(7);
  });

  test('comboStart + comboGrowth empilham: ×2, ×4, ×6, ×8', () => {
    const relics = [RELIC_POOL[8], RELIC_POOL[9]];
    expect(comboMultiplier(1, relics)).toBe(2);
    expect(comboMultiplier(4, relics)).toBe(8);
  });
});

describe('activeRelics', () => {
  test('combina a Relíquia de largada com as adquiridas, sem duplicar', () => {
    const starting = RELIC_POOL[0];
    const acquired = [RELIC_POOL[1], RELIC_POOL[2]];
    expect(activeRelics(starting, acquired)).toEqual([starting, ...acquired]);
    expect(activeRelics(undefined, acquired)).toEqual(acquired);
  });
});
