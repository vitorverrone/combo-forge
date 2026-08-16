import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from './components/AdBanner';
import { BreakReminderBanner } from './components/BreakReminderBanner';
import { CollectionScreen } from './components/CollectionScreen';
import { DailyChallengeScreen } from './components/DailyChallengeScreen';
import { GameFeedback } from './components/GameFeedback';
import { GameScreen } from './components/GameScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { ShopScreen } from './components/ShopScreen';
import { StartScreen } from './components/StartScreen';
import { UnlockChoiceModal } from './components/UnlockChoiceModal';
import { colors } from './components/theme';
import { initializeSqlitePersistence } from './store/bootstrap';
import { useGameStore } from './store/gameStore';

// Persistência real (SQLite): injeta os ports de storage no store singleton e
// carrega a meta-progressão salva entre sessões. Uma vez, na avaliação.
initializeSqlitePersistence();

export default function App() {
  const screen = useGameStore((state) => state.screen);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {/* SafeAreaView (topo) mantém o conteúdo abaixo da barra de status —
            o app roda edge-to-edge no Android (API 35+). As sobreposições
            (modais/banners) ficam fora de propósito. */}
        <SafeAreaView edges={['top']} style={styles.container}>
          {screen === 'start' && <StartScreen />}
          {screen === 'game' && <GameScreen />}
          {screen === 'profile' && <ProfileScreen />}
          {screen === 'collection' && <CollectionScreen />}
          {screen === 'daily' && <DailyChallengeScreen />}
          {screen === 'shop' && <ShopScreen />}
        </SafeAreaView>
        {/* Banner full-width de 50dp no rodapé de todas as telas (ticket
            banner-01). Oculto quando não há ad unit para a plataforma (regra
            pura shouldShowBanner) — anúncio nunca é obrigatório. */}
        <AdBanner />
        <UnlockChoiceModal />
        <BreakReminderBanner />
        <GameFeedback />
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
