/**
 * Forja e Cartas Forjadas.
 *
 * Ao vencer uma Rodada (da 1ª à 5ª), o motor gera 3 ofertas de Forja
 * distintas: 2 de Efeito de Forja + 1 de Relíquia (ou uma terceira oferta de
 * carta quando o teto de 3 Relíquias ativas foi atingido). Aplicar um efeito
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
import { Relic, RELIC_CAP, RELIC_POOL } from './relics';

export type ForgeOffer =
  | { readonly type: 'cardEffect'; readonly effect: ForgeEffect }
  | { readonly type: 'relic'; readonly relic: Relic };

/** Quantidade padrão de ofertas de Efeito de Forja por Forja (2). */
export const CARD_EFFECT_OFFERS = 2;
/** Quantidade quando a oferta de Relíquia vira carta (teto de Relíquias atingido). */
export const MAX_CARD_EFFECT_OFFERS = 3;

/**
 * Pool de Efeitos de Forja ofertáveis (sintonizável — os números são dados,
 * a forma das regras é a que importa). Cada entrada é única: a geração
 * embaralha o pool e toma as primeiras N, garantindo ofertas distintas.
 */
export const FORGE_EFFECT_POOL: readonly ForgeEffect[] = [
  { kind: 'valueBonus', amount: 2 },
  { kind: 'valueBonus', amount: 3 },
  { kind: 'valueBonus', amount: 5 },
  { kind: 'multiplier', multiplier: 2 },
  { kind: 'multiplier', multiplier: 3 },
  { kind: 'wildcard' },
  { kind: 'trigger', triggerPlay: 3, bonus: 20 },
  { kind: 'trigger', triggerPlay: 4, bonus: 30 },
];

/**
 * Seed da stream de Forja da Rodada R: independente do stream de
 * embaralhamento e dependente apenas do seed da Run e da Rodada, de modo que
 * dois jogadores do Desafio Diário recebam as mesmas ofertas mesmo vencendo
 * a Rodada com caminhos de Jogadas diferentes.
 */
export function forgeOfferSeed(seed: number, roundNumber: number): number {
  return (Math.imul(seed, 31) + roundNumber) >>> 0;
}

/**
 * Gera as 3 ofertas da Forja: 2 de Efeito de Forja + 1 de Relíquia. Com o
 * teto de RELIC_CAP Relíquias ativas, a oferta de Relíquia vira uma terceira
 * oferta de carta. Determinístico para uma mesma stream.
 */
export function generateForgeOffers(rng: Rng, ownedRelics: readonly Relic[]): ForgeOffer[] {
  const hasRelicSlot = ownedRelics.length < RELIC_CAP;
  const effectCount = hasRelicSlot ? CARD_EFFECT_OFFERS : MAX_CARD_EFFECT_OFFERS;
  const offers: ForgeOffer[] = pickDistinct(FORGE_EFFECT_POOL, effectCount, rng).map((effect) => ({
    type: 'cardEffect',
    effect,
  }));
  if (hasRelicSlot) {
    const available = RELIC_POOL.filter((relic) => !ownedRelics.some((owned) => owned.id === relic.id));
    const [relic] = pickDistinct(available, 1, rng);
    if (relic === undefined) {
      throw new Error('Nenhuma Relíquia disponível para a oferta de Forja.');
    }
    offers.push({ type: 'relic', relic });
  }
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
