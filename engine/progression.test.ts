import { Card, cardKey, SUITS } from './cards';
import { BONUS_FORGE_EFFECTS, generateForgeOffers } from './forge';
import { createSeededRng } from './random';
import { RELIC_POOL } from './relics';
import {
  ALL_UNLOCKS,
  applyUnlockKind,
  claimOption,
  claimReachedSingles,
  computeUnlocks,
  createMemoryProgressionStorage,
  DEFAULT_PROFILE_STATS,
  DEFAULT_PROGRESSION,
  isForgerUnlocked,
  isOptionClaimable,
  MILESTONES,
  milestoneOptionTitle,
  normalizeProgression,
  pendingMilestones,
  PersistedProgression,
  poolsFor,
  recordDailySubmission,
  recordPlay,
  recordRunEnd,
  unlockStatuses,
  UnlocksDraft,
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
    const won = recordRunEnd(recordRunEnd(DEFAULT_PROFILE_STATS, false, 120, 'apprentice'), true, 2600, 'apprentice');
    expect(won.runsStarted).toBe(2);
    expect(won.runsWon).toBe(1);
    expect(won.bestRunScore).toBe(2600);
    const noRecord = recordRunEnd(won, false, 90, 'apprentice');
    expect(noRecord.bestRunScore).toBe(2600);
  });

  test('recordRunEnd incrementa winsByForger só em vitória, e só do Forjador certo', () => {
    let stats = recordRunEnd(DEFAULT_PROFILE_STATS, true, 500, 'hammer');
    expect(stats.winsByForger).toEqual({ apprentice: 0, hammer: 1, anvil: 0 });
    stats = recordRunEnd(stats, false, 300, 'hammer'); // derrota não altera
    expect(stats.winsByForger.hammer).toBe(1);
    stats = recordRunEnd(stats, true, 700, 'hammer'); // 2ª vitória com o mesmo Forjador incrementa, não duplica
    expect(stats.winsByForger.hammer).toBe(2);
    stats = recordRunEnd(stats, true, 400, 'anvil');
    expect(stats.winsByForger).toEqual({ apprentice: 0, hammer: 2, anvil: 1 });
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

  test('applyUnlockKind trata kind "title" como no-op — não concede forger/efeito/rareRelics (ADR 0009)', () => {
    const draft: UnlocksDraft = { forgers: ['apprentice'], extraEffects: [], rareRelics: false };
    applyUnlockKind(draft, { kind: 'title' });
    expect(draft).toEqual({ forgers: ['apprentice'], extraEffects: [], rareRelics: false });
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

describe('normalizeProgression (saves antigos — ADR 0009)', () => {
  test('sem save (null) devolve o estado inicial', () => {
    expect(normalizeProgression(null)).toEqual(DEFAULT_PROGRESSION);
  });

  test('save com stats parcial (campo novo ausente) recebe os defaults sem perder o resto', () => {
    const oldSave = {
      stats: { runsWon: 3, bestRunScore: 1200 },
      claimedOptions: ['unlock-forger-hammer'],
    } as unknown as PersistedProgression;
    const normalized = normalizeProgression(oldSave);
    expect(normalized.stats.runsWon).toBe(3);
    expect(normalized.stats.bestRunScore).toBe(1200);
    expect(normalized.stats.runsStarted).toBe(DEFAULT_PROFILE_STATS.runsStarted);
    expect(normalized.stats.maxMultiplier).toBe(DEFAULT_PROFILE_STATS.maxMultiplier);
    expect(normalized.claimedOptions).toEqual(['unlock-forger-hammer']);
  });

  test('save completo passa sem alteração', () => {
    const p: PersistedProgression = {
      stats: statsWith({ runsWon: 5 }),
      claimedOptions: ['unlock-forger-hammer'],
    };
    expect(normalizeProgression(p)).toEqual(p);
  });
});

describe('Títulos: Vitórias, Recorde de Pontuação, Multiplicador e Maestria de Baralho (ticket 02, ADR 0009)', () => {
  test.each([
    ['run10Won', 'runsWon', 10] as const,
    ['run15Won', 'runsWon', 15] as const,
    ['run25Won', 'runsWon', 25] as const,
    ['scoreRecord4000', 'bestRunScore', 4000] as const,
    ['scoreRecord6000', 'bestRunScore', 6000] as const,
    ['scoreRecord9000', 'bestRunScore', 9000] as const,
    ['multiplierRecord8', 'maxMultiplier', 8] as const,
    ['multiplierRecord12', 'maxMultiplier', 12] as const,
  ])('%s: condição falsa abaixo do limiar, verdadeira no limiar exato e acima dele', (id, field, threshold) => {
    const milestone = MILESTONES.find((m) => m.id === id);
    expect(milestone).toBeDefined();
    expect(milestone?.condition(statsWith({ [field]: threshold - 1 }))).toBe(false);
    expect(milestone?.condition(statsWith({ [field]: threshold }))).toBe(true);
    expect(milestone?.condition(statsWith({ [field]: threshold + 1 }))).toBe(true);
  });

  const allCardKeys = SUITS.flatMap((suit) =>
    Array.from({ length: 10 }, (_, i) => cardKey({ suit, value: i + 1 })),
  );
  const fortyCardPlays = Object.fromEntries(allCardKeys.map((key) => [key, 1]));

  test('deckMastery: falso com 39 cartas distintas jogadas, verdadeiro com as 40', () => {
    const milestone = MILESTONES.find((m) => m.id === 'deckMastery');
    expect(allCardKeys).toHaveLength(40);
    const thirtyNine = Object.fromEntries(allCardKeys.slice(0, 39).map((key) => [key, 1]));
    expect(milestone?.condition(statsWith({ cardPlays: thirtyNine }))).toBe(false);
    expect(milestone?.condition(statsWith({ cardPlays: fortyCardPlays }))).toBe(true);
  });

  test('cada Título é reivindicado automaticamente (opção única) e não concede poder', () => {
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ runsWon: 25, bestRunScore: 9000, maxMultiplier: 12, cardPlays: fortyCardPlays }),
    };
    const result = claimReachedSingles(p);
    const titleOptionIds = [
      'title-seasoned-smith',
      'title-veteran-smith',
      'title-forge-legend',
      'title-high-scorer',
      'title-score-breaker',
      'title-mythic-forge',
      'title-full-deck',
      'title-chain-master',
      'title-unstoppable-chain',
    ];
    for (const optionId of titleOptionIds) {
      expect(result.claimed).toContain(optionId);
    }
    const unlocks = computeUnlocks(result.persisted);
    // Os poderes vêm dos marcos originais (1ª/3ª vitória, recorde ≥ 2.500),
    // não dos Títulos — que não concedem Forjador/Efeito/Relíquia nenhum.
    expect(unlocks.forgers).toEqual(['apprentice', 'hammer', 'anvil']);
    expect(unlocks.rareRelics).toBe(true);
    expect(unlocks.extraEffects).toEqual([]);
  });
});

describe('Título: Maestria de Forjador (ticket 03, ADR 0009)', () => {
  test('condição falsa com 0 Forjadores vencidos', () => {
    const milestone = MILESTONES.find((m) => m.id === 'forgerMastery');
    expect(milestone?.condition(statsWith())).toBe(false);
  });

  test('condição falsa com só 1 dos 3 Forjadores vencidos', () => {
    const milestone = MILESTONES.find((m) => m.id === 'forgerMastery');
    const stats = statsWith({ winsByForger: { apprentice: 3, hammer: 0, anvil: 0 } });
    expect(milestone?.condition(stats)).toBe(false);
  });

  test('condição verdadeira só quando os 3 Forjadores têm ao menos 1 vitória', () => {
    const milestone = MILESTONES.find((m) => m.id === 'forgerMastery');
    const stats = statsWith({ winsByForger: { apprentice: 1, hammer: 1, anvil: 1 } });
    expect(milestone?.condition(stats)).toBe(true);
  });

  test('reivindicado automaticamente (opção única) e não concede poder', () => {
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ winsByForger: { apprentice: 2, hammer: 1, anvil: 1 } }),
    };
    const result = claimReachedSingles(p);
    expect(result.claimed).toContain('title-triple-forger');
    const unlocks = computeUnlocks(result.persisted);
    expect(unlocks.forgers).toEqual(['apprentice']); // nenhum marco de poder atingido aqui
    expect(unlocks.rareRelics).toBe(false);
    expect(unlocks.extraEffects).toEqual([]);
  });
});

describe('Sequência do Desafio Diário (recordDailySubmission, ADR 0010, ticket 01)', () => {
  test('primeira submissão começa a Sequência em 1', () => {
    const stats = recordDailySubmission(DEFAULT_PROFILE_STATS, '2026-09-04');
    expect(stats.dailyStreakCurrent).toBe(1);
    expect(stats.dailyStreakBest).toBe(1);
    expect(stats.dailyStreakLastDate).toBe('2026-09-04');
  });

  test('dia seguinte incrementa a Sequência', () => {
    let stats = recordDailySubmission(DEFAULT_PROFILE_STATS, '2026-09-04');
    stats = recordDailySubmission(stats, '2026-09-05');
    expect(stats.dailyStreakCurrent).toBe(2);
    expect(stats.dailyStreakBest).toBe(2);
  });

  test('resubmissão no mesmo dia não altera a Sequência', () => {
    let stats = recordDailySubmission(DEFAULT_PROFILE_STATS, '2026-09-04');
    const resubmitted = recordDailySubmission(stats, '2026-09-04');
    expect(resubmitted).toEqual(stats);
  });

  test('pular um dia reinicia a Sequência em 1, mas preserva o recorde histórico', () => {
    let stats = recordDailySubmission(DEFAULT_PROFILE_STATS, '2026-09-01');
    stats = recordDailySubmission(stats, '2026-09-02');
    stats = recordDailySubmission(stats, '2026-09-03'); // Sequência de 3, recorde 3
    expect(stats.dailyStreakBest).toBe(3);
    stats = recordDailySubmission(stats, '2026-09-05'); // pulou o dia 4
    expect(stats.dailyStreakCurrent).toBe(1);
    expect(stats.dailyStreakBest).toBe(3); // recorde não decresce
  });

  test('atravessa a virada de mês corretamente (dia seguinte de 31 é dia 1)', () => {
    let stats = recordDailySubmission(DEFAULT_PROFILE_STATS, '2026-08-31');
    stats = recordDailySubmission(stats, '2026-09-01');
    expect(stats.dailyStreakCurrent).toBe(2);
  });

  test('uma nova Sequência que supera o recorde antigo atualiza dailyStreakBest de novo', () => {
    let stats = recordDailySubmission(DEFAULT_PROFILE_STATS, '2026-09-01');
    stats = recordDailySubmission(stats, '2026-09-02'); // Sequência 2, recorde 2
    stats = recordDailySubmission(stats, '2026-09-10'); // pulou vários dias, reinicia em 1
    expect(stats.dailyStreakCurrent).toBe(1);
    expect(stats.dailyStreakBest).toBe(2);
    stats = recordDailySubmission(stats, '2026-09-11');
    stats = recordDailySubmission(stats, '2026-09-12'); // Sequência 3, supera o recorde
    expect(stats.dailyStreakCurrent).toBe(3);
    expect(stats.dailyStreakBest).toBe(3);
  });
});

describe('Títulos: Sequência do Desafio Diário (ADR 0010, ticket 01)', () => {
  test.each([
    ['dailyStreak3', 3] as const,
    ['dailyStreak7', 7] as const,
    ['dailyStreak15', 15] as const,
    ['dailyStreak30', 30] as const,
  ])('%s: condição falsa abaixo do limiar, verdadeira no limiar exato e acima dele', (id, threshold) => {
    const milestone = MILESTONES.find((m) => m.id === id);
    expect(milestone).toBeDefined();
    expect(milestone?.condition(statsWith({ dailyStreakBest: threshold - 1 }))).toBe(false);
    expect(milestone?.condition(statsWith({ dailyStreakBest: threshold }))).toBe(true);
    expect(milestone?.condition(statsWith({ dailyStreakBest: threshold + 1 }))).toBe(true);
  });

  test('cada Título de Sequência é reivindicado automaticamente (opção única) e não concede poder', () => {
    const p: typeof DEFAULT_PROGRESSION = {
      ...DEFAULT_PROGRESSION,
      stats: statsWith({ dailyStreakBest: 30 }),
    };
    const result = claimReachedSingles(p);
    const titleOptionIds = [
      'title-daily-spark',
      'title-weekly-ritual',
      'title-steady-hammer',
      'title-unbroken-forge',
    ];
    for (const optionId of titleOptionIds) {
      expect(result.claimed).toContain(optionId);
    }
    const unlocks = computeUnlocks(result.persisted);
    expect(unlocks.forgers).toEqual(['apprentice']);
    expect(unlocks.rareRelics).toBe(false);
    expect(unlocks.extraEffects).toEqual([]);
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
