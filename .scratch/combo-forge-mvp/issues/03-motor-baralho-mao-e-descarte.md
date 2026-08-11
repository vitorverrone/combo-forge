# 03 — Motor: Baralho, Mão e Descarte

**What to build:** O motor gerencia o Baralho de 40 cartas (4 naipes × Valores 1–10, sem figuras), embaralhado com fonte de aleatoriedade injetada, a Mão de 7 cartas com reabastecimento após cada Jogada ou Descarte, os 2 Descarte por Rodada e a reciclagem das cartas jogadas ao fim da Rodada. Entrega o estado serializável do Baralho/Mão com testes de determinismo.

**Blocked by:** 01 — Scaffolding do projeto

**Status:** done

- [ ] Baralho com 40 cartas únicas (4 naipes × 10 Valores), sem figuras
- [ ] Embaralhamento determinístico com RNG injetado: mesmo seed → mesma ordem
- [ ] Mão de 7 cartas reabastece do Baralho após cada Jogada ou Descarte
- [ ] Descarte devolve as cartas escolhidas ao Baralho e compra o mesmo número; limite de 2 por Rodada, não usados são perdidos
- [ ] Cartas jogadas voltam ao Baralho ao fim da Rodada (reciclagem — o deck mantém sempre as 40 cartas)
- [ ] Estado do Baralho/Mão é serializável, sem referências de UI
