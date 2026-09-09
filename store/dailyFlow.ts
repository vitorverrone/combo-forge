/**
 * Fluxo do Desafio Diário — orquestração entre o store e o motor (ticket 13).
 *
 * O motor (engine/daily.ts) guarda as regras puras do Desafio (tentativas,
 * rollover UTC, ports); este módulo orquestra o ciclo de vida completo:
 * fronteira do dia, gate de tentativas, cache do seed do dia, chamadas ao
 * backend e ao provider de anúncio, persistência via port e montagem da Run
 * do dia (Forjador fixo, DDA desligado, pools completos — ADR 0003).
 *
 * Interface pequena para muita orquestração: um único comando
 * (runDailyCommand) cobre start / watchAd / submit / fetchLeaderboard. O
 * invariante de fronteira do dia (attempts sempre se referem ao dia atual)
 * é garantido aqui, uma vez, e não re-derivado nos call sites. Nada deste
 * módulo conhece zustand, telas ou navegação: o IO acontece só através dos
 * ports injetados (DailyFlowDeps) e o resultado é aplicado pelo store.
 */

import {
  AdProvider,
  ALL_UNLOCKS,
  canPlayDaily,
  canWatchExtraAd,
  consumeDailyAttempt,
  createSeededRng,
  DailyAttempts,
  DailyBackend,
  DailyChallengeStorage,
  dailyAttemptsForDay,
  DailyLeaderboard,
  DEFAULT_DDA_CONFIG,
  LeagueStanding,
  Rng,
  RunState,
  startRun as engineStartRun,
  unlockExtraAttempt,
  utcDateIso,
  validateDisplayName,
  withBestSubmitted,
} from '../engine';

/** Estado do Desafio Diário no store (tentativas, seed, leaderboard, flags). */
export interface DailyState {
  /** Tentativas do dia (persistidas entre sessões). */
  readonly attempts: DailyAttempts;
  /** UUID opaco do dispositivo (persistido; identidade no leaderboard). */
  readonly deviceId: string;
  /** Seed do dia em cache (null até a primeira busca do dia). */
  readonly seed: number | null;
  /** Data a que o seed em cache se refere (YYYY-MM-DD, UTC). */
  readonly seedDate: string;
  /** Busca do seed / início da Run do dia. */
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly error: string | null;
  /** Anúncio recompensado da tentativa extra. */
  readonly adLoading: boolean;
  /** Submissão da pontuação ao fim da Run. */
  readonly submitStatus: 'idle' | 'submitting' | 'submitted' | 'failed';
  /**
   * Leaderboard semanal (opt-in; null até o jogador abrir) OU posição na
   * Liga (ADR 0010, ticket 02) — exclusivos entre si: `league` não-null
   * significa que a Liga está ativa pra semana e `leaderboard` fica null;
   * `leaderboard` só é preenchido quando a Liga ainda não atingiu a massa
   * crítica (fallback pro leaderboard único).
   */
  readonly leaderboard: DailyLeaderboard | null;
  readonly league: LeagueStanding | null;
  readonly leaderboardLoading: boolean;
  readonly leaderboardError: string | null;
  /**
   * Nome de Exibição do dispositivo (ticket 02): null até a primeira vez
   * ser salvo — a UI usa isso para decidir se mostra o modal obrigatório.
   */
  readonly displayName: string | null;
  readonly displayNameStatus: 'idle' | 'saving' | 'error';
  readonly displayNameError: string | null;
  /** Onboarding da Liga na DailyChallengeScreen (ticket 01): visto uma única vez por dispositivo. */
  readonly dailyOnboardingSeen: boolean;
  /**
   * Intenção de jogar pendente de Nome de Exibição (ticket 02): true quando o
   * jogador tocou em "jogar" sem nome salvo ainda — é isso que abre o
   * DisplayNameModal. Nunca persistido (estado de UI de uma sessão).
   */
  readonly pendingPlayIntent: boolean;
}

/** Ports que o fluxo precisa (injetados pelo store; memória nos testes). */
export interface DailyFlowDeps {
  /** Persistência das tentativas do dia + deviceId. */
  readonly storage: DailyChallengeStorage;
  /** Backend do seed/submissão/leaderboard (Supabase no app). */
  readonly backend: DailyBackend;
  /** Provider de anúncio recompensado (AdMob no app). */
  readonly adProvider: AdProvider;
  /** Relógio (fronteira de dia UTC, igual à do backend). */
  readonly now: () => Date;
}

/** Comandos do ciclo de vida do Desafio Diário. */
export type DailyCommand =
  | { type: 'start' }
  | { type: 'requestPlay' }
  | { type: 'watchAd' }
  | { type: 'submit'; score: number }
  | { type: 'fetchLeaderboard' }
  | { type: 'setDisplayName'; name: string };

/** Resultado do comando: estado novo + sinal de Run iniciada (navegação). */
export interface DailyFlowResult {
  /** Estado do Desafio sempre (pode ser o mesmo objeto se nada mudou). */
  readonly daily: DailyState;
  /** Run do dia iniciada pelo comando 'start' (null = sem Run/navegação). */
  readonly run: RunState | null;
  /** Stream de RNG da Run iniciada (null sem Run). */
  readonly rng: Rng | null;
}

/**
 * Executa um comando do fluxo do Desafio Diário. Sempre devolve o estado
 * novo do Desafio (nunca lança): loading/erro ficam nos campos de status,
 * e `run !== null` sinaliza que a Run do dia começou. Persiste via ports
 * quando há mutação.
 */
export async function runDailyCommand(
  state: DailyState,
  deps: DailyFlowDeps,
  command: DailyCommand,
): Promise<DailyFlowResult> {
  switch (command.type) {
    case 'start':
      return startDailyChallenge(state, deps);
    case 'requestPlay':
      return requestPlay(state, deps);
    case 'watchAd':
      return watchAdForExtraAttempt(state, deps);
    case 'submit':
      return submitDailyScore(state, deps, command.score);
    case 'fetchLeaderboard':
      return fetchLeaderboard(state, deps);
    case 'setDisplayName':
      return setDisplayName(state, deps, command.name);
  }
}

/** Inicia a Run do dia: seed do backend (cacheado), Forjador fixo, DDA off. */
async function startDailyChallenge(
  state: DailyState,
  deps: DailyFlowDeps,
): Promise<DailyFlowResult> {
  const today = utcDateIso(deps.now());
  const attempts = dailyAttemptsForDay(state.attempts, today);
  if (!canPlayDaily(attempts)) {
    return { daily: attempts === state.attempts ? state : { ...state, attempts }, run: null, rng: null };
  }
  const loading = { ...state, attempts, status: 'loading' as const, error: null };
  try {
    // Seed do dia: reusa o cache do dia ou busca no backend (mesmo seed para
    // todos os jogadores — comparação justa, ADR 0003).
    let seed = state.seed;
    if (seed === null || state.seedDate !== today) {
      seed = await deps.backend.fetchSeed(today);
    }
    const nextAttempts = consumeDailyAttempt(attempts);
    deps.storage.saveAttempts(nextAttempts);
    // Forjador fixo (Aprendiz) + pools completos (ALL_UNLOCKS) + DDA off:
    // a Run do dia é idêntica para todos os jogadores.
    const rng = createSeededRng(seed);
    const run = engineStartRun(seed, {
      forger: 'apprentice',
      ddaConfig: { ...DEFAULT_DDA_CONFIG, enabled: false },
      unlocks: ALL_UNLOCKS,
      rng,
    });
    return {
      daily: {
        ...loading,
        attempts: nextAttempts,
        seed,
        seedDate: today,
        status: 'ready',
        submitStatus: 'idle',
      },
      run,
      rng,
    };
  } catch (error) {
    // Falha do backend: devolve a tentativa não consumida (nada foi gasto).
    deps.storage.saveAttempts(attempts);
    return {
      daily: { ...state, attempts, status: 'error', error: messageOf(error) },
      run: null,
      rng: null,
    };
  }
}

/**
 * Toque em "jogar" (ticket 02): com Nome de Exibição já salvo, comporta-se
 * como 'start'. Sem nome ainda, não mexe em tentativas/seed — só marca a
 * intenção pendente, que é o que abre o DisplayNameModal na UI. `setDisplayName`
 * encadeia de volta pra esta mesma Run assim que o nome for salvo.
 */
async function requestPlay(state: DailyState, deps: DailyFlowDeps): Promise<DailyFlowResult> {
  if (state.displayName !== null) {
    return startDailyChallenge(state, deps);
  }
  return { daily: { ...state, pendingPlayIntent: true }, run: null, rng: null };
}

/** Assistir o anúncio recompensado para liberar a tentativa extra. */
async function watchAdForExtraAttempt(
  state: DailyState,
  deps: DailyFlowDeps,
): Promise<DailyFlowResult> {
  const attempts = dailyAttemptsForDay(state.attempts, utcDateIso(deps.now()));
  if (!canWatchExtraAd(attempts)) {
    return { daily: attempts === state.attempts ? state : { ...state, attempts }, run: null, rng: null };
  }
  const loading = { ...state, attempts, adLoading: true };
  try {
    const watched = await deps.adProvider.requestRewardedAd();
    if (!watched) {
      // Desistiu ou provider sem anúncio: sem recompensa, estado intacto.
      return { daily: { ...loading, adLoading: false }, run: null, rng: null };
    }
    const nextAttempts = unlockExtraAttempt(attempts);
    deps.storage.saveAttempts(nextAttempts);
    return { daily: { ...loading, attempts: nextAttempts, adLoading: false }, run: null, rng: null };
  } catch {
    // Falha do provider (sem anúncio no momento): mantém o estado.
    return { daily: { ...loading, adLoading: false }, run: null, rng: null };
  }
}

/** Submete a pontuação da Run do dia ao backend (best-of-week no servidor). */
async function submitDailyScore(
  state: DailyState,
  deps: DailyFlowDeps,
  score: number,
): Promise<DailyFlowResult> {
  if (state.submitStatus === 'submitting' || state.submitStatus === 'submitted') {
    return { daily: state, run: null, rng: null };
  }
  const attempts = dailyAttemptsForDay(state.attempts, utcDateIso(deps.now()));
  const submitting = { ...state, attempts, submitStatus: 'submitting' as const };
  try {
    // O servidor guarda a melhor pontuação do dia do dispositivo.
    const stored = await deps.backend.submitScore(state.deviceId, score);
    const nextAttempts = withBestSubmitted(attempts, stored);
    deps.storage.saveAttempts(nextAttempts);
    return {
      daily: { ...submitting, attempts: nextAttempts, submitStatus: 'submitted' },
      run: null,
      rng: null,
    };
  } catch {
    return { daily: { ...submitting, submitStatus: 'failed' }, run: null, rng: null };
  }
}

/**
 * Opt-in: busca a posição na Liga (ADR 0010, ticket 02) e só cai para o
 * leaderboard único (posição própria + top 10) quando a Liga ainda não
 * ativou pra semana (fetchLeagueLeaderboard devolve null). Nunca busca os
 * dois — são exclusivos entre si na tela.
 */
async function fetchLeaderboard(
  state: DailyState,
  deps: DailyFlowDeps,
): Promise<DailyFlowResult> {
  const attempts = dailyAttemptsForDay(state.attempts, utcDateIso(deps.now()));
  const loading = { ...state, attempts, leaderboardLoading: true, leaderboardError: null };
  try {
    const league = await deps.backend.fetchLeagueLeaderboard(state.deviceId);
    if (league !== null) {
      return {
        daily: { ...loading, league, leaderboard: null, leaderboardLoading: false },
        run: null,
        rng: null,
      };
    }
    const leaderboard = await deps.backend.fetchLeaderboard(state.deviceId);
    return {
      daily: { ...loading, leaderboard, league: null, leaderboardLoading: false },
      run: null,
      rng: null,
    };
  } catch (error) {
    return {
      daily: { ...loading, leaderboardLoading: false, leaderboardError: messageOf(error) },
      run: null,
      rng: null,
    };
  }
}

/**
 * Grava o Nome de Exibição (ticket 02). Valida no cliente primeiro (falha
 * sem round-trip de rede quando dá pra saber sem o servidor); só então
 * chama o backend, que é a fonte da verdade final (moderação/formato) —
 * rejeição do servidor ou falha de rede caem no mesmo estado de erro.
 */
async function setDisplayName(
  state: DailyState,
  deps: DailyFlowDeps,
  name: string,
): Promise<DailyFlowResult> {
  const clientValidation = validateDisplayName(name);
  if (!clientValidation.valid) {
    // Este módulo não conhece i18n (fica na camada UI/format.ts) — guarda o
    // reason bruto ('tooShort' etc.), não uma mensagem traduzida. Na prática
    // a UI já faz a mesma validação ao vivo antes de habilitar o botão de
    // salvar, então este branch é uma rede de segurança, não o caminho
    // principal de erro visto pelo jogador.
    return {
      daily: { ...state, displayNameStatus: 'error', displayNameError: clientValidation.reason },
      run: null,
      rng: null,
    };
  }
  const saving = { ...state, displayNameStatus: 'saving' as const, displayNameError: null };
  try {
    const savedName = await deps.backend.setDisplayName(state.deviceId, name);
    deps.storage.saveDisplayName(savedName);
    const saved: DailyState = {
      ...saving,
      displayName: savedName,
      displayNameStatus: 'idle',
      pendingPlayIntent: false,
    };
    // Ticket 02: tocou em "jogar" sem nome salvo ainda — o nome acabou de
    // resolver isso, então a Run começa agora, sem exigir um segundo toque.
    if (state.pendingPlayIntent) {
      return startDailyChallenge(saved, deps);
    }
    return { daily: saved, run: null, rng: null };
  } catch (error) {
    return {
      daily: { ...saving, displayNameStatus: 'error', displayNameError: messageOf(error) },
      run: null,
      rng: null,
    };
  }
}

/** Mensagem de erro estável para a UI (mesma regra do store). */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
