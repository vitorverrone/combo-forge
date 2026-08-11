import { Card, ForgeEffect } from './cards';
import { DEFAULT_DDA_CONFIG, DEFAULT_DDA_STATE } from './dda';
import { createDeck, DeckState, DISCARDS_PER_ROUND, HAND_SIZE } from './deck';
import { ForgeOffer, forgeCard, forgeOfferSeed, generateForgeOffers } from './forge';
import { createSeededRng, Rng } from './random';
import { ALL_UNLOCKS } from './progression';
import { RELIC_CAP, RELIC_POOL } from './relics';
import {
  applyForgeOffer,
  baseTarget,
  makePlay,
  PLAYS_PER_ROUND,
  RunEvent,
  RunState,
  startNextRound,
} from './run';

const spades = (value: number): Card => ({ suit: 'spades', value });
const hearts = (value: number): Card => ({ suit: 'hearts', value });
const diamonds = (value: number): Card => ({ suit: 'diamonds', value });
const clubs = (value: number): Card => ({ suit: 'clubs', value });

const cardId = (card: Card): string => `${card.suit}:${card.value}`;
const eventsOfType = (events: RunEvent[], type: RunEvent['type']) => events.filter((e) => e.type === type);

const QUAD_TENS = [clubs(10), spades(10), hearts(10), diamonds(10)];

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
    seed: 0,
    forgedCards: [],
    relics: [],
    startingRelic: undefined,
    forger: 'apprentice',
    dda: DEFAULT_DDA_STATE,
    ddaConfig: DEFAULT_DDA_CONFIG,
    unlocks: ALL_UNLOCKS,
    forgeOffers: [],
    ...overrides,
  };
}

/** Vitória garantida em uma única Jogada: quadra de 10s vale 110 ≥ Meta 50. */
function winRoundOne(
  rngForPlay: Rng,
  overrides: Partial<RunState> = {},
): { run: RunState; events: RunEvent[] } {
  const run = makeRun(QUAD_TENS, overrides);
  return makePlay(run, QUAD_TENS, rngForPlay);
}

const cardEffect = (effect: ForgeEffect): ForgeOffer => ({ type: 'cardEffect', effect });

describe('generateForgeOffers', () => {
  test('gera 3 ofertas distintas: 2 de Efeito de Forja + 1 de Relíquia', () => {
    const offers = generateForgeOffers(createSeededRng(1), []);
    expect(offers).toHaveLength(3);
    expect(offers.filter((o) => o.type === 'cardEffect')).toHaveLength(2);
    expect(offers.filter((o) => o.type === 'relic')).toHaveLength(1);
    const effectKeys = offers
      .filter((o) => o.type === 'cardEffect')
      .map((o) => JSON.stringify((o as Extract<ForgeOffer, { type: 'cardEffect' }>).effect));
    expect(new Set(effectKeys).size).toBe(2);
  });

  test('determinístico com a mesma stream', () => {
    const a = generateForgeOffers(createSeededRng(42), []);
    const b = generateForgeOffers(createSeededRng(42), []);
    expect(a).toEqual(b);
  });

  test('streams diferentes geram ofertas diferentes', () => {
    const a = generateForgeOffers(createSeededRng(42), []);
    const b = generateForgeOffers(createSeededRng(43), []);
    expect(a).not.toEqual(b);
  });

  test('com o teto de 3 Relíquias ativas, a oferta de Relíquia vira uma terceira oferta de carta', () => {
    const owned = RELIC_POOL.slice(0, RELIC_CAP);
    const offers = generateForgeOffers(createSeededRng(7), owned);
    expect(offers).toHaveLength(3);
    expect(offers.every((o) => o.type === 'cardEffect')).toBe(true);
  });

  test('a oferta de Relíquia nunca é uma Relíquia já ativa', () => {
    const owned = [RELIC_POOL[0]];
    const relicOffer = generateForgeOffers(createSeededRng(7), owned).find((o) => o.type === 'relic');
    expect(relicOffer).toBeDefined();
    if (relicOffer !== undefined && relicOffer.type === 'relic') {
      expect(owned.some((o) => o.id === relicOffer.relic.id)).toBe(false);
    }
  });
});

describe('forgeOfferSeed', () => {
  test('deriva a stream da Forja do seed da Run e da Rodada', () => {
    expect(forgeOfferSeed(42, 1)).toBe(forgeOfferSeed(42, 1));
    expect(forgeOfferSeed(42, 1)).not.toBe(forgeOfferSeed(42, 2));
    expect(forgeOfferSeed(42, 1)).not.toBe(forgeOfferSeed(43, 1));
  });
});

describe('forgeCard', () => {
  test('cria uma Carta Forjada nova ou empilha efeitos na existente', () => {
    const first = forgeCard([], spades(7), { kind: 'valueBonus', amount: 2 });
    expect(first).toEqual([{ card: spades(7), effects: [{ kind: 'valueBonus', amount: 2 }] }]);
    const second = forgeCard(first, spades(7), { kind: 'multiplier', multiplier: 2 });
    expect(second).toHaveLength(1);
    expect(second[0].effects).toEqual([
      { kind: 'valueBonus', amount: 2 },
      { kind: 'multiplier', multiplier: 2 },
    ]);
    const other = forgeCard(second, hearts(3), { kind: 'wildcard' });
    expect(other).toHaveLength(2);
  });
});

describe('Forja na Run', () => {
  test('vencer a Rodada 1 entra na fase forging com 3 ofertas e emite os eventos', () => {
    const { run, events } = winRoundOne(createSeededRng(1));
    expect(run.phase).toBe('forging');
    expect(run.forgeOffers).toHaveLength(3);
    expect(eventsOfType(events, 'roundWon')).toHaveLength(1);
    expect(eventsOfType(events, 'forgeOffers')).toHaveLength(1);
  });

  test('ofertas independent do caminho de Jogadas (stream separada do embaralhamento)', () => {
    const a = winRoundOne(createSeededRng(1), { seed: 42 }).run;
    const b = winRoundOne(createSeededRng(9999), { seed: 42 }).run;
    expect(a.forgeOffers).toEqual(b.forgeOffers);
  });

  test('mesmo seed e mesmo caminho produzem a mesma Run (determinismo)', () => {
    const a = winRoundOne(createSeededRng(1), { seed: 7 }).run;
    const b = winRoundOne(createSeededRng(1), { seed: 7 }).run;
    expect(a).toEqual(b);
  });

  test('seeds diferentes geram ofertas diferentes', () => {
    const a = winRoundOne(createSeededRng(1), { seed: 42 }).run;
    const b = winRoundOne(createSeededRng(1), { seed: 43 }).run;
    expect(a.forgeOffers).not.toEqual(b.forgeOffers);
  });

  test('com 3 Relíquias ativas, as ofertas da Rodada vencida são todas de carta', () => {
    const { run } = winRoundOne(createSeededRng(1), { relics: RELIC_POOL.slice(0, RELIC_CAP) });
    expect(run.forgeOffers).toHaveLength(3);
    expect(run.forgeOffers.every((o) => o.type === 'cardEffect')).toBe(true);
  });

  test('jogar na fase forging lança erro', () => {
    const { run } = winRoundOne(createSeededRng(1));
    expect(() => makePlay(run, [spades(1)], createSeededRng(2))).toThrow();
  });
});

describe('applyForgeOffer', () => {
  const valueBonusOffer = cardEffect({ kind: 'valueBonus', amount: 2 });
  const relicOffer: ForgeOffer = { type: 'relic', relic: RELIC_POOL[3] };

  test('aplica um Efeito de Forja, criando uma Carta Forjada permanente', () => {
    const run = makeRun([spades(7)], { phase: 'forging', forgeOffers: [valueBonusOffer] });
    const { run: next, events } = applyForgeOffer(run, 0, spades(7));
    expect(next.forgedCards).toEqual([{ card: spades(7), effects: [{ kind: 'valueBonus', amount: 2 }] }]);
    expect(next.phase).toBe('roundWon');
    expect(next.forgeOffers).toHaveLength(0);
    expect(eventsOfType(events, 'forgeApplied')).toHaveLength(1);
  });

  test('empilha efeitos na mesma carta em Forjas futuras, preservando a ordem', () => {
    const first = applyForgeOffer(
      makeRun([spades(7)], { phase: 'forging', forgeOffers: [cardEffect({ kind: 'multiplier', multiplier: 2 })] }),
      0,
      spades(7),
    ).run;
    const run2: RunState = { ...first, phase: 'forging', forgeOffers: [valueBonusOffer] };
    const { run: second } = applyForgeOffer(run2, 0, spades(7));
    expect(second.forgedCards).toHaveLength(1);
    expect(second.forgedCards[0].effects).toEqual([
      { kind: 'multiplier', multiplier: 2 },
      { kind: 'valueBonus', amount: 2 },
    ]);
  });

  test('adquire uma Relíquia respeitando o teto', () => {
    const run = makeRun([spades(7)], { phase: 'forging', forgeOffers: [relicOffer] });
    const { run: next } = applyForgeOffer(run, 0);
    expect(next.relics).toEqual([RELIC_POOL[3]]);
    expect(next.phase).toBe('roundWon');
  });

  test('lança erro fora da fase forging', () => {
    const run = makeRun([spades(7)], { phase: 'playing' });
    expect(() => applyForgeOffer(run, 0, spades(7))).toThrow();
  });

  test('lança erro com índice de oferta inválido', () => {
    const run = makeRun([spades(7)], { phase: 'forging', forgeOffers: [valueBonusOffer] });
    expect(() => applyForgeOffer(run, 1, spades(7))).toThrow();
    expect(() => applyForgeOffer(run, -1, spades(7))).toThrow();
  });

  test('oferta de Efeito de Forja sem carta alvo lança erro', () => {
    const run = makeRun([spades(7)], { phase: 'forging', forgeOffers: [valueBonusOffer] });
    expect(() => applyForgeOffer(run, 0)).toThrow();
  });

  test('carta alvo fora do Baralho lança erro', () => {
    const run = makeRun([spades(7)], { phase: 'forging', forgeOffers: [valueBonusOffer] });
    expect(() => applyForgeOffer(run, 0, { suit: 'spades', value: 13 } as Card)).toThrow();
  });

  test('Relíquia ofertada acima do teto lança erro (guarda defensiva)', () => {
    const run = makeRun([spades(7)], {
      phase: 'forging',
      forgeOffers: [relicOffer],
      relics: RELIC_POOL.slice(0, RELIC_CAP),
    });
    expect(() => applyForgeOffer(run, 0)).toThrow();
  });
});

describe('fluxo da Forja entre Rodadas', () => {
  test('vencer → forjar → avançar: Cartas Forjadas persistem na Rodada seguinte', () => {
    let { run } = winRoundOne(createSeededRng(1), { seed: 11 });
    expect(run.phase).toBe('forging');
    const cardOffer = run.forgeOffers.find(
      (o): o is Extract<ForgeOffer, { type: 'cardEffect' }> => o.type === 'cardEffect',
    );
    expect(cardOffer).toBeDefined();
    if (cardOffer === undefined) return;
    run = applyForgeOffer(run, run.forgeOffers.indexOf(cardOffer), spades(10)).run;
    expect(run.phase).toBe('roundWon');

    const next = startNextRound(run, createSeededRng(2));
    expect(next.roundNumber).toBe(2);
    expect(next.phase).toBe('playing');
    expect(next.forgedCards).toHaveLength(1);
    expect(next.forgeOffers).toHaveLength(0);
    expect(next.relics).toEqual(run.relics);
  });

  test('startNextRound exige forjar primeiro (fase forging bloqueia o avanço)', () => {
    const { run } = winRoundOne(createSeededRng(1));
    expect(run.phase).toBe('forging');
    expect(() => startNextRound(run, createSeededRng(2))).toThrow();
  });

  test('vencer a 6ª Rodada encerra a Run em vitória, sem Forja', () => {
    const run = makeRun(QUAD_TENS, { roundNumber: 6, target: 50 });
    const { run: next, events } = makePlay(run, QUAD_TENS, createSeededRng(3));
    expect(next.phase).toBe('runWon');
    expect(next.forgeOffers).toHaveLength(0);
    expect(eventsOfType(events, 'forgeOffers')).toHaveLength(0);
    expect(eventsOfType(events, 'runWon')).toHaveLength(1);
  });
});

describe('Relíquias de Mecânica na estrutura (ticket 06)', () => {
  test('+1 Descarte adquirido via Forja vale a partir da Rodada seguinte', () => {
    const run = makeRun(QUAD_TENS, { phase: 'forging', forgeOffers: [{ type: 'relic', relic: RELIC_POOL[6] }] });
    const forged = applyForgeOffer(run, 0).run;
    const next = startNextRound(forged, createSeededRng(2));
    expect(next.deck.discardsRemaining).toBe(DISCARDS_PER_ROUND + 1);
    expect(next.deck.hand).toHaveLength(HAND_SIZE);
  });

  test('+1 carta na Mão adquirido via Forja vale a partir da Rodada seguinte', () => {
    const run = makeRun(QUAD_TENS, { phase: 'forging', forgeOffers: [{ type: 'relic', relic: RELIC_POOL[7] }] });
    const forged = applyForgeOffer(run, 0).run;
    const next = startNextRound(forged, createSeededRng(2));
    expect(next.deck.hand).toHaveLength(HAND_SIZE + 1);
  });

  test('a Relíquia de largada do Forjador não conta para o teto de ofertas', () => {
    const run = makeRun(QUAD_TENS, {
      forger: 'hammer',
      startingRelic: RELIC_POOL[0],
      relics: RELIC_POOL.slice(0, RELIC_CAP),
    });
    // 3 adquiridas + 1 de largada: a Forja vira a oferta de Relíquia em carta
    const { run: won } = makePlay(run, QUAD_TENS, createSeededRng(3));
    expect(won.forgeOffers).toHaveLength(3);
    expect(won.forgeOffers.every((o) => o.type === 'cardEffect')).toBe(true);
  });
});

describe('boost de Relíquia rara (ticket 07)', () => {
  test('com o boost e a decisão aleatória a favor, a oferta sai do subconjunto raro', () => {
    const lowRng: Rng = () => 0.1; // rng() < RARE_RELIC_BOOST_RATE → viés para raras
    const offers = generateForgeOffers(lowRng, [], { rareRelicBoost: true });
    const relicOffer = offers.find((o) => o.type === 'relic');
    expect(relicOffer).toBeDefined();
    if (relicOffer !== undefined && relicOffer.type === 'relic') {
      expect(relicOffer.relic.rarity).toBe('rare');
    }
  });

  test('sem boost, o sorteio é uniforme sobre todas as disponíveis', () => {
    const lowRng: Rng = () => 0.1;
    const offers = generateForgeOffers(lowRng, [], { rareRelicBoost: false });
    expect(offers.filter((o) => o.type === 'relic')).toHaveLength(1);
  });

  test('o boost permanece determinístico para a mesma stream', () => {
    const lowRng: Rng = () => 0.1;
    const a = generateForgeOffers(lowRng, [], { rareRelicBoost: true });
    const b = generateForgeOffers(lowRng, [], { rareRelicBoost: true });
    expect(a).toEqual(b);
  });
});

describe('serialização', () => {
  test('estado da Run com Forja é serializável', () => {
    const { run } = winRoundOne(createSeededRng(1), { seed: 5 });
    expect(JSON.parse(JSON.stringify(run))).toEqual(run);
  });
});
