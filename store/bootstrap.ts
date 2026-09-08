/**
 * Bootstrap do app: injeta a persistência SQLite (DDA + meta-progressão +
 * Desafio Diário) e o backend Supabase no store singleton, substituindo os
 * ports em memória usados como padrão (e pelos testes). Carrega a
 * meta-progressão e as tentativas do Desafio Diário salvas entre sessões.
 *
 * Chamado uma única vez, na avaliação do módulo de App.tsx.
 */
import {
  createDeviceId,
  createInitialDailyAttempts,
  dailyAttemptsForDay,
  normalizeProgression,
  normalizeShopState,
  utcDateIso,
} from '../engine';

import { createAppAdProvider } from '../services/ads';
import { createAppDailyBackend } from '../services/supabase';
import { createAppShopProvider } from '../services/revenuecat';
import { createAppTelemetryProvider } from '../services/firebaseAnalytics';

import { gameStore } from './gameStore';
import { createSqlitePersistence } from './sqlite';
import { loadTutorialState } from './tutorialFlow';

export function initializeSqlitePersistence(): void {
  try {
    const { ddaStorage, progressionStorage, dailyStorage, shopStorage, tutorialStorage } =
      createSqlitePersistence();
    const saved = progressionStorage.load();
    const savedAttempts = dailyStorage.loadAttempts();
    // deviceId (chave do leaderboard): o store singleton resolve um deviceId
    // já na construção do módulo, mas com o port em memória (padrão) — a
    // troca de dailyStorage acima não re-deriva esse campo sozinha. Repete
    // aqui o mesmo "carrega ou cria e persiste" da construção do store,
    // agora contra o SQLite real, e substitui o gerado em memória.
    const savedDeviceId = dailyStorage.loadDeviceId();
    const deviceId = savedDeviceId ?? createDeviceId();
    if (deviceId !== savedDeviceId) dailyStorage.saveDeviceId(deviceId);
    // Identidade de telemetria (ADR 0007): mesmo device_id anônimo do
    // Desafio Diário, resolvido acima — permite cruzar um caso de ranking
    // com o funil de retenção dele sem introduzir nenhum dado pessoal.
    const telemetry = createAppTelemetryProvider();
    void telemetry.setUserId(deviceId);
    // Loja persistida (comprados + equipados + remoção de anúncios), com
    // default aplicado a saves antigos sem o campo adsRemoved.
    const loadedShop = normalizeShopState(shopStorage.load());
    gameStore.setState({
      ddaStorage,
      dailyStorage,
      dailyBackend: createAppDailyBackend(),
      adProvider: createAppAdProvider(telemetry),
      telemetry,
      shopStorage,
      shopProvider: createAppShopProvider(),
      progression: normalizeProgression(saved),
      tutorialStorage,
      tutorial: loadTutorialState(tutorialStorage),
      daily: {
        ...gameStore.getState().daily,
        deviceId,
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
    // Sincronização automática no launch (ticket 03): o RevenueCat reentrega
    // a entitlement remove_ads ao configurar — reflete adsRemoved sem
    // interação do jogador. Fire-and-forget: falha silenciosa (o botão
    // "Restaurar compras" da Loja e o próximo launch tentam de novo).
    void gameStore.getState().syncRemoveAdsEntitlement();
  } catch (error) {
    // SQLite indisponível ou falhou ao inicializar (ex.: contenção de lock
    // no cold start): mantém os ports em memória do store singleton — a
    // sessão continua jogável, mas SEM persistência entre sessões (nome de
    // exibição, tentativas do dia e meta-progressão "resetam" ao reabrir o
    // app). Isso não deveria acontecer em uso normal — logamos para poder
    // diagnosticar via Firebase se voltar a ocorrer, em vez de engolir o
    // erro sem deixar rastro (era assim antes e tornava o sintoma
    // inexplicável).
    console.error('[bootstrap] Falha ao inicializar persistência SQLite:', error);
    void createAppTelemetryProvider().logEvent('sqlite_persistence_init_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
