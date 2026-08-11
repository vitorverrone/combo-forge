import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { engineModuleId } from './engine';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Combo Forge</Text>
      <Text style={styles.engine}>{engineModuleId}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  engine: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
});
