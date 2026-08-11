import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { GameScreen } from './components/GameScreen';
import { StartScreen } from './components/StartScreen';
import { colors } from './components/theme';
import { useGameStore } from './store/gameStore';

export default function App() {
  const screen = useGameStore((state) => state.screen);

  return (
    <View style={styles.container}>
      {screen === 'start' ? <StartScreen /> : <GameScreen />}
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
