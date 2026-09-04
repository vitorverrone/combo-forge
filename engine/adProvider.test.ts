import { shouldShowBanner } from './adProvider';

describe('shouldShowBanner (banner full-width — ticket 01/02, ADR 0008)', () => {
  test('sem ad unit de banner para a plataforma → banner oculto (degrade sem quebrar)', () => {
    expect(shouldShowBanner(false, undefined, undefined)).toBe(false);
  });

  test('com ad unit de banner, sem remoção comprada e sem Run em andamento → banner visível', () => {
    expect(shouldShowBanner(false, 'ca-app-pub-1234567890123456/1234567890', undefined)).toBe(true);
  });

  test('vazio nunca é considerado um ad unit válido', () => {
    expect(shouldShowBanner(false, '', undefined)).toBe(false);
  });

  test('remoção de anúncios comprada → banner oculto mesmo com ad unit disponível (ticket 02)', () => {
    expect(shouldShowBanner(true, 'ca-app-pub-1234567890123456/1234567890', undefined)).toBe(false);
  });

  test('remoção comprada e sem ad unit → oculto', () => {
    expect(shouldShowBanner(true, undefined, undefined)).toBe(false);
  });

  test('Rodada ativa (playing) → banner oculto mesmo com ad unit e sem remoção (ADR 0008)', () => {
    expect(shouldShowBanner(false, 'ca-app-pub-1234567890123456/1234567890', 'playing')).toBe(false);
  });

  test('Forja (forging) → banner continua visível, não é Rodada ativa', () => {
    expect(shouldShowBanner(false, 'ca-app-pub-1234567890123456/1234567890', 'forging')).toBe(true);
  });

  test('fim de Rodada (roundWon) → banner continua visível', () => {
    expect(shouldShowBanner(false, 'ca-app-pub-1234567890123456/1234567890', 'roundWon')).toBe(true);
  });

  test('fim de Run (runWon/runLost) → banner continua visível', () => {
    expect(shouldShowBanner(false, 'ca-app-pub-1234567890123456/1234567890', 'runWon')).toBe(true);
    expect(shouldShowBanner(false, 'ca-app-pub-1234567890123456/1234567890', 'runLost')).toBe(true);
  });
});
