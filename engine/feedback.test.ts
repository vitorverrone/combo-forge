import {
  bytesToBase64,
  feedbackForEvents,
  hapticForMultiplier,
  NO_FEEDBACK,
  playToneForMultiplier,
  sineWaveWavDataUri,
} from './feedback';
import { RunEvent } from './run';

const played = (multiplier: number): RunEvent => ({
  type: 'played',
  roundNumber: 1,
  baseValue: 10,
  multiplier,
  points: 10 * multiplier,
  score: 10 * multiplier,
  target: 50,
  playsRemaining: 3,
});

describe('pitch ascendente proporcional ao combo', () => {
  test('o tom sobe com o multiplicador (nunca constante)', () => {
    const tones = [1, 2, 3, 4].map((m) => playToneForMultiplier(m).frequency);
    expect(tones[1]).toBeGreaterThan(tones[0]);
    expect(tones[2]).toBeGreaterThan(tones[1]);
    expect(tones[3]).toBeGreaterThan(tones[2]);
  });

  test('vibração curta e proporcional ao tamanho do combo', () => {
    expect(hapticForMultiplier(1)).toBe('light');
    expect(hapticForMultiplier(2)).toBe('medium');
    expect(hapticForMultiplier(3)).toBe('medium');
    expect(hapticForMultiplier(4)).toBe('heavy');
  });
});

describe('feedbackForEvents (disparado pelos eventos do motor)', () => {
  test('Jogada pede tom + haptic do multiplier', () => {
    const spec = feedbackForEvents([played(3)]);
    expect(spec.tone?.frequency).toBe(playToneForMultiplier(3).frequency);
    expect(spec.haptic).toBe('medium');
  });

  test('vitória de Run tem prioridade sobre a Jogada (sem sobrepor sons)', () => {
    const spec = feedbackForEvents([played(4), { type: 'runWon', roundNumber: 6, runScore: 999 }]);
    expect(spec.tone?.frequency).toBe(784);
    expect(spec.haptic).toBe('heavy');
  });

  test('derrota de Run tem tom grave e vibração média', () => {
    const spec = feedbackForEvents([played(1), { type: 'roundLost', roundNumber: 1, score: 30, target: 50 }, { type: 'runLost', roundNumber: 1, runScore: 30 }]);
    expect(spec.tone?.frequency).toBe(196);
    expect(spec.haptic).toBe('medium');
  });

  test('vitória de Rodada (sem fim de Run) tem tom de conquista', () => {
    const spec = feedbackForEvents([played(2), { type: 'roundWon', roundNumber: 1, score: 60, target: 50 }]);
    expect(spec.tone?.frequency).toBe(587);
  });

  test('Forja aplicada tem tom curto e vibração leve', () => {
    const spec = feedbackForEvents([{ type: 'forgeApplied', roundNumber: 1, offerIndex: 0 }]);
    expect(spec.tone?.frequency).toBe(660);
    expect(spec.haptic).toBe('light');
  });

  test('sem evento de feedback → NO_FEEDBACK', () => {
    expect(feedbackForEvents([])).toBe(NO_FEEDBACK);
    expect(feedbackForEvents([{ type: 'forgeOffers', roundNumber: 1, offers: [] }])).toBe(NO_FEEDBACK);
  });
});

describe('geração de tom WAV em runtime', () => {
  test('data URI de WAV válido e determinístico', () => {
    const a = sineWaveWavDataUri(440, 110);
    const b = sineWaveWavDataUri(440, 110);
    expect(a).toBe(b);
    expect(a.startsWith('data:audio/wav;base64,')).toBe(true);
  });

  test('frequências diferentes produzem tons diferentes', () => {
    expect(sineWaveWavDataUri(440, 110)).not.toBe(sineWaveWavDataUri(880, 110));
  });

  test('bytesToBase64 decodifica de volta', () => {
    const bytes = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
    const b64 = bytesToBase64(bytes);
    expect(Buffer.from(b64, 'base64').toString('utf8')).toBe('hello');
  });
});
