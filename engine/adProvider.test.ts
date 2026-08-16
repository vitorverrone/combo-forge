import { shouldShowBanner } from './adProvider';

describe('shouldShowBanner (banner full-width — ticket 01)', () => {
  test('sem ad unit de banner para a plataforma → banner oculto (degrade sem quebrar)', () => {
    expect(shouldShowBanner(undefined)).toBe(false);
  });

  test('com ad unit de banner → banner visível', () => {
    expect(shouldShowBanner('ca-app-pub-1234567890123456/1234567890')).toBe(true);
  });

  test('vazio nunca é considerado um ad unit válido', () => {
    expect(shouldShowBanner('')).toBe(false);
  });
});
