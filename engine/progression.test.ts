import { Card, cardKey } from './cards';
import { BONUS_FORGE_EFFECTS, generateForgeOffers } from './forge';
import { createSeededRng } from './random';
import { RELIC_POOL } from './relics';
import {
  ALL_UNLOCKS,
  claimOption,
  claimReachedSingles,
  computeUnlocks,
  createMemoryProgressionStorage,
  DEFAULT_PROFILE_STATS,
  DEFAULT_PROGRESSION,
  isForgerUnlocked,
  isOptionClaimable,
  milestoneOptionTitle,
  pendingMilestones,
  poolsFor,
  recordPlay,
  recordRunEnd,
  unlockStatuses,
  UnlocksState,
} from './progression';
import { makePlay, PLAYS_PER_ROUND, RunState, startRun } from './run';

const spades = (value: number): Card => ({ suit: 'spades', value });
const hearts = (value: number): Card => ({ suit: 'hearts', value });
const diamonds = (value: number): Card => ({ suit: 'diamonds', value });
const clubs = (value: number): Card => ({ suit: 'clubs', value });

const QUAD_TENS = [clubs(10), spades(10), hearts(10), diamonds(10)];

const statsWith = (overrides: Partial<typeof DEFAULT_PROFILE_STATS> = {}) => ({
  ...DEFAULT_PROFILE_STATS,
  ...overrides,
});

describe('estatísticas de perfil', () => {
  test('recordPlay conta as cartas jogadas e sobe o maior combo', () => {
    let stats = recordPlay(DEFAULT_PROFILE_STATS, [spades(7), hearts(7)], 2);
    stats = recordPlay(stats, [spades(7)], 3);
    expect(stats.cardPlays[cardKey(spades(7))]).toBe(2);
    expect(stats.cardPlays[cardKey(hearts(7))]).toBe(1);
    expect(stats.maxMultiplier).toBe(3);
  });

  test('recordRunEnd registra vitória/derrota e o recorde de pontos', () => {
    const won = recordRunEnd(recordRunEnd(DEFAULT_PROFILE_STATS, false, 120), true, 2600);
    expect(won.runsStarted).toBe(2);
    expect(won.runsWon).toBe(1);
    expect(won.bestRunScore).toBe(2600);
    const noRecord = recordRunEnd(won, false, 90);
    expect(noRecord.bestRunScore).toBe(2600);
  });
});

describe('desbloqueios derivados (computeUnlocks)', () => {
  test('progressão nova: só o Aprendiz, sem efeitos bônus e sem Relíquias raras', () => {
    const unlocks = computeUnlocks(DEFAULT_PROGRESSION);
    expect(unlocks.forgers).toEqual(['apprentice']);
    expect(unlocks.extraEffects).toEqual([]);
    expect(unlocks.rareRelics).toBe(false);
    expect(isForgerUnlocked(unlocks, 'hammer')).toBe(false);
    expect(isForgerUnlocked(unlocks, 'anvil')).toBe(false);
  });

  test('reivindicações expandem os desbloqueios', () => {
    let p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      claimedOptions: ['unlock-forger-hammer', 'unlock-forger-anvil', 'value-bonus-7', 'unlock-rare-relics'],
    };
    const unlocks = computeUnlocks(p);
    expect(unlocks.forgers).toEqual(['apprentice', 'hammer', 'anvil']);
    expect(unlocks.extraEffects).toContain('value-bonus-7');
    expect(unlocks.rareRelics).toBe(true);
    expect(p.claimedOptions).toHaveLength(4); // não muta o original
  });
});

describe('detecção de marcos', () => {
  test('1ª vitória reivindica o Martelo automaticamente; a Bigorna fica para a 3ª', () => {
    let p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ runsWon: 1 }),
    };
    const result = claimReachedSingles(p);
    expect(result.claimed).toEqual(['unlock-forger-hammer']);
    p = result.persisted;
    expect(computeUnlocks(p).forgers).toContain('hammer');
    expect(computeUnlocks(p).forgers).not.toContain('anvil');
  });

  test('3ª vitória desbloqueia a Bigorna (opção única, automática)', () => {
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ runsWon: 3 }),
    };
    const result = claimReachedSingles(p);
    expect(result.claimed).toEqual(['unlock-forger-hammer', 'unlock-forger-anvil']);
    expect(computeUnlocks(result.persisted).forgers).toEqual(['apprentice', 'hammer', 'anvil']);
  });

  test('5ª vitória não é automática: as duas opções de Efeito ficam pendentes', () => {
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ runsWon: 5 }),
    };
    const result = claimReachedSingles(p);
    expect(result.claimed).toEqual(['unlock-forger-hammer', 'unlock-forger-anvil']);
    const pending = pendingMilestones(result.persisted);
    expect(pending).toHaveLength(1);
    expect(pending[0].milestone.id).toBe('fifthRunWon');
    expect(pending[0].unclaimedOptions.map((option) => option.id)).toEqual([
      'value-bonus-7',
      'trigger-2-15',
    ]);
  });

  test('recorde ≥ 2.500 desbloqueia as Relíquias raras (opção única, automática)', () => {
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ bestRunScore: 2500 }),
    };
    const result = claimReachedSingles(p);
    expect(result.claimed).toEqual(['unlock-rare-relics']);
    expect(computeUnlocks(result.persisted).rareRelics).toBe(true);
  });

  test('recordes abaixo de 2.500 não atingem o marco', () => {
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ bestRunScore: 2499 }),
    };
    expect(pendingMilestones(p)).toHaveLength(0);
    expect(claimReachedSingles(p).claimed).toEqual([]);
  });
});

describe('escolha da ordem de desbloqueio (marco multi-opção)', () => {
  test('reivindicar a 1ª opção adiciona só ela ao pool; a 2ª segue pendente', () => {
    let p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ runsWon: 5 }),
    };
    p = claimReachedSingles(p).persisted;
    p = claimOption(p, 'value-bonus-7');
    const unlocks = computeUnlocks(p);
    expect(unlocks.extraEffects).toEqual(['value-bonus-7']);
    const pool = poolsFor(unlocks).forgeEffects.map((option) => option.id);
    expect(pool).toContain('value-bonus-7');
    expect(pool).not.toContain('trigger-2-15');
    expect(isOptionClaimable(p, 'trigger-2-15')).toBe(true);
  });

  test('reivindicar a 2ª depois completa o marco — os dois efeitos entram no pool', () => {
    let p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ runsWon: 5 }),
    };
    p = claimReachedSingles(p).persisted;
    p = claimOption(p, 'trigger-2-15');
    p = claimOption(p, 'value-bonus-7');
    const pool = poolsFor(computeUnlocks(p)).forgeEffects.map((option) => option.id);
    expect(pool).toContain('value-bonus-7');
    expect(pool).toContain('trigger-2-15');
    expect(pendingMilestones(p)).toHaveLength(0);
  });

  test('opção indisponível lança erro (marco não atingido ou já reivindicada)', () => {
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      claimedOptions: ['unlock-forger-hammer'],
    };
    expect(() => claimOption(p, 'unlock-forger-hammer')).toThrow();
    expect(() => claimOption(p, 'value-bonus-7')).toThrow();
    expect(() => claimOption(p, 'id-desconhecido')).toThrow();
    expect(isOptionClaimable(p, 'unlock-forger-hammer')).toBe(false);
  });
});

describe('pools filtrados (poolsFor)', () => {
  test('sem desbloqueio, Relíquias raras ficam fora do pool de ofertas', () => {
    const { relics } = poolsFor(computeUnlocks(DEFAULT_PROGRESSION));
    expect(relics.some((relic) => relic.rarity === 'rare')).toBe(false);
    expect(relics.filter((relic) => relic.rarity === 'common')).toHaveLength(
      RELIC_POOL.filter((relic) => relic.rarity === 'common').length,
    );
  });

  test('com desbloqueio, as raras entram no pool', () => {
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      claimedOptions: ['unlock-rare-relics'],
    };
    const { relics } = poolsFor(computeUnlocks(p));
    expect(relics.some((relic) => relic.rarity === 'rare')).toBe(true);
  });

  test('o pool de Efeitos bônus só entra conforme reivindicado', () => {
    const base = poolsFor(computeUnlocks(DEFAULT_PROGRESSION)).forgeEffects;
    expect(base).toHaveLength(8);
    const one: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      claimedOptions: ['value-bonus-7'],
    };
    expect(poolsFor(computeUnlocks(one)).forgeEffects).toHaveLength(9);
    const all = poolsFor(ALL_UNLOCKS).forgeEffects;
    expect(all).toHaveLength(8 + BONUS_FORGE_EFFECTS.length);
  });
});

describe('integração com a Run (startRun e ofertas)', () => {
  test('startRun recusa um Forjador bloqueado pela meta-progressão', () => {
    const unlocks = computeUnlocks(DEFAULT_PROGRESSION);
    expect(() => startRun(1, { forger: 'hammer', unlocks })).toThrow();
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      claimedOptions: ['unlock-forger-hammer'],
    };
    expect(startRun(1, { forger: 'hammer', unlocks: computeUnlocks(p) }).forger).toBe('hammer');
  });

  test('sem desbloqueio de raras, nenhuma oferta de Forja é rara (em vários seeds)', () => {
    const unlocks = computeUnlocks(DEFAULT_PROGRESSION);
    const { relics } = poolsFor(unlocks);
    for (let seed = 0; seed < 40; seed += 1) {
      const offers = generateForgeOffers(createSeededRng(seed), [], { relics });
      for (const offer of offers) {
        if (offer.type === 'relic') {
          expect(offer.relic.rarity).toBe('common');
        }
      }
    }
  });

  test('ofertas da Run respeitam o pool filtrado: nada de conteúdo bloqueado', () => {
    const run = makeRoundSixRun(computeUnlocks(DEFAULT_PROGRESSION));
    const { run: won } = makePlay(run, QUAD_TENS, createSeededRng(1));
    for (const offer of won.forgeOffers) {
      if (offer.type === 'relic') {
        expect(offer.relic.rarity).toBe('common');
      }
    }
  });
});

describe('persistência via port injetado', () => {
  test('salvar e carregar preserva a meta-progressão', () => {
    const storage = createMemoryProgressionStorage();
    const p: typeof DEFAULT_PROGRESSION = {
      stats: statsWith({ runsWon: 3, bestRunScore: 1200 }),
      claimedOptions: ['unlock-forger-hammer', 'unlock-forger-anvil'],
    };
    storage.save(p);
    expect(storage.load()).toEqual(p);
  });

  test('storage vazio devolve null', () => {
    expect(createMemoryProgressionStorage().load()).toBeNull();
  });
});

describe('utilidades de exibição', () => {
  test('milestoneOptionTitle resolve títulos e cai no id para desconhecidos', () => {
    expect(milestoneOptionTitle('unlock-forger-hammer')).toBe('Hammer forger');
    expect(milestoneOptionTitle('nao-existe')).toBe('nao-existe');
  });

  test('unlockStatuses marca claimed/available por opção', () => {
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ runsWon: 5 }),
      claimedOptions: ['unlock-forger-hammer', 'unlock-forger-anvil'],
    };
    const statuses = unlockStatuses(p);
    const hammer = statuses.find((status) => status.option.id === 'unlock-forger-hammer');
    const effect = statuses.find((status) => status.option.id === 'value-bonus-7');
    expect(hammer?.claimed).toBe(true);
    expect(effect?.available).toBe(true);
  });
});

/** Run na Rodada 6 com Mão vencedora (quadra de 10s ≥ Meta) e os unlocks dados. */
function makeRoundSixRun(unlocks: UnlocksState): RunState {
  const run = startRun(0, { unlocks });
  return {
    ...run,
    roundNumber: 6,
    target: 50,
    deck: {
      drawPile: [],
      discardPile: [],
      hand: QUAD_TENS,
      discardsRemaining: 2,
    },
    playsRemaining: PLAYS_PER_ROUND,
  };
}
