/**
 * Motor de jogo puro: nenhuma dependência de React Native, Skia, Reanimated,
 * Zustand ou SQLite. Toda a lógica de regras do Combo Forge (Padrões,
 * Valor-Base, Multiplicador de Combo, Baralho, Mão, Descarte, Rodada, Meta,
 * Forja e Cartas Forjadas, Relíquias e Forjadores, DDA) vive aqui; o Desafio
 * Diário com seed completo entra em fase futura.
 */

export * from './cards';
export * from './patterns';
export * from './random';
export * from './deck';
export * from './dda';
export * from './relics';
export * from './forge';
export * from './forgers';
export * from './progression';
export * from './run';

export const engineModuleId = 'combo-forge-engine';
