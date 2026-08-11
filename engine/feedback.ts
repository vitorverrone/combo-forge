/**
 * Feedback sensorial (ticket 15) — mapeamento puro evento → resposta.
 *
 * O motor emite eventos (RunEvent) e este módulo decide, sem tocar em IO,
 * QUAL resposta cada evento pede: um tom (frequência/duração) e uma vibração
 * (intensidade). Nenhuma regra de jogo vive aqui nem na UI — o player real
 * (services/feedback.ts) só executa os specs.
 *
 * Princípios (skill game-feel):
 * - Pitch ascendente proporcional ao Multiplicador de Combo (o evento
 *   'played' carrega o multiplier do motor).
 * - Vibração curta e proporcional ao tamanho do combo — nunca constante,
 *   para não causar fadiga háptica.
 * - Juice transiente: um spec por lote de eventos (o mais importante), para
 *   não sobrepor sons numa mesma ação.
 */

import { RunEvent } from './run';

/** Intensidade da vibração (curta, proporcional ao evento). */
export type HapticStrength = 'light' | 'medium' | 'heavy' | 'none';

/** Um tom sintetizado em runtime (frequência em Hz + duração em ms). */
export interface ToneSpec {
  readonly frequency: number;
  readonly durationMs: number;
}

/** Resposta sensorial completa de um evento. */
export interface FeedbackSpec {
  /** Tom a tocar; null = sem som. */
  readonly tone: ToneSpec | null;
  /** Vibração a acionar; 'none' = sem vibração. */
  readonly haptic: HapticStrength;
}

/** Nenhuma resposta (evento que não pede feedback). */
export const NO_FEEDBACK: FeedbackSpec = { tone: null, haptic: 'none' };

/** Frequência base do tom de Jogada (G4). */
export const PLAY_BASE_FREQUENCY = 392;
/** Passo por nível de combo: +2 semitons a cada multiplicador. */
const SEMITONE = Math.pow(2, 2 / 12);

/**
 * Tom de Jogada: o pitch sobe 2 semitons por multiplicador de combo
 * (×1 → 392 Hz, ×2 → 440 Hz, ×3 → 494 Hz, ×4 → 554 Hz, …). Proporcional ao
 * combo, nunca constante.
 */
export function playToneForMultiplier(multiplier: number): ToneSpec {
  return {
    frequency: Math.round(PLAY_BASE_FREQUENCY * Math.pow(SEMITONE, multiplier - 1)),
    durationMs: 110,
  };
}

/** Vibração de Jogada: curta e proporcional ao tamanho do combo. */
export function hapticForMultiplier(multiplier: number): HapticStrength {
  if (multiplier <= 1) return 'light';
  if (multiplier <= 3) return 'medium';
  return 'heavy';
}

/**
 * Decisão de prioridade para um lote de eventos: devolve o spec do evento
 * mais importante presente (fim de Run > derrota de Rodada > vitória de
 * Rodada > Jogada > Forja), para nunca sobrepor sons na mesma ação.
 */
export function feedbackForEvents(events: readonly RunEvent[]): FeedbackSpec {
  if (events.some((event) => event.type === 'runWon')) {
    return {
      tone: { frequency: 784, durationMs: 240 },
      haptic: 'heavy',
    };
  }
  if (events.some((event) => event.type === 'runLost')) {
    return {
      tone: { frequency: 196, durationMs: 300 },
      haptic: 'medium',
    };
  }
  // Vitória de Rodada tem prioridade sobre a Jogada (é o desfecho do lote).
  if (events.some((event) => event.type === 'roundWon')) {
    return {
      tone: { frequency: 587, durationMs: 160 },
      haptic: 'medium',
    };
  }
  const played = [...events].reverse().find((event) => event.type === 'played');
  if (played !== undefined && played.type === 'played') {
    return {
      tone: playToneForMultiplier(played.multiplier),
      haptic: hapticForMultiplier(played.multiplier),
    };
  }
  if (events.some((event) => event.type === 'forgeApplied')) {
    return {
      tone: { frequency: 660, durationMs: 90 },
      haptic: 'light',
    };
  }
  return NO_FEEDBACK;
}

/**
 * Gera um WAV PCM 16-bit mono de uma onda senoidal (tom curto) e devolve
 * como data URI (data:audio/wav;base64,…). Puro e determinístico — o player
 * real só precisa tocar o data URI; sem assets embutidos.
 */
export function sineWaveWavDataUri(
  frequency: number,
  durationMs: number,
  sampleRate = 22050,
  amplitude = 0.25,
): string {
  const samples = Math.max(1, Math.round((sampleRate * durationMs) / 1000));
  const dataSize = samples * 2; // 16-bit mono
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Amostras: seno com fade-in/out de 8ms para evitar clique.
  const fadeSamples = Math.min(samples, Math.round((sampleRate * 8) / 1000));
  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    let envelope = 1;
    if (i < fadeSamples) envelope = i / fadeSamples;
    else if (i > samples - fadeSamples) envelope = (samples - i) / fadeSamples;
    const value = Math.sin(2 * Math.PI * frequency * t) * amplitude * envelope;
    view.setInt16(44 + i * 2, Math.round(value * 32767), true);
  }

  return `data:audio/wav;base64,${bytesToBase64(new Uint8Array(buffer))}`;
}

/** Base64 (padrão Web) de bytes — sem depender de Buffer/btoa (RN). */
export function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += alphabet[b0 >> 2];
    out += alphabet[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? alphabet[((b1 & 0x0f) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? alphabet[b2 & 0x3f] : '=';
  }
  return out;
}
