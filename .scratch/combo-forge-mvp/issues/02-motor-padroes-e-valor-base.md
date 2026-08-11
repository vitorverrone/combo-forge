# 02 — Motor: Padrões e Valor-Base

**What to build:** O motor reconhece o melhor Padrão formado pelas cartas selecionadas (Carta Alta, Par, Dois Pares, Trinca, Sequência, Full House e Quadra), aceita Sequências Ás–5 e 10–Ás, e calcula o Valor-Base de uma Jogada = bônus do Padrão + soma dos Valores das cartas selecionadas. Entrega as funções puras de reconhecimento e pontuação com testes.

**Blocked by:** 01 — Scaffolding do projeto

**Status:** done

- [ ] Cada um dos 7 Padrões é reconhecido com o bônus correto (tabela sintonizável: Carta Alta 0, Par 5, Dois Pares 15, Trinca 25, Sequência 40, Full House 55, Quadra 70)
- [ ] Uma Jogada de 2–5 cartas pontua o melhor Padrão formado pelas cartas selecionadas; cartas extras além do mínimo do Padrão somam seus Valores
- [ ] Carta Alta (1 carta) é o fallback válido, com bônus 0 e pontuando apenas o Valor da carta
- [ ] Sequência reconhece Ás–5 e 10–Ás; cartas fora de ordem contígua não formam Sequência
- [ ] O cálculo é uma função pura e determinística: mesmo estado + mesma entrada → mesmo resultado, sem estado interno
