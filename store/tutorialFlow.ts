/**
 * Motor do tutorial contextual em coach-mark (.scratch/tutorial-walkthrough)
 * — guiado por spotlight durante a jogatina real, gatilhado pela ação do
 * jogador em vez de um botão fixo de "próximo".
 *
 * Cada seção (GameScreen, Forja) é uma SEQUÊNCIA de passos declarada em
 * `GAME_SCREEN_STEPS`/`FORGE_STEPS` logo abaixo — cada passo lista os
 * eventos que o avançam pro próximo (ou concluem a seção, se for o último
 * da lista). Adicionar um passo novo é só acrescentar uma entrada na lista
 * certa (+ o evento novo em `TutorialEvent`, se o gatilho ainda não existir)
 * — `runTutorialCommand` nunca precisa mudar, porque ele não sabe quantos
 * passos cada seção tem, só sabe avançar "o passo ativo, se o evento bater
 * com o que esse passo espera".
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

/** 1-based — o passo N existe só se a seção tiver pelo menos N entradas na lista de passos. */
export type GameScreenTutorialStep = number;
export type ForgeTutorialStep = number;

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

interface TutorialStepDefinition {
  /** Eventos que avançam ESTE passo pro próximo (ou concluem a seção, se for o último da lista). */
  readonly advanceOn: readonly TutorialEvent['type'][];
}

/**
 * Passos da seção GameScreen, em ordem: 1) selecionar carta; 2) Limpar/
 * Descartar (ou o botão "Próximo" desse passo); 3) relíquias ativas (botão
 * "Próximo"); 4) tocar no "?" de referência de Padrões, que conclui a seção.
 */
const GAME_SCREEN_STEPS: readonly TutorialStepDefinition[] = [
  { advanceOn: ['cardTouched'] },
  { advanceOn: ['clearOrDiscardTouched', 'nextPressed'] },
  { advanceOn: ['nextPressed'] },
  { advanceOn: ['patternReferenceTouched'] },
];

/** Passos da seção Forja: 1) tocar numa oferta ou no botão "Concluir", que conclui a seção. */
const FORGE_STEPS: readonly TutorialStepDefinition[] = [
  { advanceOn: ['forgeOfferTouched', 'forgeCompletePressed'] },
];

/**
 * Avança o passo ativo de UMA seção, se o evento bater com o que esse passo
 * espera. Sem passo ativo, ou evento que não se aplica ao passo atual: nada
 * muda. Passo ativo era o último da lista: a seção conclui (activeStep volta
 * a null, seen vira true).
 */
function advanceSection(
  steps: readonly TutorialStepDefinition[],
  activeStep: number | null,
  eventType: TutorialEvent['type'],
): { readonly activeStep: number | null; readonly seen: boolean } {
  if (activeStep === null) return { activeStep: null, seen: false };
  const current = steps[activeStep - 1];
  if (current === undefined || !current.advanceOn.includes(eventType)) {
    return { activeStep, seen: false };
  }
  const nextStep = activeStep + 1;
  return nextStep > steps.length ? { activeStep: null, seen: true } : { activeStep: nextStep, seen: false };
}

/**
 * Avança ou encerra o passo ativo conforme o evento. Cada evento só enxerga
 * e só altera o campo da SUA seção — um evento da GameScreen nunca lê nem
 * escreve `forgeActiveStep`/`forgeSeen`, e vice-versa (cada seção usa sua
 * própria lista de passos: um evento só afeta a seção em cuja lista ele
 * aparece). Eventos que não se aplicam ao passo atual daquela seção não
 * fazem nada — devolvem o mesmo estado. `gameScreenSkipPressed` é o único
 * evento fora do modelo "avança o passo atual": ele conclui a seção
 * GameScreen a partir de QUALQUER passo ativo, não só do último.
 */
export function runTutorialCommand(state: TutorialState, event: TutorialEvent): TutorialState {
  if (event.type === 'gameScreenSkipPressed') {
    return state.gameScreenActiveStep !== null ? completeGameScreen(state) : state;
  }

  const gameScreen = advanceSection(GAME_SCREEN_STEPS, state.gameScreenActiveStep, event.type);
  const forge = advanceSection(FORGE_STEPS, state.forgeActiveStep, event.type);

  return {
    gameScreenActiveStep: gameScreen.activeStep,
    gameScreenSeen: state.gameScreenSeen || gameScreen.seen,
    forgeActiveStep: forge.activeStep,
    forgeSeen: state.forgeSeen || forge.seen,
  };
}

function completeGameScreen(state: TutorialState): TutorialState {
  return { ...state, gameScreenActiveStep: null, gameScreenSeen: true };
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
  readonly roundNumber: number;
  readonly phase: RunPhase;
}

/**
 * A seção GameScreen deveria começar agora? Rodada 1, fase 'playing', ainda
 * não vista, e a seção GameScreen ainda não está ativa — em qualquer modo de
 * Run (normal ou Desafio Diário, já que a 1ª partida do jogador pode ser
 * qualquer um dos dois). Não depende do estado da seção Forja.
 */
export function shouldStartGameScreenTutorial(
  state: TutorialState,
  context: GameScreenTutorialContext,
): boolean {
  return (
    context.roundNumber === 1 &&
    context.phase === 'playing' &&
    !state.gameScreenSeen &&
    state.gameScreenActiveStep === null
  );
}

export interface ForgeTutorialContext {
  readonly phase: RunPhase;
}

/**
 * A seção Forja deveria começar agora? Fase 'forging', ainda não vista, e a
 * seção Forja ainda não está ativa — em qualquer modo de Run (normal ou
 * Desafio Diário). Não depende do estado da seção GameScreen — pular ou
 * nunca ter visto a GameScreen não impede a Forja de disparar.
 */
export function shouldStartForgeTutorial(
  state: TutorialState,
  context: ForgeTutorialContext,
): boolean {
  return (
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
