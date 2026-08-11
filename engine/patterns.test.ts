import { Card } from './cards';
import { evaluatePlay, identifyPattern, PatternKind } from './patterns';

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
