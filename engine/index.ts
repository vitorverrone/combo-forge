/**
 * Motor de jogo puro: nenhuma dependência de React Native, Skia, Reanimated,
 * Zustand ou SQLite. Toda a lógica de regras do Combo Forge (Padrões,
 * Valor-Base, Multiplicador de Combo, Baralho, Mão, Descarte, Rodada, Meta,
 * Forja, Relíquias, DDA, Desafio Diário) vive aqui em fases futuras.
 */

export * from './cards';
export * from './patterns';
export * from './random';
export * from './deck';

export const engineModuleId = 'combo-forge-engine';
