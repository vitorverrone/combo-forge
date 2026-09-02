import {
  abandonGameScreenTutorialIfActive,
  createMemoryTutorialStorage,
  DEFAULT_TUTORIAL_STATE,
  loadTutorialState,
  persistTutorialTransition,
  runTutorialCommand,
  shouldStartForgeTutorial,
  shouldStartGameScreenTutorial,
  startForgeTutorial,
  startGameScreenTutorial,
  TutorialState,
} from './tutorialFlow';

const atGameScreenStep = (step: number | null, overrides: Partial<TutorialState> = {}): TutorialState => ({
  ...DEFAULT_TUTORIAL_STATE,
  gameScreenActiveStep: step,
  ...overrides,
});

const atForgeStep = (step: 1 | null, overrides: Partial<TutorialState> = {}): TutorialState => ({
  ...DEFAULT_TUTORIAL_STATE,
  forgeActiveStep: step,
  ...overrides,
});

describe('runTutorialCommand — passo 1 (seleção de carta)', () => {
  test('cardTouched avança do passo 1 pro passo 2', () => {
    const next = runTutorialCommand(atGameScreenStep(1), { type: 'cardTouched' });
    expect(next.gameScreenActiveStep).toBe(2);
    expect(next.gameScreenSeen).toBe(false);
  });

  test('cardTouched não faz nada fora do passo 1', () => {
    expect(runTutorialCommand(atGameScreenStep(2), { type: 'cardTouched' }).gameScreenActiveStep).toBe(2);
    expect(runTutorialCommand(atGameScreenStep(3), { type: 'cardTouched' }).gameScreenActiveStep).toBe(3);
    expect(runTutorialCommand(atGameScreenStep(null), { type: 'cardTouched' }).gameScreenActiveStep).toBeNull();
  });
});

describe('runTutorialCommand — passo 2 (Limpar/Descartar + Próximo)', () => {
  test('clearOrDiscardTouched avança do passo 2 pro passo 3 (relíquias ativas)', () => {
    const next = runTutorialCommand(atGameScreenStep(2), { type: 'clearOrDiscardTouched' });
    expect(next.gameScreenActiveStep).toBe(3);
    expect(next.gameScreenSeen).toBe(false);
  });

  test('nextPressed produz o mesmo resultado que clearOrDiscardTouched no passo 2', () => {
    const next = runTutorialCommand(atGameScreenStep(2), { type: 'nextPressed' });
    expect(next.gameScreenActiveStep).toBe(3);
  });

  test('clearOrDiscardTouched não faz nada fora do passo 2 (nextPressed também avança o passo 3, testado abaixo)', () => {
    expect(runTutorialCommand(atGameScreenStep(1), { type: 'clearOrDiscardTouched' }).gameScreenActiveStep).toBe(1);
    expect(runTutorialCommand(atGameScreenStep(3), { type: 'clearOrDiscardTouched' }).gameScreenActiveStep).toBe(3);
    expect(runTutorialCommand(atGameScreenStep(1), { type: 'nextPressed' }).gameScreenActiveStep).toBe(1);
  });
});

describe('runTutorialCommand — passo 3 (relíquias ativas + Próximo)', () => {
  test('nextPressed avança do passo 3 pro passo 4 (referência de Padrões)', () => {
    const next = runTutorialCommand(atGameScreenStep(3), { type: 'nextPressed' });
    expect(next.gameScreenActiveStep).toBe(4);
    expect(next.gameScreenSeen).toBe(false);
  });

  test('clearOrDiscardTouched não faz nada no passo 3 — só nextPressed avança esse passo', () => {
    expect(runTutorialCommand(atGameScreenStep(3), { type: 'clearOrDiscardTouched' }).gameScreenActiveStep).toBe(3);
  });

  test('nextPressed não faz nada no passo 4 (já é o último — quem conclui de lá é patternReferenceTouched)', () => {
    expect(runTutorialCommand(atGameScreenStep(4), { type: 'nextPressed' }).gameScreenActiveStep).toBe(4);
  });
});

describe('runTutorialCommand — passo 4 (referência de Padrões, o "?")', () => {
  test('patternReferenceTouched conclui a seção GameScreen a partir do passo 4', () => {
    const next = runTutorialCommand(atGameScreenStep(4), { type: 'patternReferenceTouched' });
    expect(next.gameScreenActiveStep).toBeNull();
    expect(next.gameScreenSeen).toBe(true);
  });

  test('patternReferenceTouched não faz nada fora do passo 4', () => {
    expect(runTutorialCommand(atGameScreenStep(1), { type: 'patternReferenceTouched' }).gameScreenSeen).toBe(false);
    expect(runTutorialCommand(atGameScreenStep(2), { type: 'patternReferenceTouched' }).gameScreenSeen).toBe(false);
    expect(runTutorialCommand(atGameScreenStep(3), { type: 'patternReferenceTouched' }).gameScreenSeen).toBe(false);
    expect(runTutorialCommand(atGameScreenStep(null), { type: 'patternReferenceTouched' }).gameScreenSeen).toBe(false);
  });
});

describe('runTutorialCommand — gameScreenSkipPressed ("Pular tutorial")', () => {
  test('conclui a seção GameScreen a partir de qualquer um dos 4 passos', () => {
    for (const step of [1, 2, 3, 4] as const) {
      expect(runTutorialCommand(atGameScreenStep(step), { type: 'gameScreenSkipPressed' })).toEqual(
        atGameScreenStep(null, { gameScreenSeen: true }),
      );
    }
  });

  test('não faz nada sem passo ativo na GameScreen', () => {
    expect(runTutorialCommand(atGameScreenStep(null), { type: 'gameScreenSkipPressed' })).toEqual(
      atGameScreenStep(null),
    );
  });

  test('não mexe na seção Forja mesmo que ela esteja ativa ao mesmo tempo', () => {
    const bothActive: TutorialState = { ...DEFAULT_TUTORIAL_STATE, gameScreenActiveStep: 1, forgeActiveStep: 1 };
    const next = runTutorialCommand(bothActive, { type: 'gameScreenSkipPressed' });
    expect(next.gameScreenActiveStep).toBeNull();
    expect(next.gameScreenSeen).toBe(true);
    expect(next.forgeActiveStep).toBe(1);
    expect(next.forgeSeen).toBe(false);
  });
});

describe('runTutorialCommand — passo da Forja', () => {
  test('forgeOfferTouched conclui a seção Forja a partir do passo ativo', () => {
    const next = runTutorialCommand(atForgeStep(1), { type: 'forgeOfferTouched' });
    expect(next.forgeActiveStep).toBeNull();
    expect(next.forgeSeen).toBe(true);
    expect(next.gameScreenSeen).toBe(false);
  });

  test('forgeCompletePressed ("Concluir") produz o mesmo resultado que tocar numa oferta', () => {
    const next = runTutorialCommand(atForgeStep(1), { type: 'forgeCompletePressed' });
    expect(next.forgeActiveStep).toBeNull();
    expect(next.forgeSeen).toBe(true);
  });

  test('forgeOfferTouched e forgeCompletePressed não fazem nada sem a Forja ativa', () => {
    expect(runTutorialCommand(atForgeStep(null), { type: 'forgeOfferTouched' }).forgeSeen).toBe(false);
    expect(runTutorialCommand(atForgeStep(null), { type: 'forgeCompletePressed' }).forgeSeen).toBe(false);
  });

  test('não mexem na seção GameScreen mesmo que ela esteja ativa ao mesmo tempo', () => {
    const bothActive: TutorialState = { ...DEFAULT_TUTORIAL_STATE, gameScreenActiveStep: 2, forgeActiveStep: 1 };
    const next = runTutorialCommand(bothActive, { type: 'forgeOfferTouched' });
    expect(next.forgeActiveStep).toBeNull();
    expect(next.forgeSeen).toBe(true);
    expect(next.gameScreenActiveStep).toBe(2);
    expect(next.gameScreenSeen).toBe(false);
  });
});

describe('independência entre as duas seções — o ponto central deste módulo', () => {
  test('pular a seção GameScreen em qualquer passo nunca marca a Forja como vista nem mexe no passo ativo dela', () => {
    for (const step of [1, 2, 3, 4] as const) {
      const state: TutorialState = { ...DEFAULT_TUTORIAL_STATE, gameScreenActiveStep: step, forgeActiveStep: 1 };
      const next = runTutorialCommand(state, { type: 'gameScreenSkipPressed' });
      expect(next.forgeSeen).toBe(false);
      expect(next.forgeActiveStep).toBe(1);
    }
  });

  test('concluir a Forja nunca marca a GameScreen como vista nem mexe no passo ativo dela', () => {
    const state: TutorialState = { ...DEFAULT_TUTORIAL_STATE, gameScreenActiveStep: 1, forgeActiveStep: 1 };
    const next = runTutorialCommand(state, { type: 'forgeCompletePressed' });
    expect(next.gameScreenSeen).toBe(false);
    expect(next.gameScreenActiveStep).toBe(1);
  });
});

describe('startGameScreenTutorial / startForgeTutorial', () => {
  test('startGameScreenTutorial ativa o passo 1 da GameScreen, sem tocar na Forja', () => {
    const next = startGameScreenTutorial(DEFAULT_TUTORIAL_STATE);
    expect(next.gameScreenActiveStep).toBe(1);
    expect(next.forgeActiveStep).toBeNull();
  });

  test('startForgeTutorial ativa o passo 1 da Forja, sem tocar na GameScreen', () => {
    const next = startForgeTutorial(DEFAULT_TUTORIAL_STATE);
    expect(next.forgeActiveStep).toBe(1);
    expect(next.gameScreenActiveStep).toBeNull();
  });

  test('as duas seções podem estar ativas ao mesmo tempo sem conflito', () => {
    const next = startForgeTutorial(startGameScreenTutorial(DEFAULT_TUTORIAL_STATE));
    expect(next.gameScreenActiveStep).toBe(1);
    expect(next.forgeActiveStep).toBe(1);
  });
});

describe('abandonGameScreenTutorialIfActive', () => {
  test('conclui a seção GameScreen se qualquer um dos 4 passos estava ativo', () => {
    for (const step of [1, 2, 3, 4] as const) {
      expect(abandonGameScreenTutorialIfActive(atGameScreenStep(step)).gameScreenSeen).toBe(true);
      expect(abandonGameScreenTutorialIfActive(atGameScreenStep(step)).gameScreenActiveStep).toBeNull();
    }
  });

  test('não faz nada sem passo ativo', () => {
    expect(abandonGameScreenTutorialIfActive(atGameScreenStep(null))).toEqual(atGameScreenStep(null));
  });

  test('não mexe na seção Forja', () => {
    const state: TutorialState = { ...DEFAULT_TUTORIAL_STATE, gameScreenActiveStep: 1, forgeActiveStep: 1 };
    const next = abandonGameScreenTutorialIfActive(state);
    expect(next.forgeActiveStep).toBe(1);
    expect(next.forgeSeen).toBe(false);
  });
});

describe('shouldStartGameScreenTutorial — gatilho independente', () => {
  const eligibleContext = { runMode: 'normal' as const, roundNumber: 1, phase: 'playing' as const };

  test('true quando Run normal, Rodada 1, fase playing, ainda não vista, seção não ativa', () => {
    expect(shouldStartGameScreenTutorial(DEFAULT_TUTORIAL_STATE, eligibleContext)).toBe(true);
  });

  test('false no Desafio Diário', () => {
    expect(
      shouldStartGameScreenTutorial(DEFAULT_TUTORIAL_STATE, { ...eligibleContext, runMode: 'daily' }),
    ).toBe(false);
  });

  test('false fora da Rodada 1', () => {
    expect(
      shouldStartGameScreenTutorial(DEFAULT_TUTORIAL_STATE, { ...eligibleContext, roundNumber: 2 }),
    ).toBe(false);
  });

  test('false fora da fase playing', () => {
    expect(
      shouldStartGameScreenTutorial(DEFAULT_TUTORIAL_STATE, { ...eligibleContext, phase: 'forging' }),
    ).toBe(false);
  });

  test('false se a seção já foi vista', () => {
    expect(
      shouldStartGameScreenTutorial(atGameScreenStep(null, { gameScreenSeen: true }), eligibleContext),
    ).toBe(false);
  });

  test('false se a seção GameScreen já está ativa', () => {
    expect(shouldStartGameScreenTutorial(atGameScreenStep(2), eligibleContext)).toBe(false);
  });

  test('não depende da seção Forja já ter sido vista nem de estar ativa (gatilhos independentes)', () => {
    const state: TutorialState = { ...DEFAULT_TUTORIAL_STATE, forgeSeen: true, forgeActiveStep: 1 };
    expect(shouldStartGameScreenTutorial(state, eligibleContext)).toBe(true);
  });
});

describe('shouldStartForgeTutorial — gatilho independente', () => {
  const eligibleContext = { runMode: 'normal' as const, phase: 'forging' as const };

  test('true quando Run normal, fase forging, ainda não vista, seção não ativa', () => {
    expect(shouldStartForgeTutorial(DEFAULT_TUTORIAL_STATE, eligibleContext)).toBe(true);
  });

  test('false no Desafio Diário', () => {
    expect(shouldStartForgeTutorial(DEFAULT_TUTORIAL_STATE, { ...eligibleContext, runMode: 'daily' })).toBe(
      false,
    );
  });

  test('false fora da fase forging', () => {
    expect(shouldStartForgeTutorial(DEFAULT_TUTORIAL_STATE, { ...eligibleContext, phase: 'playing' })).toBe(
      false,
    );
  });

  test('false se a seção já foi vista', () => {
    expect(shouldStartForgeTutorial(atForgeStep(null, { forgeSeen: true }), eligibleContext)).toBe(false);
  });

  test('false se a seção Forja já está ativa', () => {
    expect(shouldStartForgeTutorial(atForgeStep(1), eligibleContext)).toBe(false);
  });

  test('não depende da seção GameScreen já ter sido vista nem de estar ativa (gatilhos independentes) — pode disparar numa Run diferente da que mostrou os 3 passos da GameScreen', () => {
    const state: TutorialState = { ...DEFAULT_TUTORIAL_STATE, gameScreenSeen: false, gameScreenActiveStep: 2 };
    expect(shouldStartForgeTutorial(state, eligibleContext)).toBe(true);
  });

  test('true mesmo se o jogador pulou a seção GameScreen (gameScreenSeen=true não bloqueia a Forja)', () => {
    const state: TutorialState = { ...DEFAULT_TUTORIAL_STATE, gameScreenSeen: true };
    expect(shouldStartForgeTutorial(state, eligibleContext)).toBe(true);
  });
});

describe('persistência (TutorialStorage)', () => {
  test('createMemoryTutorialStorage começa com as duas flags falsas por padrão', () => {
    const storage = createMemoryTutorialStorage();
    expect(storage.loadGameScreenSeen()).toBe(false);
    expect(storage.loadForgeSeen()).toBe(false);
  });

  test('createMemoryTutorialStorage aceita estado inicial', () => {
    const storage = createMemoryTutorialStorage({ gameScreenSeen: true });
    expect(storage.loadGameScreenSeen()).toBe(true);
    expect(storage.loadForgeSeen()).toBe(false);
  });

  test('loadTutorialState lê as duas flags do storage, sem passo ativo em nenhuma seção', () => {
    const storage = createMemoryTutorialStorage({ gameScreenSeen: true, forgeSeen: false });
    expect(loadTutorialState(storage)).toEqual({
      gameScreenActiveStep: null,
      forgeActiveStep: null,
      gameScreenSeen: true,
      forgeSeen: false,
    });
  });

  test('persistTutorialTransition salva só a seção que acabou de ser concluída', () => {
    const storage = createMemoryTutorialStorage();
    const previous = atGameScreenStep(2);
    const next = runTutorialCommand(previous, { type: 'clearOrDiscardTouched' });
    persistTutorialTransition(previous, next, storage);
    expect(storage.loadGameScreenSeen()).toBe(false);
    expect(storage.loadForgeSeen()).toBe(false);
  });

  test('persistTutorialTransition não salva nada quando nenhuma seção muda de "visto"', () => {
    const storage = createMemoryTutorialStorage();
    const previous = atGameScreenStep(1);
    const next = runTutorialCommand(previous, { type: 'cardTouched' });
    persistTutorialTransition(previous, next, storage);
    expect(storage.loadGameScreenSeen()).toBe(false);
    expect(storage.loadForgeSeen()).toBe(false);
  });

  test('uma seção já marcada como vista não reaparece: o gatilho lido do storage persistido continua false', () => {
    const storage = createMemoryTutorialStorage();
    const seenState = runTutorialCommand(atForgeStep(1), { type: 'forgeOfferTouched' });
    persistTutorialTransition(atForgeStep(1), seenState, storage);

    // Nova "sessão": estado carregado de novo do storage.
    const reloaded = loadTutorialState(storage);
    expect(
      shouldStartForgeTutorial(reloaded, { runMode: 'normal', phase: 'forging' }),
    ).toBe(false);
  });
});
