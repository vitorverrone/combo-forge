# 04 — Motor: Rodada, Meta e Combo

**What to build:** O motor executa a Rodada completa: 4 Jogadas, pontuação acumulada comparada à Meta (curva base 50 × 1,7^(R−1)), Multiplicador de Combo crescendo ×1→×4 a cada Jogada da Rodada e zerando na Rodada seguinte, vitória ao atingir a Meta e derrota ao esgotar as Jogadas. Emite eventos de Jogada e de fim de Rodada.

**Blocked by:** 02 — Motor: Padrões e Valor-Base, 03 — Motor: Baralho, Mão e Descarte

**Status:** done

- [ ] A 1ª Jogada da Rodada usa ×1, a 4ª usa ×4; o Multiplicador zera ao iniciar uma nova Rodada
- [ ] Pontuação da Rodada = Σ (Valor-Base da Jogada × Multiplicador de Combo da Jogada)
- [ ] A Meta da Rodada R segue a curva base 50 × 1,7^(R−1) (valores sintonizáveis)
- [ ] Rodada é vencida ao acumular ≥ Meta; a Run termina ao esgotar as 4 Jogadas sem atingir a Meta
- [ ] Eventos emitidos por Jogada (pontos, multiplicador) e por fim de Rodada (vitória/derrota)
- [ ] Estado da Run serializável, sem referências de UI
