/**
 * Tipografia global — fontes carregadas via expo-font no App.tsx.
 *
 * - **body**: Rubik (variável — todos os pesos de um único arquivo TTF)
 * - **heading / logo**: Selawik (Regular + Bold — substituto open-source do Segoe UI)
 */

export const fonts = {
  /** Corpo de texto, labels, badges. */
  body: 'Rubik',
  /** Títulos, logos, headings. */
  heading: 'Selawik',
} as const;
