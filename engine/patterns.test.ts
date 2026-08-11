import { Card, ForgeEffect, ForgedCard } from './cards';
import { evaluatePlay, identifyPattern, PatternKind, ScoreModifiers } from './patterns';

const spades = (value: number): Card => ({ suit: 'spades', value });
const hearts = (value: number): Card => ({ suit: 'hearts', value });
const diamonds = (value: number): Card => ({ suit: 'diamonds', value });
const clubs = (value: number): Card => ({ suit: 'clubs', value });

const card = (value: number): Card => spades(value);

describe('identifyPattern', () => {
  test('Carta Alta: uma carta qualquer é HighCard', () => {
    expect(identifyPattern([card(7)])).toBe(PatternKind.HighCard);
  });

  test('Carta Alta: cinco valores distintos sem padrão é HighCard', () => {
    expect(identifyPattern([card(1), card(3), card(6), card(8), card(10)])).toBe(PatternKind.HighCard);
  });

  test('Par: duas cartas de mesmo valor', () => {
    expect(identifyPattern([card(7), hearts(7)])).toBe(PatternKind.Pair);
  });

  test('Par: par com cartas extras (4 cartas) ainda é Pair', () => {
    expect(identifyPattern([card(7), hearts(7), card(3), hearts(9)])).toBe(PatternKind.Pair);
  });

  test('Dois Pares: dois pares em 4 cartas', () => {
    expect(identifyPattern([card(7), hearts(7), card(3), hearts(3)])).toBe(PatternKind.TwoPair);
  });

  test('Dois Pares: dois pares com carta extra (5 cartas)', () => {
    expect(identifyPattern([card(7), hearts(7), card(3), hearts(3), card(9)])).toBe(PatternKind.TwoPair);
  });

  test('Trinca: três cartas de mesmo valor', () => {
    expect(identifyPattern([card(7), hearts(7), diamonds(7)])).toBe(PatternKind.ThreeOfAKind);
  });

  test('Trinca: trinca com carta extra (4 cartas)', () => {
    expect(identifyPattern([card(7), hearts(7), diamonds(7), card(2)])).toBe(PatternKind.ThreeOfAKind);
  });

  test('Sequência baixa: Ás–5 (1,2,3,4,5)', () => {
    expect(identifyPattern([card(1), card(2), card(3), card(4), card(5)])).toBe(PatternKind.Straight);
  });

  test('Sequência alta: 6–10', () => {
    expect(identifyPattern([card(6), card(7), card(8), card(9), card(10)])).toBe(PatternKind.Straight);
  });

  test('Sequência com Ás como 11: 7–10 + Ás', () => {
    expect(identifyPattern([card(7), card(8), card(9), card(10), card(1)])).toBe(PatternKind.Straight);
  });

  test('Não é Sequência: valores distintos fora de ordem contígua', () => {
    expect(identifyPattern([card(1), card(2), card(4), card(5), card(6)])).toBe(PatternKind.HighCard);
  });

  test('Não é Sequência: 1,2,3,4,10 sem corrida em nenhuma leitura do Ás', () => {
    expect(identifyPattern([card(1), card(2), card(3), card(4), card(10)])).toBe(PatternKind.HighCard);
  });

  test('Full House: trinca + par em 5 cartas', () => {
    expect(identifyPattern([card(7), hearts(7), diamonds(7), card(3), hearts(3)])).toBe(PatternKind.FullHouse);
  });

  test('Full House tem precedência sobre Trinca e Par', () => {
    expect(identifyPattern([card(7), hearts(7), diamonds(7), card(3), hearts(3)])).not.toBe(PatternKind.ThreeOfAKind);
  });

  test('Quadra: quatro cartas de mesmo valor', () => {
    expect(identifyPattern([card(7), hearts(7), diamonds(7), clubs(7)])).toBe(PatternKind.FourOfAKind);
  });

  test('Quadra com carta extra (5 cartas)', () => {
    expect(identifyPattern([card(7), hearts(7), diamonds(7), clubs(7), card(2)])).toBe(PatternKind.FourOfAKind);
  });
});

describe('evaluatePlay (Valor-Base = bônus do Padrão + soma dos Valores)', () => {
  test('Carta Alta: apenas o valor da carta', () => {
    expect(evaluatePlay([card(7)])).toEqual({ pattern: { kind: PatternKind.HighCard, bonus: 0 }, baseValue: 7 });
  });

  test('Par: 5 + soma (7+7)', () => {
    expect(evaluatePlay([card(7), hearts(7)]).baseValue).toBe(19);
  });

  test('Trinca de 7s: 25 + 21 = 46 (exemplo do CONTEXT.md)', () => {
    expect(evaluatePlay([card(7), hearts(7), diamonds(7)]).baseValue).toBe(46);
  });

  test('Cartas extras além do mínimo somam seus valores', () => {
    expect(evaluatePlay([card(7), hearts(7), diamonds(7), card(2)]).baseValue).toBe(48);
  });

  test('Quadra com extra: 70 + (7+7+7+7+2) = 100', () => {
    expect(evaluatePlay([card(7), hearts(7), diamonds(7), clubs(7), card(2)]).baseValue).toBe(100);
  });

  test('Sequência baixa: 40 + (1+2+3+4+5) = 55', () => {
    expect(evaluatePlay([card(1), card(2), card(3), card(4), card(5)]).baseValue).toBe(55);
  });

  test('Sequência com Ás como 11: o Ás soma seu valor impresso (1)', () => {
    const evaluation = evaluatePlay([card(7), card(8), card(9), card(10), card(1)]);
    expect(evaluation.pattern.kind).toBe(PatternKind.Straight);
    expect(evaluation.baseValue).toBe(40 + 7 + 8 + 9 + 10 + 1);
  });

  test('Full House: 55 + (7+7+7+3+3) = 82', () => {
    expect(evaluatePlay([card(7), hearts(7), diamonds(7), card(3), hearts(3)]).baseValue).toBe(82);
  });
});

describe('Cartas Forjadas no Valor-Base (ticket 05)', () => {
  const forged = (card: Card, effects: ForgeEffect[]): ForgedCard => ({ card, effects });

  test('+Valor soma fixa ao Valor da carta', () => {
    const f = [forged(spades(7), [{ kind: 'valueBonus', amount: 2 }])];
    // par de 7s: 5 + 7 + (7+2) = 21
    expect(evaluatePlay([spades(7), hearts(7)], { forgedCards: f }).baseValue).toBe(21);
  });

  test('Multiplicador: a carta vale ×2', () => {
    const f = [forged(spades(7), [{ kind: 'multiplier', multiplier: 2 }])];
    // par de 7s: 5 + 7 + (7×2) = 26
    expect(evaluatePlay([spades(7), hearts(7)], { forgedCards: f }).baseValue).toBe(26);
  });

  test('empilhamento resolve somas antes de multiplicadores, independente da ordem de aplicação', () => {
    const a = [forged(spades(7), [{ kind: 'valueBonus', amount: 2 }, { kind: 'multiplier', multiplier: 2 }])];
    const b = [forged(spades(7), [{ kind: 'multiplier', multiplier: 2 }, { kind: 'valueBonus', amount: 2 }])];
    // (7+2)×2 = 18; par de 7s: 5 + 7 + 18 = 30
    expect(evaluatePlay([spades(7), hearts(7)], { forgedCards: a }).baseValue).toBe(30);
    expect(evaluatePlay([spades(7), hearts(7)], { forgedCards: b }).baseValue).toBe(30);
  });

  test('Curinga conta como qualquer Valor para formar Padrões', () => {
    const f = [forged(spades(7), [{ kind: 'wildcard' }])];
    const evaluation = evaluatePlay([spades(7), hearts(7), diamonds(7)], { forgedCards: f });
    // curinga = 7 → trinca: 25 + 7+7+7 = 46
    expect(evaluation.pattern.kind).toBe(PatternKind.ThreeOfAKind);
    expect(evaluation.baseValue).toBe(46);
  });

  test('Curinga completa Sequência valendo a maior soma possível', () => {
    const f = [forged(clubs(5), [{ kind: 'wildcard' }])];
    const evaluation = evaluatePlay([clubs(6), clubs(7), clubs(8), clubs(9), clubs(5)], { forgedCards: f });
    // curinga = 10 → sequência: 40 + 6+7+8+9+10 = 80
    expect(evaluation.pattern.kind).toBe(PatternKind.Straight);
    expect(evaluation.baseValue).toBe(80);
  });

  test('Curinga não forma Sequência quando valores reais se repetem (melhor é Trinca)', () => {
    const f = [forged(clubs(5), [{ kind: 'wildcard' }])];
    const evaluation = evaluatePlay([spades(7), hearts(7), clubs(8), clubs(9), clubs(5)], { forgedCards: f });
    // curinga = 7 → trinca: 25 + 7+7+7+8+9 = 63
    expect(evaluation.pattern.kind).toBe(PatternKind.ThreeOfAKind);
    expect(evaluation.baseValue).toBe(63);
  });

  test('Gatilho concede o bônus apenas quando a condição é satisfeita', () => {
    const f = [forged(spades(7), [{ kind: 'trigger', triggerPlay: 3, bonus: 20 }])];
    // 3ª Jogada: 5 + (7+20) + 7 = 39; 2ª Jogada: sem bônus → 5 + 7 + 7 = 19
    expect(evaluatePlay([spades(7), hearts(7)], { forgedCards: f, playNumber: 3 }).baseValue).toBe(39);
    expect(evaluatePlay([spades(7), hearts(7)], { forgedCards: f, playNumber: 2 }).baseValue).toBe(19);
  });

  test('identifyPattern considera Curingas', () => {
    const f = [forged(spades(7), [{ kind: 'wildcard' }])];
    expect(identifyPattern([spades(7), hearts(7), diamonds(7)], f)).toBe(PatternKind.ThreeOfAKind);
  });

  test('Carta Forjada sem efeitos não altera a avaliação', () => {
    const f = [forged(spades(7), [])];
    expect(evaluatePlay([spades(7), hearts(7)], { forgedCards: f }).baseValue).toBe(19);
  });
});

describe('Relíquias no Valor-Base (ticket 06)', () => {
  test('Relíquia de Naipe multiplica a contribuição das cartas do Naipe', () => {
    const mods: ScoreModifiers = { suitMultipliers: { spades: 2 } };
    // par de 7s (7♠, 7♥): 5 + 7×2 + 7 = 26
    expect(evaluatePlay([spades(7), hearts(7)], { modifiers: mods }).baseValue).toBe(26);
  });

  test('Relíquia de Padrão soma ao bônus do Padrão', () => {
    const mods: ScoreModifiers = { patternBonuses: { [PatternKind.Pair]: 10 } };
    const evaluation = evaluatePlay([spades(7), hearts(7)], { modifiers: mods });
    expect(evaluation.pattern.bonus).toBe(15);
    expect(evaluation.baseValue).toBe(29); // (5+10) + 7 + 7
  });

  test('Naipe e Padrão combinam com Efeitos de Forja', () => {
    const forgedCards: ForgedCard[] = [{ card: spades(7), effects: [{ kind: 'multiplier', multiplier: 2 }] }];
    const mods: ScoreModifiers = { suitMultipliers: { spades: 2 }, patternBonuses: { [PatternKind.Pair]: 10 } };
    // 7♠ forjada ×2 e ×2 do Naipe: 7×2×2 = 28; 7♥ = 7; par: (5+10) + 28 + 7 = 50
    expect(evaluatePlay([spades(7), hearts(7)], { forgedCards, modifiers: mods }).baseValue).toBe(50);
  });
});

describe('validação e pureza', () => {
  test('mão vazia lança erro', () => {
    expect(() => evaluatePlay([])).toThrow();
  });

  test('mais de 5 cartas lança erro', () => {
    const six = [1, 2, 3, 4, 5, 6].map(card);
    expect(() => evaluatePlay(six)).toThrow();
  });

  test('valor fora de 1–10 lança erro', () => {
    expect(() => evaluatePlay([{ suit: 'spades', value: 11 }])).toThrow();
  });

  test('naipe inválido lança erro', () => {
    expect(() => evaluatePlay([{ suit: 'jokers', value: 5 } as unknown as Card])).toThrow();
  });

  test('cartas duplicadas (mesmo Naipe e Valor) lançam erro', () => {
    expect(() => evaluatePlay([card(7), card(7)])).toThrow();
  });

  test('função pura: mesma entrada produz exatamente o mesmo resultado', () => {
    const hand = [card(7), hearts(7), diamonds(7)];
    expect(evaluatePlay(hand)).toEqual(evaluatePlay(hand));
  });
});
