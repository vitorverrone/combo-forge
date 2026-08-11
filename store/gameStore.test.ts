import {
  baseTarget,
  Card,
  cardKey,
  createDeck,
  createMemoryDdaStorage,
  DEFAULT_DDA_CONFIG,
  DeckState,
  loadDda,
  PatternKind,
  PLAYS_PER_ROUND,
  RunEvent,
  RunState,
} from '../engine';

import { createGameStore, persistRoundEnd, selectionPreview } from './gameStore';

const spades = (value: number): Card => ({ suit: 'spades', value });
const hearts = (value: number): Card => ({ suit: 'hearts', value });

/** Constrói uma Run com Mão conhecida (para testes determinísticos). */
function makeRunWithHand(hand: readonly Card[]): RunState {
  const handIds = new Set(hand.map(cardKey));
  const deck: DeckState = {
    drawPile: createDeck().filter((card) => !handIds.has(cardKey(card))),
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
    seed: 0,
    forgedCards: [],
    relics: [],
    startingRelic: undefined,
    forger: 'apprentice',
    dda: { lastFailedRound: 0, consecutiveFailures: 0, easyWins: 0 },
    ddaConfig: DEFAULT_DDA_CONFIG,
    forgeOffers: [],
  };
}

describe('createGameStore', () => {
  test('inicia na tela de escolha do Forjador, sem Run', () => {
    const store = createGameStore();
    expect(store.getState().screen).toBe('start');
    expect(store.getState().run).toBeNull();
    expect(store.getState().forger).toBe('apprentice');
  });

  test('startRun inicia a Run com Mão de 7, o Forjador escolhido e a Relíquia de largada', () => {
    const store = createGameStore({ seed: () => 1234 });
    store.getState().chooseForger('hammer');
    store.getState().startRun();
    const state = store.getState();
    expect(state.screen).toBe('game');
    expect(state.run).not.toBeNull();
    expect(state.run?.deck.hand).toHaveLength(7);
    expect(state.run?.forger).toBe('hammer');
    expect(state.run?.startingRelic).toBeDefined();
    expect(state.run?.phase).toBe('playing');
  });

  test('backToStart volta para a tela inicial e descarta a Run', () => {
    const store = createGameStore({ seed: () => 6 });
    store.getState().startRun();
    store.getState().backToStart();
    const state = store.getState();
    expect(state.screen).toBe('start');
    expect(state.run).toBeNull();
  });
});

describe('seleção de cartas', () => {
  test('toggleCard seleciona e desseleciona cartas da Mão, ignorando as demais', () => {
    const store = createGameStore({ seed: () => 1 });
    store.getState().startRun();
    const run = store.getState().run!;
    const keys = run.deck.hand.map(cardKey);
    store.getState().toggleCard(keys[0]);
    expect(store.getState().selectedKeys).toEqual([keys[0]]);
    store.getState().toggleCard(keys[1]);
    expect(store.getState().selectedKeys).toEqual([keys[0], keys[1]]);
    store.getState().toggleCard(keys[0]);
    expect(store.getState().selectedKeys).toEqual([keys[1]]);
    // carta fora da Mão (drawPile) é ignorada
    store.getState().toggleCard(cardKey(run.deck.drawPile[0]));
    expect(store.getState().selectedKeys).toEqual([keys[1]]);
  });

  test('a seleção é limitada ao tamanho máximo de uma Jogada (5)', () => {
    const store = createGameStore({ seed: () => 2 });
    store.getState().startRun();
    const keys = store.getState().run!.deck.hand.map(cardKey);
    for (const key of keys) store.getState().toggleCard(key);
    expect(store.getState().selectedKeys).toHaveLength(5);
  });

  test('clearSelection limpa a seleção', () => {
    const store = createGameStore({ seed: () => 3 });
    store.getState().startRun();
    store.getState().toggleCard(cardKey(store.getState().run!.deck.hand[0]));
    store.getState().clearSelection();
    expect(store.getState().selectedKeys).toHaveLength(0);
  });
});

describe('selectionPreview (avaliado pelo motor)', () => {
  test('reconhece um Par e o Valor-Base da seleção', () => {
    const run = makeRunWithHand([spades(7), hearts(7), spades(3)]);
    const keys = run.deck.hand.map(cardKey);
    const preview = selectionPreview(run, [keys[0], keys[1]]);
    expect(preview?.pattern.kind).toBe(PatternKind.Pair);
    expect(preview?.baseValue).toBe(19);
  });

  test('retorna null sem seleção ou com Run nula', () => {
    const run = makeRunWithHand([spades(7)]);
    expect(selectionPreview(run, [])).toBeNull();
    expect(selectionPreview(null, [cardKey(run.deck.hand[0])])).toBeNull();
  });
});

describe('ações despachadas para o motor', () => {
  test('playSelection pontua via motor, limpa a seleção e reabastece a Mão', () => {
    const store = createGameStore({ seed: () => 4 });
    store.getState().startRun();
    const hand = store.getState().run!.deck.hand;
    store.getState().toggleCard(cardKey(hand[0]));
    const scoreBefore = store.getState().run!.score;
    store.getState().playSelection();
    const state = store.getState();
    expect(state.run!.score).toBeGreaterThan(scoreBefore);
    expect(state.selectedKeys).toHaveLength(0);
    expect(state.run!.deck.hand).toHaveLength(7);
    expect(state.lastEvents.some((event) => event.type === 'played')).toBe(true);
  });

  test('discardSelection consome um Descarte, reabastece a Mão e não pontua', () => {
    const store = createGameStore({ seed: () => 5 });
    store.getState().startRun();
    const hand = store.getState().run!.deck.hand;
    const discardsBefore = store.getState().run!.deck.discardsRemaining;
    store.getState().toggleCard(cardKey(hand[0]));
    store.getState().toggleCard(cardKey(hand[1]));
    store.getState().discardSelection();
    const state = store.getState();
    expect(state.run!.deck.discardsRemaining).toBe(discardsBefore - 1);
    expect(state.run!.deck.hand).toHaveLength(7);
    expect(state.selectedKeys).toHaveLength(0);
    expect(state.run!.score).toBe(0);
  });

  test('playSelection com seleção vazia não altera o estado', () => {
    const store = createGameStore({ seed: () => 7 });
    store.getState().startRun();
    const runBefore = store.getState().run;
    store.getState().playSelection();
    expect(store.getState().run).toBe(runBefore);
  });
});

describe('fim de Rodada e derrota', () => {
  test('nextRound avança da fase roundWon para a Rodada seguinte', () => {
    const store = createGameStore({ seed: () => 11 });
    store.getState().startRun();
    // Simula a Rodada 1 vencida e forjada: fase roundWon pronta para avançar.
    store.setState({
      run: { ...store.getState().run!, phase: 'roundWon' },
    });
    store.getState().nextRound();
    const state = store.getState();
    expect(state.run?.roundNumber).toBe(2);
    expect(state.run?.phase).toBe('playing');
    expect(state.run?.score).toBe(0);
    expect(state.run?.playsRemaining).toBe(PLAYS_PER_ROUND);
    // O avanço não devolve para a tela inicial nem zera a stream.
    expect(state.screen).toBe('game');
    expect(state.rng).not.toBeNull();
  });

  test('nextRound ignora fases que não sejam roundWon', () => {
    const store = createGameStore({ seed: () => 12 });
    store.getState().startRun();
    const runBefore = store.getState().run;
    store.getState().nextRound();
    expect(store.getState().run).toBe(runBefore);
  });

  test('restartRun inicia nova Run com novo seed, mesmo Forjador e Mão nova', () => {
    let seed = 100;
    const store = createGameStore({ seed: () => seed });
    store.getState().chooseForger('anvil');
    store.getState().startRun();
    const firstSeed = store.getState().run!.seed;
    const firstHand = store.getState().run!.deck.hand.map(cardKey);
    // Encerra em derrota (fase runLost) para reiniciar a partir dela.
    store.setState({ run: { ...store.getState().run!, phase: 'runLost' } });
    seed = 200;
    store.getState().restartRun();
    const state = store.getState();
    expect(state.screen).toBe('game');
    expect(state.run?.phase).toBe('playing');
    expect(state.run?.forger).toBe('anvil');
    expect(state.run?.roundNumber).toBe(1);
    expect(state.run?.score).toBe(0);
    // Novo seed → novo embaralhamento (baralho reciclado, Mão diferente).
    expect(state.run!.seed).not.toBe(firstSeed);
    expect(state.run!.seed).toBe(200);
    expect(state.run!.deck.hand.map(cardKey)).not.toEqual(firstHand);
  });
});

describe('persistRoundEnd (DDA persistido ao fim da Rodada)', () => {
  test('vitória fácil com Jogada sobrando acumula easyWins', () => {
    const run = makeRunWithHand([spades(7), hearts(7)]);
    const storage = createMemoryDdaStorage();
    const event: RunEvent = { type: 'roundWon', roundNumber: 1, score: 65, target: 50 };
    persistRoundEnd(run, [event], storage);
    expect(loadDda(storage, DEFAULT_DDA_CONFIG).easyWins).toBe(1);
  });

  test('vitória sem folga não acumula easyWins', () => {
    const run = makeRunWithHand([spades(7), hearts(7)]);
    const storage = createMemoryDdaStorage();
    const event: RunEvent = { type: 'roundWon', roundNumber: 1, score: 60, target: 50 };
    persistRoundEnd(run, [event], storage);
    expect(loadDda(storage, DEFAULT_DDA_CONFIG).easyWins).toBe(0);
  });

  test('derrota registra a Rodada e a falha consecutiva', () => {
    const run = makeRunWithHand([spades(7)]);
    const storage = createMemoryDdaStorage();
    const event: RunEvent = { type: 'roundLost', roundNumber: 2, score: 30, target: 50 };
    persistRoundEnd(run, [event], storage);
    expect(loadDda(storage, DEFAULT_DDA_CONFIG)).toEqual({
      lastFailedRound: 2,
      consecutiveFailures: 1,
      easyWins: 0,
    });
  });

  test('Run sem DDA (Desafio Diário) não toca o histórico persistido', () => {
    const run = {
      ...makeRunWithHand([spades(7)]),
      ddaConfig: { ...DEFAULT_DDA_CONFIG, enabled: false },
    };
    const storage = createMemoryDdaStorage({
      lastFailedRound: 1,
      consecutiveFailures: 2,
      easyWins: 4,
    });
    const event: RunEvent = { type: 'roundLost', roundNumber: 1, score: 30, target: 50 };
    persistRoundEnd(run, [event], storage);
    expect(loadDda(storage, DEFAULT_DDA_CONFIG)).toEqual({
      lastFailedRound: 1,
      consecutiveFailures: 2,
      easyWins: 4,
    });
  });
});
