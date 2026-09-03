import {
  adjustTarget,
  attemptNumberForRound,
  createMemoryDdaStorage,
  DEFAULT_DDA_CONFIG,
  DEFAULT_DDA_STATE,
  isEasyWin,
  loadDda,
  persistDda,
  saveDda,
  updateDda,
} from './dda';
import { baseTarget } from './run';

describe('adjustTarget (curva base ± DDA)', () => {
  test('histórico neutro não altera a curva base', () => {
    expect(adjustTarget(baseTarget(3), 3, DEFAULT_DDA_STATE, DEFAULT_DDA_CONFIG)).toBe(baseTarget(3));
  });

  test('3 falhas consecutivas na Rodada reduzem a Meta dela em 10%', () => {
    const dda = { lastFailedRound: 3, consecutiveFailures: 3, easyWins: 0 };
    expect(adjustTarget(baseTarget(3), 3, dda, DEFAULT_DDA_CONFIG)).toBe(Math.round(baseTarget(3) * 0.9));
    // outras Rodadas não são afetadas
    expect(adjustTarget(baseTarget(1), 1, dda, DEFAULT_DDA_CONFIG)).toBe(baseTarget(1));
  });

  test('5 vitórias fáceis consecutivas aumentam a Meta em 15% (pós rebalance, assimétrico)', () => {
    const dda = { lastFailedRound: 0, consecutiveFailures: 0, easyWins: 5 };
    expect(adjustTarget(baseTarget(3), 3, dda, DEFAULT_DDA_CONFIG)).toBe(Math.round(baseTarget(3) * 1.15));
  });

  test('falhas e vitórias fáceis combinam no mesmo ajuste (sequencial: 0.9 depois 1.15)', () => {
    const dda = { lastFailedRound: 3, consecutiveFailures: 3, easyWins: 5 };
    // a implementação arredonda entre os dois fatores: round(round(144 × 0.9) × 1.15)
    expect(adjustTarget(baseTarget(3), 3, dda, DEFAULT_DDA_CONFIG)).toBe(
      Math.round(Math.round(baseTarget(3) * 0.9) * 1.15),
    );
  });

  test('failureAdjustment permanece 0.1, inalterado pelo rebalance (mudança assimétrica)', () => {
    expect(DEFAULT_DDA_CONFIG.failureAdjustment).toBe(0.1);
  });

  test('DDA desligado devolve a base intacta mesmo com histórico de ajuste', () => {
    const disabled = { ...DEFAULT_DDA_CONFIG, enabled: false };
    const dda = { lastFailedRound: 3, consecutiveFailures: 9, easyWins: 9 };
    expect(adjustTarget(baseTarget(3), 3, dda, disabled)).toBe(baseTarget(3));
  });
});

describe('attemptNumberForRound (ticket 02/ADR 0007 — número da tentativa na telemetria)', () => {
  test('histórico neutro é sempre a 1ª tentativa', () => {
    expect(attemptNumberForRound(DEFAULT_DDA_STATE, 1)).toBe(1);
  });

  test('Rodada com falhas consecutivas é a N+1ª tentativa', () => {
    const dda = { lastFailedRound: 3, consecutiveFailures: 2, easyWins: 0 };
    expect(attemptNumberForRound(dda, 3)).toBe(3);
  });

  test('outra Rodada que não a da última derrota é sempre a 1ª tentativa', () => {
    const dda = { lastFailedRound: 3, consecutiveFailures: 2, easyWins: 0 };
    expect(attemptNumberForRound(dda, 4)).toBe(1);
  });
});

describe('isEasyWin (margem ≥ 30% acima da Meta com 1+ Jogada sobrando)', () => {
  test('pontuação com folga e Jogada sobrando é vitória fácil', () => {
    expect(isEasyWin(65, 50, 1, DEFAULT_DDA_CONFIG)).toBe(true); // 50 × 1.3 = 65
  });

  test('sem Jogada sobrando não é vitória fácil', () => {
    expect(isEasyWin(100, 50, 0, DEFAULT_DDA_CONFIG)).toBe(false);
  });

  test('abaixo da margem não é vitória fácil', () => {
    expect(isEasyWin(64, 50, 2, DEFAULT_DDA_CONFIG)).toBe(false);
  });
});

describe('updateDda (histórico persistido)', () => {
  test('falhas consecutivas crescem na mesma Rodada e zeram ao mudar de Rodada', () => {
    const first = updateDda(DEFAULT_DDA_STATE, { roundNumber: 3, won: false, easyWin: false });
    expect(first).toEqual({ lastFailedRound: 3, consecutiveFailures: 1, easyWins: 0 });
    const second = updateDda(first, { roundNumber: 3, won: false, easyWin: false });
    expect(second.consecutiveFailures).toBe(2);
    const otherRound = updateDda(second, { roundNumber: 2, won: false, easyWin: false });
    expect(otherRound).toEqual({ lastFailedRound: 2, consecutiveFailures: 1, easyWins: 0 });
  });

  test('vencer zera as falhas e acumula vitórias fáceis consecutivas', () => {
    let dda = { lastFailedRound: 3, consecutiveFailures: 2, easyWins: 0 };
    dda = updateDda(dda, { roundNumber: 4, won: true, easyWin: true });
    expect(dda).toEqual({ lastFailedRound: 3, consecutiveFailures: 0, easyWins: 1 });
    dda = updateDda(dda, { roundNumber: 5, won: true, easyWin: true });
    expect(dda.easyWins).toBe(2);
  });

  test('vencer sem folga quebra a sequência de vitórias fáceis', () => {
    const dda = { lastFailedRound: 0, consecutiveFailures: 0, easyWins: 4 };
    const next = updateDda(dda, { roundNumber: 1, won: true, easyWin: false });
    expect(next.easyWins).toBe(0);
  });

  test('falhar quebra a sequência de vitórias fáceis', () => {
    const dda = { lastFailedRound: 0, consecutiveFailures: 0, easyWins: 4 };
    const next = updateDda(dda, { roundNumber: 2, won: false, easyWin: false });
    expect(next.easyWins).toBe(0);
  });
});

describe('persistência via port de storage injetado', () => {
  test('salvar e carregar preserva o histórico', () => {
    const storage = createMemoryDdaStorage();
    const dda = { lastFailedRound: 3, consecutiveFailures: 2, easyWins: 1 };
    saveDda(storage, dda);
    expect(loadDda(storage, DEFAULT_DDA_CONFIG)).toEqual(dda);
  });

  test('falhar a mesma Rodada 3 vezes seguidas reduz a Meta dela em 10% na próxima Run', () => {
    const storage = createMemoryDdaStorage();
    let dda = loadDda(storage, DEFAULT_DDA_CONFIG);
    for (let i = 0; i < 3; i += 1) {
      dda = persistDda(storage, dda, { roundNumber: 3, won: false, easyWin: false });
    }
    const nextRun = loadDda(storage, DEFAULT_DDA_CONFIG);
    expect(nextRun).toEqual({ lastFailedRound: 3, consecutiveFailures: 3, easyWins: 0 });
    expect(adjustTarget(baseTarget(3), 3, nextRun, DEFAULT_DDA_CONFIG)).toBe(
      Math.round(baseTarget(3) * 0.9),
    );
  });

  test('storage vazio devolve o estado neutro', () => {
    expect(loadDda(createMemoryDdaStorage(), DEFAULT_DDA_CONFIG)).toEqual(DEFAULT_DDA_STATE);
  });

  test('DDA desligado devolve sempre o estado neutro, ignorando o storage', () => {
    const storage = createMemoryDdaStorage({ lastFailedRound: 3, consecutiveFailures: 3, easyWins: 5 });
    const disabled = { ...DEFAULT_DDA_CONFIG, enabled: false };
    expect(loadDda(storage, disabled)).toEqual(DEFAULT_DDA_STATE);
  });
});
