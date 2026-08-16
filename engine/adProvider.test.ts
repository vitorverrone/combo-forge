import { shouldShowBanner } from './adProvider';

describe('shouldShowBanner (banner full-width — ticket 01/02)', () => {
  test('sem ad unit de banner para a plataforma → banner oculto (degrade sem quebrar)', () => {
    expect(shouldShowBanner(false, undefined)).toBe(false);
  });

  test('com ad unit de banner e sem remoção comprada → banner visível', () => {
    expect(shouldShowBanner(false, 'ca-app-pub-1234567890123456/1234567890')).toBe(true);
  });

  test('vazio nunca é considerado um ad unit válido', () => {
    expect(shouldShowBanner(false, '')).toBe(false);
  });

  test('remoção de anúncios comprada → banner oculto mesmo com ad unit disponível (ticket 02)', () => {
    expect(shouldShowBanner(true, 'ca-app-pub-1234567890123456/1234567890')).toBe(false);
  });

  test('remoção comprada e sem ad unit → oculto', () => {
    expect(shouldShowBanner(true, undefined)).toBe(false);
  });
});
