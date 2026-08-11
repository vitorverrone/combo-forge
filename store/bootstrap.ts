/**
 * Bootstrap do app: injeta a persistência SQLite (DDA + meta-progressão +
 * Desafio Diário) e o backend Supabase no store singleton, substituindo os
 * ports em memória usados como padrão (e pelos testes). Carrega a
 * meta-progressão e as tentativas do Desafio Diário salvas entre sessões.
 *
 * Chamado uma única vez, na avaliação do módulo de App.tsx.
 */
import {
  createInitialDailyAttempts,
  dailyAttemptsForDay,
  DEFAULT_PROGRESSION,
  utcDateIso,
} from '../engine';

import { createAppDailyBackend } from '../services/supabase';

import { gameStore } from './gameStore';
import { createSqlitePersistence } from './sqlite';

export function initializeSqlitePersistence(): void {
  try {
    const { ddaStorage, progressionStorage, dailyStorage } = createSqlitePersistence();
    const saved = progressionStorage.load();
    const savedAttempts = dailyStorage.loadAttempts();
    gameStore.setState({
      ddaStorage,
      dailyStorage,
      dailyBackend: createAppDailyBackend(),
      progression: saved ?? DEFAULT_PROGRESSION,
      daily: {
        ...gameStore.getState().daily,
        attempts: dailyAttemptsForDay(
          savedAttempts ?? createInitialDailyAttempts(utcDateIso()),
          utcDateIso(),
        ),
      },
    });
  } catch {
    // SQLite indisponível (ex.: plataforma sem suporte): mantém os ports em
    // memória do store singleton — a sessão continua jogável, só sem
    // persistência entre sessões.
  }
}
