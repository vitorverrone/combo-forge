/**
 * Relíquias: pool e metadados.
 *
 * Ticket 05 (Forja) precisa do pool para gerar as ofertas de Relíquia e do
 * teto de 3 ativas. A aplicação dos efeitos de cada Relíquia ao cálculo de
 * pontuação e à estrutura da Rodada é o ticket 06 (Motor: Relíquias e
 * Forjadores) — aqui vivem apenas os dados (id, nome, categoria, raridade).
 *
 * Nomes em inglês (texto de jogo). 10 Relíquias em 4 categorias:
 * suit (multiplica um Naipe), pattern (fortalece um Padrão),
 * mechanic (ajustes suaves, nunca +1 Jogada) e combo (mexe no Multiplicador).
 */

export type RelicCategory = 'suit' | 'pattern' | 'mechanic' | 'combo';

export type RelicRarity = 'common' | 'rare';

export interface Relic {
  readonly id: string;
  readonly name: string;
  readonly category: RelicCategory;
  readonly rarity: RelicRarity;
}

/** Teto de Relíquias ativas por Run. */
export const RELIC_CAP = 3;

export const RELIC_POOL: readonly Relic[] = [
  // Naipe — multiplica um Naipe (aplicação no ticket 06)
  { id: 'suit-spades', name: 'Blade of Spades', category: 'suit', rarity: 'common' },
  { id: 'suit-hearts', name: 'Hearth of Hearts', category: 'suit', rarity: 'common' },
  { id: 'suit-diamonds', name: 'Crown of Diamonds', category: 'suit', rarity: 'common' },
  { id: 'suit-clubs', name: 'Oak of Clubs', category: 'suit', rarity: 'common' },
  // Padrão — fortalece um Padrão
  { id: 'pattern-pair', name: 'Pair Forge', category: 'pattern', rarity: 'common' },
  { id: 'pattern-straight', name: 'Straight Line', category: 'pattern', rarity: 'rare' },
  // Mecânica — ajustes suaves (ex.: +1 Descarte, +1 carta na Mão; nunca +1 Jogada)
  { id: 'mechanic-discard', name: 'Scrap Yard', category: 'mechanic', rarity: 'common' },
  { id: 'mechanic-hand', name: 'Big Bench', category: 'mechanic', rarity: 'common' },
  // Combo — mexe no Multiplicador de Combo
  { id: 'combo-start', name: 'Warm Up', category: 'combo', rarity: 'common' },
  { id: 'combo-plus', name: 'Chain Reaction', category: 'combo', rarity: 'rare' },
];
