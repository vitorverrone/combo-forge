/**
 * Bootstrap do app: injeta a persistência SQLite (DDA + meta-progressão +
 * Desafio Diário) e o backend Supabase no store singleton, substituindo os
 * ports em memória usados como padrão (e pelos testes). Carrega a
 * meta-progressão e as tentativas do Desafio Diário salvas entre sessões.
 *
 * Chamado uma única vez, na avaliação do módulo de App.tsx.
 */
import {
  createInitialBreakHistory,
  createInitialDailyAttempts,
  dailyAttemptsForDay,
  DEFAULT_PROGRESSION,
  normalizeShopState,
  utcDateIso,
} from '../engine';

import { createAppAdProvider } from '../services/ads';
import { createAppDailyBackend } from '../services/supabase';
import { createAppShopProvider } from '../services/revenuecat';

import { gameStore } from './gameStore';
import { createSqlitePersistence } from './sqlite';

export function initializeSqlitePersistence(): void {
  try {
    const { ddaStorage, progressionStorage, dailyStorage, shopStorage, breakStorage } =
      createSqlitePersistence();
    const saved = progressionStorage.load();
    const savedAttempts = dailyStorage.loadAttempts();
    // Loja persistida (comprados + equipados + remoção de anúncios), com
    // default aplicado a saves antigos sem o campo adsRemoved.
    const loadedShop = normalizeShopState(shopStorage.load());
    gameStore.setState({
      ddaStorage,
      dailyStorage,
      dailyBackend: createAppDailyBackend(),
      adProvider: createAppAdProvider(),
      shopStorage,
      shopProvider: createAppShopProvider(),
      breakStorage,
      breakHistory: breakStorage.load() ?? createInitialBreakHistory(),
      progression: saved ?? DEFAULT_PROGRESSION,
      daily: {
        ...gameStore.getState().daily,
        attempts: dailyAttemptsForDay(
          savedAttempts ?? createInitialDailyAttempts(utcDateIso()),
          utcDateIso(),
        ),
      },
      shop: {
        ...gameStore.getState().shop,
        owned: loadedShop,
      },
      adsRemoved: loadedShop.adsRemoved,
    });
  } catch {
    // SQLite indisponível (ex.: plataforma sem suporte): mantém os ports em
    // memória do store singleton — a sessão continua jogável, só sem
    // persistência entre sessões.
  }
}
