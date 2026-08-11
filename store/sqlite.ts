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

import { DdaState, DdaStorage, PersistedProgression, ProgressionStorage } from '../engine';

/** Banco dedicado do Combo Forge (o KV store cria uma tabela própria). */
const DATABASE_NAME = 'combo-forge.db';
const DDA_KEY = 'combo-forge:dda';
const PROGRESSION_KEY = 'combo-forge:progression';

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

/** Persistência completa do app (DDA + meta-progressão) num único banco. */
export function createSqlitePersistence(): {
  readonly ddaStorage: DdaStorage;
  readonly progressionStorage: ProgressionStorage;
} {
  return {
    ddaStorage: createSqliteDdaStorage(),
    progressionStorage: createSqliteProgressionStorage(),
  };
}
