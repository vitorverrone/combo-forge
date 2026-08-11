import { engineModuleId } from './index';

test('engine module is isolated and importable without React Native', () => {
  expect(engineModuleId).toBe('combo-forge-engine');
});
