import { Card } from './cards';
import { createDeck, DeckState } from './deck';
import { createSeededRng } from './random';
import {
  baseTarget,
  currentMultiplier,
  discard,
  makePlay,
  PLAYS_PER_ROUND,
  ROUNDS_PER_RUN,
  RunEvent,
  RunState,
  startNextRound,
  startRun,
} from './run';

const spades = (value: number): Card => ({ suit: 'spades', value });
const hearts = (value: number): Card => ({ suit: 'hearts', value });
const diamonds = (value: number): Card => ({ suit: 'diamonds', value });
const clubs = (value: number): Card => ({ suit: 'clubs', value });

const cardId = (card: Card): string => `${card.suit}:${card.value}`;

/** Constrói um estado de Run com uma Mão conhecida (para testes determinísticos). */
function makeRun(hand: readonly Card[], overrides: Partial<RunState> = {}): RunState {
  const handIds = new Set(hand.map(cardId));
  const deck: DeckState = {
    drawPile: createDeck().filter((card) => !handIds.has(cardId(card))),
    discardPile: [],
    hand: [...hand],
    discardsRemaining: 2,
  };
  return {
    deck,
    roundNumber: 1,
    playsRemaining: PLAYS_PER_ROUND,
    score: 0,
    runScore: 0,
    target: baseTarget(1),
    phase: 'playing',
    ...overrides,
  };
}

const eventsOfType = (events: RunEvent[], type: RunEvent['type']) => events.filter((e) => e.type === type);

describe('baseTarget (curva 50 × 1,7^(R−1))', () => {
  test('arredonda a curva para as 6 Rodadas', () => {
    expect(baseTarget(1)).toBe(50);
    expect(baseTarget(2)).toBe(85);
    expect(baseTarget(3)).toBe(144); // 50 × 1,7² = 144,499… → arredonda p/ 144
    expect(baseTarget(4)).toBe(246);
    expect(baseTarget(5)).toBe(418);
    expect(baseTarget(6)).toBe(710);
  });
});

describe('startRun', () => {
  test('inicia Rodada 1 com 4 Jogadas, Mão de 7 e Meta 50', () => {
    const run = startRun(createSeededRng(1));
    expect(run.roundNumber).toBe(1);
    expect(run.playsRemaining).toBe(PLAYS_PER_ROUND);
    expect(run.score).toBe(0);
    expect(run.runScore).toBe(0);
    expect(run.target).toBe(50);
    expect(run.phase).toBe('playing');
    expect(run.deck.hand).toHaveLength(7);
  });

  test('currentMultiplier: 1ª Jogada ×1, 4ª ×4', () => {
    let run = startRun(createSeededRng(2));
    expect(currentMultiplier(run)).toBe(1);
    run = { ...run, playsRemaining: 3 };
    expect(currentMultiplier(run)).toBe(2);
    run = { ...run, playsRemaining: 2 };
    expect(currentMultiplier(run)).toBe(3);
    run = { ...run, playsRemaining: 1 };
    expect(currentMultiplier(run)).toBe(4);
  });
});

describe('makePlay: pontuação = Valor-Base × Multiplicador', () => {
  test('1ª Jogada usa ×1 e soma os pontos ao score', () => {
    const run = makeRun([spades(7), hearts(7), diamonds(7)]);
    const { run: next, events } = makePlay(run, [spades(7), hearts(7), diamonds(7)], createSeededRng(3));
    // trinca de 7s: 25 + 21 = 46, ×1
    expect(next.score).toBe(46);
    expect(next.runScore).toBe(46);
    expect(next.playsRemaining).toBe(3);
    const played = eventsOfType(events, 'played')[0];
    expect(played).toMatchObject({ baseValue: 46, multiplier: 1, points: 46 });
  });

  test('2ª Jogada usa ×2', () => {
    const run = makeRun([spades(7), hearts(7), diamonds(7), spades(3), hearts(3)]);
    let next = makePlay(run, [spades(7), hearts(7), diamonds(7)], createSeededRng(4)).run;
    next = makePlay(next, [spades(3), hearts(3)], createSeededRng(4)).run;
    // 46×1 + (5+3+3)×2 = 46 + 22 = 68
    expect(next.score).toBe(68);
  });

  test('4ª Jogada usa ×4', () => {
    const run = makeRun([spades(1), spades(2), spades(3), spades(4), spades(5)]);
    let next = makePlay(run, [spades(1)], createSeededRng(5)).run; // 1×1 = 1
    next = makePlay(next, [spades(2)], createSeededRng(5)).run; // 2×2 = 4 → 5
    next = makePlay(next, [spades(3)], createSeededRng(5)).run; // 3×3 = 9 → 14
    next = makePlay(next, [spades(4)], createSeededRng(5)).run; // 4×4 = 16 → 30
    expect(next.score).toBe(30);
    expect(next.playsRemaining).toBe(0);
  });

  test('Jogada vence a Rodada ao atingir a Meta mesmo com Jogadas sobrando', () => {
    const run = makeRun([spades(7), hearts(7), diamonds(7), spades(8), hearts(8), diamonds(8)]);
    const { run: next, events } = makePlay(run, [spades(7), hearts(7), diamonds(7)], createSeededRng(6));
    // 46 ≥ 50? Não — ainda não vence. Segunda jogada: 49×2 = 98 → total 144 ≥ 50
    expect(next.phase).toBe('playing');
    const second = makePlay(next, [spades(8), hearts(8), diamonds(8)], createSeededRng(6));
    expect(second.run.phase).toBe('roundWon');
    expect(second.run.playsRemaining).toBe(2);
    expect(eventsOfType(second.events, 'roundWon')).toHaveLength(1);
  });
});

describe('fim da Rodada e fim da Run', () => {
  test('esgotar as 4 Jogadas sem atingir a Meta perde a Run', () => {
    const run = makeRun([spades(1), hearts(1), diamonds(1), clubs(1), spades(2)]);
    let next = makePlay(run, [spades(1)], createSeededRng(7)).run;
    next = makePlay(next, [hearts(1)], createSeededRng(7)).run;
    next = makePlay(next, [diamonds(1)], createSeededRng(7)).run;
    const { run: last, events } = makePlay(next, [clubs(1)], createSeededRng(7));
    // 1×1 + 1×2 + 1×3 + 1×4 = 10 < 50
    expect(last.phase).toBe('runLost');
    expect(last.playsRemaining).toBe(0);
    expect(eventsOfType(events, 'roundLost')).toHaveLength(1);
    expect(eventsOfType(events, 'runLost')).toHaveLength(1);
  });

  test('vencer a Rodada 6 dispara roundWon + runWon', () => {
    const hand = [spades(10), hearts(10), diamonds(10), clubs(10), spades(9), hearts(9), diamonds(9)];
    const run = makeRun(hand, { roundNumber: 6, target: 50 }); // target artificial baixo
    const { run: next, events } = makePlay(run, hand.slice(0, 4), createSeededRng(9));
    // quadra de 10s: 110 ≥ 50 → round vencida na Rodada 6 → run vencida
    expect(next.phase).toBe('runWon');
    expect(eventsOfType(events, 'roundWon')).toHaveLength(1);
    expect(eventsOfType(events, 'runWon')).toHaveLength(1);
  });

  test('jogar após a Rodada vencida lança erro', () => {
    const run = makeRun([spades(10), hearts(10), diamonds(10)], { phase: 'roundWon' });
    expect(() => makePlay(run, [spades(10)], createSeededRng(10))).toThrow();
  });

  test('jogar após a Run perdida lança erro', () => {
    const run = makeRun([spades(10)], { phase: 'runLost' });
    expect(() => makePlay(run, [spades(10)], createSeededRng(11))).toThrow();
  });
});

describe('discard (Descarte na Rodada)', () => {
  test('descarta via estado da Run, sem alterar a pontuação', () => {
    const run = makeRun([spades(7), hearts(7), diamonds(7), spades(3), hearts(3), spades(9), hearts(9)]);
    const next = discard(run, [spades(3), hearts(3)], createSeededRng(17));
    expect(next.deck.discardsRemaining).toBe(1);
    expect(next.deck.hand).toHaveLength(7);
    expect(next.score).toBe(0);
    expect(next.phase).toBe('playing');
    expect(next.deck.discardPile.map(cardId).sort()).toEqual(['hearts:3', 'spades:3']);
  });

  test('descarte fora da fase playing lança erro', () => {
    const run = makeRun([spades(7)], { phase: 'roundWon' });
    expect(() => discard(run, [spades(7)], createSeededRng(18))).toThrow();
  });

  test('makePlay não consome Descarte', () => {
    const run = makeRun([spades(7), hearts(7), diamonds(7)]);
    const { run: next } = makePlay(run, [spades(7), hearts(7), diamonds(7)], createSeededRng(19));
    expect(next.deck.discardsRemaining).toBe(2);
  });
});

describe('startNextRound', () => {
  test('recicla o deck, reseta Jogadas/Combo/score e sobe a Meta', () => {
    const run = makeRun([spades(7), hearts(7), diamonds(7)], { phase: 'roundWon', score: 100, runScore: 100 });
    const next = startNextRound(run, createSeededRng(12));
    expect(next.roundNumber).toBe(2);
    expect(next.playsRemaining).toBe(PLAYS_PER_ROUND);
    expect(next.score).toBe(0);
    expect(next.runScore).toBe(100); // acumulado da Run permanece
    expect(next.target).toBe(85);
    expect(next.phase).toBe('playing');
    expect(next.deck.hand).toHaveLength(7);
    expect(next.deck.discardPile).toHaveLength(0);
    expect(next.deck.drawPile.length + next.deck.hand.length).toBe(40);
  });

  test('Multiplicador zera: 1ª Jogada da nova Rodada é ×1', () => {
    const run = makeRun([spades(7), hearts(7), diamonds(7)], { phase: 'roundWon' });
    const next = startNextRound(run, createSeededRng(13));
    expect(currentMultiplier(next)).toBe(1);
  });

  test('startNextRound fora da fase roundWon lança erro', () => {
    expect(() => startNextRound(makeRun([], { phase: 'playing' }), createSeededRng(14))).toThrow();
    expect(() => startNextRound(makeRun([], { phase: 'runWon' }), createSeededRng(14))).toThrow();
    expect(() => startNextRound(makeRun([], { phase: 'runLost' }), createSeededRng(14))).toThrow();
  });

  test('startNextRound na Rodada 6 lança erro (a Run já acabou)', () => {
    const run = makeRun([], { roundNumber: ROUNDS_PER_RUN, phase: 'roundWon' });
    expect(() => startNextRound(run, createSeededRng(15))).toThrow();
  });
});

describe('serialização', () => {
  test('estado da Run é serializável', () => {
    const run = startRun(createSeededRng(16));
    expect(JSON.parse(JSON.stringify(run))).toEqual(run);
  });
});
