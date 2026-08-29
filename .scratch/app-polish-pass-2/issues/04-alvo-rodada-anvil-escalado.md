# 04 — Alvo de rodada do Anvil escalado ×1.5

**What to build:** ao jogar com o Forjador Anvil (que já começa com o Multiplicador de Combo em ×1.5), o alvo de pontuação de cada uma das 6 rodadas também é escalado por ×1.5, tornando a troca de dificuldade real em vez de um bônus gratuito. Outros Forjadores (Aprendiz, Martelo) continuam com o alvo exatamente como é hoje. O Desafio Diário (Forjador fixo `apprentice`, ranking semanal comparável entre jogadores) não é afetado.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-agent

- [ ] `engine/run.ts`: `baseTarget(roundNumber)` (ou a função que o chama, que já recebe `forger: ForgerId` no escopo onde a Rodada é montada) passa a escalar o alvo por ×1.5 quando `forger === 'anvil'`, mantendo o alvo inalterado para os demais Forjadores. Aplicado **antes** do ajuste de DDA (`adjustTarget`), na mesma ordem em que os dois já compõem hoje.
- [ ] Nenhuma mudança em `Forger`/`ForgerId` (`engine/forgers.ts`) — a regra "só Anvil, ×1.5" vive inteiramente no cálculo do alvo, sem exigir campo novo no catálogo de Forjadores.
- [ ] Confirmar (sem precisar de mudança de código, já é o comportamento atual) que `store/dailyFlow.ts` continua chamando a Run do Desafio Diário com Forjador fixo `apprentice` — o rebalance do Anvil não deve alcançar o Desafio Diário.
- [ ] Teste em `engine/run.test.ts` cobrindo: alvo da rodada 1 e de pelo menos mais uma rodada com Anvil (ex.: 50→75 na rodada 1, escalado corretamente na fórmula de crescimento das demais), alvo inalterado com outro Forjador nas mesmas rodadas, e (se aplicável no mesmo arquivo ou em `store/dailyFlow.test.ts`) confirmação de que uma Run do Desafio Diário não varia por Forjador.
