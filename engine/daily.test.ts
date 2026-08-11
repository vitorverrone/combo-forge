import {
  canPlayDaily,
  canWatchExtraAd,
  consumeDailyAttempt,
  createDeviceId,
  createInitialDailyAttempts,
  createMemoryDailyChallengeStorage,
  createUnavailableDailyBackend,
  dailyAttemptsForDay,
  DAILY_MAX_ATTEMPTS,
  hasFreeAttempt,
  unlockExtraAttempt,
  utcDateIso,
  withBestSubmitted,
} from './daily';

describe('tentativas do Desafio Diário', () => {
  test('dia novo começa com 1 tentativa gratuita, sem extra', () => {
    const state = createInitialDailyAttempts('2026-08-11');
    expect(state.attemptsUsed).toBe(0);
    expect(state.extraUnlocked).toBe(false);
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

  test('o anúncio libera a extra e o limite de 2 tentativas bloqueia a terceira', () => {
    let state = createInitialDailyAttempts('2026-08-11');
    state = consumeDailyAttempt(state);
    state = unlockExtraAttempt(state);
    expect(canPlayDaily(state)).toBe(true);
    state = consumeDailyAttempt(state);
    expect(state.attemptsUsed).toBe(DAILY_MAX_ATTEMPTS);
    expect(canPlayDaily(state)).toBe(false);
  });

  test('rollover de dia zera as tentativas e mantém o melhor do dia passado', () => {
    let state = withBestSubmitted(
      consumeDailyAttempt(consumeDailyAttempt(unlockExtraAttempt(createInitialDailyAttempts('2026-08-11')))),
      1200,
    );
    state = dailyAttemptsForDay(state, '2026-08-12');
    expect(state.attemptsUsed).toBe(0);
    expect(state.extraUnlocked).toBe(false);
    expect(state.bestSubmitted).toBeNull();
    expect(canPlayDaily(state)).toBe(true);
  });

  test('mesmo dia não zera o estado', () => {
    const state = dailyAttemptsForDay(
      { date: '2026-08-11', attemptsUsed: 2, extraUnlocked: true, bestSubmitted: 900 },
      '2026-08-11',
    );
    expect(state.attemptsUsed).toBe(2);
    expect(state.extraUnlocked).toBe(true);
  });

  test('withBestSubmitted é monótono', () => {
    let state = createInitialDailyAttempts('2026-08-11');
    state = withBestSubmitted(state, 800);
    state = withBestSubmitted(state, 300);
    expect(state.bestSubmitted).toBe(800);
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
