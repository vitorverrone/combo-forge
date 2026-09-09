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
  readonly displayNameCalls: { deviceId: string; name: string }[];
} {
  const submissions: { deviceId: string; score: number }[] = [];
  const displayNameCalls: { deviceId: string; name: string }[] = [];
  return {
    submissions,
    displayNameCalls,
    fetchSeed: async () => seed,
    submitScore: async (deviceId, score) => {
      submissions.push({ deviceId, score });
      return score;
    },
    fetchLeaderboard: async (): Promise<DailyLeaderboard> => ({
      week: '2026-08-10',
      own: { rank: 1, score: 4242, name: 'Fulano' },
      top: [{ rank: 1, score: 4242, name: 'Fulano' }],
    }),
    fetchLeagueLeaderboard: async () => null, // Liga inativa por padrão nos testes — ver dailyFlow.test.ts "Liga" abaixo
    setDisplayName: async (deviceId, name) => {
      displayNameCalls.push({ deviceId, name });
      return name;
    },
  };
}

/** Deps padrão: tudo em memória, relógio fixo no dia de referência. */
function makeDeps(overrides: Partial<DailyFlowDeps> = {}): DailyFlowDeps {
  return {
    storage: createMemoryDailyChallengeStorage(),
    backend: makeFakeDailyBackend(),
    adProvider: { requestRewardedAd: async () => true, requestInterstitialAd: async () => true },
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
    league: null,
    leaderboardLoading: false,
    leaderboardError: null,
    displayName: null,
    displayNameStatus: 'idle',
    displayNameError: null,
    dailyOnboardingSeen: false,
    pendingPlayIntent: false,
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
    expect(state.attempts.attemptsUsed).toBe(2);
  });

  test('sem tentativa disponível (liberada já jogada), não inicia Run nem muda as tentativas', async () => {
    const deps = makeDeps();
    const state = makeDailyState({
      attempts: { date: TODAY, attemptsUsed: 2, unlockedTotal: 2, bestSubmitted: null },
    });
    const result = await runDailyCommand(state, deps, { type: 'start' });
    expect(result.run).toBeNull();
    expect(result.daily.attempts.attemptsUsed).toBe(2);
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

describe('runDailyCommand — requestPlay (ticket 02)', () => {
  test('com displayName já salvo: inicia a Run igual a start', async () => {
    const deps = makeDeps();
    const result = await runDailyCommand(makeDailyState({ displayName: 'Fulano' }), deps, {
      type: 'requestPlay',
    });
    expect(result.run).not.toBeNull();
    expect(result.daily.attempts.attemptsUsed).toBe(1);
    expect(result.daily.pendingPlayIntent).toBe(false);
  });

  test('sem displayName: não inicia Run, não mexe em tentativas, marca pendingPlayIntent', async () => {
    const deps = makeDeps();
    const result = await runDailyCommand(makeDailyState({ displayName: null }), deps, {
      type: 'requestPlay',
    });
    expect(result.run).toBeNull();
    expect(result.daily.attempts.attemptsUsed).toBe(0);
    expect(result.daily.pendingPlayIntent).toBe(true);
  });
});

describe('runDailyCommand — watchAd', () => {
  /** Estado com a gratuita já usada (pré-requisito do anúncio). */
  const usedFree = (): DailyState =>
    makeDailyState({
      attempts: { date: TODAY, attemptsUsed: 1, unlockedTotal: 1, bestSubmitted: null },
    });

  test('assistir o anúncio libera mais uma tentativa e persiste', async () => {
    const storage = createMemoryDailyChallengeStorage();
    const deps = makeDeps({ storage });
    const result = await runDailyCommand(usedFree(), deps, { type: 'watchAd' });
    expect(result.daily.attempts.unlockedTotal).toBe(2);
    expect(result.daily.adLoading).toBe(false);
    expect(storage.loadAttempts()?.unlockedTotal).toBe(2);
  });

  test('assistir vários anúncios em sequência (um por Run jogada entre eles) não tem teto', async () => {
    const storage = createMemoryDailyChallengeStorage();
    const deps = makeDeps({ storage });
    let state = usedFree();
    for (let ciclo = 0; ciclo < 4; ciclo += 1) {
      const watched = await runDailyCommand(state, deps, { type: 'watchAd' });
      expect(watched.daily.attempts.unlockedTotal).toBe(state.attempts.unlockedTotal + 1);
      const played = await runDailyCommand(watched.daily, deps, { type: 'start' });
      expect(played.run).not.toBeNull();
      state = played.daily;
    }
    expect(state.attempts.attemptsUsed).toBe(5);
    expect(state.attempts.unlockedTotal).toBe(5);
  });

  test('anúncio não assistido não libera tentativa extra', async () => {
    const deps = makeDeps({ adProvider: { requestRewardedAd: async () => false, requestInterstitialAd: async () => false } });
    const result = await runDailyCommand(usedFree(), deps, { type: 'watchAd' });
    expect(result.daily.attempts.unlockedTotal).toBe(1);
  });

  test('falha do anúncio não quebra nem libera tentativa extra', async () => {
    const deps = makeDeps({
      adProvider: {
        requestRewardedAd: async () => {
          throw new Error('anúncio fora do ar');
        },
        requestInterstitialAd: async () => false,
      },
    });
    const result = await runDailyCommand(usedFree(), deps, { type: 'watchAd' });
    // Fluxo intacto: sem recompensa, sem loading preso e sem tentativa gasta.
    expect(result.daily.attempts.unlockedTotal).toBe(1);
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
    expect(state.attempts.attemptsUsed).toBe(2);
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
      attempts: { date: TODAY, attemptsUsed: 1, unlockedTotal: 1, bestSubmitted: null },
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

describe('runDailyCommand — fetchLeaderboard: Liga (ADR 0010, ticket 02)', () => {
  test('Liga ativa: guarda a posição na Liga e não busca o leaderboard único', async () => {
    let globalLeaderboardCalls = 0;
    const deps = makeDeps({
      backend: {
        ...makeFakeDailyBackend(),
        fetchLeaderboard: async () => {
          globalLeaderboardCalls += 1;
          throw new Error('não deveria ser chamado com a Liga ativa');
        },
        fetchLeagueLeaderboard: async () => ({
          week: '2026-08-10',
          tier: 'silver',
          division: 2,
          own: { rank: 34, score: 1200, name: 'Ana' },
          top: [{ rank: 34, score: 1200, name: 'Ana' }],
        }),
      },
    });
    const result = await runDailyCommand(makeDailyState(), deps, { type: 'fetchLeaderboard' });
    expect(result.daily.league?.tier).toBe('silver');
    expect(result.daily.league?.division).toBe(2);
    expect(result.daily.leaderboard).toBeNull();
    expect(result.daily.leaderboardLoading).toBe(false);
    expect(globalLeaderboardCalls).toBe(0);
  });

  test('Liga inativa (null): cai de volta para o leaderboard único e limpa a Liga', async () => {
    const deps = makeDeps({
      backend: {
        ...makeFakeDailyBackend(),
        fetchLeagueLeaderboard: async () => null,
      },
    });
    const result = await runDailyCommand(
      makeDailyState({ league: { week: '2026-08-03', tier: 'gold', division: 1, own: null, top: [] } }),
      deps,
      { type: 'fetchLeaderboard' },
    );
    expect(result.daily.league).toBeNull();
    expect(result.daily.leaderboard?.own?.score).toBe(4242);
  });
});

describe('runDailyCommand — setDisplayName (ticket 02)', () => {
  test('nome válido: chama o backend, persiste e atualiza o estado', async () => {
    const storage = createMemoryDailyChallengeStorage();
    const backend = makeFakeDailyBackend();
    const deps = makeDeps({ storage, backend });
    const result = await runDailyCommand(makeDailyState({ deviceId: 'device-9' }), deps, {
      type: 'setDisplayName',
      name: 'Fulano',
    });
    expect(result.daily.displayName).toBe('Fulano');
    expect(result.daily.displayNameStatus).toBe('idle');
    expect(result.daily.displayNameError).toBeNull();
    expect(backend.displayNameCalls).toEqual([{ deviceId: 'device-9', name: 'Fulano' }]);
    expect(storage.loadDisplayName()).toBe('Fulano');
    expect(result.run).toBeNull(); // sem pendingPlayIntent: só salva o nome, não inicia Run
  });

  test('com pendingPlayIntent (tocou em jogar sem nome): salvar o nome também inicia a Run e zera o flag', async () => {
    const deps = makeDeps();
    const result = await runDailyCommand(makeDailyState({ pendingPlayIntent: true }), deps, {
      type: 'setDisplayName',
      name: 'Fulano',
    });
    expect(result.daily.displayName).toBe('Fulano');
    expect(result.daily.pendingPlayIntent).toBe(false);
    expect(result.run).not.toBeNull();
    expect(result.daily.attempts.attemptsUsed).toBe(1);
  });

  test('com pendingPlayIntent e nome inválido: não inicia Run, flag continua pendente', async () => {
    const deps = makeDeps();
    const result = await runDailyCommand(makeDailyState({ pendingPlayIntent: true }), deps, {
      type: 'setDisplayName',
      name: 'ab',
    });
    expect(result.daily.displayName).toBeNull();
    expect(result.daily.pendingPlayIntent).toBe(true);
    expect(result.run).toBeNull();
  });

  test('nome inválido no cliente: rejeita sem chamar o backend (sem round-trip de rede)', async () => {
    const backend = makeFakeDailyBackend();
    const deps = makeDeps({ backend });
    const result = await runDailyCommand(makeDailyState(), deps, { type: 'setDisplayName', name: 'ab' });
    expect(result.daily.displayName).toBeNull();
    expect(result.daily.displayNameStatus).toBe('error');
    expect(result.daily.displayNameError).not.toBeNull();
    expect(backend.displayNameCalls).toHaveLength(0);
  });

  test('nome válido no cliente mas rejeitado pelo servidor: erro do servidor aparece no estado', async () => {
    const deps = makeDeps({
      backend: {
        ...makeFakeDailyBackend(),
        setDisplayName: async () => {
          throw new Error('invalid_display_name: prohibited term');
        },
      },
    });
    const result = await runDailyCommand(makeDailyState(), deps, {
      type: 'setDisplayName',
      name: 'Fulano',
    });
    expect(result.daily.displayName).toBeNull();
    expect(result.daily.displayNameStatus).toBe('error');
    expect(result.daily.displayNameError).toBe('invalid_display_name: prohibited term');
  });

  test('falha de rede: erro aparece no estado, nada é persistido', async () => {
    const storage = createMemoryDailyChallengeStorage();
    const deps = makeDeps({
      storage,
      backend: {
        ...makeFakeDailyBackend(),
        setDisplayName: async () => {
          throw new Error('network request failed');
        },
      },
    });
    const result = await runDailyCommand(makeDailyState(), deps, {
      type: 'setDisplayName',
      name: 'Fulano',
    });
    expect(result.daily.displayNameStatus).toBe('error');
    expect(result.daily.displayNameError).toBe('network request failed');
    expect(storage.loadDisplayName()).toBeNull();
  });
});

describe('rollover também vale para comandos sem mutação', () => {
  test('watchAd em dia novo rola as tentativas no estado (display consistente)', async () => {
    // Mesmo dia anterior com tentativas esgotadas; hoje é um dia novo.
    const deps = makeDeps({ now: () => NOW });
    const stale = makeDailyState({
      attempts: { date: '2026-08-10', attemptsUsed: 2, unlockedTotal: 2, bestSubmitted: 500 },
    });
    const result = await runDailyCommand(stale, deps, { type: 'watchAd' });
    // Ainda sem gate para anúncio (gratuita não usada hoje), mas o estado já
    // reflete o dia atual — o invariante vale no seam, não só após mutação.
    expect(result.daily.attempts.date).toBe(TODAY);
    expect(utcDateIso(NOW)).toBe(TODAY);
  });
});
