/**
 * Player de feedback (ticket 15): executa os specs puros do motor
 * (engine/feedback.ts) — toca o tom sintetizado via expo-audio (data URI WAV
 * gerado em runtime, sem assets) e aciona a vibração via expo-haptics.
 *
 * A UI não decide nada: ela só chama playFeedback com o spec que o motor
 * derivou dos eventos. Em plataformas sem áudio/haptics (web, testes), os
 * módulos nativos não existem e as chamadas são no-ops seguros.
 *
 * Um único player reutilizado (replace + seekTo 0 + play) evita alocar
 * recursos a cada Jogada; os tons são curtos e voltam ao repouso.
 */

import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { FeedbackSpec, HapticStrength, sineWaveWavDataUri } from '../engine';

let tonePlayer: ReturnType<typeof createAudioPlayer> | null = null;
let lastToneUri: string | null = null;

/** Toca um spec de feedback (tom + vibração), curto e transiente. */
export function playFeedback(spec: FeedbackSpec): void {
  playTone(spec.tone?.frequency, spec.tone?.durationMs);
  triggerHaptic(spec.haptic);
}

/** Toca o tom sintetizado (data URI WAV gerado em runtime). */
function playTone(frequency: number | undefined, durationMs: number | undefined): void {
  if (frequency === undefined || durationMs === undefined) return;
  try {
    const uri = sineWaveWavDataUri(frequency, durationMs);
    if (tonePlayer === null) {
      tonePlayer = createAudioPlayer(uri);
    } else if (uri !== lastToneUri) {
      tonePlayer.replace(uri);
    }
    lastToneUri = uri;
    void tonePlayer.seekTo(0);
    tonePlayer.play();
  } catch {
    // Áudio indisponível (web/ambiente sem suporte): feedback só háptico.
  }
}

/** Vibração curta e proporcional — nunca constante. */
function triggerHaptic(strength: HapticStrength): void {
  switch (strength) {
    case 'light':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'none':
      break;
  }
}
