/**
 * Instância única do KV store SQLite (`expo-sqlite/kv-store`) para todo o
 * app. Antes deste módulo, `store/sqlite.ts`, `i18n/index.ts` e
 * `components/OnboardingOverlay.tsx` cada um abria sua própria conexão
 * (`new SQLiteStorage('combo-forge.db')`) para o MESMO arquivo — três
 * handles nativos concorrentes, abertos quase simultaneamente na
 * inicialização do app (antes até do primeiro render). No Android isso
 * disparava falhas intermitentes de lock/contenção logo no cold start,
 * silenciadas pelo catch de `initializeSqlitePersistence` (store/bootstrap.ts)
 * — o app caía inteiro para storage em memória naquela sessão: nome de
 * exibição, tentativas do dia e meta-progressão pareciam "resetar" sem
 * motivo aparente. Uma única conexão compartilhada elimina a race.
 */
import { SQLiteStorage } from 'expo-sqlite/kv-store';

export const DATABASE_NAME = 'combo-forge.db';

export const kv = new SQLiteStorage(DATABASE_NAME);
