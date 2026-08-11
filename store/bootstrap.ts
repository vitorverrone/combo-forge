/**
 * Bootstrap do app: injeta a persistência SQLite (DDA + meta-progressão) no
 * store singleton, substituindo os ports em memória usados como padrão
 * (e pelos testes). Carrega a meta-progressão salva entre sessões.
 *
 * Chamado uma única vez, na avaliação do módulo de App.tsx.
 */
import { DEFAULT_PROGRESSION } from '../engine';

import { gameStore } from './gameStore';
import { createSqlitePersistence } from './sqlite';

export function initializeSqlitePersistence(): void {
  try {
    const { ddaStorage, progressionStorage } = createSqlitePersistence();
    const saved = progressionStorage.load();
    gameStore.setState({
      ddaStorage,
      progression: saved ?? DEFAULT_PROGRESSION,
    });
  } catch {
    // SQLite indisponível (ex.: plataforma sem suporte): mantém os ports em
    // memória do store singleton — a sessão continua jogável, só sem
    // persistência entre sessões.
  }
}
