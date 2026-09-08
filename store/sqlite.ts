/**
 * Persistência real em SQLite (ticket 11) — implementa os ports de storage
 * do DDA (engine/dda.ts, do ticket 07) e da Meta-Progressão
 * (engine/progression.ts) usando o KV store do expo-sqlite
 * (`expo-sqlite/kv-store`): um Storage AsyncStorage-compatível com variantes
 * síncronas (getItemSync/setItemSync), suficiente para os blobs pequenos
 * (histórico DDA + estatísticas/desbloqueios de meta-progressão).
 *
 * Este módulo toca o nativo e só deve ser importado pelo bootstrap do app —
 * os testes usam os ports em memória.
 */
import {
  DailyAttempts,
  DailyChallengeStorage,
  DdaState,
  DdaStorage,
  PersistedProgression,
  PersistedShop,
  ProgressionStorage,
  PushSoftAskState,
  ShopStorage,
} from '../engine';

import { kv } from '../services/sqliteKv';
import { PushFlowStorage } from './pushFlow';
import { TutorialStorage } from './tutorialFlow';

const DDA_KEY = 'combo-forge:dda';
const PROGRESSION_KEY = 'combo-forge:progression';
const DAILY_ATTEMPTS_KEY = 'combo-forge:daily-attempts';
const DAILY_DEVICE_ID_KEY = 'combo-forge:daily-device-id';
const DAILY_DISPLAY_NAME_KEY = 'combo-forge:daily-display-name';
const SHOP_KEY = 'combo-forge:shop';
const TUTORIAL_GAMESCREEN_SEEN_KEY = 'combo-forge:tutorial-gamescreen-seen';
const TUTORIAL_FORGE_SEEN_KEY = 'combo-forge:tutorial-forge-seen';
const PUSH_SOFT_ASK_STATE_KEY = 'combo-forge:push-soft-ask-state';

function readJson<T>(key: string): T | null {
  const raw = kv.getItemSync(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // JSON corrompido (versão antiga, etc.): trata como ausente.
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  kv.setItemSync(key, JSON.stringify(value));
}

/** Port de storage do DDA sobre SQLite (ticket 07, agora com persistência real). */
export function createSqliteDdaStorage(): DdaStorage {
  return {
    load: () => readJson<DdaState>(DDA_KEY),
    save: (state) => writeJson(DDA_KEY, state),
  };
}

/** Port de storage da Meta-Progressão sobre SQLite. */
export function createSqliteProgressionStorage(): ProgressionStorage {
  return {
    load: () => readJson<PersistedProgression>(PROGRESSION_KEY),
    save: (state) => writeJson(PROGRESSION_KEY, state),
  };
}

/** Port de storage da Loja Cosmética sobre SQLite (comprados + equipados). */
export function createSqliteShopStorage(): ShopStorage {
  return {
    load: () => readJson<PersistedShop>(SHOP_KEY),
    save: (state) => writeJson(SHOP_KEY, state),
  };
}

/** Port de storage do Desafio Diário sobre SQLite (tentativas + deviceId + Nome de Exibição). */
export function createSqliteDailyChallengeStorage(): DailyChallengeStorage {
  return {
    loadAttempts: () => readJson<DailyAttempts>(DAILY_ATTEMPTS_KEY),
    saveAttempts: (state) => writeJson(DAILY_ATTEMPTS_KEY, state),
    loadDeviceId: () => readJson<string>(DAILY_DEVICE_ID_KEY),
    saveDeviceId: (id) => writeJson(DAILY_DEVICE_ID_KEY, id),
    loadDisplayName: () => readJson<string>(DAILY_DISPLAY_NAME_KEY),
    saveDisplayName: (name) => writeJson(DAILY_DISPLAY_NAME_KEY, name),
  };
}

/**
 * Port de storage do tutorial contextual sobre SQLite (duas flags "já
 * visto" — mesmo padrão booleano de hasSeenOnboarding/completeOnboarding
 * em OnboardingOverlay.tsx, não um blob JSON).
 */
export function createSqliteTutorialStorage(): TutorialStorage {
  return {
    loadGameScreenSeen: () => kv.getItemSync(TUTORIAL_GAMESCREEN_SEEN_KEY) === 'true',
    saveGameScreenSeen: () => kv.setItemSync(TUTORIAL_GAMESCREEN_SEEN_KEY, 'true'),
    loadForgeSeen: () => kv.getItemSync(TUTORIAL_FORGE_SEEN_KEY) === 'true',
    saveForgeSeen: () => kv.setItemSync(TUTORIAL_FORGE_SEEN_KEY, 'true'),
  };
}

/** Port de storage do soft-ask de push sobre SQLite (ADR 0012, ticket 02). */
export function createSqlitePushFlowStorage(): PushFlowStorage {
  return {
    loadSoftAskState: () => readJson<PushSoftAskState>(PUSH_SOFT_ASK_STATE_KEY),
    saveSoftAskState: (state) => writeJson(PUSH_SOFT_ASK_STATE_KEY, state),
  };
}

/** Persistência completa do app (DDA + meta + diário + loja + tutorial + push). */
export function createSqlitePersistence(): {
  readonly ddaStorage: DdaStorage;
  readonly progressionStorage: ProgressionStorage;
  readonly dailyStorage: DailyChallengeStorage;
  readonly shopStorage: ShopStorage;
  readonly tutorialStorage: TutorialStorage;
  readonly pushStorage: PushFlowStorage;
} {
  return {
    ddaStorage: createSqliteDdaStorage(),
    progressionStorage: createSqliteProgressionStorage(),
    dailyStorage: createSqliteDailyChallengeStorage(),
    shopStorage: createSqliteShopStorage(),
    tutorialStorage: createSqliteTutorialStorage(),
    pushStorage: createSqlitePushFlowStorage(),
  };
}
