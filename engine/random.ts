/**
 * Fonte de aleatoriedade injetada.
 *
 * O motor nunca usa Math.random diretamente: recebe um `Rng` como parâmetro,
 * o que permite (a) testes determinísticos e (b) o Desafio Diário rodar a
 * mesma Run para todos os jogadores a partir do mesmo seed.
 *
 * Nota de design (tickets 05/13): decisões do jogador (quantas Jogadas
 * até esgotar o drawPile) mudam quantas chamadas de rng() o embaralhamento
 * consome. Para o Desafio Diário ser justo, as ofertas de Forja/Relíquia
 * usam streams de RNG separados, derivados do seed da Run e da Rodada
 * (forgeOfferSeed em forge.ts — implementado no ticket 05), nunca o mesmo
 * stream do embaralhamento. O seed completo do Desafio Diário (que também
 * desliga o DDA, ticket 07) virá no ticket 13.
 */

export type Rng = () => number;

/**
 * PRNG determinístico mulberry32. Para um mesmo seed inteiro, produz sempre
 * a mesma sequência de números em [0, 1).
 */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
