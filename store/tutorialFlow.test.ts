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

const atStep = (step: 1 | 2 | 3 | null, overrides: Partial<TutorialState> = {}): TutorialState => ({
  ...DEFAULT_TUTORIAL_STATE,
  activeStep: step,
  ...overrides,
});

describe('runTutorialCommand — passo 1 (seleção de carta)', () => {
  test('cardTouched avança do passo 1 pro passo 2', () => {
    const next = runTutorialCommand(atStep(1), { type: 'cardTouched' });
    expect(next.activeStep).toBe(2);
    expect(next.gameScreenSeen).toBe(false);
  });

  test('cardTouched não faz nada fora do passo 1', () => {
    expect(runTutorialCommand(atStep(2), { type: 'cardTouched' }).activeStep).toBe(2);
    expect(runTutorialCommand(atStep(3), { type: 'cardTouched' }).activeStep).toBe(3);
    expect(runTutorialCommand(atStep(null), { type: 'cardTouched' }).activeStep).toBeNull();
  });
});

describe('runTutorialCommand — passo 2 (Limpar/Descartar + Próximo)', () => {
  test('clearOrDiscardTouched conclui a seção GameScreen a partir do passo 2', () => {
    const next = runTutorialCommand(atStep(2), { type: 'clearOrDiscardTouched' });
    expect(next.activeStep).toBeNull();
    expect(next.gameScreenSeen).toBe(true);
    expect(next.forgeSeen).toBe(false);
  });

  test('nextPressed produz o mesmo resultado que clearOrDiscardTouched no passo 2', () => {
    const next = runTutorialCommand(atStep(2), { type: 'nextPressed' });
    expect(next.activeStep).toBeNull();
    expect(next.gameScreenSeen).toBe(true);
  });

  test('clearOrDiscardTouched e nextPressed não fazem nada fora do passo 2', () => {
    expect(runTutorialCommand(atStep(1), { type: 'clearOrDiscardTouched' }).activeStep).toBe(1);
    expect(runTutorialCommand(atStep(3), { type: 'clearOrDiscardTouched' }).activeStep).toBe(3);
    expect(runTutorialCommand(atStep(1), { type: 'nextPressed' }).activeStep).toBe(1);
    expect(runTutorialCommand(atStep(3), { type: 'nextPressed' }).activeStep).toBe(3);
  });
});

describe('runTutorialCommand — passo 3 (Forja)', () => {
  test('forgeOfferTouched conclui a seção Forja a partir do passo 3', () => {
    const next = runTutorialCommand(atStep(3), { type: 'forgeOfferTouched' });
    expect(next.activeStep).toBeNull();
    expect(next.forgeSeen).toBe(true);
    expect(next.gameScreenSeen).toBe(false);
  });

  test('forgeOfferTouched não faz nada fora do passo 3', () => {
    expect(runTutorialCommand(atStep(1), { type: 'forgeOfferTouched' }).activeStep).toBe(1);
    expect(runTutorialCommand(atStep(2), { type: 'forgeOfferTouched' }).activeStep).toBe(2);
    expect(runTutorialCommand(atStep(null), { type: 'forgeOfferTouched' }).forgeSeen).toBe(false);
  });
});

describe('runTutorialCommand — skipOrCompletePressed ("Pular tutorial" / "Concluir")', () => {
  test('conclui a seção GameScreen quando o passo ativo é 1 ou 2', () => {
    expect(runTutorialCommand(atStep(1), { type: 'skipOrCompletePressed' })).toEqual(
      atStep(null, { gameScreenSeen: true }),
    );
    expect(runTutorialCommand(atStep(2), { type: 'skipOrCompletePressed' })).toEqual(
      atStep(null, { gameScreenSeen: true }),
    );
  });

  test('conclui a seção Forja quando o passo ativo é 3', () => {
    expect(runTutorialCommand(atStep(3), { type: 'skipOrCompletePressed' })).toEqual(
      atStep(null, { forgeSeen: true }),
    );
  });

  test('não faz nada sem passo ativo', () => {
    expect(runTutorialCommand(atStep(null), { type: 'skipOrCompletePressed' })).toEqual(atStep(null));
  });
});

describe('startGameScreenTutorial / startForgeTutorial', () => {
  test('startGameScreenTutorial ativa o passo 1', () => {
    expect(startGameScreenTutorial(DEFAULT_TUTORIAL_STATE).activeStep).toBe(1);
  });

  test('startForgeTutorial ativa o passo 3', () => {
    expect(startForgeTutorial(DEFAULT_TUTORIAL_STATE).activeStep).toBe(3);
  });
});

describe('abandonGameScreenTutorialIfActive', () => {
  test('conclui a seção GameScreen se o passo 1 ou 2 estava ativo', () => {
    expect(abandonGameScreenTutorialIfActive(atStep(1)).gameScreenSeen).toBe(true);
    expect(abandonGameScreenTutorialIfActive(atStep(1)).activeStep).toBeNull();
    expect(abandonGameScreenTutorialIfActive(atStep(2)).gameScreenSeen).toBe(true);
  });

  test('não mexe na seção Forja nem em nenhum passo ativo fora de 1/2', () => {
    expect(abandonGameScreenTutorialIfActive(atStep(3))).toEqual(atStep(3));
    expect(abandonGameScreenTutorialIfActive(atStep(null))).toEqual(atStep(null));
  });
});

describe('shouldStartGameScreenTutorial — gatilho independente', () => {
  const eligibleContext = { runMode: 'normal' as const, roundNumber: 1, phase: 'playing' as const };

  test('true quando Run normal, Rodada 1, fase playing, ainda não vista, nenhuma seção ativa', () => {
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
      shouldStartGameScreenTutorial(atStep(null, { gameScreenSeen: true }), eligibleContext),
    ).toBe(false);
  });

  test('false se alguma seção já está ativa', () => {
    expect(shouldStartGameScreenTutorial(atStep(3), eligibleContext)).toBe(false);
  });

  test('não depende da seção Forja já ter sido vista (gatilhos independentes)', () => {
    expect(
      shouldStartGameScreenTutorial(atStep(null, { forgeSeen: true }), eligibleContext),
    ).toBe(true);
  });
});

describe('shouldStartForgeTutorial — gatilho independente', () => {
  const eligibleContext = { runMode: 'normal' as const, phase: 'forging' as const };

  test('true quando Run normal, fase forging, ainda não vista, nenhuma seção ativa', () => {
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
    expect(shouldStartForgeTutorial(atStep(null, { forgeSeen: true }), eligibleContext)).toBe(false);
  });

  test('false se alguma seção já está ativa', () => {
    expect(shouldStartForgeTutorial(atStep(1), eligibleContext)).toBe(false);
  });

  test('não depende da seção GameScreen já ter sido vista (gatilhos independentes) — pode disparar numa Run diferente da que mostrou os passos 1-2', () => {
    expect(shouldStartForgeTutorial(atStep(null, { gameScreenSeen: false }), eligibleContext)).toBe(true);
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

  test('loadTutorialState lê as duas flags do storage, sem passo ativo', () => {
    const storage = createMemoryTutorialStorage({ gameScreenSeen: true, forgeSeen: false });
    expect(loadTutorialState(storage)).toEqual({
      activeStep: null,
      gameScreenSeen: true,
      forgeSeen: false,
    });
  });

  test('persistTutorialTransition salva só a seção que acabou de ser concluída', () => {
    const storage = createMemoryTutorialStorage();
    const previous = atStep(2);
    const next = runTutorialCommand(previous, { type: 'clearOrDiscardTouched' });
    persistTutorialTransition(previous, next, storage);
    expect(storage.loadGameScreenSeen()).toBe(true);
    expect(storage.loadForgeSeen()).toBe(false);
  });

  test('persistTutorialTransition não salva nada quando nenhuma seção muda de "visto"', () => {
    const storage = createMemoryTutorialStorage();
    const previous = atStep(1);
    const next = runTutorialCommand(previous, { type: 'cardTouched' });
    persistTutorialTransition(previous, next, storage);
    expect(storage.loadGameScreenSeen()).toBe(false);
    expect(storage.loadForgeSeen()).toBe(false);
  });

  test('uma seção já marcada como vista não reaparece: o gatilho lido do storage persistido continua false', () => {
    const storage = createMemoryTutorialStorage();
    const seenState = runTutorialCommand(atStep(3), { type: 'forgeOfferTouched' });
    persistTutorialTransition(atStep(3), seenState, storage);

    // Nova "sessão": estado carregado de novo do storage.
    const reloaded = loadTutorialState(storage);
    expect(
      shouldStartForgeTutorial(reloaded, { runMode: 'normal', phase: 'forging' }),
    ).toBe(false);
  });
});
