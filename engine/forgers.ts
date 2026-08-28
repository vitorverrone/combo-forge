/**
 * Forjadores.
 *
 * Um Forjador define o arquétipo da build pela Relíquia exclusiva de
 * largada, aplicada no início da Run fora do teto de 3 Relíquias. O MVP tem
 * três, cada um com identidade própria (rebalance pós health-check, ADR
 * 0006): Aprendiz (explorador — +1 carta na Mão, mais opções de Padrão),
 * Martelo (especialista em Trinca) e Bigorna (Multiplicador de Combo, sem
 * mais ser estritamente melhor que os outros dois). O Aprendiz é sempre
 * disponível; os demais são desbloqueados por marcos de meta-progressão
 * (ticket 11) — aqui só os dados e a aplicação de largada.
 *
 * Nomes em inglês (texto de jogo).
 */

import { PatternKind } from './patterns';
import { Relic } from './relics';

export type ForgerId = 'apprentice' | 'hammer' | 'anvil';

export interface Forger {
  readonly id: ForgerId;
  readonly name: string;
  /** Relíquia exclusiva de largada (fora do teto). */
  readonly startingRelic?: Relic;
}

export const FORGERS: readonly Forger[] = [
  {
    id: 'apprentice',
    name: 'Apprentice',
    // Identidade própria de build (rebalance pós health-check, ADR 0006):
    // explorador com +1 carta na Mão, mais opções de Padrão por Jogada.
    startingRelic: {
      id: 'forger-apprentice',
      name: 'Apprentice Reach',
      category: 'mechanic',
      rarity: 'common',
      effect: { kind: 'handSize', amount: 1 },
    },
  },
  {
    id: 'hammer',
    name: 'Hammer',
    startingRelic: {
      id: 'forger-hammer',
      name: 'Hammer Rhythm',
      category: 'pattern',
      rarity: 'common',
      // Bônus dobrado de 10 para 20 (ADR 0006): perseguir Trinca vira
      // estratégia de especialista que compensa.
      effect: { kind: 'pattern', pattern: PatternKind.ThreeOfAKind, bonus: 20 },
    },
  },
  {
    id: 'anvil',
    name: 'Anvil',
    startingRelic: {
      id: 'forger-anvil',
      name: 'Anvil Beat',
      category: 'combo',
      rarity: 'common',
      // Multiplicador inicial reduzido de 2 para 1.5 (ADR 0006): escolher
      // Bigorna deixa de ser estritamente melhor que os outros Forjadores.
      effect: { kind: 'comboStart', multiplier: 1.5 },
    },
  },
];

export function getForger(id: ForgerId): Forger {
  const forger = FORGERS.find((candidate) => candidate.id === id);
  if (forger === undefined) {
    throw new Error(`Forjador desconhecido: ${id}.`);
  }
  return forger;
}
