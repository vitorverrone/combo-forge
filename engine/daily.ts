/**
 * Desafio Diário — regras do lado do cliente (ticket 13).
 *
 * O Desafio Diário é a mesma Run para todos os jogadores: o seed do dia vem
 * do backend (get_daily_seed, ticket 12) e determina embaralhamento e ofertas
 * de Forja; o DDA fica desligado (Metas na curva base, iguais para todos) e o
 * Forjador é fixo (Aprendiz, sempre disponível) com todos os pools de Forja
 * abertos (ALL_UNLOCKS) — assim as ofertas são idênticas entre jogadores com
 * meta-progressão diferente (comparação justa, ADR 0003).
 *
 * Tentativas: 1 gratuita por dia + tentativas extras ilimitadas liberadas
 * pelo provider de anúncio (abstração AdProvider), uma por vez — precisa
 * consumir (jogar) a tentativa desbloqueada pelo anúncio anterior antes de
 * poder assistir o próximo (nunca acumula anúncios sem jogar entre eles). A
 * fronteira do dia é UTC, igual à do backend. A identidade do dispositivo é
 * um UUID opaco gerado uma vez e persistido localmente (o backend deduplica
 * por (day, device_id)).
 *
 * Este módulo é puro (regras e ports), sem IO: o port DailyChallengeStorage
 * guarda tentativas e deviceId (SQLite no app, memória nos testes); o port
 * DailyBackend é implementado pelo serviço Supabase (services/supabase.ts).
 */

/** Tentativas gratuitas por dia. */
export const DAILY_FREE_ATTEMPTS = 1;

/** Tentativas do dia, persistidas entre sessões. */
export interface DailyAttempts {
  /** Data do desafio (YYYY-MM-DD, UTC) a que este estado se refere. */
  readonly date: string;
  /** Tentativas já usadas hoje. */
  readonly attemptsUsed: number;
  /**
   * Tentativas já liberadas hoje (gratuita + 1 por anúncio assistido).
   * Cresce sem teto; nunca passa à frente de `attemptsUsed` por mais de 1 —
   * é isso que impõe "uma tentativa por anúncio" (canWatchExtraAd).
   */
  readonly unlockedTotal: number;
  /** Melhor pontuação submetida hoje (para re-submissões do servidor). */
  readonly bestSubmitted: number | null;
}

export function createInitialDailyAttempts(dateIso: string): DailyAttempts {
  return {
    date: dateIso,
    attemptsUsed: 0,
    unlockedTotal: DAILY_FREE_ATTEMPTS,
    bestSubmitted: null,
  };
}

/**
 * Zera as tentativas quando o dia muda (rollover UTC); mantém o estado
 * intacto no mesmo dia. Não toca o deviceId (outra chave do storage).
 *
 * Também normaliza `unlockedTotal` ausente: dado persistido no formato
 * anterior a este campo (era `extraUnlocked: boolean`) chega aqui sem ele —
 * sem isso, `attemptsUsed < undefined`/`attemptsUsed >= undefined` dão
 * sempre falso e travam o dia inteiro (jogar e assistir anúncio) até o
 * próximo rollover sobrescrever o estado sozinho.
 */
export function dailyAttemptsForDay(
  state: DailyAttempts,
  dateIso: string,
): DailyAttempts {
  if (state.date !== dateIso) return createInitialDailyAttempts(dateIso);
  if (state.unlockedTotal === undefined) return { ...state, unlockedTotal: DAILY_FREE_ATTEMPTS };
  return state;
}

/** Há tentativa gratuita disponível hoje? */
export function hasFreeAttempt(state: DailyAttempts): boolean {
  return state.attemptsUsed < DAILY_FREE_ATTEMPTS;
}

/** Pode jogar agora (tem tentativa liberada e ainda não usada)? */
export function canPlayDaily(state: DailyAttempts): boolean {
  return state.attemptsUsed < state.unlockedTotal;
}

/** Consome uma tentativa (gratuita ou extra). */
export function consumeDailyAttempt(state: DailyAttempts): DailyAttempts {
  return { ...state, attemptsUsed: state.attemptsUsed + 1 };
}

/** Libera mais uma tentativa (chamado após o anúncio recompensado). */
export function unlockExtraAttempt(state: DailyAttempts): DailyAttempts {
  return { ...state, unlockedTotal: state.unlockedTotal + 1 };
}

/**
 * Pode assistir o anúncio agora? Só enquanto não houver tentativa liberada e
 * ainda não jogada esperando — é essa condição que impõe "uma tentativa por
 * anúncio" (nunca acumula anúncios sem jogar entre eles). Como
 * `unlockedTotal` começa em DAILY_FREE_ATTEMPTS, isso já implica que a
 * gratuita foi usada.
 */
export function canWatchExtraAd(state: DailyAttempts): boolean {
  return state.attemptsUsed >= state.unlockedTotal;
}

/** Registra a melhor pontuação submetida no dia (monótona). */
export function withBestSubmitted(
  state: DailyAttempts,
  score: number,
): DailyAttempts {
  return {
    ...state,
    bestSubmitted: Math.max(state.bestSubmitted ?? 0, score),
  };
}

/** UUID v4 opaco para o dispositivo (Math.random; sem depender de crypto RN). */
export function createDeviceId(): string {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 36; i += 1) {
    if (i === 8 || i === 13 || i === 18 || i === 23) id += '-';
    else if (i === 14) id += '4'; // versão 4
    else if (i === 19) id += '89ab'[Math.floor(Math.random() * 4)]; // variante RFC 4122
    else id += hex[Math.floor(Math.random() * 16)];
  }
  return id;
}

/** Data de hoje em YYYY-MM-DD (UTC), mesma fronteira de dia do backend. */
export function utcDateIso(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Uma entrada do leaderboard semanal (rank compartilhado em empates). */
export interface DailyLeaderboardEntry {
  readonly rank: number;
  readonly score: number;
  /** Nome de Exibição do dispositivo; null se ainda não cadastrou (ticket 02). */
  readonly name: string | null;
}

/** Resposta do leaderboard semanal do Desafio Diário. */
export interface DailyLeaderboard {
  /** Segunda-feira da semana (ISO), YYYY-MM-DD. */
  readonly week: string;
  /** Posição própria na semana (null se o dispositivo não pontuou). */
  readonly own: DailyLeaderboardEntry | null;
  /** Top 10 da semana, com o Nome de Exibição de cada posição. */
  readonly top: readonly DailyLeaderboardEntry[];
}

/**
 * Um dos 5 patamares nomeados da Liga (ADR 0010, ticket 02) — bronze é piso
 * (sem rebaixamento), diamond é teto (sem promoção).
 */
export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

/**
 * Posição do dispositivo na Liga (Tier + Divisão), quando ativa. `division`
 * e `own` são null quando o dispositivo ainda não pontuou na semana — sem
 * pontuação não há rank pra saber em qual Divisão (bloco de ~30) ele cai.
 */
export interface LeagueStanding {
  /** Segunda-feira da semana (ISO), YYYY-MM-DD. */
  readonly week: string;
  readonly tier: LeagueTier;
  /** Número da Divisão (1-based); null se o dispositivo não pontuou na semana. */
  readonly division: number | null;
  readonly own: DailyLeaderboardEntry | null;
  /** Ranking completo da Divisão (não um top 10) — vazio se `own` for null. */
  readonly top: readonly DailyLeaderboardEntry[];
}

/**
 * Port de persistência do Desafio Diário: tentativas do dia + deviceId +
 * Nome de Exibição (ticket 02 — nome é propriedade do dispositivo, mesma
 * chave/lugar do deviceId, independente do dia).
 * Implementação SQLite no app (store/sqlite.ts); memória nos testes.
 */
export interface DailyChallengeStorage {
  loadAttempts(): DailyAttempts | null;
  saveAttempts(state: DailyAttempts): void;
  loadDeviceId(): string | null;
  saveDeviceId(id: string): void;
  loadDisplayName(): string | null;
  saveDisplayName(name: string): void;
}

/** Implementação em memória do port, para testes. */
export function createMemoryDailyChallengeStorage(
  initial?: DailyAttempts | null,
  deviceId?: string | null,
  displayName?: string | null,
): DailyChallengeStorage {
  let attempts = initial ?? null;
  let storedDeviceId = deviceId ?? null;
  let storedDisplayName = displayName ?? null;
  return {
    loadAttempts: () => attempts,
    saveAttempts: (state) => {
      attempts = state;
    },
    loadDeviceId: () => storedDeviceId,
    saveDeviceId: (id) => {
      storedDeviceId = id;
    },
    loadDisplayName: () => storedDisplayName,
    saveDisplayName: (name) => {
      storedDisplayName = name;
    },
  };
}

/**
 * Port do backend do Desafio Diário (implementado pelo serviço Supabase,
 * services/supabase.ts — ticket 12). Sem contas de usuário: o backend
 * deduplica por (day, device_id) e re-submissões só sobem a pontuação.
 */
export interface DailyBackend {
  /** Seed do dia (mesmo para todos os jogadores). */
  fetchSeed(dateIso: string): Promise<number>;
  /** Submete a pontuação da Run; devolve o melhor score armazenado do dia. */
  submitScore(deviceId: string, score: number): Promise<number>;
  /** Leaderboard semanal (posição própria + top 10, sem identidades). */
  fetchLeaderboard(deviceId: string): Promise<DailyLeaderboard>;
  /**
   * Posição na Liga (Tier + Divisão), quando ativa (ADR 0010, ticket 02).
   * Null quando a base de jogadores ainda não atingiu a massa crítica da
   * semana — o chamador cai de volta para fetchLeaderboard (leaderboard
   * único). Resolve o Tier do dispositivo pra semana atual como efeito
   * colateral da própria consulta (preguiçoso, sem job agendado).
   */
  fetchLeagueLeaderboard(deviceId: string): Promise<LeagueStanding | null>;
  /**
   * Grava o Nome de Exibição do dispositivo (ticket 02). Rejeita a Promise
   * quando o servidor recusa (moderação/formato — fonte da verdade final,
   * além da validação do cliente) ou em falha de rede; devolve o nome
   * canônico salvo (trim aplicado) quando aceito.
   */
  setDisplayName(deviceId: string, name: string): Promise<string>;
}

/** Backend indisponível (env não configurado): erros claros para a UI. */
export function createUnavailableDailyBackend(): DailyBackend {
  const unavailable = () =>
    Promise.reject(new Error('Desafio Diário indisponível: backend não configurado.'));
  return {
    fetchSeed: unavailable,
    submitScore: unavailable,
    fetchLeaderboard: unavailable,
    fetchLeagueLeaderboard: unavailable,
    setDisplayName: unavailable,
  };
}
