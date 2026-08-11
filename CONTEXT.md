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
O subconjunto de 7 cartas do Baralho que o jogador segura e a partir do qual seleciona as cartas de uma Jogada. Reabastece pelo Baralho após cada Jogada ou Descarte.
_Evitar_: Hand (em inglês), baralho (Mão é um subconjunto, não o deck inteiro)

**Descarte**:
A ação de trocar cartas da Mão antes de jogar: as cartas escolhidas voltam ao Baralho e o mesmo número é comprado. Há 2 Descarte por Rodada, compartilhados entre as 4 Jogadas; os não usados são perdidos.
_Evitar_: Troca, redraw, swap

**Rodada**:
Uma unidade da Run com uma Meta de pontos e exatamente 4 Jogadas disponíveis. É vencida quando a pontuação acumulada atinge a Meta antes das Jogadas se esgotarem.
_Evitar_: Blind (é o nome do GDD para a Meta; Rodada é a unidade de jogo), round

**Meta**:
O alvo de pontos de uma Rodada. Atingida quando a pontuação acumulada da Rodada a iguala ou supera, avançando a Run; não atingida, a Run termina.
_Evitar_: Blind, objetivo, alvo

**Run**:
Uma sessão completa de jogo, da Rodada 1 até a derrota ou até vencer a 6ª Rodada. Ao falhar, reinicia-se imediatamente uma nova Run.
_Evitar_: Partida, run run (sem repetição)
