import './i18n';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from './components/AdBanner';
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
  const [fontsLoaded] = useFonts({
    'Rubik': require('./assets/fonts/Rubik-Variable.ttf'),
    'Selawik': require('./assets/fonts/Selawik-Regular.ttf'),
    'Selawik-Bold': require('./assets/fonts/Selawik-Bold.ttf'),
  });

  const screen = useGameStore((state) => state.screen);

  // Mantém o splash visível até as fontes carregarem.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.screenWrapper}>
          {screen === 'start' && <StartScreen />}
          {screen === 'game' && <GameScreen />}
          {screen === 'profile' && <ProfileScreen />}
          {screen === 'collection' && <CollectionScreen />}
          {screen === 'daily' && <DailyChallengeScreen />}
          {screen === 'shop' && <ShopScreen />}
        </View>
        <AdBanner />
        <UnlockChoiceModal />
        <GameFeedback />
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
