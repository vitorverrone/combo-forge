/**
 * Forja e Cartas Forjadas.
 *
 * Ao vencer uma Rodada (da 1ª à 5ª), o motor gera 3 ofertas de Forja
 * distintas: 2 de Efeito de Forja + 1 de Relíquia — sempre, mesmo com o teto
 * de RELIC_CAP Relíquias ativas já atingido (ajuste de UX: a oferta de
 * Relíquia deixou de virar uma terceira oferta de carta; ver
 * applyForgeOffer em run.ts, que passa a exigir escolher qual Relíquia já
 * adquirida substituir quando o teto está cheio). Aplicar um efeito
 * transforma a carta do Baralho numa Carta Forjada, permanente na Run, que
 * pode ser forjada de novo em Forjas futuras (empilhamento; a resolução
 * sempre soma antes de multiplicar — ver patterns.ts).
 *
 * RNG: as ofertas usam uma stream separada do embaralhamento, derivada do
 * seed da Run e do número da Rodada (forgeOfferSeed), para que as ofertas do
 * Desafio Diário não dependam das decisões do jogador dentro da Rodada
 * (ver nota em random.ts).
 */

import { Card, cardKey, ForgeEffect, ForgedCard } from './cards';
import { shuffle } from './deck';
import { Rng } from './random';
import { Relic, RELIC_POOL } from './relics';

export type ForgeOffer =
  | { readonly type: 'cardEffect'; readonly effect: ForgeEffect }
  | { readonly type: 'relic'; readonly relic: Relic };

/** Quantidade de ofertas de Efeito de Forja por Forja — sempre 2, mesmo no teto de Relíquias. */
export const CARD_EFFECT_OFFERS = 2;

/**
 * Pool de Efeitos de Forja ofertáveis (sintonizável — os números são dados,
 * a forma das regras é a que importa). Cada entrada é única: a geração
 * embaralha o pool e toma as primeiras N, garantindo ofertas distintas.
 */
export const FORGE_EFFECT_POOL: readonly ForgeEffectOption[] = [
  { id: 'value-bonus-2', effect: { kind: 'valueBonus', amount: 2 } },
  { id: 'value-bonus-3', effect: { kind: 'valueBonus', amount: 3 } },
  { id: 'value-bonus-5', effect: { kind: 'valueBonus', amount: 5 } },
  { id: 'multiplier-2', effect: { kind: 'multiplier', multiplier: 2 } },
  { id: 'multiplier-3', effect: { kind: 'multiplier', multiplier: 3 } },
  { id: 'wildcard', effect: { kind: 'wildcard' } },
  { id: 'trigger-3-20', effect: { kind: 'trigger', triggerPlay: 3, bonus: 20 } },
  { id: 'trigger-4-30', effect: { kind: 'trigger', triggerPlay: 4, bonus: 30 } },
];

/**
 * Efeitos de Forja bônus (ticket 11): entram no pool de ofertas apenas quando
 * o marco "5ª Run vencida" as desbloqueia (o jogador escolhe a ordem).
 */
export const BONUS_FORGE_EFFECTS: readonly ForgeEffectOption[] = [
  { id: 'value-bonus-7', effect: { kind: 'valueBonus', amount: 7 } },
  { id: 'trigger-2-15', effect: { kind: 'trigger', triggerPlay: 2, bonus: 15 } },
];

/**
 * Uma entrada do pool de Efeitos de Forja: o efeito + um id estável. O id é
 * a identidade usada pela Meta-Progressão (ticket 11) para gatear os efeitos
 * bônus (BONUS_FORGE_EFFECTS) por desbloqueio.
 */
export interface ForgeEffectOption {
  readonly id: string;
  readonly effect: ForgeEffect;
}

/**
 * Seed da stream de Forja da Rodada R: independente do stream de
 * embaralhamento e dependente apenas do seed da Run e da Rodada, de modo que
 * dois jogadores do Desafio Diário recebam as mesmas ofertas mesmo vencendo
 * a Rodada com caminhos de Jogadas diferentes.
 */
export function forgeOfferSeed(seed: number, roundNumber: number): number {
  return (Math.imul(seed, 31) + roundNumber) >>> 0;
}

export interface ForgeOfferOptions {
  /**
   * DDA de vitórias fáceis (ticket 07): aumenta a frequência de Relíquia
   * rara na oferta. Consome uma chamada extra de rng() — determinística
   * para a mesma stream.
   */
  readonly rareRelicBoost?: boolean;
  /**
   * Pool de Efeitos de Forja ofertáveis (ticket 11): a Meta-Progressão filtra
   * os efeitos bônus até serem desbloqueados. Padrão: FORGE_EFFECT_POOL.
   */
  readonly forgeEffects?: readonly ForgeEffectOption[];
  /**
   * Pool de Relíquias ofertáveis (ticket 11): as raras só entram com o
   * desbloqueio de recorde ≥ 2.500. Padrão: RELIC_POOL completo.
   */
  readonly relics?: readonly Relic[];
}

/** Probabilidade de a oferta vir do subconjunto raro quando o boost está ativo. */
export const RARE_RELIC_BOOST_RATE = 0.5;

/**
 * Gera as 3 ofertas da Forja: 2 de Efeito de Forja + 1 de Relíquia, sempre —
 * mesmo com o teto de RELIC_CAP Relíquias ativas já atingido (a escolha de
 * qual Relíquia substituir fica pra applyForgeOffer, em run.ts).
 * Determinístico para uma mesma stream.
 */
export function generateForgeOffers(
  rng: Rng,
  ownedRelics: readonly Relic[],
  options: ForgeOfferOptions = {},
): ForgeOffer[] {
  const effectPool = options.forgeEffects ?? FORGE_EFFECT_POOL;
  const relicPool = options.relics ?? RELIC_POOL;
  const offers: ForgeOffer[] = pickDistinct(effectPool, CARD_EFFECT_OFFERS, rng).map((option) => ({
    type: 'cardEffect',
    effect: option.effect,
  }));
  const available = relicPool.filter((relic) => !ownedRelics.some((owned) => owned.id === relic.id));
  // Exclui categoria combo do subconjunto raro do boost (rebalance pós
  // health-check, ADR 0006): o próprio boost de Relíquia rara do DDA não
  // deve mais alimentar o desequilíbrio de Combo que o DDA existe pra
  // conter. Sem raras fora de combo, o boost simplesmente não tem efeito
  // nesta chamada — cai para o sorteio normal entre `available`.
  const boostableRares = available.filter((relic) => relic.rarity === 'rare' && relic.category !== 'combo');
  let candidates = available;
  if (options.rareRelicBoost && boostableRares.length > 0 && rng() < RARE_RELIC_BOOST_RATE) {
    candidates = boostableRares;
  }
  const [relic] = pickDistinct(candidates, 1, rng);
  if (relic === undefined) {
    throw new Error('Nenhuma Relíquia disponível para a oferta de Forja.');
  }
  offers.push({ type: 'relic', relic });
  return offers;
}

/**
 * Aplica um Efeito de Forja a uma carta, empilhando efeitos numa Carta
 * Forjada já existente. Retorna a nova lista de Cartas Forjadas (imutável).
 */
export function forgeCard(
  forgedCards: readonly ForgedCard[],
  card: Card,
  effect: ForgeEffect,
): ForgedCard[] {
  const key = cardKey(card);
  const existing = forgedCards.find((forged) => cardKey(forged.card) === key);
  if (!existing) return [...forgedCards, { card, effects: [effect] }];
  return forgedCards.map((forged) =>
    cardKey(forged.card) === key ? { ...forged, effects: [...forged.effects, effect] } : forged,
  );
}

function pickDistinct<T>(pool: readonly T[], count: number, rng: Rng): T[] {
  return shuffle(pool, rng).slice(0, count);
}
