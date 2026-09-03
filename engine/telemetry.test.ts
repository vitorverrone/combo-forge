import { createDevTelemetryProvider } from './telemetry';

describe('createDevTelemetryProvider (ticket 01)', () => {
  test('logEvent resolve sem lançar, com parâmetros', async () => {
    const provider = createDevTelemetryProvider();
    await expect(
      provider.logEvent('run_started', { forger: 'apprentice', runNumber: 1 }),
    ).resolves.toBeUndefined();
  });

  test('logEvent resolve sem lançar, sem parâmetros', async () => {
    const provider = createDevTelemetryProvider();
    await expect(provider.logEvent('shop_opened')).resolves.toBeUndefined();
  });

  test('setUserId resolve sem lançar', async () => {
    const provider = createDevTelemetryProvider();
    await expect(provider.setUserId('device-abc-123')).resolves.toBeUndefined();
  });
});
