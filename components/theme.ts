/** Paleta da UI (tema de forja). */
export const colors = {
  /** Fundo geral: carvão arroxeado profundo. */
  background: '#161120',
  /** Superfícies elevadas (HUD, painéis). */
  surface: '#221a30',
  /** Superfícies levemente acima do surface (chips, relics). */
  surfaceElevated: '#241b33',
  /** Superfícies em estado selecionado/ativo. */
  surfaceSelected: '#2a2140',
  surfaceBorder: '#3a2f4c',
  /** Backdrop de modais (background com opacidade). */
  backdrop: 'rgba(22,17,32,0.8)',
  /** Face das cartas: pergaminho. */
  cardFace: '#f2e9d8',
  cardInk: '#221a2e',
  /** Naipes vermelhos. */
  red: '#c1352c',
  /** Ouro da Forja (destaques, botão principal). */
  gold: '#e0a53e',
  goldDark: '#b9842a',
  /** Texto escuro em superfícies douradas (botões primários). */
  textOnPrimary: '#241a05',
  text: '#f4ede1',
  textDim: '#a89bb8',
  /** Feedback de erro/perda. */
  danger: '#e05c4e',
  /** Feedback de vitória. */
  success: '#7fc98a',
} as const;

/**
 * Escala de espaçamento (padding/margin/gap). Extraída dos valores já usados
 * de forma consistente pelo app (grade real de 2px, confirmada por
 * frequência de uso — não uma escala nova imposta por cima). Valores raros
 * (1, 3, 5, 7, 11 — usados 1-3 vezes, provavelmente ajustes finos pontuais)
 * e os bem maiores que 28 (offsets de layout específicos, ex.: espaço pro
 * banner de anúncio) ficam de fora de propósito — não são "espaçamento", são
 * exceções ou restrições de layout.
 */
export const spacing = {
  0: 0,
  2: 2,
  3: 3,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  28: 28,
} as const;

/**
 * Escala de raio de borda. Mesma lógica do spacing: valores já usados de
 * forma consistente (grade real, confirmada por frequência). Raios raros —
 * em geral metade da largura/altura de um elemento específico para formar um
 * círculo (ex.: borderRadius: 19 para um dot de 38×38) — ficam de fora: são
 * uma relação com aquele elemento, não uma escolha de escala.
 */
export const radius = {
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
} as const;
