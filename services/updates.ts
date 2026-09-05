/**
 * Notificação de atualização (baseline de portfólio, ver CLAUDE.md raiz):
 *
 * - OTA (expo-updates): checa e baixa update de JS/assets a cada abertura do
 *   app. Se encontrou e baixou, o app avisa o jogador (UpdatePrompt.tsx) e só
 *   reinicia se ele confirmar — nunca troca a versão debaixo dos pés do
 *   jogador no meio de uma run.
 * - Loja (sp-react-native-in-app-updates): checa versão nativa publicada.
 *   Android usa o fluxo FLEXIBLE (banner dispensável do próprio Play Store);
 *   iOS mostra o alerta padrão da lib linkando pra App Store. Dispensável nos
 *   dois casos — nunca bloqueia o jogo.
 *
 * Ambos os checks nunca lançam: falha de rede, módulo nativo ausente
 * (Expo Go/web/testes) ou qualquer erro do SDK resolve `false`/no-op, o jogo
 * sempre funciona sem a atualização.
 */
import { Platform } from 'react-native';

/** Baixou um update OTA e ele está pronto pra aplicar no próximo reload? */
export async function checkForOtaUpdate(): Promise<boolean> {
  try {
    const Updates = await import('expo-updates');
    if (!Updates.isEnabled) return false;
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return false;
    await Updates.fetchUpdateAsync();
    return true;
  } catch {
    return false;
  }
}

/** Reinicia o app pra aplicar o update OTA já baixado por checkForOtaUpdate. */
export async function reloadAppForUpdate(): Promise<void> {
  try {
    const Updates = await import('expo-updates');
    await Updates.reloadAsync();
  } catch {
    // Sem módulo nativo (Expo Go/web) — nada a fazer, o jogador continua no app.
  }
}

/**
 * Checa se há uma versão mais nova publicada na loja e, se houver, dispara o
 * prompt nativo da própria loja (Play Store flexible / alerta com link pra
 * App Store). Fire-and-forget: a UI do prompt é toda gerenciada pela lib.
 */
export async function checkForStoreUpdate(): Promise<void> {
  try {
    const { default: SpInAppUpdates, IAUUpdateKind } = await import(
      'sp-react-native-in-app-updates'
    );
    const inAppUpdates = new SpInAppUpdates(__DEV__);
    const result = await inAppUpdates.checkNeedsUpdate();
    if (!result.shouldUpdate) return;

    await inAppUpdates.startUpdate(
      Platform.OS === 'android'
        ? { updateType: IAUUpdateKind.FLEXIBLE }
        : { forceUpgrade: false },
    );
  } catch {
    // Módulo nativo ausente (Expo Go/web/testes) ou loja indisponível — no-op.
  }
}
