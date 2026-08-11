import { Card } from './cards';
import { createSeededRng } from './random';
import {
  createDeck,
  DECK_SIZE,
  DeckState,
  discardCards,
  DISCARDS_PER_ROUND,
  drawToHand,
  HAND_SIZE,
  initialDeckState,
  playCards,
  shuffle,
  startRound,
} from './deck';

const cardId = (card: Card): string => `${card.suit}:${card.value}`;
const handIds = (state: DeckState): Set<string> => new Set(state.hand.map(cardId));

describe('createDeck', () => {
  test('40 cartas únicas: 4 naipes × 10 valores, sem figuras', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(DECK_SIZE);
    expect(new Set(deck.map(cardId)).size).toBe(DECK_SIZE);
    for (const card of deck) {
      expect(card.value).toBeGreaterThanOrEqual(1);
      expect(card.value).toBeLessThanOrEqual(10);
    }
    // cada valor aparece exatamente 4 vezes (um por naipe)
    for (let value = 1; value <= 10; value += 1) {
      expect(deck.filter((card) => card.value === value)).toHaveLength(4);
    }
  });
});

describe('shuffle e determinismo', () => {
  test('mesmo seed produz a mesma ordem', () => {
    const deck = createDeck();
    const first = shuffle(deck, createSeededRng(1234));
    const second = shuffle(deck, createSeededRng(1234));
    expect(first.map(cardId)).toEqual(second.map(cardId));
  });

  test('seeds diferentes produzem ordens diferentes', () => {
    const deck = createDeck();
    const first = shuffle(deck, createSeededRng(1234));
    const second = shuffle(deck, createSeededRng(4321));
    expect(first.map(cardId)).not.toEqual(second.map(cardId));
  });

  test('embaralhar preserva o conjunto de cartas', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck, createSeededRng(7));
    const byId = (a: Card, b: Card): number => cardId(a).localeCompare(cardId(b));
    expect([...shuffled].sort(byId)).toEqual([...deck].sort(byId));
  });

  test('startRound com o mesmo seed produz a mesma Mão', () => {
    const a = startRound(initialDeckState(), createSeededRng(99));
    const b = startRound(initialDeckState(), createSeededRng(99));
    expect(a.hand.map(cardId)).toEqual(b.hand.map(cardId));
  });
});

describe('startRound', () => {
  test('distribui Mão de 7, 2 Descarte e drawPile com as 33 restantes', () => {
    const state = startRound(initialDeckState(), createSeededRng(1));
    expect(state.hand).toHaveLength(HAND_SIZE);
    expect(state.discardsRemaining).toBe(DISCARDS_PER_ROUND);
    expect(state.drawPile).toHaveLength(DECK_SIZE - HAND_SIZE);
    expect(state.discardPile).toHaveLength(0);
  });
});

describe('drawToHand', () => {
  test('reabastece até 7 cartas', () => {
    let state = startRound(initialDeckState(), createSeededRng(2));
    state = { ...state, hand: state.hand.slice(0, 3) };
    state = drawToHand(state, createSeededRng(2));
    expect(state.hand).toHaveLength(HAND_SIZE);
  });

  test('mão já cheia não compra cartas', () => {
    let state = startRound(initialDeckState(), createSeededRng(3));
    const drawPileBefore = state.drawPile.length;
    state = drawToHand(state, createSeededRng(3));
    expect(state.hand).toHaveLength(HAND_SIZE);
    expect(state.drawPile).toHaveLength(drawPileBefore);
  });
});

describe('discardCards', () => {
  test('descarta seleção, compra o mesmo número e consome um Descarte', () => {
    let state = startRound(initialDeckState(), createSeededRng(4));
    const selected = state.hand.slice(0, 2);
    const drawPileBefore = state.drawPile.length;
    state = discardCards(state, selected, createSeededRng(4));
    expect(state.discardsRemaining).toBe(1);
    expect(state.hand).toHaveLength(HAND_SIZE);
    expect(state.discardPile.map(cardId).sort()).toEqual(selected.map(cardId).sort());
    expect(state.drawPile).toHaveLength(drawPileBefore - 2);
  });

  test('descarte 0: segundo Descarte; descarte 3 lança erro', () => {
    let state = startRound(initialDeckState(), createSeededRng(5));
    const rng = createSeededRng(5);
    state = discardCards(state, state.hand.slice(0, 1), rng);
    state = discardCards(state, state.hand.slice(0, 1), rng);
    expect(state.discardsRemaining).toBe(0);
    expect(() => discardCards(state, state.hand.slice(0, 1), rng)).toThrow();
  });

  test('cartas fora da Mão lançam erro', () => {
    const state = startRound(initialDeckState(), createSeededRng(6));
    const notInHand = state.drawPile[0];
    expect(() => discardCards(state, [notInHand], createSeededRng(6))).toThrow();
  });

  test('seleção vazia lança erro (não gasta Descarte à toa)', () => {
    const state = startRound(initialDeckState(), createSeededRng(7));
    expect(() => discardCards(state, [], createSeededRng(7))).toThrow();
  });
});

describe('playCards e reabastecimento', () => {
  test('jogar move as cartas para o descarte e reabastece a Mão', () => {
    let state = startRound(initialDeckState(), createSeededRng(8));
    const selected = state.hand.slice(0, 5);
    state = playCards(state, selected, createSeededRng(8));
    expect(state.hand).toHaveLength(HAND_SIZE);
    expect(state.discardPile.map(cardId).sort()).toEqual(selected.map(cardId).sort());
  });

  test('jogar cartas fora da Mão lança erro', () => {
    const state = startRound(initialDeckState(), createSeededRng(9));
    expect(() => playCards(state, [state.drawPile[0]], createSeededRng(9))).toThrow();
  });

  test('tensão de baralho: jogadas repetidas esgotam o drawPile e o descarte reembaralha', () => {
    const rng = createSeededRng(10);
    let state = startRound(initialDeckState(), rng);
    for (let play = 0; play < 12; play += 1) {
      state = playCards(state, state.hand.slice(0, 5), rng);
      expect(state.hand).toHaveLength(HAND_SIZE);
      expect(state.drawPile.length + state.discardPile.length).toBe(DECK_SIZE - HAND_SIZE);
    }
    // invariante global: as 40 cartas sempre presentes, sem duplicatas
    const allCards = [...state.drawPile, ...state.discardPile, ...state.hand];
    expect(allCards).toHaveLength(DECK_SIZE);
    expect(new Set(allCards.map(cardId)).size).toBe(DECK_SIZE);
  });
});

describe('reciclagem (startRound após uma Rodada)', () => {
  test('todas as cartas voltam ao Baralho e a Rodada recomeça limpa', () => {
    const rng = createSeededRng(11);
    let state = startRound(initialDeckState(), rng);
    state = playCards(state, state.hand.slice(0, 5), rng);
    state = discardCards(state, state.hand.slice(0, 2), rng);
    state = startRound(state, rng);
    expect(state.hand).toHaveLength(HAND_SIZE);
    expect(state.drawPile).toHaveLength(DECK_SIZE - HAND_SIZE);
    expect(state.discardPile).toHaveLength(0);
    expect(state.discardsRemaining).toBe(DISCARDS_PER_ROUND);
    const allCards = [...state.drawPile, ...state.hand];
    expect(new Set(allCards.map(cardId)).size).toBe(DECK_SIZE);
  });
});

describe('serialização', () => {
  test('estado é serializável (sem referências de UI ou funções)', () => {
    const state = startRound(initialDeckState(), createSeededRng(12));
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
