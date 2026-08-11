/**
 * Lembrete gentil de pausa (ticket 15).
 *
 * Após várias Runs consecutivas terminadas em intervalo curto, o jogo sugere
 * uma pausa — sem bloquear nada (a UI mostra um banner dismissível). A regra
 * é pura: guarda os timestamps (epoch ms) dos fins de Run e decide com base
 * numa janela sintonizável.
 *
 * "Consecutivas em intervalo curto": cada fim de Run aconteceu até
 * `windowMs` depois do fim da anterior. Com `consecutiveRuns` fins nessa
 * cadeia, o lembrete é sugerido (e só reaparece depois de um descanso).
 */

/** Parâmetros do lembrete (sintonizáveis — a forma da regra é o que importa). */
export interface BreakReminderConfig {
  /** Runs consecutivas (fins em cadeia curta) que disparam o lembrete. */
  readonly consecutiveRuns: number;
  /** Janela entre fins de Run consecutivos (ms). */
  readonly windowMs: number;
  /** Após sugerir, silencia por este tempo (ms) mesmo continuando a jogar. */
  readonly cooldownMs: number;
}

export const DEFAULT_BREAK_REMINDER_CONFIG: BreakReminderConfig = {
  consecutiveRuns: 3,
  windowMs: 10 * 60 * 1000, // 10 minutos entre fins consecutivos
  cooldownMs: 30 * 60 * 1000, // 30 minutos de silêncio após sugerir
};

/** Histórico persistido: fins de Run recentes + último lembrete sugerido. */
export interface BreakHistory {
  /** Timestamps (epoch ms) dos fins de Run, em ordem cronológica. */
  readonly runEndsAt: readonly number[];
  /** Epoch ms do último lembrete exibido (0 = nunca). */
  readonly lastSuggestedAt: number;
}

export function createInitialBreakHistory(): BreakHistory {
  return { runEndsAt: [], lastSuggestedAt: 0 };
}

/**
 * Registra o fim de uma Run. Poda o histórico à cadeia relevante para a
 * regra (últimas `consecutiveRuns` entradas): o blob é persistido no SQLite
 * a cada fim de Run, então mantê-lo limitado evita crescimento infinito —
 * e a regra só consulta essa cauda de qualquer forma.
 */
export function recordRunFinished(history: BreakHistory, atMs: number): BreakHistory {
  const tail = DEFAULT_BREAK_REMINDER_CONFIG.consecutiveRuns;
  return { ...history, runEndsAt: [...history.runEndsAt, atMs].slice(-tail) };
}

/**
 * Deve sugerir uma pausa agora? Sim quando as `consecutiveRuns` últimas Runs
 * terminaram em cadeia dentro de `windowMs`, e o lembrete não foi exibido
 * dentro do cooldown.
 */
export function shouldSuggestBreak(
  history: BreakHistory,
  nowMs: number,
  config: BreakReminderConfig = DEFAULT_BREAK_REMINDER_CONFIG,
): boolean {
  // Cooldown só conta a partir do primeiro lembrete (lastSuggestedAt 0 = nunca).
  if (history.lastSuggestedAt > 0 && nowMs - history.lastSuggestedAt < config.cooldownMs) {
    return false;
  }
  const recent = history.runEndsAt.slice(-config.consecutiveRuns);
  if (recent.length < config.consecutiveRuns) return false;
  for (let i = 1; i < recent.length; i += 1) {
    if (recent[i] - recent[i - 1] > config.windowMs) return false;
  }
  return true;
}

/** Marca o lembrete como exibido agora (entra em cooldown). */
export function markBreakSuggested(
  history: BreakHistory,
  atMs: number,
): BreakHistory {
  return { ...history, lastSuggestedAt: atMs };
}

/** Port de persistência do histórico de pausa (SQLite no app; mem. testes). */
export interface BreakStorage {
  load(): BreakHistory | null;
  save(history: BreakHistory): void;
}

export function createMemoryBreakStorage(initial?: BreakHistory | null): BreakStorage {
  let stored = initial ?? null;
  return {
    load: () => stored,
    save: (history) => {
      stored = history;
    },
  };
}
