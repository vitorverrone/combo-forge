/**
 * Testes do fluxo do Desafio Diário (store/dailyFlow.ts) — a superfície de
 * teste do ciclo de vida completo, sem zustand: fronteira do dia, gate de
 * tentativas, cache do seed, anúncio recompensado, submissão e leaderboard.
 *
 * Os testes de integração do store (store/gameStore.test.ts) cobrem a ponte
 * store → fluxo; aqui o fluxo é exercitado direto pela interface.
 */

import {
  ALL_UNLOCKS,
  baseTarget,
  DailyBackend,
  DailyLeaderboard,
  DAILY_MAX_ATTEMPTS,
  createInitialDailyAttempts,
  createMemoryDailyChallengeStorage,
  utcDateIso,
} from '../engine';

import { DailyFlowDeps, DailyState, runDailyCommand } from './dailyFlow';

/** Data fixa do dia de referência dos testes (UTC). */
const TODAY = '2026-08-11';
const NOW = new Date(`${TODAY}T12:00:00Z`);

/** Backend fake: seed fixo e chamadas rastreáveis. */
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

/** Deps padrão: tudo em memória, relógio fixo no dia de referência. */
function makeDeps(overrides: Partial<DailyFlowDeps> = {}): DailyFlowDeps {
  return {
    storage: createMemoryDailyChallengeStorage(),
    backend: makeFakeDailyBackend(),
    adProvider: { requestRewardedAd: async () => true },
    now: () => NOW,
    ...overrides,
  };
}

/** Estado do Desafio padrão: dia de referência, sem nada consumido. */
function makeDailyState(overrides: Partial<DailyState> = {}): DailyState {
  return {
    attempts: createInitialDailyAttempts(TODAY),
    deviceId: 'device-1',
    seed: null,
    seedDate: '',
    status: 'idle',
    error: null,
    adLoading: false,
    submitStatus: 'idle',
    leaderboard: null,
    leaderboardLoading: false,
    leaderboardError: null,
    ...overrides,
  };
}

describe('runDailyCommand — start', () => {
  test('inicia a Run do dia (seed do backend, Forjador fixo, DDA off) e consome a gratuita', async () => {
    const storage = createMemoryDailyChallengeStorage();
    const deps = makeDeps({ storage });
    const result = await runDailyCommand(makeDailyState(), deps, { type: 'start' });
    expect(result.run).not.toBeNull();
    expect(result.run?.seed).toBe(424242);
    expect(result.run?.forger).toBe('apprentice');
    expect(result.run?.ddaConfig.enabled).toBe(false);
    expect(result.run?.unlocks).toEqual(ALL_UNLOCKS);
    // Meta na curva base (DDA off) e tentativa consumida e persistida.
    expect(result.run?.target).toBe(baseTarget(1));
    expect(result.daily.attempts.attemptsUsed).toBe(1);
    expect(result.daily.status).toBe('ready');
    expect(result.daily.seedDate).toBe(TODAY);
    expect(storage.loadAttempts()?.attemptsUsed).toBe(1);
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
    const deps = makeDeps({ backend });
    let state = makeDailyState();
    state = (await runDailyCommand(state, deps, { type: 'start' })).daily; // gratuita
    state = (await runDailyCommand(state, deps, { type: 'watchAd' })).daily; // libera a extra
    state = (await runDailyCommand(state, deps, { type: 'start' })).daily; // extra
    expect(fetches).toBe(1);
    expect(state.attempts.attemptsUsed).toBe(DAILY_MAX_ATTEMPTS);
  });

  test('sem tentativa disponível, não inicia Run nem muda as tentativas', async () => {
    const deps = makeDeps();
    const state = makeDailyState({
      attempts: { date: TODAY, attemptsUsed: DAILY_MAX_ATTEMPTS, extraUnlocked: true, bestSubmitted: null },
    });
    const result = await runDailyCommand(state, deps, { type: 'start' });
    expect(result.run).toBeNull();
    expect(result.daily.attempts.attemptsUsed).toBe(DAILY_MAX_ATTEMPTS);
  });

  test('falha do backend marca erro e não consome tentativa', async () => {
    const storage = createMemoryDailyChallengeStorage();
    const backend: DailyBackend = {
      ...makeFakeDailyBackend(),
      fetchSeed: async () => {
        throw new Error('rede fora');
      },
    };
    const deps = makeDeps({ storage, backend });
    const result = await runDailyCommand(makeDailyState(), deps, { type: 'start' });
    expect(result.run).toBeNull();
    expect(result.daily.status).toBe('error');
    expect(result.daily.error).toBe('rede fora');
    expect(result.daily.attempts.attemptsUsed).toBe(0);
    expect(storage.loadAttempts()?.attemptsUsed).toBe(0);
  });
});

describe('runDailyCommand — watchAd', () => {
  /** Estado com a gratuita já usada (pré-requisito do anúncio). */
  const usedFree = (): DailyState =>
    makeDailyState({
      attempts: { date: TODAY, attemptsUsed: 1, extraUnlocked: false, bestSubmitted: null },
    });

  test('assistir o anúncio libera a tentativa extra e persiste', async () => {
    const storage = createMemoryDailyChallengeStorage();
    const deps = makeDeps({ storage });
    const result = await runDailyCommand(usedFree(), deps, { type: 'watchAd' });
    expect(result.daily.attempts.extraUnlocked).toBe(true);
    expect(result.daily.adLoading).toBe(false);
    expect(storage.loadAttempts()?.extraUnlocked).toBe(true);
  });

  test('anúncio não assistido não libera a extra', async () => {
    const deps = makeDeps({ adProvider: { requestRewardedAd: async () => false } });
    const result = await runDailyCommand(usedFree(), deps, { type: 'watchAd' });
    expect(result.daily.attempts.extraUnlocked).toBe(false);
  });

  test('falha do anúncio não quebra nem libera a extra', async () => {
    const deps = makeDeps({
      adProvider: {
        requestRewardedAd: async () => {
          throw new Error('anúncio fora do ar');
        },
      },
    });
    const result = await runDailyCommand(usedFree(), deps, { type: 'watchAd' });
    // Fluxo intacto: sem recompensa, sem loading preso e sem tentativa gasta.
    expect(result.daily.attempts.extraUnlocked).toBe(false);
    expect(result.daily.adLoading).toBe(false);
    expect(result.daily.attempts.attemptsUsed).toBe(1);
  });
});

describe('runDailyCommand — rollover (fronteira de dia UTC)', () => {
  test('dia novo zera as tentativas e refaz o cache do seed', async () => {
    let now = NOW;
    const deps = makeDeps({ now: () => now });
    let state = makeDailyState();
    state = (await runDailyCommand(state, deps, { type: 'start' })).daily;
    state = (await runDailyCommand(state, deps, { type: 'watchAd' })).daily;
    state = (await runDailyCommand(state, deps, { type: 'start' })).daily;
    expect(state.attempts.attemptsUsed).toBe(DAILY_MAX_ATTEMPTS);
    // Dia seguinte: a gratuita volta e o seed do novo dia é buscado de novo.
    now = new Date('2026-08-12T12:00:00Z');
    const nextDay = await runDailyCommand(state, deps, { type: 'start' });
    expect(nextDay.run).not.toBeNull();
    expect(nextDay.daily.attempts.attemptsUsed).toBe(1);
    expect(nextDay.daily.seedDate).toBe('2026-08-12');
  });
});

describe('runDailyCommand — submit', () => {
  const submittedState = (): DailyState =>
    makeDailyState({
      attempts: { date: TODAY, attemptsUsed: 1, extraUnlocked: false, bestSubmitted: null },
    });

  test('submete com o deviceId do dispositivo, registra a melhor pontuação e persiste', async () => {
    const storage = createMemoryDailyChallengeStorage();
    const backend = makeFakeDailyBackend();
    const deps = makeDeps({ storage, backend });
    const first = await runDailyCommand(submittedState(), deps, { type: 'submit', score: 100 });
    expect(first.daily.submitStatus).toBe('submitted');
    expect(first.daily.attempts.bestSubmitted).toBe(100);
    expect(storage.loadAttempts()?.bestSubmitted).toBe(100);
    expect(backend.submissions).toEqual([{ deviceId: 'device-1', score: 100 }]);
    // Re-submissão bloqueada (já submitted): nem o backend é chamado de novo.
    const second = await runDailyCommand(first.daily, deps, { type: 'submit', score: 50 });
    expect(second.daily).toBe(first.daily);
    expect(backend.submissions).toHaveLength(1);
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
    const deps = makeDeps({ backend });
    const failed = await runDailyCommand(submittedState(), deps, { type: 'submit', score: 100 });
    expect(failed.daily.submitStatus).toBe('failed');
    fail = false;
    const retried = await runDailyCommand(failed.daily, deps, { type: 'submit', score: 100 });
    expect(retried.daily.submitStatus).toBe('submitted');
    expect(retried.daily.attempts.bestSubmitted).toBe(100);
  });
});

describe('runDailyCommand — fetchLeaderboard', () => {
  test('guarda a resposta (posição própria + top 10)', async () => {
    const deps = makeDeps();
    const result = await runDailyCommand(makeDailyState(), deps, { type: 'fetchLeaderboard' });
    expect(result.daily.leaderboard?.own?.score).toBe(4242);
    expect(result.daily.leaderboard?.top).toHaveLength(1);
    expect(result.daily.leaderboardLoading).toBe(false);
  });

  test('falha do backend aparece no estado', async () => {
    const deps = makeDeps({
      backend: {
        ...makeFakeDailyBackend(),
        fetchLeaderboard: async () => {
          throw new Error('sem leaderboard');
        },
      },
    });
    const result = await runDailyCommand(makeDailyState(), deps, { type: 'fetchLeaderboard' });
    expect(result.daily.leaderboardError).toBe('sem leaderboard');
    expect(result.daily.leaderboard).toBeNull();
    expect(result.daily.leaderboardLoading).toBe(false);
  });
});

describe('rollover também vale para comandos sem mutação', () => {
  test('watchAd em dia novo rola as tentativas no estado (display consistente)', async () => {
    // Mesmo dia anterior com tentativas esgotadas; hoje é um dia novo.
    const deps = makeDeps({ now: () => NOW });
    const stale = makeDailyState({
      attempts: { date: '2026-08-10', attemptsUsed: DAILY_MAX_ATTEMPTS, extraUnlocked: true, bestSubmitted: 500 },
    });
    const result = await runDailyCommand(stale, deps, { type: 'watchAd' });
    // Ainda sem gate para anúncio (gratuita não usada hoje), mas o estado já
    // reflete o dia atual — o invariante vale no seam, não só após mutação.
    expect(result.daily.attempts.date).toBe(TODAY);
    expect(utcDateIso(NOW)).toBe(TODAY);
  });
});
