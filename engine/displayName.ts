/**
 * Nome de Exibição — validação do lado do cliente (ticket 02, ADR 0005).
 *
 * Espelho de `set_display_name` (supabase/migrations/0003_display_name.sql):
 * mesma ordem de checagem (tamanho → caracteres → termos proibidos), mesmo
 * trim. Fonte da verdade é o SQL; roda aqui também para feedback instantâneo
 * sem round-trip de rede — a chamada ao servidor continua sendo a validação
 * final (a anon key do Supabase é pública, então um filtro só no app seria
 * burlável chamando a API direto).
 *
 * Cópia irmã: `supabase/contract.ts` tem o mesmo espelho para os testes de
 * verificação do contrato (`verify-contract.mjs` confere as duas listas
 * contra o SQL real). Mantidas sincronizadas manualmente entre os três
 * lugares — SQL, contract.ts e este módulo.
 */

/** Tamanho mínimo/máximo do Nome de Exibição — igual à constraint SQL `players_display_name_length`. */
export const DISPLAY_NAME_MIN_LENGTH = 3;
export const DISPLAY_NAME_MAX_LENGTH = 16;

/**
 * Caracteres aceitos: letras (incluindo acentuação pt-br), números e espaço
 * — sem emoji nem símbolo. Mesmo regex da constraint SQL
 * `players_display_name_charset` e da função `set_display_name`.
 */
const DISPLAY_NAME_CHARSET_REGEX =
  /^[a-zA-Z0-9 ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ]+$/;

/**
 * Termos proibidos (pt-br + en) — lista própria, curada pelo time (ADR
 * 0005). Idêntica à de `set_display_name` (SQL, fonte da verdade) e de
 * `supabase/contract.ts`.
 */
export const PROHIBITED_DISPLAY_NAME_TERMS: readonly string[] = [
  'porra', 'caralho', 'merda', 'buceta', 'cacete', 'piroca', 'cuzao',
  'arrombado', 'arrombada', 'punheta', 'xoxota', 'putinha', 'corno',
  'fdp', 'desgracado', 'desgracada', 'viadinho', 'bosta',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'whore',
  'faggot', 'nigger', 'nigga', 'motherfucker', 'dickhead', 'slut',
  'retard', 'pussy',
];

/** Resultado da validação do Nome de Exibição, com o motivo da rejeição. */
export type DisplayNameValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: 'tooShort' | 'tooLong' | 'invalidChars' | 'profanity' };

/** Valida um Nome de Exibição (tamanho → caracteres → termos proibidos), com trim. */
export function validateDisplayName(rawName: string): DisplayNameValidation {
  const name = rawName.trim();
  if (name.length < DISPLAY_NAME_MIN_LENGTH) return { valid: false, reason: 'tooShort' };
  if (name.length > DISPLAY_NAME_MAX_LENGTH) return { valid: false, reason: 'tooLong' };
  if (!DISPLAY_NAME_CHARSET_REGEX.test(name)) return { valid: false, reason: 'invalidChars' };
  const lower = name.toLowerCase();
  if (PROHIBITED_DISPLAY_NAME_TERMS.some((term) => lower.includes(term))) {
    return { valid: false, reason: 'profanity' };
  }
  return { valid: true };
}
