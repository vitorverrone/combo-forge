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
  DdaStorage,
  applyForgeOffer as engineApplyForgeOffer,
  evaluatePlay,
  ForgerId,
  isEasyWin,
  isForgerUnlocked,
  isOptionClaimable,
  loadDda,
  makePlay,
  milestoneOptionTitle,
  PendingMilestone,
  pendingMilestones,
  PersistedProgression,
  persistDda,
  PlayEvaluation,
  ProgressionStorage,
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
  BreakHistory,
  BreakStorage,
  createInitialBreakHistory,
  createMemoryBreakStorage,
  DEFAULT_BREAK_REMINDER_CONFIG,
  markBreakSuggested,
  recordRunFinished,
  shouldSuggestBreak,
  createDevShopProvider,
  createMemoryShopStorage,
  normalizeShopState,
  PersistedShop,
  ShopProvider,
  ShopStorage,
} from '../engine';

import {
  DailyFlowDeps,
  DailyFlowResult,
  DailyState,
  runDailyCommand,
} from './dailyFlow';

import {
  equipCosmetic as equipCosmeticFlow,
  runShopCommand,
  ShopFlowDeps,
  ShopFlowState,
  ShopState,
} from './shopFlow';

export type { ShopState } from './shopFlow';

export type Screen = 'start' | 'game' | 'profile' | 'collection' | 'daily' | 'shop';

/** Modo da Run atual: normal (meta-progressão conta) ou Desafio Diário. */
export type RunMode = 'normal' | 'daily';

/** Máximo de cartas selecionáveis (tamanho máximo de uma Jogada). */
export const MAX_SELECTION = 5;

/** Intervalo de Runs entre anúncios intersticiais (ticket 02). */
const INTERSTITIAL_RUNS_INTERVAL = 2;

export interface GameState {
  readonly screen: Screen;
  readonly forger: ForgerId;
  /** Modo da Run atual (Desafio Diário não conta para meta-progressão). */
  readonly runMode: RunMode;
  readonly run: RunState | null;
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
  /** Loja cosmética (ticket 14) — itens só visuais, nunca poder. */
  readonly shop: ShopState;
  readonly shopStorage: ShopStorage;
  readonly shopProvider: ShopProvider;
  /**
   * Remoção de anúncios comprada (ticket 02): banner oculto em todas as
   * telas. Persistida via ShopStorage (mesmo padrão do owned da loja).
   */
  readonly adsRemoved: boolean;
  /** Lembrete gentil de pausa (ticket 15) — sugere, nunca bloqueia. */
  readonly breakSuggestion: boolean;
  readonly breakHistory: BreakHistory;
  readonly breakStorage: BreakStorage;
  /** Contador de Runs desde o último intersticial. */
  readonly interstitialRunsSinceAd: number;
  /** True quando um intersticial deve ser exibido (Run end screens consomem). */
  readonly showInterstitial: boolean;

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
  /** Dispensa o lembrete de pausa atual (cooldown; o jogo nunca é bloqueado). */
  readonly dismissBreakReminder: () => void;
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
  readonly applyForgeOffer: (offerIndex: number, targetCard?: Card) => void;
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
  /** Relógio injetável (padrão: Date.now; usado na fronteira de dia UTC). */
  readonly now?: () => Date;
  /** Port de persistência da loja (padrão: memória, p/ testes). */
  readonly shopStorage?: ShopStorage;
  /** Provider de compras (padrão: dev simulado; app injeta RevenueCat). */
  readonly shopProvider?: ShopProvider;
  /** Estado inicial da loja (padrão: vazio; injetável em testes). */
  readonly initialShop?: PersistedShop;
  /** Port de persistência do histórico de pausa (padrão: memória). */
  readonly breakStorage?: BreakStorage;
  /** Relógio para o lembrete de pausa (padrão: Date.now). */
  readonly breakNow?: () => number;
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
 */
export function persistRoundEnd(
  run: RunState,
  events: readonly RunEvent[],
  storage: DdaStorage,
): void {
  if (!run.ddaConfig.enabled) return;
  for (const event of events) {
    if (event.type === 'roundWon') {
      const easyWin = isEasyWin(event.score, event.target, run.playsRemaining, DEFAULT_DDA_CONFIG);
      persistDda(storage, run.dda, { roundNumber: event.roundNumber, won: true, easyWin });
    } else if (event.type === 'roundLost') {
      persistDda(storage, run.dda, { roundNumber: event.roundNumber, won: false, easyWin: false });
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
  const dailyStorage = deps.dailyStorage ?? createMemoryDailyChallengeStorage();
  const dailyBackend = deps.dailyBackend ?? createUnavailableDailyBackend();
  const adProvider = deps.adProvider ?? createDevAdProvider();
  const nextSeed = deps.seed ?? (() => (Date.now() % 0xffffffff) >>> 0);
  const now = deps.now ?? (() => new Date());

  const shopStorage = deps.shopStorage ?? createMemoryShopStorage();
  const shopProvider = deps.shopProvider ?? createDevShopProvider();
  const initialShop = deps.initialShop ?? normalizeShopState(shopStorage.load());
  const breakStorage = deps.breakStorage ?? createMemoryBreakStorage();
  const breakNow = deps.breakNow ?? (() => Date.now());
  const initialBreakHistory = breakStorage.load() ?? createInitialBreakHistory();

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

  return createStore<GameState>()((set, get) => ({
    screen: 'start',
    forger: 'apprentice',
    runMode: 'normal',
    run: null,
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
      leaderboardLoading: false,
      leaderboardError: null,
      displayName: dailyStorage.loadDisplayName(),
      displayNameStatus: 'idle',
      displayNameError: null,
    },
    dailyStorage,
    dailyBackend,
    adProvider,
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
    breakSuggestion: false,
    breakHistory: initialBreakHistory,
    breakStorage,
    interstitialRunsSinceAd: 0,
    showInterstitial: false,

    dismissBreakReminder: () => {
      const { breakHistory, breakStorage } = get();
      const next = markBreakSuggested(breakHistory, breakNow());
      breakStorage.save(next);
      set({ breakHistory: next, breakSuggestion: false });
    },

    dismissInterstitial: () => set({ showInterstitial: false }),

    openShop: () => {
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
      const { forger, progression } = get();
      const unlocks = computeUnlocks(progression);
      if (!isForgerUnlocked(unlocks, forger)) return;
      const seed = nextSeed();
      const rng = createSeededRng(seed);
      const dda = loadDda(ddaStorage, DEFAULT_DDA_CONFIG);
      const run = engineStartRun(seed, { forger, dda, ddaConfig: DEFAULT_DDA_CONFIG, rng, unlocks });
      set({ screen: 'game', runMode: 'normal', run, rng, selectedKeys: [], lastEvents: [], recentUnlocks: [] });
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
      set({ daily: result.daily });
    },

    setDisplayName: async (name: string) => {
      const result = await runDailyCommand(get().daily, dailyFlowDeps(get(), now), {
        type: 'setDisplayName',
        name,
      });
      set({ daily: result.daily });
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
        // Lembrete de pausa (ticket 15): toda Run encerrada conta, em qualquer
        // modo — a sugestão nunca bloqueia o jogo.
        const breakPatch = advanceBreakReminder(result.events, get().breakHistory, breakNow(), breakStorage);
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
            ...breakPatch,
          });
        } else {
          persistRoundEnd(result.run, result.events, storage);
          const ended = result.events.some(
            (event) => event.type === 'runWon' || event.type === 'runLost',
          );
          // Intersticial entre Runs (ticket 02): incrementa o contador a cada
          // Run concluída e agenda um intersticial quando atinge o intervalo.
          // Desafio Diário não conta (já tratado acima).
          let interstitialPatch: Partial<GameState> = {};
          if (ended && !get().adsRemoved) {
            const nextCount = get().interstitialRunsSinceAd + 1;
            if (nextCount >= INTERSTITIAL_RUNS_INTERVAL) {
              interstitialPatch = { interstitialRunsSinceAd: 0, showInterstitial: true };
            } else {
              interstitialPatch = { interstitialRunsSinceAd: nextCount };
            }
          }
          set({
            ...advanceProgression(result, played, progression, get().unlockChoice, get().recentUnlocks, progressionStorage),
            ...breakPatch,
            ...interstitialPatch,
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

    applyForgeOffer: (offerIndex, targetCard) => {
      const { run } = get();
      if (run === null || run.phase !== 'forging') return;
      try {
        const result = engineApplyForgeOffer(run, offerIndex, targetCard);
        set({ run: result.run, selectedKeys: [], lastEvents: result.events });
      } catch {
        // Oferta/carta inválida (defesa da UI): estado permanece intacto
      }
    },

    nextRound: () => {
      const { run, rng } = get();
      if (run === null || rng === null || run.phase !== 'roundWon') return;
      set({ run: startNextRound(run, rng), selectedKeys: [], lastEvents: [] });
    },

    restartRun: () => {
      // Nova Run com novo seed e o mesmo Forjador, sem passar pela tela inicial.
      get().startRun();
    },

    claimUnlock: (optionId) => {
      const { progression } = get();
      if (!isOptionClaimable(progression, optionId)) return;
      const next = engineClaimOption(progression, optionId);
      saveProgression(progressionStorage, next);
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
  }));
}

/**
 * Avança a meta-progressão após uma ação de Jogada: acumula estatísticas por
 * Jogada, registra o fim da Run (vitória/derrota + recorde), reivindica
 * automaticamente os marcos de opção única e expõe o marco multi-opção
 * (escolha da ordem) como modal. Persiste o resultado no storage.
 */
function advanceProgression(
  result: { run: RunState; events: readonly RunEvent[] },
  played: readonly Card[],
  progression: PersistedProgression,
  currentChoice: PendingMilestone | null,
  currentUnlocks: readonly string[],
  storage: ProgressionStorage,
): Partial<GameState> {
  let next: PersistedProgression = progression;
  let unlockChoice = currentChoice;
  let recentUnlocks = currentUnlocks;

  const playedEvent = result.events.find((event) => event.type === 'played');
  if (playedEvent !== undefined) {
    next = { ...next, stats: recordPlay(next.stats, played, playedEvent.multiplier) };
  }

  const ended = result.events.find(
    (event) => event.type === 'runWon' || event.type === 'runLost',
  );
  if (ended !== undefined) {
    next = { ...next, stats: recordRunEnd(next.stats, ended.type === 'runWon', result.run.runScore) };
    const singles = claimReachedSingles(next);
    next = singles.persisted;
    if (singles.claimed.length > 0) {
      recentUnlocks = singles.claimed.map(milestoneOptionTitle);
    }
    const multi = pendingMilestones(next).find((candidate) => candidate.milestone.options.length > 1);
    if (multi !== undefined) {
      unlockChoice = multi;
    }
  }

  // Grava a cada Jogada: o blob é pequeno (estatísticas + ids) e o port do
  // SQLite é síncrono via KV store — aceitável no MVP.
  saveProgression(storage, next);
  return {
    run: result.run,
    selectedKeys: [],
    lastEvents: result.events,
    progression: next,
    unlockChoice,
    recentUnlocks,
  };
}

/**
 * Atualiza o histórico de pausa quando uma Run termina (runWon/runLost):
 * registra o fim e computa a sugestão gentil. Devolve o patch de estado;
 * vazio quando não houve fim de Run. Nunca altera regra de jogo.
 */
function advanceBreakReminder(
  events: readonly RunEvent[],
  history: BreakHistory,
  nowMs: number,
  storage: BreakStorage,
): Partial<GameState> {
  const ended = events.some(
    (event) => event.type === 'runWon' || event.type === 'runLost',
  );
  if (!ended) return {};
  const next = recordRunFinished(history, nowMs);
  storage.save(next);
  return {
    breakHistory: next,
    breakSuggestion: shouldSuggestBreak(next, nowMs, DEFAULT_BREAK_REMINDER_CONFIG),
  };
}

/** Ports da Loja a partir do estado atual do store (mesmo padrão do dailyFlow). */
function shopFlowDeps(state: GameState): ShopFlowDeps {
  return { storage: state.shopStorage, provider: state.shopProvider };
}

/** Fatia da Loja (estado + remoção de anúncios) a partir do estado atual. */
function shopFlowSlice(state: GameState): ShopFlowState {
  return { shop: state.shop, adsRemoved: state.adsRemoved };
}

/** Store singleton usado pela UI (memória; o app injeta SQLite no boot). */
export const gameStore = createGameStore();

/** Hook da UI: seleciona uma fatia do estado do store. */
export function useGameStore<T>(selector: (state: GameState) => T): T {
  return useStore(gameStore, selector);
}
