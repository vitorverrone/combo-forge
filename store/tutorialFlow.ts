/**
 * Motor do tutorial contextual em coach-mark (.scratch/tutorial-walkthrough)
 * — 3 passos guiados por spotlight durante a jogatina real, gatilhados pela
 * ação do jogador em vez de um botão fixo de "próximo": passos 1-2 na
 * GameScreen (selecionar carta; Limpar/Descartar, com um botão "Próximo"
 * adicional só nesse passo) e passo 3 na Forja (tocar numa oferta pra ver a
 * diferença entre Relíquia e Efeito de Carta).
 *
 * Dois gatilhos independentes, cada um com sua própria flag "já visto"
 * persistida: a seção da Forja pode disparar numa Run diferente da que
 * mostrou a seção da GameScreen (ex.: a 1ª Rodada foi perdida antes de
 * chegar na Forja) — nenhuma das duas depende da outra ter sido vista.
 *
 * Módulo puro: nenhum conhecimento de Zustand, telas ou navegação — as
 * telas (tickets 04/05) consomem o estado e despacham os eventos; o store
 * (gameStore.ts) orquestra a persistência via o port injetado.
 */

import { RunPhase } from '../engine';

export type TutorialStep = 1 | 2 | 3;

/** Total de passos do tour (2 na GameScreen + 1 na Forja) — usado pela UI na barra "Passo N de X". */
export const TOTAL_TUTORIAL_STEPS = 3;

export interface TutorialState {
  /** Passo ativo agora (null = nenhuma seção do tutorial no ar). */
  readonly activeStep: TutorialStep | null;
  readonly gameScreenSeen: boolean;
  readonly forgeSeen: boolean;
}

export const DEFAULT_TUTORIAL_STATE: TutorialState = {
  activeStep: null,
  gameScreenSeen: false,
  forgeSeen: false,
};

export type TutorialEvent =
  | { readonly type: 'cardTouched' }
  | { readonly type: 'clearOrDiscardTouched' }
  | { readonly type: 'nextPressed' }
  | { readonly type: 'skipOrCompletePressed' }
  | { readonly type: 'forgeOfferTouched' };

/**
 * Avança ou encerra o passo ativo conforme o evento. Eventos que não se
 * aplicam ao passo atual (ex.: `forgeOfferTouched` fora do passo 3) não
 * fazem nada — devolvem o mesmo estado.
 */
export function runTutorialCommand(state: TutorialState, event: TutorialEvent): TutorialState {
  switch (event.type) {
    case 'cardTouched':
      return state.activeStep === 1 ? { ...state, activeStep: 2 } : state;
    case 'clearOrDiscardTouched':
    case 'nextPressed':
      return state.activeStep === 2 ? completeGameScreen(state) : state;
    case 'forgeOfferTouched':
      return state.activeStep === 3 ? completeForge(state) : state;
    case 'skipOrCompletePressed':
      if (state.activeStep === 1 || state.activeStep === 2) return completeGameScreen(state);
      if (state.activeStep === 3) return completeForge(state);
      return state;
  }
}

function completeGameScreen(state: TutorialState): TutorialState {
  return { ...state, activeStep: null, gameScreenSeen: true };
}

function completeForge(state: TutorialState): TutorialState {
  return { ...state, activeStep: null, forgeSeen: true };
}

/** Inicia a seção GameScreen (passo 1) — chamar só depois de `shouldStartGameScreenTutorial` confirmar. */
export function startGameScreenTutorial(state: TutorialState): TutorialState {
  return { ...state, activeStep: 1 };
}

/** Inicia a seção Forja (passo 3) — chamar só depois de `shouldStartForgeTutorial` confirmar. */
export function startForgeTutorial(state: TutorialState): TutorialState {
  return { ...state, activeStep: 3 };
}

/**
 * O jogador saiu da tela de jogo (Rodada vencida ou perdida) com a seção
 * GameScreen ainda ativa (passo 1 ou 2, nunca dispensada) — conta como
 * vista: ele já interagiu o suficiente pra terminar a Rodada. Evita que a
 * seção fique "presa" ativa numa tela que não está mais em foco.
 */
export function abandonGameScreenTutorialIfActive(state: TutorialState): TutorialState {
  return state.activeStep === 1 || state.activeStep === 2 ? completeGameScreen(state) : state;
}

export interface GameScreenTutorialContext {
  readonly runMode: 'normal' | 'daily';
  readonly roundNumber: number;
  readonly phase: RunPhase;
}

/**
 * A seção GameScreen deveria começar agora? Run normal, Rodada 1, fase
 * 'playing', ainda não vista, e nenhuma outra seção já ativa.
 */
export function shouldStartGameScreenTutorial(
  state: TutorialState,
  context: GameScreenTutorialContext,
): boolean {
  return (
    context.runMode === 'normal' &&
    context.roundNumber === 1 &&
    context.phase === 'playing' &&
    !state.gameScreenSeen &&
    state.activeStep === null
  );
}

export interface ForgeTutorialContext {
  readonly runMode: 'normal' | 'daily';
  readonly phase: RunPhase;
}

/**
 * A seção Forja deveria começar agora? Run normal, fase 'forging', ainda
 * não vista, e nenhuma outra seção já ativa.
 */
export function shouldStartForgeTutorial(
  state: TutorialState,
  context: ForgeTutorialContext,
): boolean {
  return (
    context.runMode === 'normal' &&
    context.phase === 'forging' &&
    !state.forgeSeen &&
    state.activeStep === null
  );
}

/**
 * Port de persistência das duas flags "já visto" (memória nos testes;
 * SQLite no app via store/sqlite.ts, mesmo padrão dos outros ports do
 * projeto). Sem resumo de passo-a-passo — só o "já visto" de cada seção é
 * persistido; uma seção não concluída reaparece inteira da próxima vez que
 * o gatilho disparar (mesma regra do onboarding estático).
 *
 * Vive aqui (não em engine/) porque o tutorial não é regra de jogo — é uma
 * preocupação de fluxo/UI, mesmo domínio deste módulo.
 */
export interface TutorialStorage {
  readonly loadGameScreenSeen: () => boolean;
  readonly saveGameScreenSeen: () => void;
  readonly loadForgeSeen: () => boolean;
  readonly saveForgeSeen: () => void;
}

/** Implementação em memória do port, para testes. */
export function createMemoryTutorialStorage(initial?: {
  readonly gameScreenSeen?: boolean;
  readonly forgeSeen?: boolean;
}): TutorialStorage {
  let gameScreenSeen = initial?.gameScreenSeen ?? false;
  let forgeSeen = initial?.forgeSeen ?? false;
  return {
    loadGameScreenSeen: () => gameScreenSeen,
    saveGameScreenSeen: () => {
      gameScreenSeen = true;
    },
    loadForgeSeen: () => forgeSeen,
    saveForgeSeen: () => {
      forgeSeen = true;
    },
  };
}

/** Carrega o estado inicial do tutorial a partir do storage (nenhum passo ativo no boot). */
export function loadTutorialState(storage: TutorialStorage): TutorialState {
  return {
    activeStep: null,
    gameScreenSeen: storage.loadGameScreenSeen(),
    forgeSeen: storage.loadForgeSeen(),
  };
}

/**
 * Persiste a flag da seção que acabou de ser concluída nesta transição
 * (comparando o estado antes/depois de `runTutorialCommand` ou
 * `abandonGameScreenTutorialIfActive`). Não salva nada se nenhuma seção
 * mudou de "não visto" para "visto".
 */
export function persistTutorialTransition(
  previous: TutorialState,
  next: TutorialState,
  storage: TutorialStorage,
): void {
  if (next.gameScreenSeen && !previous.gameScreenSeen) storage.saveGameScreenSeen();
  if (next.forgeSeen && !previous.forgeSeen) storage.saveForgeSeen();
}
