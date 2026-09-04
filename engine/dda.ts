/**
 * Dificuldade Dinâmica (DDA).
 *
 * Ajusta a Meta da curva base para manter o jogador em Flow, usando um
 * histórico leve persistido entre Runs via port de storage injetado
 * (implementação em memória para testes; o app usa SQLite na camada de
 * persistência):
 *
 * - Falhar a mesma Rodada 3 vezes seguidas reduz a Meta dela em 10%.
 * - 5 vitórias fáceis consecutivas (margem ≥ 30% acima da Meta com 1+
 *   Jogada sobrando) aumentam a Meta em 15% e a frequência de Relíquia
 *   rara (consumido por forge.ts via rareRelicBoost — exclui Relíquias de
 *   categoria combo do boost, ver forge.ts).
 *
 * A flag "sem DDA" desliga todos os ajustes de Meta (usada pelo Desafio
 * Diário). Hesitação dispara apenas dicas visuais (patterns.ts,
 * availablePatternHints) — nunca toca a Meta. Tudo puro e determinístico.
 */

export interface DdaState {
  /** Rodada da última derrota (0 = nunca perdeu). */
  readonly lastFailedRound: number;
  /** Falhas consecutivas na mesma Rodada; zera ao vencer ou mudar de Rodada. */
  readonly consecutiveFailures: number;
  /** Vitórias fáceis consecutivas; zera ao falhar ou vencer sem folga. */
  readonly easyWins: number;
}

export const DEFAULT_DDA_STATE: DdaState = {
  lastFailedRound: 0,
  consecutiveFailures: 0,
  easyWins: 0,
};

/** Parâmetros do DDA (sintonizáveis — a forma da regra é o que importa). */
export interface DdaConfig {
  /** False desliga todos os ajustes de Meta (Desafio Diário). */
  readonly enabled: boolean;
  /** Falhas consecutivas na mesma Rodada que reduzem a Meta. */
  readonly failureThreshold: number;
  /** Redução da Meta da Rodada travada (ex.: 0.10 = −10%). */
  readonly failureAdjustment: number;
  /** Vitórias fáceis consecutivas que aumentam a Meta. */
  readonly easyWinThreshold: number;
  /** Margem sobre a Meta que define uma vitória fácil (ex.: 0.30 = +30%). */
  readonly easyWinMargin: number;
  /** Aumento da Meta com a sequência de vitórias fáceis (ex.: 0.10 = +10%). */
  readonly easyWinAdjustment: number;
}

export const DEFAULT_DDA_CONFIG: DdaConfig = {
  enabled: true,
  failureThreshold: 3,
  failureAdjustment: 0.1,
  easyWinThreshold: 5,
  easyWinMargin: 0.3,
  // Assimétrico por decisão (rebalance pós health-check, ADR 0006): reage
  // mais rápido a sequências de vitórias fáceis (0.10 → 0.15) sem tornar
  // Rodadas travadas mais fáceis — failureAdjustment permanece 0.1.
  easyWinAdjustment: 0.15,
};

/** Port de persistência do histórico do DDA (injetado; memória para testes). */
export interface DdaStorage {
  load(): DdaState | null;
  save(state: DdaState): void;
}

/** Implementação em memória do port, para testes e Desafio Diário em sessão. */
export function createMemoryDdaStorage(initial?: DdaState): DdaStorage {
  let stored = initial ?? null;
  return {
    load: () => stored,
    save: (state) => {
      stored = state;
    },
  };
}

/** Carrega o histórico; com DDA desligado, devolve sempre o estado neutro. */
export function loadDda(storage: DdaStorage, config: DdaConfig = DEFAULT_DDA_CONFIG): DdaState {
  if (!config.enabled) return DEFAULT_DDA_STATE;
  return storage.load() ?? DEFAULT_DDA_STATE;
}

export function saveDda(storage: DdaStorage, state: DdaState): void {
  storage.save(state);
}

/**
 * Meta ajustada da Rodada R: −10% quando R é a Rodada da última derrota com
 * falhas consecutivas suficientes; +10% com a sequência de vitórias fáceis.
 * Ambos partem da curva base. Com DDA desligado, devolve a base intacta.
 */
export function adjustTarget(
  baseTarget: number,
  roundNumber: number,
  dda: DdaState,
  config: DdaConfig = DEFAULT_DDA_CONFIG,
): number {
  if (!config.enabled) return baseTarget;
  let target = baseTarget;
  if (dda.lastFailedRound === roundNumber && dda.consecutiveFailures >= config.failureThreshold) {
    target = Math.round(target * (1 - config.failureAdjustment));
  }
  if (dda.easyWins >= config.easyWinThreshold) {
    target = Math.round(target * (1 + config.easyWinAdjustment));
  }
  return target;
}

/**
 * Em que tentativa da Rodada R o jogador está, contando a sequência de
 * falhas persistida (ticket 02/ADR 0007 — telemetria): 1ª tentativa se R não
 * é a Rodada da última derrota; N+1 se já falhou N vezes seguidas nela.
 * Mesmo predicado usado por adjustTarget para decidir o desconto de Meta.
 */
export function attemptNumberForRound(dda: DdaState, roundNumber: number): number {
  return dda.lastFailedRound === roundNumber ? dda.consecutiveFailures + 1 : 1;
}

/** "Vitória fácil": margem ≥ easyWinMargin acima da Meta com 1+ Jogada sobrando. */
export function isEasyWin(
  score: number,
  target: number,
  playsRemaining: number,
  config: DdaConfig = DEFAULT_DDA_CONFIG,
): boolean {
  return playsRemaining > 0 && score >= target * (1 + config.easyWinMargin);
}

export interface DdaRoundOutcome {
  readonly roundNumber: number;
  readonly won: boolean;
  readonly easyWin: boolean;
}

/**
 * Máquina de estados do histórico: falhas consecutivas por Rodada (zera ao
 * vencer ou mudar de Rodada) e vitórias fáceis consecutivas (zera ao falhar
 * ou vencer sem folga). Não depende de parâmetros de config — os limiares
 * apenas gateiam adjustTarget/isEasyWin.
 */
export function updateDda(dda: DdaState, outcome: DdaRoundOutcome): DdaState {
  if (!outcome.won) {
    if (dda.lastFailedRound === outcome.roundNumber) {
      return {
        lastFailedRound: outcome.roundNumber,
        consecutiveFailures: dda.consecutiveFailures + 1,
        easyWins: 0,
      };
    }
    return { lastFailedRound: outcome.roundNumber, consecutiveFailures: 1, easyWins: 0 };
  }
  return {
    ...dda,
    consecutiveFailures: 0,
    easyWins: outcome.easyWin ? dda.easyWins + 1 : 0,
  };
}

/** Atualiza o histórico com o fim de uma Rodada e persiste no storage. */
export function persistDda(storage: DdaStorage, dda: DdaState, outcome: DdaRoundOutcome): DdaState {
  const next = updateDda(dda, outcome);
  saveDda(storage, next);
  return next;
}

export type DdaAdjustmentTrigger = 'consecutiveFailures' | 'easyWins';

export interface DdaAdjustment {
  readonly direction: 'reduced' | 'increased';
  readonly trigger: DdaAdjustmentTrigger;
}

/**
 * Classifica se a Meta muda de fato entre dois estados de DDA consecutivos
 * (ticket 03/ADR 0007 — telemetria): null na maioria das Rodadas, mesmo
 * quando falhas/vitórias fáceis se acumulam — só quando a sequência cruza o
 * limiar que adjustTarget usa (mesmos failureThreshold/easyWinThreshold),
 * não a cada passo depois dele (adjustTarget não escala além do limiar).
 */
export function ddaAdjustment(
  previous: DdaState,
  next: DdaState,
  config: DdaConfig = DEFAULT_DDA_CONFIG,
): DdaAdjustment | null {
  if (
    previous.consecutiveFailures < config.failureThreshold &&
    next.consecutiveFailures >= config.failureThreshold
  ) {
    return { direction: 'reduced', trigger: 'consecutiveFailures' };
  }
  if (previous.easyWins < config.easyWinThreshold && next.easyWins >= config.easyWinThreshold) {
    return { direction: 'increased', trigger: 'easyWins' };
  }
  return null;
}
