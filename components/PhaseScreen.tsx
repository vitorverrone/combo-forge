import { RunState } from '../engine';

import { ForgeScreen } from './ForgeScreen';
import { RoundWonScreen } from './RoundWonScreen';
import { RunLostScreen } from './RunLostScreen';
import { RunWonScreen } from './RunWonScreen';

interface PhaseScreenProps {
  readonly run: RunState;
}

/**
 * Despacha para a tela certa conforme a fase da Run.
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
      return <ForgeScreen run={run} />;
  }
}
