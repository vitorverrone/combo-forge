import { useEffect, useRef } from 'react';

import { feedbackForEvents } from '../engine';

import { playFeedback } from '../services/feedback';

import { useGameStore } from '../store/gameStore';

/**
 * Camada de feedback (ticket 15): observa os eventos do motor (lastEvents) e
 * dispara o spec correspondente (som + vibração). Nenhuma regra de jogo vive
 * aqui — só a tradução evento → resposta definida pelo motor (feedback.ts).
 *
 * Renderiza nada; é montado uma vez no App.
 */
export function GameFeedback() {
  const lastEvents = useGameStore((state) => state.lastEvents);
  const lastSeen = useRef(lastEvents);

  useEffect(() => {
    if (lastEvents === lastSeen.current) return; // nada novo (mesma referência)
    lastSeen.current = lastEvents;
    playFeedback(feedbackForEvents(lastEvents));
  }, [lastEvents]);

  return null;
}
