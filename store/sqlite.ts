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
import { SQLiteStorage } from 'expo-sqlite/kv-store';

import {
  BreakHistory,
  BreakStorage,
  DailyAttempts,
  DailyChallengeStorage,
  DdaState,
  DdaStorage,
  PersistedProgression,
  PersistedShop,
  ProgressionStorage,
  ShopStorage,
} from '../engine';

/** Banco dedicado do Combo Forge (o KV store cria uma tabela própria). */
const DATABASE_NAME = 'combo-forge.db';
const DDA_KEY = 'combo-forge:dda';
const PROGRESSION_KEY = 'combo-forge:progression';
const DAILY_ATTEMPTS_KEY = 'combo-forge:daily-attempts';
const DAILY_DEVICE_ID_KEY = 'combo-forge:daily-device-id';
const SHOP_KEY = 'combo-forge:shop';
const BREAK_KEY = 'combo-forge:break-history';

const kv = new SQLiteStorage(DATABASE_NAME);

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

/** Port de storage do lembrete de pausa sobre SQLite (fins de Run recentes). */
export function createSqliteBreakStorage(): BreakStorage {
  return {
    load: () => readJson<BreakHistory>(BREAK_KEY),
    save: (history) => writeJson(BREAK_KEY, history),
  };
}

/** Port de storage do Desafio Diário sobre SQLite (tentativas + deviceId). */
export function createSqliteDailyChallengeStorage(): DailyChallengeStorage {
  return {
    loadAttempts: () => readJson<DailyAttempts>(DAILY_ATTEMPTS_KEY),
    saveAttempts: (state) => writeJson(DAILY_ATTEMPTS_KEY, state),
    loadDeviceId: () => {
      const raw = kv.getItemSync(DAILY_DEVICE_ID_KEY);
      return raw ?? null;
    },
    saveDeviceId: (id) => writeJson(DAILY_DEVICE_ID_KEY, id),
  };
}

/** Persistência completa do app (DDA + meta + diário + loja + pausa). */
export function createSqlitePersistence(): {
  readonly ddaStorage: DdaStorage;
  readonly progressionStorage: ProgressionStorage;
  readonly dailyStorage: DailyChallengeStorage;
  readonly shopStorage: ShopStorage;
  readonly breakStorage: BreakStorage;
} {
  return {
    ddaStorage: createSqliteDdaStorage(),
    progressionStorage: createSqliteProgressionStorage(),
    dailyStorage: createSqliteDailyChallengeStorage(),
    shopStorage: createSqliteShopStorage(),
    breakStorage: createSqliteBreakStorage(),
  };
}
