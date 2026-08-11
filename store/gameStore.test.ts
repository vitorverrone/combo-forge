import {
  ALL_UNLOCKS,
  baseTarget,
  Card,
  cardKey,
  computeUnlocks,
  createDeck,
  COSMETIC_CATALOG,
  createDevShopProvider,
  createMemoryDailyChallengeStorage,
  createMemoryDdaStorage,
  createMemoryProgressionStorage,
  createMemoryShopStorage,
  createSeededRng,
  DailyBackend,
  DailyLeaderboard,
  DAILY_MAX_ATTEMPTS,
  DEFAULT_DDA_CONFIG,
  DEFAULT_PROFILE_STATS,
  DEFAULT_PROGRESSION,
  DeckState,
  generateForgeOffers,
  isForgerUnlocked,
  loadDda,
  milestoneOptionTitle,
  pendingMilestones,
  RELIC_POOL,
  PatternKind,
  PLAYS_PER_ROUND,
  RunEvent,
  RunState,
} from '../engine';

import { createGameStore, persistRoundEnd, selectionPreview } from './gameStore';

/** Backend fake do Desafio Diário: seed fixo e chamadas rastreáveis. */
function makeFakeDailyBackend(seed = 424242): DailyBackend & {
  readonly submissions: { deviceId: string; score: number }[];
} {
  const submissions: { deviceId: string; score: number }[] = [];
  return {
    submissions,
    fetchSeed: async () => seed,
    submitScore: async (deviceId, score) => {
      submissions.push({ deviceId, score });
      return score;
    },
    fetchLeaderboard: async (): Promise<DailyLeaderboard> => ({
      week: '2026-08-10',
      own: { rank: 1, score: 4242 },
      top: [{ rank: 1, score: 4242 }],
    }),
  };
}

const spades = (value: number): Card => ({ suit: 'spades', value });
const hearts = (value: number): Card => ({ suit: 'hearts', value });
const diamonds = (value: number): Card => ({ suit: 'diamonds', value });
const clubs = (value: number): Card => ({ suit: 'clubs', value });

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
    unlocks: ALL_UNLOCKS,
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
    const store = createGameStore({
      seed: () => 1234,
      initialProgression: { ...DEFAULT_PROGRESSION, claimedOptions: ['unlock-forger-hammer'] },
    });
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

  test('applyForgeOffer de carta exige a carta alvo e encerra a fase forging', () => {
    const store = createGameStore({ seed: () => 21 });
    store.getState().startRun();
    // Simula a Rodada vencida: fase forging com as ofertas do motor.
    const offers = generateForgeOffers(createSeededRng(7), []);
    store.setState({
      run: { ...store.getState().run!, phase: 'forging', forgeOffers: offers },
    });
    const cardEffectIndex = offers.findIndex((offer) => offer.type === 'cardEffect');
    const target = createDeck()[3];
    store.getState().applyForgeOffer(cardEffectIndex, target);
    const state = store.getState();
    expect(state.run?.phase).toBe('roundWon');
    expect(state.run?.forgeOffers).toHaveLength(0);
    expect(state.run?.forgedCards).toHaveLength(1);
    expect(cardKey(state.run!.forgedCards[0].card)).toBe(cardKey(target));
  });

  test('applyForgeOffer de Relíquia adquire a Relíquia da oferta', () => {
    const store = createGameStore({ seed: () => 22 });
    store.getState().startRun();
    const offers = generateForgeOffers(createSeededRng(7), []);
    store.setState({
      run: { ...store.getState().run!, phase: 'forging', forgeOffers: offers },
    });
    const relicIndex = offers.findIndex((offer) => offer.type === 'relic');
    expect(relicIndex).toBeGreaterThanOrEqual(0);
    const relic = (offers[relicIndex] as Extract<(typeof offers)[number], { type: 'relic' }>).relic;
    store.getState().applyForgeOffer(relicIndex);
    const state = store.getState();
    expect(state.run?.phase).toBe('roundWon');
    expect(state.run?.relics.map((candidate) => candidate.id)).toContain(relic.id);
  });

  test('applyForgeOffer respeita o teto de 3 Relíquias: sem slot, só ofertas de carta', () => {
    const store = createGameStore({ seed: () => 23 });
    store.getState().startRun();
    // Teto cheio: o motor gera 3 ofertas de carta, sem oferta de Relíquia.
    const fullRelics = RELIC_POOL.slice(0, 3);
    const offers = generateForgeOffers(createSeededRng(7), fullRelics);
    expect(offers.every((offer) => offer.type === 'cardEffect')).toBe(true);
    store.setState({
      run: { ...store.getState().run!, phase: 'forging', forgeOffers: offers },
    });
    // Aplicar a primeira oferta (de carta) segue o fluxo normal.
    store.getState().applyForgeOffer(0, createDeck()[5]);
    expect(store.getState().run?.phase).toBe('roundWon');
    expect(store.getState().run?.relics).toHaveLength(0);
  });

  test('applyForgeOffer ignora fases que não sejam forging', () => {
    const store = createGameStore({ seed: () => 24 });
    store.getState().startRun();
    const runBefore = store.getState().run;
    store.getState().applyForgeOffer(0, createDeck()[0]);
    expect(store.getState().run).toBe(runBefore);
  });

  test('restartRun inicia nova Run com novo seed, mesmo Forjador e Mão nova', () => {
    let seed = 100;
    const store = createGameStore({
      seed: () => seed,
      initialProgression: { ...DEFAULT_PROGRESSION, claimedOptions: ['unlock-forger-anvil'] },
    });
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

describe('Desafio Diário (ticket 13)', () => {
  const QUAD_TENS = [clubs(10), spades(10), hearts(10), diamonds(10)];

  test('openDaily navega para a tela do desafio', () => {
    const store = createGameStore();
    store.getState().openDaily();
    expect(store.getState().screen).toBe('daily');
  });

  test('startDailyChallenge usa o seed do backend, Forjador fixo, DDA desligado e consume a gratuita', async () => {
    const storage = createMemoryDailyChallengeStorage();
    const backend = makeFakeDailyBackend(424242);
    const store = createGameStore({ dailyStorage: storage, dailyBackend: backend });
    await store.getState().startDailyChallenge();
    const state = store.getState();
    expect(state.screen).toBe('game');
    expect(state.runMode).toBe('daily');
    expect(state.run).not.toBeNull();
    expect(state.run?.seed).toBe(424242);
    expect(state.run?.forger).toBe('apprentice');
    expect(state.run?.ddaConfig.enabled).toBe(false);
    expect(state.run?.unlocks).toEqual(ALL_UNLOCKS);
    // Meta na curva base (DDA off) e tentativa consumida e persistida.
    expect(state.run?.target).toBe(baseTarget(1));
    expect(state.daily.attempts.attemptsUsed).toBe(1);
    expect(storage.loadAttempts()?.attemptsUsed).toBe(1);
    expect(storage.loadDeviceId()).toBe(state.daily.deviceId);
  });

  test('o seed do dia é cacheado: segunda tentativa não refaz a busca', async () => {
    let fetches = 0;
    const backend: DailyBackend = {
      ...makeFakeDailyBackend(),
      fetchSeed: async () => {
        fetches += 1;
        return 424242;
      },
    };
    const store = createGameStore({ dailyBackend: backend });
    await store.getState().startDailyChallenge(); // gratuita
    await store.getState().watchAdForExtraAttempt(); // libera a extra
    await store.getState().startDailyChallenge(); // extra
    expect(fetches).toBe(1);
    expect(store.getState().daily.attempts.attemptsUsed).toBe(DAILY_MAX_ATTEMPTS);
  });

  test('sem anúncio, a segunda tentativa é bloqueada', async () => {
    const store = createGameStore({ dailyBackend: makeFakeDailyBackend() });
    await store.getState().startDailyChallenge();
    store.getState().openDaily();
    await store.getState().startDailyChallenge();
    const state = store.getState();
    expect(state.screen).toBe('daily'); // não navegou para o jogo
    expect(state.daily.attempts.attemptsUsed).toBe(1);
  });

  test('assistir o anúncio libera a tentativa extra', async () => {
    const storage = createMemoryDailyChallengeStorage();
    const store = createGameStore({ dailyStorage: storage, dailyBackend: makeFakeDailyBackend() });
    await store.getState().startDailyChallenge();
    await store.getState().watchAdForExtraAttempt();
    expect(store.getState().daily.attempts.extraUnlocked).toBe(true);
    expect(storage.loadAttempts()?.extraUnlocked).toBe(true);
  });

  test('anúncio não assistido (provider falso) não libera a extra', async () => {
    const store = createGameStore({
      dailyBackend: makeFakeDailyBackend(),
      adProvider: { requestRewardedAd: async () => false },
    });
    await store.getState().startDailyChallenge();
    await store.getState().watchAdForExtraAttempt();
    expect(store.getState().daily.attempts.extraUnlocked).toBe(false);
  });

  test('dia novo zera as tentativas (rollover UTC)', async () => {
    let now = new Date('2026-08-11T12:00:00Z');
    const storage = createMemoryDailyChallengeStorage();
    const store = createGameStore({
      dailyStorage: storage,
      dailyBackend: makeFakeDailyBackend(),
      now: () => now,
    });
    await store.getState().startDailyChallenge();
    await store.getState().watchAdForExtraAttempt();
    await store.getState().startDailyChallenge();
    expect(store.getState().daily.attempts.attemptsUsed).toBe(DAILY_MAX_ATTEMPTS);
    // Dia seguinte: a gratuita volta.
    now = new Date('2026-08-12T12:00:00Z');
    store.getState().openDaily();
    await store.getState().startDailyChallenge();
    expect(store.getState().screen).toBe('game');
    expect(store.getState().daily.attempts.attemptsUsed).toBe(1);
    expect(store.getState().daily.seedDate).toBe('2026-08-12');
  });

  test('fim da Run diária submete a pontuação e não acumula meta-progressão', async () => {
    const backend = makeFakeDailyBackend();
    const store = createGameStore({ dailyBackend: backend });
    await store.getState().startDailyChallenge();
    // Run vencedora na Rodada 6 (fim de Run) em modo diário.
    store.setState({ run: { ...makeRunWithHand(QUAD_TENS), roundNumber: 6 } });
    for (const card of QUAD_TENS) store.getState().toggleCard(cardKey(card));
    store.getState().playSelection();
    const state = store.getState();
    expect(state.run?.phase).toBe('runWon');
    // Submetida ao backend com o deviceId do dispositivo.
    expect(backend.submissions).toHaveLength(1);
    expect(backend.submissions[0].deviceId).toBe(state.daily.deviceId);
    expect(backend.submissions[0].score).toBe(state.run!.runScore);
    // Nada conta para estatísticas ou desbloqueios de meta-progressão.
    expect(state.progression.stats.runsStarted).toBe(0);
    expect(state.progression.stats.runsWon).toBe(0);
    expect(state.progression.stats.bestRunScore).toBe(0);
    expect(state.recentUnlocks).toHaveLength(0);
  });

  test('derrota na Run diária também submete a pontuação', async () => {
    const backend = makeFakeDailyBackend();
    const store = createGameStore({ dailyBackend: backend });
    await store.getState().startDailyChallenge();
    store.setState({ run: { ...makeRunWithHand([spades(1)]), playsRemaining: 1 } });
    store.getState().toggleCard(cardKey(spades(1)));
    store.getState().playSelection();
    expect(store.getState().run?.phase).toBe('runLost');
    expect(backend.submissions).toHaveLength(1);
    expect(store.getState().progression.stats.runsStarted).toBe(0);
  });

  test('falha de backend marca erro e não consome tentativa', async () => {
    const backend: DailyBackend = {
      ...makeFakeDailyBackend(),
      fetchSeed: async () => {
        throw new Error('rede fora');
      },
    };
    const store = createGameStore({ dailyBackend: backend });
    store.getState().openDaily();
    await store.getState().startDailyChallenge();
    const state = store.getState();
    expect(state.screen).toBe('daily'); // não navegou para o jogo
    expect(state.daily.status).toBe('error');
    expect(state.daily.error).toBe('rede fora');
    expect(state.daily.attempts.attemptsUsed).toBe(0);
  });

  test('submissão com falha marca failed e o retry reenvia', async () => {
    let fail = true;
    const backend: DailyBackend = {
      ...makeFakeDailyBackend(),
      submitScore: async (deviceId, score) => {
        if (fail) throw new Error('rede fora');
        return score;
      },
    };
    const store = createGameStore({ dailyBackend: backend });
    await store.getState().startDailyChallenge();
    store.setState({ run: { ...makeRunWithHand(QUAD_TENS), roundNumber: 6 } });
    for (const card of QUAD_TENS) store.getState().toggleCard(cardKey(card));
    store.getState().playSelection();
    // a submissão falhou no fim da Run
    await Promise.resolve();
    expect(store.getState().daily.submitStatus).toBe('failed');
    // retry com rede de volta
    fail = false;
    await store.getState().submitDailyScore(store.getState().run!.runScore);
    expect(store.getState().daily.submitStatus).toBe('submitted');
  });

  test('fetchLeaderboard (opt-in) guarda a resposta e a falha aparece no estado', async () => {
    const store = createGameStore({ dailyBackend: makeFakeDailyBackend() });
    await store.getState().fetchLeaderboard();
    expect(store.getState().daily.leaderboard?.own?.score).toBe(4242);
    expect(store.getState().daily.leaderboard?.top).toHaveLength(1);
    const failing = createGameStore({
      dailyBackend: {
        ...makeFakeDailyBackend(),
        fetchLeaderboard: async () => {
          throw new Error('sem leaderboard');
        },
      },
    });
    await failing.getState().fetchLeaderboard();
    expect(failing.getState().daily.leaderboardError).toBe('sem leaderboard');
    expect(failing.getState().daily.leaderboard).toBeNull();
  });
});

describe('loja cosmética (ticket 14)', () => {
  test('openShop navega para a loja e carrega as ofertas', async () => {
    const store = createGameStore({ shopProvider: createDevShopProvider() });
    store.getState().openShop();
    expect(store.getState().screen).toBe('shop');
    await Promise.resolve();
    expect(store.getState().shop.status).toBe('ready');
    expect(store.getState().shop.offerings).toHaveLength(COSMETIC_CATALOG.length);
  });

  test('purchaseCosmetic compra, persiste e auto-equipa a skin', async () => {
    const storage = createMemoryShopStorage();
    const store = createGameStore({ shopStorage: storage, shopProvider: createDevShopProvider() });
    await store.getState().purchaseCosmetic('skin-obsidian');
    let state = store.getState();
    expect(state.shop.owned.owned).toContain('skin-obsidian');
    expect(state.shop.owned.equippedDeckSkin).toBe('skin-obsidian'); // aplicada na hora
    expect(storage.load()?.owned).toContain('skin-obsidian');
    // VFX não interfere na skin.
    await store.getState().purchaseCosmetic('vfx-golden-combo');
    state = store.getState();
    expect(state.shop.owned.owned).toContain('vfx-golden-combo');
    expect(state.shop.owned.equippedComboVfx).toBe('vfx-golden-combo');
    expect(state.shop.owned.equippedDeckSkin).toBe('skin-obsidian');
  });

  test('equipCosmetic equipa apenas itens comprados e troca a skin atual', async () => {
    const store = createGameStore({ shopProvider: createDevShopProvider() });
    // sem comprar, não equipa
    store.getState().equipCosmetic('skin-obsidian');
    expect(store.getState().shop.owned.equippedDeckSkin).toBeNull();
    await store.getState().purchaseCosmetic('skin-obsidian');
    await store.getState().purchaseCosmetic('skin-emerald');
    store.getState().equipCosmetic('skin-obsidian');
    expect(store.getState().shop.owned.equippedDeckSkin).toBe('skin-obsidian');
    store.getState().equipCosmetic('skin-emerald');
    expect(store.getState().shop.owned.equippedDeckSkin).toBe('skin-emerald');
  });

  test('purchaseCosmetic ignora item já comprado (sem chamar o provider)', async () => {
    const provider = createDevShopProvider();
    const spy = jest.spyOn(provider, 'purchase');
    const store = createGameStore({ shopProvider: provider });
    await store.getState().purchaseCosmetic('skin-obsidian');
    await store.getState().purchaseCosmetic('skin-obsidian');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('restorePurchases junta compras do servidor às locais', async () => {
    const store = createGameStore({
      shopProvider: {
        ...createDevShopProvider(),
        restore: async () => ['combo_forge_skin_royal', 'combo_forge_skin_obsidian'],
      },
    });
    await store.getState().purchaseCosmetic('skin-obsidian');
    await store.getState().restorePurchases();
    const owned = store.getState().shop.owned.owned;
    expect(owned).toContain('skin-obsidian');
    expect(owned).toContain('skin-royal');
  });

  test('falha do provider marca erro e não adiciona o item', async () => {
    const store = createGameStore({
      shopProvider: {
        ...createDevShopProvider(),
        purchase: async () => {
          throw new Error('loja fora do ar');
        },
      },
    });
    await store.getState().purchaseCosmetic('skin-obsidian');
    const state = store.getState();
    expect(state.shop.error).toBe('loja fora do ar');
    expect(state.shop.owned.owned).toHaveLength(0);
    expect(state.shop.purchasing).toBeNull();
  });

  test('item inexistente é rejeitado sem quebrar o estado', async () => {
    const store = createGameStore({ shopProvider: createDevShopProvider() });
    await store.getState().purchaseCosmetic('nao-existe');
    const state = store.getState();
    expect(state.shop.error).toBeDefined();
    expect(state.shop.owned.owned).toHaveLength(0);
    expect(state.shop.purchasing).toBeNull();
  });
});

describe('meta-progressão (ticket 11)', () => {
  const QUAD_TENS = [clubs(10), spades(10), hearts(10), diamonds(10)];

  /** Coloca uma Run na Rodada 6 com Mão vencedora e joga a quadra (runWon). */
  function winStoreRun(store: ReturnType<typeof createGameStore>): void {
    store.getState().startRun(); // garante a stream de RNG no store
    store.setState({ run: { ...makeRunWithHand(QUAD_TENS), roundNumber: 6 } });
    for (const card of QUAD_TENS) store.getState().toggleCard(cardKey(card));
    store.getState().playSelection();
  }

  test('chooseForger ignora Forjadores bloqueados pela meta-progressão', () => {
    const store = createGameStore();
    store.getState().chooseForger('hammer');
    expect(store.getState().forger).toBe('apprentice');
  });

  test('chooseForger aceita Forjador desbloqueado e startRun respeita os unlocks', () => {
    const store = createGameStore({
      initialProgression: { ...DEFAULT_PROGRESSION, claimedOptions: ['unlock-forger-hammer'] },
    });
    store.getState().chooseForger('hammer');
    expect(store.getState().forger).toBe('hammer');
    store.getState().startRun();
    expect(store.getState().run?.forger).toBe('hammer');
    expect(isForgerUnlocked(computeUnlocks(store.getState().progression), 'hammer')).toBe(true);
  });

  test('fim de Run vencida registra a vitória, desbloqueia o Martelo e mostra o banner', () => {
    const storage = createMemoryProgressionStorage();
    const store = createGameStore({ progressionStorage: storage });
    winStoreRun(store);
    const state = store.getState();
    expect(state.run?.phase).toBe('runWon');
    expect(state.progression.stats.runsWon).toBe(1);
    expect(state.progression.stats.runsStarted).toBe(1);
    expect(state.progression.stats.bestRunScore).toBeGreaterThan(0);
    expect(computeUnlocks(state.progression).forgers).toContain('hammer');
    expect(state.recentUnlocks).toContain(milestoneOptionTitle('unlock-forger-hammer'));
    expect(storage.load()?.claimedOptions).toContain('unlock-forger-hammer');
  });

  test('Run perdida registra a derrota sem desbloquear nada', () => {
    const store = createGameStore();
    store.getState().startRun();
    store.setState({ run: { ...makeRunWithHand([spades(1)]), playsRemaining: 1 } });
    store.getState().toggleCard(cardKey(spades(1)));
    store.getState().playSelection();
    const state = store.getState();
    expect(state.run?.phase).toBe('runLost');
    expect(state.progression.stats.runsStarted).toBe(1);
    expect(state.progression.stats.runsWon).toBe(0);
    expect(state.progression.claimedOptions).toHaveLength(0);
    expect(state.recentUnlocks).toHaveLength(0);
  });

  test('quinta vitória: o jogador escolhe a ordem dos dois Efeitos de Forja', () => {
    const store = createGameStore({
      initialProgression: {
        ...DEFAULT_PROGRESSION,
        stats: { ...DEFAULT_PROFILE_STATS, runsWon: 4 },
        claimedOptions: ['unlock-forger-hammer', 'unlock-forger-anvil'],
      },
    });
    winStoreRun(store);
    let state = store.getState();
    expect(state.progression.stats.runsWon).toBe(5);
    // marco multi-opção pendente → modal aberto com as duas opções
    expect(state.unlockChoice).not.toBeNull();
    expect(state.unlockChoice?.unclaimedOptions).toHaveLength(2);
    // primeira escolha de ordem
    store.getState().claimUnlock('value-bonus-7');
    state = store.getState();
    expect(computeUnlocks(state.progression).extraEffects).toEqual(['value-bonus-7']);
    expect(state.unlockChoice).toBeNull();
    // a segunda continua disponível para reivindicar depois (Coleção)
    const pending = pendingMilestones(state.progression);
    expect(pending).toHaveLength(1);
    expect(pending[0].unclaimedOptions.map((option) => option.id)).toEqual(['trigger-2-15']);
    // segunda escolha completa o marco
    store.getState().claimUnlock('trigger-2-15');
    expect(computeUnlocks(store.getState().progression).extraEffects).toHaveLength(2);
  });

  test('claimUnlock persiste a escolha no storage', () => {
    const storage = createMemoryProgressionStorage();
    const store = createGameStore({
      progressionStorage: storage,
      initialProgression: {
        ...DEFAULT_PROGRESSION,
        stats: { ...DEFAULT_PROFILE_STATS, runsWon: 5 },
      },
    });
    store.getState().claimUnlock('value-bonus-7');
    expect(storage.load()?.claimedOptions).toContain('value-bonus-7');
  });

  test('Jogadas acumulam estatísticas de perfil (cartas jogadas e maior combo)', () => {
    const store = createGameStore({ seed: () => 4 });
    store.getState().startRun();
    const hand = store.getState().run!.deck.hand;
    store.getState().toggleCard(cardKey(hand[0]));
    store.getState().playSelection();
    const stats = store.getState().progression.stats;
    expect(stats.cardPlays[cardKey(hand[0])]).toBe(1);
    expect(stats.maxMultiplier).toBeGreaterThanOrEqual(1);
  });

  test('openProfile, openCollection e backToStart navegam entre telas', () => {
    const store = createGameStore();
    store.getState().openProfile();
    expect(store.getState().screen).toBe('profile');
    store.getState().openCollection();
    expect(store.getState().screen).toBe('collection');
    store.getState().backToStart();
    expect(store.getState().screen).toBe('start');
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
