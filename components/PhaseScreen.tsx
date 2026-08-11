import { StyleSheet, Text, View } from 'react-native';

import { RunState } from '../engine';

import { colors } from './theme';
import { RoundWonScreen } from './RoundWonScreen';
import { RunLostScreen } from './RunLostScreen';
import { RunWonScreen } from './RunWonScreen';

interface PhaseScreenProps {
  readonly run: RunState;
}

/**
 * Despacha para a tela certa conforme a fase da Run. A Forja entre Rodadas
 * (fase 'forging') chega no ticket 10; até lá, um placeholder.
 */
export function PhaseScreen({ run }: PhaseScreenProps) {
  switch (run.phase) {
    case 'roundWon':
      return <RoundWonScreen run={run} />;
    case 'runWon':
      return <RunWonScreen run={run} />;
    case 'runLost':
      return <RunLostScreen run={run} />;
    case 'forging':
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>ROUND {run.roundNumber} COMPLETE</Text>
          <Text style={styles.placeholderText}>
            The Forge between rounds arrives in the next update.
          </Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  placeholderText: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
