import {
  canPlayDaily,
  canWatchExtraAd,
  consumeDailyAttempt,
  createDeviceId,
  createInitialDailyAttempts,
  createMemoryDailyChallengeStorage,
  createUnavailableDailyBackend,
  DailyAttempts,
  DAILY_FREE_ATTEMPTS,
  dailyAttemptsForDay,
  dailyCallToActionState,
  hasFreeAttempt,
  unlockExtraAttempt,
  utcDateIso,
  withBestSubmitted,
} from './daily';

describe('tentativas do Desafio Diário', () => {
  test('dia novo começa com 1 tentativa gratuita, sem extra', () => {
    const state = createInitialDailyAttempts('2026-08-11');
    expect(state.attemptsUsed).toBe(0);
    expect(state.unlockedTotal).toBe(DAILY_FREE_ATTEMPTS);
    expect(hasFreeAttempt(state)).toBe(true);
    expect(canPlayDaily(state)).toBe(true);
    expect(canWatchExtraAd(state)).toBe(false); // ainda tem a gratuita
  });

  test('usar a gratuita consome a tentativa e trava a próxima sem anúncio', () => {
    let state = createInitialDailyAttempts('2026-08-11');
    state = consumeDailyAttempt(state);
    expect(state.attemptsUsed).toBe(1);
    expect(hasFreeAttempt(state)).toBe(false);
    expect(canPlayDaily(state)).toBe(false); // extra ainda não liberada
    expect(canWatchExtraAd(state)).toBe(true); // agora o anúncio faz sentido
  });

  test('o anúncio libera mais uma tentativa e trava o próximo anúncio até ela ser jogada', () => {
    let state = createInitialDailyAttempts('2026-08-11');
    state = consumeDailyAttempt(state);
    state = unlockExtraAttempt(state);
    expect(state.unlockedTotal).toBe(2);
    expect(canPlayDaily(state)).toBe(true);
    expect(canWatchExtraAd(state)).toBe(false); // já tem uma liberada, não jogada
    state = consumeDailyAttempt(state);
    expect(canPlayDaily(state)).toBe(false);
    expect(canWatchExtraAd(state)).toBe(true); // jogou, pode assistir de novo
  });

  test('vários ciclos de anúncio → Run → anúncio → Run não têm teto', () => {
    let state = createInitialDailyAttempts('2026-08-11');
    for (let ciclo = 0; ciclo < 5; ciclo += 1) {
      state = consumeDailyAttempt(state); // joga a tentativa disponível
      expect(canWatchExtraAd(state)).toBe(true);
      state = unlockExtraAttempt(state); // assiste o anúncio
      expect(canWatchExtraAd(state)).toBe(false); // não pode assistir outro sem jogar
      expect(canPlayDaily(state)).toBe(true);
    }
    expect(state.attemptsUsed).toBe(5);
    expect(state.unlockedTotal).toBe(6);
  });

  test('rollover de dia zera as tentativas e mantém o melhor do dia passado', () => {
    let state = withBestSubmitted(
      consumeDailyAttempt(consumeDailyAttempt(unlockExtraAttempt(createInitialDailyAttempts('2026-08-11')))),
      1200,
    );
    state = dailyAttemptsForDay(state, '2026-08-12');
    expect(state.attemptsUsed).toBe(0);
    expect(state.unlockedTotal).toBe(DAILY_FREE_ATTEMPTS);
    expect(state.bestSubmitted).toBeNull();
    expect(canPlayDaily(state)).toBe(true);
  });

  test('mesmo dia não zera o estado', () => {
    const state = dailyAttemptsForDay(
      { date: '2026-08-11', attemptsUsed: 2, unlockedTotal: 3, bestSubmitted: 900 },
      '2026-08-11',
    );
    expect(state.attemptsUsed).toBe(2);
    expect(state.unlockedTotal).toBe(3);
  });

  test('estado do mesmo dia sem unlockedTotal (formato anterior, extraUnlocked) é normalizado, não trava o dia', () => {
    // Simula dado persistido antes deste campo existir (era extraUnlocked:
    // boolean) — cast explícito porque o formato antigo não compila mais.
    const legacy = {
      date: '2026-08-11',
      attemptsUsed: 1,
      extraUnlocked: false,
      bestSubmitted: null,
    } as unknown as DailyAttempts;
    const state = dailyAttemptsForDay(legacy, '2026-08-11');
    expect(state.unlockedTotal).toBe(DAILY_FREE_ATTEMPTS);
    expect(state.attemptsUsed).toBe(1);
    expect(canWatchExtraAd(state)).toBe(true);
  });

  test('withBestSubmitted é monótono', () => {
    let state = createInitialDailyAttempts('2026-08-11');
    state = withBestSubmitted(state, 800);
    state = withBestSubmitted(state, 300);
    expect(state.bestSubmitted).toBe(800);
  });
});

describe('dailyCallToActionState', () => {
  test.each<[string, DailyAttempts, ReturnType<typeof dailyCallToActionState>]>([
    [
      'gratuita disponível, nada usado',
      { date: '2026-08-11', attemptsUsed: 0, unlockedTotal: 1, bestSubmitted: null },
      'free-ready',
    ],
    [
      'gratuita usada, extra já liberada e não jogada',
      { date: '2026-08-11', attemptsUsed: 1, unlockedTotal: 2, bestSubmitted: null },
      'extra-ready',
    ],
    [
      'gratuita usada, sem extra liberada ainda',
      { date: '2026-08-11', attemptsUsed: 1, unlockedTotal: 1, bestSubmitted: null },
      'watch-ad',
    ],
    [
      'vários ciclos jogados, extra liberada e não jogada',
      { date: '2026-08-11', attemptsUsed: 5, unlockedTotal: 6, bestSubmitted: null },
      'extra-ready',
    ],
    [
      'vários ciclos jogados, aguardando novo anúncio',
      { date: '2026-08-11', attemptsUsed: 5, unlockedTotal: 5, bestSubmitted: null },
      'watch-ad',
    ],
  ])('%s', (_description, state, expected) => {
    expect(dailyCallToActionState(state)).toBe(expected);
  });

  test('transições ao longo de um ciclo completo (gratuita → anúncio → extra → jogada → anúncio)', () => {
    let state = createInitialDailyAttempts('2026-08-11');
    expect(dailyCallToActionState(state)).toBe('free-ready');

    state = consumeDailyAttempt(state);
    expect(dailyCallToActionState(state)).toBe('watch-ad');

    state = unlockExtraAttempt(state);
    expect(dailyCallToActionState(state)).toBe('extra-ready');

    state = consumeDailyAttempt(state);
    expect(dailyCallToActionState(state)).toBe('watch-ad');
  });
});

describe('utcDateIso e deviceId', () => {
  test('data UTC no formato YYYY-MM-DD', () => {
    expect(utcDateIso(new Date('2026-08-11T03:00:00Z'))).toBe('2026-08-11');
  });

  test('deviceId é um UUID v4', () => {
    const id = createDeviceId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(createDeviceId()).not.toBe(id);
  });
});

describe('ports', () => {
  test('storage em memória guarda tentativas e deviceId', () => {
    const storage = createMemoryDailyChallengeStorage();
    expect(storage.loadAttempts()).toBeNull();
    const state = createInitialDailyAttempts('2026-08-11');
    storage.saveAttempts(state);
    expect(storage.loadAttempts()).toEqual(state);
    storage.saveDeviceId('uuid-1');
    expect(storage.loadDeviceId()).toBe('uuid-1');
  });

  test('backend indisponível rejeita com mensagem clara', async () => {
    const backend = createUnavailableDailyBackend();
    await expect(backend.fetchSeed('2026-08-11')).rejects.toThrow('backend não configurado');
    await expect(backend.submitScore('dev', 100)).rejects.toThrow('backend não configurado');
    await expect(backend.fetchLeaderboard('dev')).rejects.toThrow('backend não configurado');
  });
});
