/**
 * Camada de estado (Zustand) da Run jogável.
 *
 * Nenhuma regra de jogo vive aqui: o store apenas (a) guarda o estado do
 * motor (RunState) e estado de UI (tela, seleção de cartas), (b) despacha as
 * ações do jogador para o motor puro com a stream de RNG contínua que ele
 * mesmo criou no startRun e (c) persiste o histórico DDA ao fim de cada
 * Rodada (port de storage injetado). Tudo o que a UI precisa ler (preview do
 * Padrão, etc.) vem de funções puras do motor.
 */

import { useStore } from 'zustand';
import { createStore, StoreApi } from 'zustand/vanilla';

import {
  activeRelics,
  Card,
  cardKey,
  createMemoryDdaStorage,
  createSeededRng,
  currentPlayNumber,
  DEFAULT_DDA_CONFIG,
  discard,
  DdaStorage,
  evaluatePlay,
  ForgerId,
  isEasyWin,
  loadDda,
  makePlay,
  persistDda,
  PlayEvaluation,
  Rng,
  RunEvent,
  RunState,
  scoreModifiers,
  startRun as engineStartRun,
} from '../engine';

export type Screen = 'start' | 'game';

/** Máximo de cartas selecionáveis (tamanho máximo de uma Jogada). */
export const MAX_SELECTION = 5;

export interface GameState {
  readonly screen: Screen;
  readonly forger: ForgerId;
  readonly run: RunState | null;
  /** Identidades (`naipe:valor`) das cartas da Mão selecionadas. */
  readonly selectedKeys: readonly string[];
  /** Eventos do motor da última ação (para a UI reagir a eles). */
  readonly lastEvents: readonly RunEvent[];
  /** Stream contínua de RNG da Run; criada no startRun e usada em toda ação. */
  readonly rng: Rng | null;
  readonly ddaStorage: DdaStorage;

  readonly chooseForger: (forger: ForgerId) => void;
  readonly startRun: () => void;
  readonly toggleCard: (key: string) => void;
  readonly clearSelection: () => void;
  readonly playSelection: () => void;
  readonly discardSelection: () => void;
  readonly backToStart: () => void;
}

export interface GameStoreDeps {
  readonly ddaStorage?: DdaStorage;
  /** Fonte de seed da próxima Run (padrão: relógio; injetável em testes). */
  readonly seed?: () => number;
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

export function createGameStore(deps: GameStoreDeps = {}): StoreApi<GameState> {
  const ddaStorage = deps.ddaStorage ?? createMemoryDdaStorage();
  const nextSeed = deps.seed ?? (() => (Date.now() % 0xffffffff) >>> 0);

  return createStore<GameState>()((set, get) => ({
    screen: 'start',
    forger: 'apprentice',
    run: null,
    selectedKeys: [],
    lastEvents: [],
    rng: null,
    ddaStorage,

    chooseForger: (forger) => set({ forger }),

    startRun: () => {
      const forger = get().forger;
      const seed = nextSeed();
      const rng = createSeededRng(seed);
      const dda = loadDda(ddaStorage, DEFAULT_DDA_CONFIG);
      const run = engineStartRun(seed, { forger, dda, ddaConfig: DEFAULT_DDA_CONFIG, rng });
      set({ screen: 'game', run, rng, selectedKeys: [], lastEvents: [] });
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
      const { run, rng, selectedKeys, ddaStorage: storage } = get();
      if (run === null || rng === null || selectedKeys.length === 0) return;
      try {
        const result = makePlay(run, selectedCards(run, selectedKeys), rng);
        persistRoundEnd(result.run, result.events, storage);
        set({ run: result.run, selectedKeys: [], lastEvents: result.events });
      } catch {
        // Jogada inválida (defesa da UI): estado permanece intacto
      }
    },

    discardSelection: () => {
      const { run, rng, selectedKeys, ddaStorage: storage } = get();
      if (run === null || rng === null || selectedKeys.length === 0) return;
      try {
        const nextRun = discard(run, selectedCards(run, selectedKeys), rng);
        set({ run: nextRun, selectedKeys: [], lastEvents: [] });
      } catch {
        // Sem Descarte restante (defesa da UI): estado permanece intacto
      }
    },

    backToStart: () =>
      set({ screen: 'start', run: null, selectedKeys: [], lastEvents: [], rng: null }),
  }));
}

/** Store singleton usado pela UI. */
export const gameStore = createGameStore();

/** Hook da UI: seleciona uma fatia do estado do store. */
export function useGameStore<T>(selector: (state: GameState) => T): T {
  return useStore(gameStore, selector);
}
