/**
 * Motor do tutorial contextual em coach-mark (.scratch/tutorial-walkthrough)
 * — guiado por spotlight durante a jogatina real, gatilhado pela ação do
 * jogador em vez de um botão fixo de "próximo": 3 passos na GameScreen
 * (selecionar carta; Limpar/Descartar, com um botão "Próximo" adicional só
 * nesse passo; tocar no "?" de referência de Padrões) e 1 passo na Forja
 * (tocar numa oferta pra ver a diferença entre Relíquia e Efeito de Carta).
 *
 * As duas seções são estados completamente independentes — cada uma com seu
 * próprio campo de "passo ativo" e sua própria flag "já visto"
 * (`gameScreenActiveStep`/`gameScreenSeen` vs. `forgeActiveStep`/
 * `forgeSeen`), não um único contador de passo compartilhado entre as duas.
 * Isso não é só uma escolha de nomenclatura: garante, ao nível do reducer,
 * que um evento de uma seção (ex.: pular a GameScreen) nunca consegue
 * concluir ou interferir na outra — a Forja pode disparar numa Run diferente
 * da que mostrou a GameScreen (ex.: a 1ª Rodada foi perdida antes de chegar
 * na Forja), e o jogador pular a GameScreen não deveria impedir a Forja de
 * aparecer depois.
 *
 * Módulo puro: nenhum conhecimento de Zustand, telas ou navegação — as
 * telas (tickets 04/05) consomem o estado e despacham os eventos; o store
 * (gameStore.ts) orquestra a persistência via o port injetado.
 */

import { RunPhase } from '../engine';

export type GameScreenTutorialStep = 1 | 2 | 3;
export type ForgeTutorialStep = 1;

export interface TutorialState {
  /** Passo ativo agora na seção GameScreen (null = seção não está no ar). */
  readonly gameScreenActiveStep: GameScreenTutorialStep | null;
  /** Passo ativo agora na seção Forja (null = seção não está no ar). Independente do campo acima. */
  readonly forgeActiveStep: ForgeTutorialStep | null;
  readonly gameScreenSeen: boolean;
  readonly forgeSeen: boolean;
}

export const DEFAULT_TUTORIAL_STATE: TutorialState = {
  gameScreenActiveStep: null,
  forgeActiveStep: null,
  gameScreenSeen: false,
  forgeSeen: false,
};

export type TutorialEvent =
  | { readonly type: 'cardTouched' }
  | { readonly type: 'clearOrDiscardTouched' }
  | { readonly type: 'nextPressed' }
  | { readonly type: 'patternReferenceTouched' }
  | { readonly type: 'gameScreenSkipPressed' }
  | { readonly type: 'forgeOfferTouched' }
  | { readonly type: 'forgeCompletePressed' };

/**
 * Avança ou encerra o passo ativo conforme o evento. Cada evento só enxerga
 * e só altera o campo da SUA seção — um evento da GameScreen nunca lê nem
 * escreve `forgeActiveStep`/`forgeSeen`, e vice-versa. Eventos que não se
 * aplicam ao passo atual daquela seção não fazem nada — devolvem o mesmo
 * estado.
 */
export function runTutorialCommand(state: TutorialState, event: TutorialEvent): TutorialState {
  switch (event.type) {
    case 'cardTouched':
      return state.gameScreenActiveStep === 1 ? { ...state, gameScreenActiveStep: 2 } : state;
    case 'clearOrDiscardTouched':
    case 'nextPressed':
      return state.gameScreenActiveStep === 2 ? { ...state, gameScreenActiveStep: 3 } : state;
    case 'patternReferenceTouched':
      return state.gameScreenActiveStep === 3 ? completeGameScreen(state) : state;
    case 'gameScreenSkipPressed':
      return state.gameScreenActiveStep !== null ? completeGameScreen(state) : state;
    case 'forgeOfferTouched':
    case 'forgeCompletePressed':
      return state.forgeActiveStep === 1 ? completeForge(state) : state;
  }
}

function completeGameScreen(state: TutorialState): TutorialState {
  return { ...state, gameScreenActiveStep: null, gameScreenSeen: true };
}

function completeForge(state: TutorialState): TutorialState {
  return { ...state, forgeActiveStep: null, forgeSeen: true };
}

/** Inicia a seção GameScreen (passo 1) — chamar só depois de `shouldStartGameScreenTutorial` confirmar. */
export function startGameScreenTutorial(state: TutorialState): TutorialState {
  return { ...state, gameScreenActiveStep: 1 };
}

/** Inicia a seção Forja (passo 1, próprio — não relacionado ao passo 1 da GameScreen) — chamar só depois de `shouldStartForgeTutorial` confirmar. */
export function startForgeTutorial(state: TutorialState): TutorialState {
  return { ...state, forgeActiveStep: 1 };
}

/**
 * O jogador saiu da tela de jogo (Rodada vencida ou perdida) com a seção
 * GameScreen ainda ativa (qualquer um dos 3 passos, nunca dispensada) —
 * conta como vista: ele já interagiu o suficiente pra terminar a Rodada.
 * Evita que a seção fique "presa" ativa numa tela que não está mais em
 * foco. Não toca na seção Forja.
 */
export function abandonGameScreenTutorialIfActive(state: TutorialState): TutorialState {
  return state.gameScreenActiveStep !== null ? completeGameScreen(state) : state;
}

export interface GameScreenTutorialContext {
  readonly runMode: 'normal' | 'daily';
  readonly roundNumber: number;
  readonly phase: RunPhase;
}

/**
 * A seção GameScreen deveria começar agora? Run normal, Rodada 1, fase
 * 'playing', ainda não vista, e a seção GameScreen ainda não está ativa.
 * Não depende do estado da seção Forja.
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
    state.gameScreenActiveStep === null
  );
}

export interface ForgeTutorialContext {
  readonly runMode: 'normal' | 'daily';
  readonly phase: RunPhase;
}

/**
 * A seção Forja deveria começar agora? Run normal, fase 'forging', ainda
 * não vista, e a seção Forja ainda não está ativa. Não depende do estado da
 * seção GameScreen — pular ou nunca ter visto a GameScreen não impede a
 * Forja de disparar.
 */
export function shouldStartForgeTutorial(
  state: TutorialState,
  context: ForgeTutorialContext,
): boolean {
  return (
    context.runMode === 'normal' &&
    context.phase === 'forging' &&
    !state.forgeSeen &&
    state.forgeActiveStep === null
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

/** Carrega o estado inicial do tutorial a partir do storage (nenhum passo ativo em nenhuma seção no boot). */
export function loadTutorialState(storage: TutorialStorage): TutorialState {
  return {
    gameScreenActiveStep: null,
    forgeActiveStep: null,
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
