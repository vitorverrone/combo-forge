# 08 — Run jogável (tela de jogo)

**What to build:** A Run jogável de ponta a ponta: tela de início com escolha do Forjador, Mão de 7 cartas na tela, seleção de 2–5 cartas com preview do melhor Padrão e do Valor-Base, ações Jogar e Descartar, e HUD com Meta, pontos acumulados, Jogadas e Descarte restantes e Multiplicador de Combo. A UI despacha ações para o motor via camada de estado e renderiza o estado resultante — nenhuma regra de jogo na UI.

**Blocked by:** 04 — Motor: Rodada, Meta e Combo

**Status:** ready-for-agent

- [ ] Tela de início de Run permite escolher o Forjador (Aprendiz sempre disponível; Martelo e Bigorna apenas se desbloqueados) e mostra a Relíquia de largada
- [ ] A Mão de 7 cartas é renderizada; selecionar 2–5 cartas mostra o Padrão reconhecido e o Valor-Base antes de confirmar
- [ ] Jogar executa a pontuação no motor e atualiza pontos, Multiplicador de Combo e cartas restantes; Descartar consome um Descarte e reabastece a Mão
- [ ] HUD mostra Meta da Rodada, pontos acumulados, Jogadas e Descarte restantes
- [ ] A camada de UI/estado não contém nenhuma regra de jogo (todo comportamento passa pelo motor)
