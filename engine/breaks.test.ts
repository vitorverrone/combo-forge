import {
  createInitialBreakHistory,
  createMemoryBreakStorage,
  DEFAULT_BREAK_REMINDER_CONFIG,
  markBreakSuggested,
  recordRunFinished,
  shouldSuggestBreak,
} from './breaks';

const WINDOW = DEFAULT_BREAK_REMINDER_CONFIG.windowMs; // 10 min

function historyAt(times: readonly number[], lastSuggestedAt = 0) {
  return { runEndsAt: times, lastSuggestedAt };
}

describe('lembrete de pausa (regra pura)', () => {
  test('menos de N runs nunca sugere', () => {
    const now = 1_000_000;
    expect(shouldSuggestBreak(historyAt([now - WINDOW, now]), now)).toBe(false);
  });

  test('3 runs consecutivas em intervalo curto sugerem pausa', () => {
    const now = 1_000_000;
    const history = historyAt([now - WINDOW, now - WINDOW / 2, now]);
    expect(shouldSuggestBreak(history, now)).toBe(true);
  });

  test('intervalo entre runs acima da janela quebra a cadeia', () => {
    const now = 1_000_000;
    const history = historyAt([now - WINDOW * 3, now - WINDOW, now]);
    expect(shouldSuggestBreak(history, now)).toBe(false);
  });

  test('cooldown silencia depois de sugerir (não bloqueia, só some)', () => {
    const now = 1_000_000;
    const history = markBreakSuggested(
      historyAt([now - WINDOW, now - WINDOW / 2, now]),
      now,
    );
    expect(shouldSuggestBreak(history, now + 1)).toBe(false);
    // Depois do cooldown volta a sugerir (com nova cadeia de runs).
    const later = now + DEFAULT_BREAK_REMINDER_CONFIG.cooldownMs;
    const continued = recordRunFinished(history, later);
    expect(shouldSuggestBreak(continued, later)).toBe(false); // sem runs novas suficientes
    const finished = recordRunFinished(recordRunFinished(continued, later + 1), later + 2);
    expect(shouldSuggestBreak(finished, later + 2)).toBe(true);
  });

  test('recordRunFinished mantém a ordem cronológica', () => {
    const history = recordRunFinished(recordRunFinished(createInitialBreakHistory(), 100), 200);
    expect(history.runEndsAt).toEqual([100, 200]);
  });

  test('recordRunFinished poda o histórico à cauda relevante da regra', () => {
    let history = createInitialBreakHistory();
    for (let i = 1; i <= 10; i += 1) history = recordRunFinished(history, i * 100);
    // A regra só olha as últimas consecutiveRuns entradas; o resto é descartado.
    expect(history.runEndsAt).toHaveLength(DEFAULT_BREAK_REMINDER_CONFIG.consecutiveRuns);
    expect(history.runEndsAt).toEqual([800, 900, 1000]);
  });

  test('storage em memória persiste o histórico', () => {
    const storage = createMemoryBreakStorage();
    expect(storage.load()).toBeNull();
    const history = historyAt([100, 200]);
    storage.save(history);
    expect(storage.load()).toEqual(history);
  });
});
