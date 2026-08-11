/**
 * Forjadores.
 *
 * Um Forjador define o arquétipo da build pela Relíquia exclusiva de
 * largada, aplicada no início da Run fora do teto de 3 Relíquias. O MVP tem
 * três: Aprendiz (neutro, sem Relíquia — o onboarding), Martelo (fortalece
 * um Padrão) e Bigorna (mexe no Multiplicador de Combo). O Aprendiz é sempre
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
  /** Relíquia exclusiva de largada (fora do teto); ausente para o Aprendiz. */
  readonly startingRelic?: Relic;
}

export const FORGERS: readonly Forger[] = [
  { id: 'apprentice', name: 'Apprentice' },
  {
    id: 'hammer',
    name: 'Hammer',
    startingRelic: {
      id: 'forger-hammer',
      name: 'Hammer Rhythm',
      category: 'pattern',
      rarity: 'common',
      effect: { kind: 'pattern', pattern: PatternKind.ThreeOfAKind, bonus: 10 },
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
      effect: { kind: 'comboStart', multiplier: 2 },
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
