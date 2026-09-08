import { shouldShowPushSoftAsk } from './pushProvider';

describe('shouldShowPushSoftAsk (soft-ask de notificação — ADR 0012, ticket 02)', () => {
  test('Liga inativa (null): nunca mostra, mesmo não resolvido', () => {
    expect(shouldShowPushSoftAsk('unresolved', null)).toBe(false);
  });

  test('Liga ativa + soft-ask não resolvido: mostra', () => {
    const league = { week: '2026-08-31', tier: 'bronze' as const, division: 1, own: null, top: [] };
    expect(shouldShowPushSoftAsk('unresolved', league)).toBe(true);
  });

  test('Liga ativa + já recusado: não mostra de novo', () => {
    const league = { week: '2026-08-31', tier: 'bronze' as const, division: 1, own: null, top: [] };
    expect(shouldShowPushSoftAsk('declined', league)).toBe(false);
  });

  test('Liga ativa + já aceito: não mostra de novo', () => {
    const league = { week: '2026-08-31', tier: 'bronze' as const, division: 1, own: null, top: [] };
    expect(shouldShowPushSoftAsk('accepted', league)).toBe(false);
  });
});
