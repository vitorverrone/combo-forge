/**
 * Camada de estado (Zustand) da Run jogável + meta-progressão (ticket 11).
 *
 * Nenhuma regra de jogo vive aqui: o store apenas (a) guarda o estado do
 * motor (RunState) e estado de UI (tela, seleção de cartas), (b) despacha as
 * ações do jogador para o motor puro com a stream de RNG contínua que ele
 * mesmo criou no startRun, (c) persiste o histórico DDA ao fim de cada
 * Rodada, (d) acumula estatísticas de perfil e reivindica desbloqueios de
 * meta-progressão ao fim de cada Run (funções puras de progression.ts),
 * persistindo via port injetado (memória nos testes; SQLite no app), (e)
 * delega a orquestração de IO do Desafio Diário ao fluxo (store/dailyFlow.ts)
 * e (f) a orquestração de IO da Loja ao fluxo (store/shopFlow.ts), aplicando
 * as fatias novas que eles devolvem.
 * Tudo o que a UI precisa ler vem de funções puras do motor.
 */

import { useStore } from 'zustand';
import { createStore, StoreApi } from 'zustand/vanilla';

import {
  activeRelics,
  AdProvider,
  attemptNumberForRound,
  Card,
  cardKey,
  claimOption as engineClaimOption,
  claimReachedSingles,
  computeUnlocks,
  createDevAdProvider,
  createDeviceId,
  createInitialDailyAttempts,
  createMemoryDailyChallengeStorage,
  createMemoryDdaStorage,
  createMemoryProgressionStorage,
  createSeededRng,
  createUnavailableDailyBackend,
  currentPlayNumber,
  DailyBackend,
  DailyChallengeStorage,
  dailyAttemptsForDay,
  DEFAULT_DDA_CONFIG,
  DEFAULT_PROGRESSION,
  discard,
  DdaAdjustment,
  ddaAdjustment,
  DdaStorage,
  applyForgeOffer as engineApplyForgeOffer,
  evaluatePlay,
  ForgerId,
  isEasyWin,
  isForgerUnlocked,
  isOptionClaimable,
  LeagueTier,
  loadDda,
  makePlay,
  milestoneOfOption,
  milestoneOptionTitle,
  PendingMilestone,
  pendingMilestones,
  PersistedProgression,
  persistDda,
  PlayEvaluation,
  ProfileStats,
  ProgressionStorage,
  recordDailySubmission,
  recordLeagueTier,
  recordPlay,
  recordRunEnd,
  Rng,
  RunEvent,
  RunState,
  saveProgression,
  scoreModifiers,
  startNextRound,
  startRun as engineStartRun,
  utcDateIso,
  createDevShopProvider,
  createMemoryShopStorage,
  normalizeShopState,
  PersistedShop,
  ShopProvider,
  ShopStorage,
  createDevTelemetryProvider,
  createMemoryPushProvider,
  createUnavailablePushBackend,
  PushBackend,
  PushProvider,
  TelemetryParams,
  TelemetryProvider,
} from '../engine';

import {
  DailyFlowDeps,
  DailyFlowResult,
  DailyState,
  runDailyCommand,
} from './dailyFlow';

import {
  acceptPushSoftAsk as acceptPushSoftAskFlow,
  createMemoryPushFlowStorage,
  declinePushSoftAsk as declinePushSoftAskFlow,
  loadPushState,
  PushFlowDeps,
  PushFlowState,
  PushFlowStorage,
  PushState,
  registerNotificationTapListener,
} from './pushFlow';

import {
  equipCosmetic as equipCosmeticFlow,
  runShopCommand,
  ShopFlowDeps,
  ShopFlowState,
  ShopState,
} from './shopFlow';

import {
  abandonGameScreenTutorialIfActive,
  createMemoryTutorialStorage,
  loadTutorialState,
  persistTutorialTransition,
  runTutorialCommand,
  shouldStartForgeTutorial,
  shouldStartGameScreenTutorial,
  startForgeTutorial,
  startGameScreenTutorial,
  TutorialState,
  TutorialStorage,
} from './tutorialFlow';

export type { ShopState } from './shopFlow';

export type Screen = 'start' | 'game' | 'profile' | 'collection' | 'daily' | 'shop';

/** Modo da Run atual: normal (meta-progressão conta) ou Desafio Diário. */
export type RunMode = 'normal' | 'daily';

/** Máximo de cartas selecionáveis (tamanho máximo de uma Jogada). */
export const MAX_SELECTION = 5;

/** Intervalo de Runs entre anúncios intersticiais (ticket 02). */
const INTERSTITIAL_RUNS_INTERVAL = 1;

/** Abaixo disso, restartRun() dispara restart_immediate (ticket 02/ADR 0007). */
const RESTART_IMMEDIATE_THRESHOLD_SECONDS = 10;

export interface GameState {
  readonly screen: Screen;
  readonly forger: ForgerId;
  /** Modo da Run atual (Desafio Diário não conta para meta-progressão). */
  readonly runMode: RunMode;
  readonly run: RunState | null;
  /**
   * Contagem de Runs iniciadas na sessão do app (ticket 02/ADR 0007 —
   * "número da Run" do evento run_started). Incrementado em startRun(), não
   * em progression.stats.runsStarted: aquele campo só cresce quando uma Run
   * TERMINA (recordRunEnd), então uma Run abandonada via backToStart() sem
   * terminar faria o próximo run_started repetir o mesmo número.
   */
  readonly runsStartedCount: number;
  /** Identidades (`naipe:valor`) das cartas da Mão selecionadas. */
  readonly selectedKeys: readonly string[];
  /** Eventos do motor da última ação (para a UI reagir a eles). */
  readonly lastEvents: readonly RunEvent[];
  /** Stream contínua de RNG da Run; criada no startRun e usada em toda ação. */
  readonly rng: Rng | null;
  readonly ddaStorage: DdaStorage;
  /** Meta-progressão persistida: estatísticas de perfil + desbloqueios. */
  readonly progression: PersistedProgression;
  /**
   * Marco com mais de uma opção aguardando a escolha de ordem do jogador
   * (modal). Null quando não há escolha pendente.
   */
  readonly unlockChoice: PendingMilestone | null;
  /** Títulos dos desbloqueios recém-concedidos (banner nas telas de fim de Run). */
  readonly recentUnlocks: readonly string[];
  /** Estado do Desafio Diário (ticket 13). */
  readonly daily: DailyState;
  readonly dailyStorage: DailyChallengeStorage;
  readonly dailyBackend: DailyBackend;
  readonly adProvider: AdProvider;
  /** Port de telemetria (ticket 01/ADR 0007) — no-op em dev/testes. */
  readonly telemetry: TelemetryProvider;
  /** Loja cosmética (ticket 14) — itens só visuais, nunca poder. */
  readonly shop: ShopState;
  readonly shopStorage: ShopStorage;
  readonly shopProvider: ShopProvider;
  /**
   * Remoção de anúncios comprada (ticket 02): banner oculto em todas as
   * telas. Persistida via ShopStorage (mesmo padrão do owned da loja).
   */
  readonly adsRemoved: boolean;
  /** Contador de Runs desde o último intersticial. */
  readonly interstitialRunsSinceAd: number;
  /** Timestamp (ms) da última runLost; null se a Run mais recente não terminou em derrota. Usado por restartRun() pra medir restart_immediate (ticket 02). */
  readonly lastRunLostAt: number | null;
  /** True quando um intersticial deve ser exibido (Run end screens consomem). */
  readonly showInterstitial: boolean;
  /** Tutorial contextual em coach-mark (.scratch/tutorial-walkthrough): qual passo está ativo, o que já foi visto. */
  readonly tutorial: TutorialState;
  readonly tutorialStorage: TutorialStorage;
  /** Notificação push de queda de Tier (ADR 0012, ticket 02): resolução do soft-ask dentro do app. */
  readonly push: PushState;
  readonly pushProvider: PushProvider;
  readonly pushBackend: PushBackend;
  readonly pushStorage: PushFlowStorage;

  readonly chooseForger: (forger: ForgerId) => void;
  readonly startRun: () => void;
  /** Abre a tela do Desafio Diário. */
  readonly openDaily: () => void;
  /** Inicia a Run do Desafio Diário (seed do dia, DDA off, Forjador fixo). */
  readonly startDailyChallenge: () => Promise<void>;
  /** Assistir anúncio recompensado para liberar a tentativa extra. */
  readonly watchAdForExtraAttempt: () => Promise<void>;
  /** Submete a pontuação da Run ao backend (best-of-week no servidor). */
  readonly submitDailyScore: (score: number) => Promise<void>;
  /** Opt-in: busca o leaderboard semanal (posição própria + top 10). */
  readonly fetchLeaderboard: () => Promise<void>;
  /** Grava/troca o Nome de Exibição do dispositivo (ticket 02). */
  readonly setDisplayName: (name: string) => Promise<void>;
  /** Aceita o soft-ask de notificação (ADR 0012): pede a permissão do SO e, se concedida, registra o token. */
  readonly acceptPushSoftAsk: () => Promise<void>;
  /** Recusa o soft-ask de notificação: nunca mais aparece (ADR 0012). */
  readonly declinePushSoftAsk: () => void;
  /** Abre a loja cosmética. */
  readonly openShop: () => void;
  /** Carrega as ofertas (preços) do provider e o estado persistido. */
  readonly loadShop: () => Promise<void>;
  /** Compra um item cosmético (IAP via provider). */
  readonly purchaseCosmetic: (itemId: string) => Promise<void>;
  /** Compra a remoção de anúncios (IAP não-consumível, ticket 02). */
  readonly purchaseRemoveAds: () => Promise<void>;
  /** Equipa uma skin de baralho comprada. */
  readonly equipCosmetic: (itemId: string) => void;
  /**
   * Sincroniza a entitlement remove_ads com o provider (launch, ticket 03):
   * marca adsRemoved quando o RevenueCat reentrega a entitlement, sem
   * interação do jogador. Nunca regride uma remoção já ativa.
   */
  readonly syncRemoveAdsEntitlement: () => Promise<void>;
  /** Restaura compras do dispositivo (novo aparelho). */
  readonly restorePurchases: () => Promise<void>;
  /** Marca o intersticial como exibido (reseta o flag). */
  readonly dismissInterstitial: () => void;
  readonly toggleCard: (key: string) => void;
  readonly clearSelection: () => void;
  readonly playSelection: () => void;
  readonly discardSelection: () => void;
  /**
   * Aplica a oferta de Forja escolhida (índice em run.forgeOffers). Ofertas
   * de carta exigem a carta alvo do Baralho; a de Relíquia, só o índice.
   * Encerra a fase 'forging' e volta para 'roundWon' (pronto para nextRound).
   */
  readonly applyForgeOffer: (offerIndex: number, targetCard?: Card, replaceRelicId?: string) => void;
  /** Avança para a próxima Rodada após vencer e forjar (fase 'roundWon'). */
  readonly nextRound: () => void;
  /** Reinicia imediatamente uma nova Run (novo seed, mesmo Forjador). */
  readonly restartRun: () => void;
  /** Reivindica uma opção de desbloqueio pendente (escolha da ordem). */
  readonly claimUnlock: (optionId: string) => void;
  /** Fecha o modal de escolha de desbloqueio sem reivindicar (fica na Coleção). */
  readonly dismissUnlockChoice: () => void;
  readonly openProfile: () => void;
  readonly openCollection: () => void;
  readonly backToStart: () => void;

  /** Confere se a seção GameScreen do tutorial deveria começar agora, e ativa se sim (idempotente). */
  readonly checkGameScreenTutorialTrigger: () => void;
  /** O jogador saiu do GameScreen (Rodada terminou ou Run abandonada) com a seção ainda ativa — conta como vista (idempotente). */
  readonly tutorialGameScreenLeft: () => void;
  /** Confere se a seção Forja do tutorial deveria começar agora, e ativa se sim (idempotente). */
  readonly checkForgeTutorialTrigger: () => void;
  /** Passo 1 da GameScreen: o jogador tocou numa carta da Mão. */
  readonly tutorialCardTouched: () => void;
  /** Passo 2 da GameScreen: o jogador tocou em Limpar ou Descartar. */
  readonly tutorialClearOrDiscardTouched: () => void;
  /** Passo 2 da GameScreen: o jogador tocou no botão "Próximo" (avança sem limpar/descartar). */
  readonly tutorialNextPressed: () => void;
  /** Passo 3 da GameScreen: o jogador tocou no "?" de referência de Padrões. */
  readonly tutorialPatternReferenceTouched: () => void;
  /** "Pular tutorial" da seção GameScreen — conclui a partir de qualquer um dos 3 passos, nunca mexe na seção Forja. */
  readonly tutorialGameScreenSkipPressed: () => void;
  /** O jogador tocou numa oferta da Forja. */
  readonly tutorialForgeOfferTouched: () => void;
  /** "Concluir" da seção Forja — mesmo efeito de tocar numa oferta, nunca mexe na seção GameScreen. */
  readonly tutorialForgeCompletePressed: () => void;
}

export interface GameStoreDeps {
  readonly ddaStorage?: DdaStorage;
  /** Port de persistência da meta-progressão (padrão: memória, p/ testes). */
  readonly progressionStorage?: ProgressionStorage;
  /** Meta-progressão inicial (padrão: nova; injetável em testes). */
  readonly initialProgression?: PersistedProgression;
  /** Fonte de seed da próxima Run (padrão: relógio; injetável em testes). */
  readonly seed?: () => number;
  /** Port de persistência do Desafio Diário (padrão: memória, p/ testes). */
  readonly dailyStorage?: DailyChallengeStorage;
  /** Backend do Desafio Diário (padrão: indisponível; app injeta Supabase). */
  readonly dailyBackend?: DailyBackend;
  /** Provider de anúncios recompensados (padrão: dev, assiste sempre). */
  readonly adProvider?: AdProvider;
  /** Provider de telemetria (padrão: dev no-op; app injeta Firebase Analytics). */
  readonly telemetry?: TelemetryProvider;
  /** Relógio injetável (padrão: Date.now; usado na fronteira de dia UTC). */
  readonly now?: () => Date;
  /** Port de persistência da loja (padrão: memória, p/ testes). */
  readonly shopStorage?: ShopStorage;
  /** Provider de compras (padrão: dev simulado; app injeta RevenueCat). */
  readonly shopProvider?: ShopProvider;
  /** Estado inicial da loja (padrão: vazio; injetável em testes). */
  readonly initialShop?: PersistedShop;
  /** Port de persistência do tutorial contextual (padrão: memória, p/ testes). */
  readonly tutorialStorage?: TutorialStorage;
  /** Provider de push (padrão: memória, sem capability — mesmo estado de ambiente sem SDK nativo). */
  readonly pushProvider?: PushProvider;
  /** Backend de registro de token (padrão: indisponível; app injeta Supabase). */
  readonly pushBackend?: PushBackend;
  /** Port de persistência do soft-ask de push (padrão: memória, p/ testes). */
  readonly pushStorage?: PushFlowStorage;
}

/** Seleção resolvida em cartas da Mão, na ordem da Mão. */
export function selectedCards(run: RunState, selectedKeys: readonly string[]): Card[] {
  const keys = new Set(selectedKeys);
  return run.deck.hand.filter((card) => keys.has(cardKey(card)));
}

/**
 * Preview do melhor Padrão e do Valor-Base da seleção atual, avaliado pelo
 * motor com o contexto da Run (Cartas Forjadas, Jogada atual e Relíquias).
 * Null quando não há seleção ou ela é inválida.
 */
export function selectionPreview(
  run: RunState | null,
  selectedKeys: readonly string[],
): PlayEvaluation | null {
  if (run === null || selectedKeys.length === 0) return null;
  try {
    const selected = selectedCards(run, selectedKeys);
    return evaluatePlay(selected, {
      forgedCards: run.forgedCards,
      playNumber: currentPlayNumber(run),
      modifiers: scoreModifiers(activeRelics(run.startingRelic, run.relics)),
    });
  } catch {
    return null;
  }
}

/**
 * Persiste o histórico DDA a partir dos eventos de fim de Rodada do motor.
 * Runs "sem DDA" (ddaConfig.enabled false, Desafio Diário) não tocam o
 * histórico — a carga já devolve o estado neutro e nada deve ser salvo.
 *
 * Devolve os ajustes de Meta que de fato aconteceram (ticket 03/ADR 0007 —
 * telemetria: dda_adjustment), classificados por ddaAdjustment (engine/dda.ts)
 * a partir do dda antes/depois de cada evento — vazio na maioria das
 * Rodadas, mesmo com DDA ligado.
 */
export function persistRoundEnd(
  run: RunState,
  events: readonly RunEvent[],
  storage: DdaStorage,
): readonly DdaAdjustment[] {
  if (!run.ddaConfig.enabled) return [];
  const adjustments: DdaAdjustment[] = [];
  for (const event of events) {
    if (event.type === 'roundWon') {
      const easyWin = isEasyWin(event.score, event.target, run.playsRemaining, DEFAULT_DDA_CONFIG);
      const next = persistDda(storage, run.dda, { roundNumber: event.roundNumber, won: true, easyWin });
      const adjustment = ddaAdjustment(run.dda, next, run.ddaConfig);
      if (adjustment !== null) adjustments.push(adjustment);
    } else if (event.type === 'roundLost') {
      const next = persistDda(storage, run.dda, { roundNumber: event.roundNumber, won: false, easyWin: false });
      const adjustment = ddaAdjustment(run.dda, next, run.ddaConfig);
      if (adjustment !== null) adjustments.push(adjustment);
    }
  }
  return adjustments;
}

/** Dispara dda_adjustment pra cada ajuste real que persistRoundEnd detectou (ticket 03/ADR 0007). */
function emitDdaAdjustmentTelemetry(
  adjustments: readonly DdaAdjustment[],
  telemetry: TelemetryProvider,
): void {
  for (const adjustment of adjustments) {
    void telemetry.logEvent('dda_adjustment', {
      direction: adjustment.direction,
      trigger: adjustment.trigger,
    });
  }
}

/**
 * Parâmetros do milestone_unlocked (ticket 03/ADR 0007): milestoneId (ex.:
 * "fifthRunWon") identifica QUAL marco, optionId (ex.: "value-bonus-7")
 * identifica qual desbloqueio dentro dele — sem os dois, medir quantas
 * sessões até esgotar cada marco (o motivo do ticket) exigiria um mapa
 * optionId → milestone fora da telemetria.
 */
function milestoneUnlockedParams(optionId: string): TelemetryParams {
  return { optionId, milestoneId: milestoneOfOption(optionId)?.id ?? optionId };
}

/**
 * Dispara round_result pra cada Rodada resolvida e run_ended ao fim da Run
 * (ticket 02/ADR 0007) — mesmos eventos que persistRoundEnd/recordRunEnd já
 * processam, mesmo ponto de chamada em playSelection(). attemptNumberForRound
 * (engine/dda.ts) deriva o número da tentativa do dda da Run (carregado uma
 * vez em startRun e fixo durante ela) — mesmo predicado que adjustTarget já
 * usa pro desconto de Meta, não reimplementado aqui.
 */
function emitRoundAndRunTelemetry(
  run: RunState,
  events: readonly RunEvent[],
  telemetry: TelemetryProvider,
): void {
  for (const event of events) {
    if (event.type === 'roundWon' || event.type === 'roundLost') {
      const marginPct = Math.round(((event.score - event.target) / event.target) * 100);
      const attemptNumber = attemptNumberForRound(run.dda, event.roundNumber);
      void telemetry.logEvent('round_result', {
        roundNumber: event.roundNumber,
        result: event.type === 'roundWon' ? 'won' : 'lost',
        marginPct,
        attemptNumber,
      });
    } else if (event.type === 'runWon' || event.type === 'runLost') {
      void telemetry.logEvent('run_ended', {
        result: event.type === 'runWon' ? 'won' : 'lost',
        roundNumber: event.roundNumber,
        runScore: event.runScore,
      });
    }
  }
}

/** Ports do fluxo do Desafio Diário a partir do estado atual do store. */
function dailyFlowDeps(state: GameState, now: () => Date): DailyFlowDeps {
  return {
    storage: state.dailyStorage,
    backend: state.dailyBackend,
    adProvider: state.adProvider,
    now,
  };
}

/**
 * Patch do GameState para o resultado do fluxo do Desafio Diário. Navega
 * para o jogo e monta a Run quando o comando 'start' a iniciou; senão só
 * atualiza o estado do Desafio.
 */
function applyDailyResult(result: DailyFlowResult): Partial<GameState> {
  if (result.run === null || result.rng === null) {
    return { daily: result.daily };
  }
  return {
    daily: result.daily,
    run: result.run,
    rng: result.rng,
    screen: 'game',
    runMode: 'daily',
    selectedKeys: [],
    lastEvents: [],
    recentUnlocks: [],
    unlockChoice: null,
  };
}

export function createGameStore(deps: GameStoreDeps = {}): StoreApi<GameState> {
  const ddaStorage = deps.ddaStorage ?? createMemoryDdaStorage();
  const progressionStorage = deps.progressionStorage ?? createMemoryProgressionStorage();
  const tutorialStorage = deps.tutorialStorage ?? createMemoryTutorialStorage();
  const dailyStorage = deps.dailyStorage ?? createMemoryDailyChallengeStorage();
  const dailyBackend = deps.dailyBackend ?? createUnavailableDailyBackend();
  const adProvider = deps.adProvider ?? createDevAdProvider();
  const telemetry = deps.telemetry ?? createDevTelemetryProvider();
  const nextSeed = deps.seed ?? (() => (Date.now() % 0xffffffff) >>> 0);
  const now = deps.now ?? (() => new Date());

  const shopStorage = deps.shopStorage ?? createMemoryShopStorage();
  const shopProvider = deps.shopProvider ?? createDevShopProvider();
  const initialShop = deps.initialShop ?? normalizeShopState(shopStorage.load());

  // Sem provider injetado, o padrão se comporta como um ambiente sem
  // capability nativa de push (mesmo estado de Expo Go/web) — nada dispara
  // até o bootstrap real injetar services/push.ts.
  const pushProvider = deps.pushProvider ?? createMemoryPushProvider();
  const pushBackend = deps.pushBackend ?? createUnavailablePushBackend();
  const pushStorage = deps.pushStorage ?? createMemoryPushFlowStorage();

  // Estado inicial do Desafio Diário: deviceId persistido (ou novo) e
  // tentativas com rollover para o dia atual.
  const today = utcDateIso(now());
  const storedDeviceId = dailyStorage.loadDeviceId();
  const deviceId = storedDeviceId ?? createDeviceId();
  if (deviceId !== storedDeviceId) dailyStorage.saveDeviceId(deviceId);
  const initialAttempts = dailyAttemptsForDay(
    dailyStorage.loadAttempts() ?? createInitialDailyAttempts(today),
    today,
  );
  if (initialAttempts !== dailyStorage.loadAttempts()) {
    dailyStorage.saveAttempts(initialAttempts);
  }

  const store = createStore<GameState>()((set, get) => ({
    screen: 'start',
    forger: 'apprentice',
    runMode: 'normal',
    run: null,
    runsStartedCount: 0,
    selectedKeys: [],
    lastEvents: [],
    rng: null,
    ddaStorage,
    progression: deps.initialProgression ?? DEFAULT_PROGRESSION,
    unlockChoice: null,
    recentUnlocks: [],
    daily: {
      attempts: initialAttempts,
      deviceId,
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
      displayName: dailyStorage.loadDisplayName(),
      displayNameStatus: 'idle',
      displayNameError: null,
    },
    dailyStorage,
    dailyBackend,
    adProvider,
    telemetry,
    shop: {
      owned: initialShop,
      offerings: [],
      status: 'idle',
      error: null,
      purchasing: null,
      restoring: false,
    },
    shopStorage,
    shopProvider,
    adsRemoved: initialShop.adsRemoved,
    interstitialRunsSinceAd: 0,
    lastRunLostAt: null,
    showInterstitial: false,
    tutorial: loadTutorialState(tutorialStorage),
    tutorialStorage,
    push: loadPushState(pushStorage),
    pushProvider,
    pushBackend,
    pushStorage,

    dismissInterstitial: () => set({ showInterstitial: false }),

    openShop: () => {
      // shop_opened (ticket 04/ADR 0007): openShop() é o único ponto que
      // define screen: 'shop' — dispara aqui em vez de um useEffect na
      // ShopScreen, mesmo padrão de store action usado em run_started/
      // dda_adjustment/milestone_unlocked (a única exceção deste feature é
      // AdBanner.tsx, que dispara direto de um componente porque o
      // LOADED/FAILED do <BannerAd> não passa por nenhum port).
      void get().telemetry.logEvent('shop_opened');
      set({ screen: 'shop' });
      void get().loadShop();
    },

    // As ações da Loja delegam para o fluxo (store/shopFlow.ts): o store
    // aplica a fatia nova que o comando devolve — mesma relação do Desafio
    // Diário com o dailyFlow. Nenhuma regra de compra vive aqui.
    loadShop: async () => {
      set(await runShopCommand(shopFlowSlice(get()), shopFlowDeps(get()), { type: 'load' }));
    },

    purchaseCosmetic: async (itemId) => {
      set(
        await runShopCommand(shopFlowSlice(get()), shopFlowDeps(get()), {
          type: 'purchaseCosmetic',
          itemId,
        }),
      );
    },

    equipCosmetic: (itemId) => {
      set(equipCosmeticFlow(shopFlowSlice(get()), shopFlowDeps(get()), itemId));
    },

    purchaseRemoveAds: async () => {
      set(await runShopCommand(shopFlowSlice(get()), shopFlowDeps(get()), { type: 'purchaseRemoveAds' }));
    },

    syncRemoveAdsEntitlement: async () => {
      set(await runShopCommand(shopFlowSlice(get()), shopFlowDeps(get()), { type: 'syncEntitlement' }));
    },

    restorePurchases: async () => {
      set(await runShopCommand(shopFlowSlice(get()), shopFlowDeps(get()), { type: 'restore' }));
    },

    chooseForger: (forger) => {
      // Forjadores bloqueados pela meta-progressão não podem ser escolhidos.
      if (!isForgerUnlocked(computeUnlocks(get().progression), forger)) return;
      set({ forger });
    },

    startRun: () => {
      const { forger, progression, telemetry, runsStartedCount } = get();
      const unlocks = computeUnlocks(progression);
      if (!isForgerUnlocked(unlocks, forger)) return;
      const seed = nextSeed();
      const rng = createSeededRng(seed);
      const dda = loadDda(ddaStorage, DEFAULT_DDA_CONFIG);
      const run = engineStartRun(seed, { forger, dda, ddaConfig: DEFAULT_DDA_CONFIG, rng, unlocks });
      const nextRunsStartedCount = runsStartedCount + 1;
      void telemetry.logEvent('run_started', { forger, runNumber: nextRunsStartedCount });
      set({
        screen: 'game',
        runMode: 'normal',
        run,
        rng,
        selectedKeys: [],
        lastEvents: [],
        recentUnlocks: [],
        runsStartedCount: nextRunsStartedCount,
      });
    },

    openDaily: () => {
      set({ screen: 'daily' });
      // Ranking sempre atualizado (ticket 03): busca sozinho ao entrar na
      // tela, sem exigir um toque em "ver ranking" (que deixou de existir).
      void get().fetchLeaderboard();
    },

    startDailyChallenge: async () => {
      const result = await runDailyCommand(get().daily, dailyFlowDeps(get(), now), {
        type: 'start',
      });
      set(applyDailyResult(result));
    },

    watchAdForExtraAttempt: async () => {
      const result = await runDailyCommand(get().daily, dailyFlowDeps(get(), now), {
        type: 'watchAd',
      });
      set({ daily: result.daily });
    },

    submitDailyScore: async (score: number) => {
      const result = await runDailyCommand(get().daily, dailyFlowDeps(get(), now), {
        type: 'submit',
        score,
      });
      set({ daily: result.daily });
      // Ranking sempre atualizado (ticket 03): só depois de uma submissão
      // bem-sucedida — uma falha não deve disparar uma busca nova.
      if (result.daily.submitStatus === 'submitted') {
        // Sequência (ADR 0010, ticket 01): soma o dia e reivindica Títulos de
        // constância. Não usa advanceProgression (mesmo motivo do comentário
        // em playSelection: o Desafio Diário não conta para runsWon/
        // bestRunScore/etc.) — a Sequência é o único stat que o Desafio
        // Diário tem permissão de alterar.
        set(
          advanceDailyStreak(utcDateIso(now()), {
            progression: get().progression,
            recentUnlocks: get().recentUnlocks,
            storage: progressionStorage,
            telemetry: get().telemetry,
          }),
        );
        void get().fetchLeaderboard();
      }
    },

    fetchLeaderboard: async () => {
      // Ticket 03 precisa do indicador de carregamento de verdade: sem este
      // set() intermediário, leaderboardLoading nunca chega a ficar true na
      // store (o set() final só acontece depois do await inteiro).
      set((state) => ({ daily: { ...state.daily, leaderboardLoading: true, leaderboardError: null } }));
      const result = await runDailyCommand(get().daily, dailyFlowDeps(get(), now), {
        type: 'fetchLeaderboard',
      });
      // Aplica só os campos que este comando possui (Liga, ticket 02: a
      // busca agora encadeia 2 chamadas ao backend — fetchLeagueLeaderboard
      // e, em fallback, fetchLeaderboard — então essa promise passa mais
      // tempo em voo). Um `set({ daily: result.daily })` substituindo o
      // objeto inteiro reintroduziria os campos do snapshot capturado no
      // início desta função, apagando qualquer mutação concorrente
      // (attempts/status/etc.) que outro comando já tenha aplicado nesse
      // meio-tempo (ex.: startDailyChallenge rodando em paralelo).
      // Não aplica result.daily.attempts: o comando recalcula o rollover de
      // dia como efeito colateral de toda chamada a runDailyCommand (mesmo
      // em comandos "sem mutação" — dailyFlow.test.ts cobre isso), mas
      // aplicar esse valor aqui reabriria a MESMA corrida que este comentário
      // descreve (fetchLeaderboard pode resolver depois de startDailyChallenge
      // já ter consumido uma tentativa, e sobrescreveria o valor fresco com um
      // stale). Sem risco em deixar de fora: a UI recalcula o rollover de novo
      // a cada render (dailyAttemptsForDay em DailyChallengeScreen), e todo
      // comando que de fato consome/libera uma tentativa (start/watchAd/
      // submit) já aplica seu próprio attempts fresco por conta própria.
      set((state) => ({
        daily: {
          ...state.daily,
          leaderboard: result.daily.leaderboard,
          league: result.daily.league,
          leaderboardLoading: result.daily.leaderboardLoading,
          leaderboardError: result.daily.leaderboardError,
        },
      }));
      // Título de progressão de Tier (ADR 0010, ticket 03): só quando a Liga
      // está ativa. recordLeagueTier ignora sozinho qualquer Tier que não
      // supere o recorde, então chamar isso toda vez que a Liga responde
      // (mesmo sem um Tier novo) é seguro.
      if (result.daily.league !== null) {
        set(
          advanceLeagueTier(result.daily.league.tier, {
            progression: get().progression,
            recentUnlocks: get().recentUnlocks,
            storage: progressionStorage,
            telemetry: get().telemetry,
          }),
        );
      }
    },

    setDisplayName: async (name: string) => {
      const result = await runDailyCommand(get().daily, dailyFlowDeps(get(), now), {
        type: 'setDisplayName',
        name,
      });
      set({ daily: result.daily });
    },

    acceptPushSoftAsk: async () => {
      // Mesmo motivo do set() intermediário em fetchLeaderboard: sem ele,
      // push.registering nunca chega a ficar true na store (o set() final só
      // acontece depois do await inteiro) e o spinner/disabled do botão nunca aparece.
      set((state) => ({ push: { ...state.push, registering: true } }));
      const next = await acceptPushSoftAskFlow(pushFlowSlice(get()), pushFlowDeps(get()));
      set({ push: next.push });
    },

    declinePushSoftAsk: () => {
      const next = declinePushSoftAskFlow(pushFlowSlice(get()), pushFlowDeps(get()));
      set({ push: next.push });
    },

    toggleCard: (key) => {
      const { run, selectedKeys } = get();
      if (run === null) return;
      const inHand = run.deck.hand.some((card) => cardKey(card) === key);
      if (!inHand) return; // seleção só é válida para cartas da Mão atual
      if (selectedKeys.includes(key)) {
        set({ selectedKeys: selectedKeys.filter((candidate) => candidate !== key) });
      } else if (selectedKeys.length < MAX_SELECTION) {
        set({ selectedKeys: [...selectedKeys, key] });
      }
    },

    clearSelection: () => set({ selectedKeys: [] }),

    playSelection: () => {
      const { run, rng, selectedKeys, ddaStorage: storage, progression, runMode } = get();
      if (run === null || rng === null || selectedKeys.length === 0) return;
      try {
        const played = selectedCards(run, selectedKeys);
        const result = makePlay(run, played, rng);
        if (runMode === 'daily') {
          // Desafio Diário: não conta para meta-progressão (sem stats, sem
          // desbloqueios) e o DDA está desligado — nada a persistir além do
          // resultado. Ao fim da Run, submete a pontuação ao backend.
          const ended = result.events.find(
            (event) => event.type === 'runWon' || event.type === 'runLost',
          );
          if (ended !== undefined) {
            void get().submitDailyScore(result.run.runScore);
          }
          set({
            run: result.run,
            selectedKeys: [],
            lastEvents: result.events,
            recentUnlocks: [],
          });
        } else {
          const adjustments = persistRoundEnd(result.run, result.events, storage);
          emitDdaAdjustmentTelemetry(adjustments, get().telemetry);
          emitRoundAndRunTelemetry(result.run, result.events, get().telemetry);
          const endedEvent = result.events.find(
            (event) => event.type === 'runWon' || event.type === 'runLost',
          );
          // Intersticial entre Runs (ticket 02): incrementa o contador a cada
          // Run concluída e agenda um intersticial quando atinge o intervalo.
          // Desafio Diário não conta (já tratado acima).
          let interstitialPatch: Partial<GameState> = {};
          if (endedEvent !== undefined && !get().adsRemoved) {
            const nextCount = get().interstitialRunsSinceAd + 1;
            if (nextCount >= INTERSTITIAL_RUNS_INTERVAL) {
              interstitialPatch = { interstitialRunsSinceAd: 0, showInterstitial: true };
            } else {
              interstitialPatch = { interstitialRunsSinceAd: nextCount };
            }
          }
          // Toda Run que termina atualiza lastRunLostAt — null numa vitória
          // (limpa um timestamp de derrota antigo, senão um restart rápido
          // depois de VENCER dispararia restart_immediate por engano).
          let lastRunLostAtPatch: Partial<GameState> = {};
          if (endedEvent !== undefined) {
            lastRunLostAtPatch = {
              lastRunLostAt: endedEvent.type === 'runLost' ? now().getTime() : null,
            };
          }
          set({
            ...advanceProgression(result, played, {
              progression,
              unlockChoice: get().unlockChoice,
              recentUnlocks: get().recentUnlocks,
              storage: progressionStorage,
              telemetry: get().telemetry,
            }),
            ...interstitialPatch,
            ...lastRunLostAtPatch,
          });
        }
      } catch {
        // Jogada inválida (defesa da UI): estado permanece intacto
      }
    },

    discardSelection: () => {
      const { run, rng, selectedKeys } = get();
      if (run === null || rng === null || selectedKeys.length === 0) return;
      try {
        const nextRun = discard(run, selectedCards(run, selectedKeys), rng);
        set({ run: nextRun, selectedKeys: [], lastEvents: [] });
      } catch {
        // Sem Descarte restante (defesa da UI): estado permanece intacto
      }
    },

    applyForgeOffer: (offerIndex, targetCard, replaceRelicId) => {
      const { run } = get();
      if (run === null || run.phase !== 'forging') return;
      try {
        const result = engineApplyForgeOffer(run, offerIndex, targetCard, replaceRelicId);
        set({ run: result.run, selectedKeys: [], lastEvents: result.events });
      } catch {
        // Oferta/carta/Relíquia inválida (defesa da UI): estado permanece intacto
      }
    },

    nextRound: () => {
      const { run, rng } = get();
      if (run === null || rng === null || run.phase !== 'roundWon') return;
      set({ run: startNextRound(run, rng), selectedKeys: [], lastEvents: [] });
    },

    restartRun: () => {
      // Loop "só mais uma tentativa" (ADR 0007): restart abaixo do limiar
      // logo após uma derrota é o sinal que o premortem de lançamento pediu
      // pra observar (risco de compulsão sem mitigação).
      const { lastRunLostAt, telemetry } = get();
      if (lastRunLostAt !== null) {
        const secondsSinceLoss = (now().getTime() - lastRunLostAt) / 1000;
        if (secondsSinceLoss < RESTART_IMMEDIATE_THRESHOLD_SECONDS) {
          void telemetry.logEvent('restart_immediate', { secondsSinceLoss });
        }
      }
      // Nova Run com novo seed e o mesmo Forjador, sem passar pela tela inicial.
      get().startRun();
    },

    claimUnlock: (optionId) => {
      const { progression, telemetry } = get();
      if (!isOptionClaimable(progression, optionId)) return;
      const next = engineClaimOption(progression, optionId);
      saveProgression(progressionStorage, next);
      void telemetry.logEvent('milestone_unlocked', milestoneUnlockedParams(optionId));
      // O modal fecha após a escolha; as opções restantes ficam na Coleção.
      set({
        progression: next,
        unlockChoice: null,
        recentUnlocks: [milestoneOptionTitle(optionId)],
      });
    },

    dismissUnlockChoice: () => set({ unlockChoice: null }),

    openProfile: () => set({ screen: 'profile' }),
    openCollection: () => set({ screen: 'collection' }),

    backToStart: () =>
      set({ screen: 'start', runMode: 'normal', run: null, selectedKeys: [], lastEvents: [], rng: null }),

    checkGameScreenTutorialTrigger: () => {
      const { run, tutorial } = get();
      if (run === null) return;
      const context = { roundNumber: run.roundNumber, phase: run.phase };
      if (!shouldStartGameScreenTutorial(tutorial, context)) return;
      set({ tutorial: startGameScreenTutorial(tutorial) });
    },

    tutorialGameScreenLeft: () => {
      const { tutorial, tutorialStorage: storage } = get();
      const next = abandonGameScreenTutorialIfActive(tutorial);
      persistTutorialTransition(tutorial, next, storage);
      set({ tutorial: next });
    },

    checkForgeTutorialTrigger: () => {
      const { run, tutorial } = get();
      if (run === null) return;
      if (!shouldStartForgeTutorial(tutorial, { phase: run.phase })) return;
      set({ tutorial: startForgeTutorial(tutorial) });
    },

    tutorialCardTouched: () => {
      set({ tutorial: runTutorialCommand(get().tutorial, { type: 'cardTouched' }) });
    },

    tutorialClearOrDiscardTouched: () => {
      const { tutorial, tutorialStorage: storage } = get();
      const next = runTutorialCommand(tutorial, { type: 'clearOrDiscardTouched' });
      persistTutorialTransition(tutorial, next, storage);
      set({ tutorial: next });
    },

    tutorialNextPressed: () => {
      const { tutorial, tutorialStorage: storage } = get();
      const next = runTutorialCommand(tutorial, { type: 'nextPressed' });
      persistTutorialTransition(tutorial, next, storage);
      set({ tutorial: next });
    },

    tutorialPatternReferenceTouched: () => {
      const { tutorial, tutorialStorage: storage } = get();
      const next = runTutorialCommand(tutorial, { type: 'patternReferenceTouched' });
      persistTutorialTransition(tutorial, next, storage);
      set({ tutorial: next });
    },

    tutorialGameScreenSkipPressed: () => {
      const { tutorial, tutorialStorage: storage } = get();
      const next = runTutorialCommand(tutorial, { type: 'gameScreenSkipPressed' });
      persistTutorialTransition(tutorial, next, storage);
      set({ tutorial: next });
    },

    tutorialForgeOfferTouched: () => {
      const { tutorial, tutorialStorage: storage } = get();
      const next = runTutorialCommand(tutorial, { type: 'forgeOfferTouched' });
      persistTutorialTransition(tutorial, next, storage);
      set({ tutorial: next });
    },

    tutorialForgeCompletePressed: () => {
      const { tutorial, tutorialStorage: storage } = get();
      const next = runTutorialCommand(tutorial, { type: 'forgeCompletePressed' });
      persistTutorialTransition(tutorial, next, storage);
      set({ tutorial: next });
    },
  }));

  // Toque na notificação de queda de Tier (ADR 0012): navega direto para a
  // DailyChallengeScreen, mesma action que o botão "Desafio Diário" usa.
  // Fica fora do objeto de estado (não é uma action que a UI dispara) —
  // liga por toda a vida do store, uma vez na criação.
  registerNotificationTapListener(pushProvider, () => store.getState().openDaily());

  return store;
}

/** O que advanceProgression precisa do state atual — sempre viajam juntos no call site (mesmo padrão de ShopFlowDeps/ShopFlowState). */
interface ProgressionAdvanceContext {
  readonly progression: PersistedProgression;
  readonly unlockChoice: PendingMilestone | null;
  readonly recentUnlocks: readonly string[];
  readonly storage: ProgressionStorage;
  readonly telemetry: TelemetryProvider;
}

/**
 * Avança a meta-progressão após uma ação de Jogada: acumula estatísticas por
 * Jogada, registra o fim da Run (vitória/derrota + recorde), reivindica
 * automaticamente os marcos de opção única (disparando milestone_unlocked
 * pra cada um — ticket 03/ADR 0007) e expõe o marco multi-opção (escolha da
 * ordem) como modal. Persiste o resultado no storage.
 */
function advanceProgression(
  result: { run: RunState; events: readonly RunEvent[] },
  played: readonly Card[],
  context: ProgressionAdvanceContext,
): Partial<GameState> {
  let next: PersistedProgression = context.progression;
  let unlockChoice = context.unlockChoice;
  let recentUnlocks = context.recentUnlocks;

  const playedEvent = result.events.find((event) => event.type === 'played');
  if (playedEvent !== undefined) {
    next = { ...next, stats: recordPlay(next.stats, played, playedEvent.multiplier) };
  }

  const ended = result.events.find(
    (event) => event.type === 'runWon' || event.type === 'runLost',
  );
  if (ended !== undefined) {
    next = {
      ...next,
      stats: recordRunEnd(next.stats, ended.type === 'runWon', result.run.runScore, result.run.forger),
    };
    const singles = claimReachedSingles(next);
    next = singles.persisted;
    if (singles.claimed.length > 0) {
      recentUnlocks = singles.claimed.map(milestoneOptionTitle);
      for (const optionId of singles.claimed) {
        void context.telemetry.logEvent('milestone_unlocked', milestoneUnlockedParams(optionId));
      }
    }
    const multi = pendingMilestones(next).find((candidate) => candidate.milestone.options.length > 1);
    if (multi !== undefined) {
      unlockChoice = multi;
    }
  }

  // Grava a cada Jogada: o blob é pequeno (estatísticas + ids) e o port do
  // SQLite é síncrono via KV store — aceitável no MVP.
  saveProgression(context.storage, next);
  return {
    run: result.run,
    selectedKeys: [],
    lastEvents: result.events,
    progression: next,
    unlockChoice,
    recentUnlocks,
  };
}

/** O que advanceDailyStreak/advanceLeagueTier precisam do state atual — mesmo padrão de ProgressionAdvanceContext, sem unlockChoice (nenhum dos dois gera marco multi-opção). */
interface SingleClaimContext {
  readonly progression: PersistedProgression;
  readonly recentUnlocks: readonly string[];
  readonly storage: ProgressionStorage;
  readonly telemetry: TelemetryProvider;
}

/**
 * Aplica uma atualização pontual de estatísticas (ex.: recordDailySubmission,
 * recordLeagueTier) e reivindica automaticamente os Títulos de opção única
 * atingidos — mesmo mecanismo de claimReachedSingles que advanceProgression
 * já usa, extraído aqui porque ADR 0010 tem duas fontes de Título fora do
 * fim de Run (Sequência do Desafio Diário e Tier da Liga), cada uma tocando
 * um stat diferente mas compondo exatamente os mesmos 3 passos.
 */
function advanceSingleMilestoneStats(
  updateStats: (stats: ProfileStats) => ProfileStats,
  context: SingleClaimContext,
): Pick<GameState, 'progression' | 'recentUnlocks'> {
  const stats = updateStats(context.progression.stats);
  const singles = claimReachedSingles({ ...context.progression, stats });
  let recentUnlocks = context.recentUnlocks;
  if (singles.claimed.length > 0) {
    recentUnlocks = singles.claimed.map(milestoneOptionTitle);
    for (const optionId of singles.claimed) {
      void context.telemetry.logEvent('milestone_unlocked', milestoneUnlockedParams(optionId));
    }
  }
  saveProgression(context.storage, singles.persisted);
  return { progression: singles.persisted, recentUnlocks };
}

/**
 * Sequência do Desafio Diário (ADR 0010, ticket 01): soma o dia à Sequência
 * e reivindica automaticamente os Títulos de constância atingidos. Não toca
 * runsWon/bestRunScore/etc — o Desafio Diário não conta para essas
 * estatísticas (ver playSelection), só para a Sequência.
 */
function advanceDailyStreak(
  todayIso: string,
  context: SingleClaimContext,
): Pick<GameState, 'progression' | 'recentUnlocks'> {
  return advanceSingleMilestoneStats((stats) => recordDailySubmission(stats, todayIso), context);
}

/**
 * Tier da Liga (ADR 0010, ticket 03): registra o maior Tier já alcançado e
 * reivindica automaticamente os Títulos de progressão atingidos. Chamado a
 * cada consulta à Liga que devolver um Tier (fetchLeaderboard) — recordLeagueTier
 * já ignora observações que não superam o recorde, então chamar de novo com o
 * mesmo Tier (ou um mais baixo, após rebaixamento) é seguro e não reivindica nada.
 */
function advanceLeagueTier(
  tier: LeagueTier,
  context: SingleClaimContext,
): Pick<GameState, 'progression' | 'recentUnlocks'> {
  return advanceSingleMilestoneStats((stats) => recordLeagueTier(stats, tier), context);
}

/** Ports da Loja a partir do estado atual do store (mesmo padrão do dailyFlow). */
function shopFlowDeps(state: GameState): ShopFlowDeps {
  return { storage: state.shopStorage, provider: state.shopProvider, telemetry: state.telemetry };
}

/** Fatia da Loja (estado + remoção de anúncios) a partir do estado atual. */
function shopFlowSlice(state: GameState): ShopFlowState {
  return { shop: state.shop, adsRemoved: state.adsRemoved };
}

/** Ports do fluxo de push a partir do estado atual do store (mesmo padrão do dailyFlow/shopFlow). */
function pushFlowDeps(state: GameState): PushFlowDeps {
  return { provider: state.pushProvider, backend: state.pushBackend, storage: state.pushStorage };
}

/** Fatia de push (estado + deviceId, propriedade do Desafio Diário) a partir do estado atual. */
function pushFlowSlice(state: GameState): PushFlowState {
  return { push: state.push, deviceId: state.daily.deviceId };
}

/** Store singleton usado pela UI (memória; o app injeta SQLite no boot). */
export const gameStore = createGameStore();

/** Hook da UI: seleciona uma fatia do estado do store. */
export function useGameStore<T>(selector: (state: GameState) => T): T {
  return useStore(gameStore, selector);
}
