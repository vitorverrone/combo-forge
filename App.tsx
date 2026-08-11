import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { CollectionScreen } from './components/CollectionScreen';
import { GameScreen } from './components/GameScreen';
import { ProfileScreen } from './components/ProfileScreen';
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
    <View style={styles.container}>
      {screen === 'start' && <StartScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'profile' && <ProfileScreen />}
      {screen === 'collection' && <CollectionScreen />}
      <UnlockChoiceModal />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
