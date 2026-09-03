import { createDevTelemetryProvider } from './telemetry';

describe('createDevTelemetryProvider (ticket 01)', () => {
  test('logEvent não lança com parâmetros', () => {
    const provider = createDevTelemetryProvider();
    expect(() =>
      provider.logEvent('run_started', { forger: 'apprentice', runNumber: 1 }),
    ).not.toThrow();
  });

  test('logEvent não lança sem parâmetros', () => {
    const provider = createDevTelemetryProvider();
    expect(() => provider.logEvent('shop_opened')).not.toThrow();
  });

  test('setUserId não lança', () => {
    const provider = createDevTelemetryProvider();
    expect(() => provider.setUserId('device-abc-123')).not.toThrow();
  });
});
