import { validateDisplayName } from './displayName';

describe('Nome de Exibição (validação do lado do cliente, ticket 02)', () => {
  test('nome válido: letras, números e espaço, dentro do tamanho', () => {
    expect(validateDisplayName('Fulano')).toEqual({ valid: true });
    expect(validateDisplayName('Player 7')).toEqual({ valid: true });
    expect(validateDisplayName('abc')).toEqual({ valid: true }); // tamanho mínimo exato
    expect(validateDisplayName('a'.repeat(16))).toEqual({ valid: true }); // tamanho máximo exato
  });

  test('aceita acentuação pt-br', () => {
    expect(validateDisplayName('José Ção')).toEqual({ valid: true });
    expect(validateDisplayName('ÁÉÍÓÚÇÑ áéíóúçñ')).toEqual({ valid: true });
  });

  test('corta espaços nas pontas antes de validar (trim)', () => {
    expect(validateDisplayName('  Fulano  ')).toEqual({ valid: true });
    expect(validateDisplayName('  ab  ')).toEqual({ valid: false, reason: 'tooShort' });
  });

  test('nome curto demais (menos de 3 caracteres após trim)', () => {
    expect(validateDisplayName('ab')).toEqual({ valid: false, reason: 'tooShort' });
    expect(validateDisplayName('')).toEqual({ valid: false, reason: 'tooShort' });
  });

  test('nome longo demais (mais de 16 caracteres)', () => {
    expect(validateDisplayName('a'.repeat(17))).toEqual({ valid: false, reason: 'tooLong' });
  });

  test('caractere fora do permitido: emoji e símbolo', () => {
    expect(validateDisplayName('Nome😀')).toEqual({ valid: false, reason: 'invalidChars' });
    expect(validateDisplayName('Nome!')).toEqual({ valid: false, reason: 'invalidChars' });
    expect(validateDisplayName('Nome_x')).toEqual({ valid: false, reason: 'invalidChars' });
  });

  test('termo proibido pt-br é rejeitado, sem distinguir maiúscula/minúscula', () => {
    expect(validateDisplayName('seu merda')).toEqual({ valid: false, reason: 'profanity' });
    expect(validateDisplayName('MERDA total')).toEqual({ valid: false, reason: 'profanity' });
  });

  test('termo proibido en é rejeitado', () => {
    expect(validateDisplayName('fuck you')).toEqual({ valid: false, reason: 'profanity' });
  });

  test('checagem de tamanho vem antes da de caracteres, que vem antes da de termo proibido', () => {
    expect(validateDisplayName('a!')).toEqual({ valid: false, reason: 'tooShort' });
  });
});
