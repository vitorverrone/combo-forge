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
O conjunto fixo de 40 cartas da Run: 4 naipes × 10 valores (1 a 10, sem figuras). As cartas jogadas são recicladas — retornam ao Baralho ao fim da Rodada —, então a composição só muda através de Forjas escolhidas entre Rodadas.
_Evitar_: Deck, baralho consumível

**Naipe**:
A família de uma carta. Há 4 no jogo (Espadas, Copas, Ouros, Paus). Por si só não forma Padrão — é identidade usada por Relíquias e efeitos de carta.
_Evitar_: Suit, cor (cor é detalhe de renderização)

**Valor**:
O número de uma carta, de 1 a 10. Entra na soma do Valor-Base e na formação de Sequências.
_Evitar_: Rank

**Forja**:
O momento entre Rodadas em que o jogador escolhe 1 entre 3 ofertas para fortalecer a build: 2 ofertas de efeito de carta e 1 oferta de Relíquia. Ocorre após cada Rodada vencida (5 por Run).
_Evitar_: Upgrade, shop, melhoria

**Carta Forjada**:
Uma carta do Baralho que recebeu um ou mais Efeitos de Forja, permanentes na Run, aplicados sempre que a carta entra numa Jogada. Pode ser forjada de novo em Forjas futuras, empilhando efeitos.
_Evitar_: Carta melhorada, enhanced card

**Efeito de Forja**:
Um dos quatro efeitos aplicáveis a uma carta via Forja: +Valor (soma fixa ao Valor da carta), Multiplicador (carta vale ×2 ou ×3), Curinga (conta como qualquer Valor e qualquer Naipe) e Gatilho (bônus sob condição, ex.: "se for a 3ª Jogada da Rodada, +20"). Efeitos empilhados resolvem somas antes de multiplicadores.
_Evitar_: Efeito especial, habilidade de carta

**Relíquia**:
Um item passivo que altera uma regra global da Run, adquirido via Forja, com máximo de 3 ativas por Run. O pool do MVP tem 10, em 4 categorias: Naipe (multiplica um naipe), Padrão (fortalece um Padrão), Mecânica (ajustes suaves, ex.: +1 Descarte ou +1 carta na Mão — nunca +1 Jogada) e Combo (mexe no Multiplicador de Combo).
_Evitar_: Artefato, item, power-up

**Mão**:
O subconjunto de 7 cartas do Baralho que o jogador segura e a partir do qual seleciona as cartas de uma Jogada. Reabastece pelo Baralho após cada Jogada ou Descarte.
_Evitar_: Hand (em inglês), baralho (Mão é um subconjunto, não o deck inteiro)

**Descarte**:
A ação de trocar cartas da Mão antes de jogar: as cartas escolhidas voltam ao Baralho e o mesmo número é comprado. Há 2 Descarte por Rodada, compartilhados entre as 4 Jogadas; os não usados são perdidos.
_Evitar_: Troca, redraw, swap

**Padrão**:
A configuração das cartas de uma Jogada que define o bônus do Valor-Base. Os padrões do jogo são: Carta Alta (fallback de 1 carta), Par, Dois Pares, Trinca, Sequência (5 cartas em ordem, naipes livres, incluindo Ás–5 e 10–Ás), Full House e Quadra. A Jogada pontua o melhor Padrão formado pelas cartas selecionadas (2–5 cartas, ou 1 para Carta Alta) e todas as cartas selecionadas somam seus valores ao bônus.
_Evitar_: Mão (Mão é o conjunto disponível; Padrão é a configuração jogada), combinação

**Rodada**:
Uma unidade da Run com uma Meta de pontos e exatamente 4 Jogadas disponíveis. É vencida quando a pontuação acumulada atinge a Meta antes das Jogadas se esgotarem.
_Evitar_: Blind (é o nome do GDD para a Meta; Rodada é a unidade de jogo), round

**Meta**:
O alvo de pontos de uma Rodada. Atingida quando a pontuação acumulada da Rodada a iguala ou supera, avançando a Run; não atingida, a Run termina. A curva base é 50 × 1,7^(R−1) na Rodada R, ajustada pelo DDA.
_Evitar_: Blind, objetivo, alvo

**Dificuldade Dinâmica (DDA)**:
O sistema que ajusta a Meta para manter o jogador em Flow, persistente entre Runs. Falhar a mesma Rodada 3 vezes seguidas reduz a Meta dela em 10%; 5 vitórias fáceis consecutivas (margem ≥ 30% acima da Meta com 1+ Jogada sobrando) aumentam a Meta em 10% e a chance de Relíquia rara. Hesitação dispara apenas dicas visuais, sem tocar a Meta. Fica desligado no Desafio Diário.
_Evitar_: Curva de dificuldade (a curva base é o alicerce; DDA é o ajuste dinâmico sobre ela), adaptive difficulty

**Run**:
Uma sessão completa de jogo, da Rodada 1 até a derrota ou até vencer a 6ª Rodada. Ao falhar, reinicia-se imediatamente uma nova Run.
_Evitar_: Partida, run run (sem repetição)
