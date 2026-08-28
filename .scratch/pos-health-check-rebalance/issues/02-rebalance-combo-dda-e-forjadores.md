# 02 — Rebalance: Combo, DDA e Forjadores

**What to build:** o multiplicador de combo deixa de ser dominado por um único outlier de sorte (Chain Reaction + Forjador Bigorna), o DDA reage mais rápido a sequências de vitórias fáceis sem afetar o lado das falhas, e os três Forjadores passam a ter identidades de build genuinamente diferentes (Aprendiz explorador, Martelo especialista em Trinca, Bigorna estável) em vez de Bigorna ser estritamente melhor. Um achado desta sessão de grilling também é corrigido: o boost de Relíquia rara do DDA parava de favorecer Relíquias de categoria Combo, então não alimenta mais o próprio desequilíbrio que o DDA existe pra conter. Racional completo e números já travados em `docs/adr/0006-rebalance-p1-pos-health-check.md`.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** done

- [x] `engine/relics.ts`: `comboGrowth.step` da Relíquia Chain Reaction (`combo-plus`) muda de 2 para 1.5.
- [x] `engine/forgers.ts`: Relíquia de largada do Forjador Bigorna (`anvil`) muda `comboStart.multiplier` de 2 para 1.5.
- [x] `engine/forgers.ts`: Relíquia de largada do Forjador Martelo (`hammer`) muda `pattern.bonus` de 10 para 20.
- [x] `engine/forgers.ts`: Forjador Aprendiz (`apprentice`) ganha uma Relíquia de largada nova com efeito `handSize` +1 (hoje não tem `startingRelic`).
- [x] `engine/dda.ts`: `DEFAULT_DDA_CONFIG.easyWinAdjustment` muda de 0.1 para 0.15; `failureAdjustment` permanece 0.1, inalterado (mudança assimétrica, intencional).
- [x] `engine/forge.ts`: em `generateForgeOffers`, quando `rareRelicBoost` está ativo, o subconjunto de Relíquias raras usado no sorteio exclui as de categoria `combo`. Se a exclusão esvaziar o subconjunto, o boost não tem efeito naquela chamada — cai pro sorteio normal entre as disponíveis, sem lançar erro.
- [x] Testes estendem `dda.test.ts`, `relics.test.ts`, `forgers.test.ts` e `forge.test.ts` cobrindo cada mudança acima — especialmente `forge.test.ts` com `rareRelicBoost` ativo nunca retornando uma Relíquia de categoria `combo`, repetindo com várias seeds.
- [x] Determinismo do Desafio Diário (ADR 0003) confirmado: o teste existente de "mesmo seed → mesma sequência de ofertas" continua passando com a exclusão de categoria `combo` no lugar.
