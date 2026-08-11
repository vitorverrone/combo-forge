# Combo Forge

Roguelike de cartas mobile de sessão curta (3–8 min) em que o jogador monta combos de cartas que multiplicam a pontuação, tentando bater a meta (blind) de cada rodada antes que as Jogadas se esgotem.

## Linguagem

### Mecânica Principal

**Jogada**:
O conjunto de 2–5 cartas que o jogador seleciona e joga em um turno, formando um padrão reconhecido (par, trinca, sequência, etc.). É pontuada pelo seu Valor-Base, antes de aplicar multiplicadores.
_Evitar_: Play, mão jogada, combo (Multiplicador de Combo é o sistema de multiplicadores, não a jogada em si)

**Valor-Base**:
A pontuação bruta de uma Jogada antes de qualquer multiplicador: o bônus fixo do padrão formado mais a soma dos valores das cartas escolhidas (ex.: trinca de 7+7+7 = 25 + 21 = 46).
_Evitar_: Chips, pontos brutos

**Multiplicador de Combo**:
O fator aplicado ao Valor-Base de uma Jogada, igual à contagem de Jogadas já feitas na mesma Rodada (1ª Jogada ×1, 2ª ×2, 3ª ×3, etc.). Zera ao iniciar uma nova Rodada.
_Evitar_: Combo (sem qualificação), streak, chain, multiplicador global

**Baralho**:
O conjunto fixo de cartas disponíveis na Run. As cartas jogadas são recicladas — retornam ao Baralho ao fim da Rodada —, então a composição só muda através de Upgrades escolhidos entre Rodadas.
_Evitar_: Deck, baralho consumível

**Mão**:
O subconjunto de cartas do Baralho que o jogador segura e a partir do qual seleciona as cartas de uma Jogada. Reabastece pelo Baralho após cada Jogada.
_Evitar_: Hand (em inglês), baralho (Mão é um subconjunto, não o deck inteiro)
