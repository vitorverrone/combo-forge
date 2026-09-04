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
O número de uma carta, de 1 a 10. Entra na soma do Valor-Base e na formação de Sequências. O Ás (Valor 1) pode contar como 11 apenas para formar Sequências.
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
A configuração das cartas de uma Jogada que define o bônus do Valor-Base. Os padrões do jogo são: Carta Alta (fallback de 1 carta), Par, Dois Pares, Trinca, Sequência (5 cartas em ordem, naipes livres, incluindo Ás–5 e 10–Ás), Full House e Quadra. A Jogada pontua o melhor Padrão formado pelas cartas selecionadas (2–5 cartas, ou 1 para Carta Alta) e todas as cartas selecionadas somam seus valores ao bônus. Na soma do Valor-Base o Ás conta sempre seu Valor impresso (1), mesmo quando participa de uma Sequência como 11.
_Evitar_: Mão (Mão é o conjunto disponível; Padrão é a configuração jogada), combinação

**Rodada**:
Uma unidade da Run com uma Meta de pontos e exatamente 4 Jogadas disponíveis. É vencida quando a pontuação acumulada atinge a Meta antes das Jogadas se esgotarem.
_Evitar_: Blind (é o nome do GDD para a Meta; Rodada é a unidade de jogo), round

**Meta**:
O alvo de pontos de uma Rodada. Atingida quando a pontuação acumulada da Rodada a iguala ou supera, avançando a Run; não atingida, a Run termina. A curva base é 50 × 1,7^(R−1) na Rodada R, ajustada pelo DDA.
_Evitar_: Blind, objetivo, alvo

**Dificuldade Dinâmica (DDA)**:
O sistema que ajusta a Meta para manter o jogador em Flow, persistente entre Runs. É assimétrico: falhar a mesma Rodada 3 vezes seguidas reduz a Meta dela em 10%; 5 vitórias fáceis consecutivas (margem ≥ 30% acima da Meta com 1+ Jogada sobrando) aumentam a Meta em 15% e a chance de Relíquia rara — exceto Relíquias de categoria Combo, nunca favorecidas por esse boost, pra não retroalimentar builds de Multiplicador de Combo bem na hora em que o jogador já está ganhando fácil (ver ADR 0006). Hesitação dispara apenas dicas visuais, sem tocar a Meta. Fica desligado no Desafio Diário.
_Evitar_: Curva de dificuldade (a curva base é o alicerce; DDA é o ajuste dinâmico sobre ela), adaptive difficulty

**Forjador**:
Um personagem jogável definido por uma Relíquia exclusiva de largada (fora do teto de 3), cada um com uma identidade de build própria (ver ADR 0006). O MVP tem três: Aprendiz (padrão de início — ganha 1 carta extra na Mão, explorador de mais opções de Padrão), Martelo (especialista — fortalece a Trinca, vale persegui-la como padrão principal) e Bigorna (estável — começa a Run com o Multiplicador de Combo mais alto). O Aprendiz é sempre disponível; os demais são desbloqueados por Conquistas de meta-progressão.
_Evitar_: Personagem, classe, herói

**Desafio Diário**:
O modo diário de comparação social justa. Um seed cobre a Run inteira (embaralhamento do Baralho + ofertas de Forja e de Relíquia), idêntico para todos os jogadores, e o DDA fica desligado. São 1 tentativa gratuita por dia + tentativas extras ilimitadas via anúncio recompensado (opt-in), uma por vez — precisa terminar a Run desbloqueada pelo anúncio anterior antes de poder assistir o próximo. O ranking é semanal, ordenado pela pontuação final da Run, exige Nome de Exibição para participar e mostra sempre a própria posição e o top 10, atualizados ao abrir a tela.
_Evitar_: Daily, desafio do dia

**Nome de Exibição**:
O apelido público do dispositivo no ranking do Desafio Diário. Obrigatório — escolhido uma única vez, num modal bloqueante na primeira abertura da tela do Desafio Diário, sem opção de pular; editável depois na tela de Perfil. 3–16 caracteres, letras (com acento)/números/espaço, sem emoji ou símbolo; sem checagem de unicidade entre dispositivos (duplicados são permitidos). Moderado contra palavrão nos dois lados — cliente e servidor — porque a chamada ao backend é pública e contorna qualquer filtro que exista só no app.
_Evitar_: Nickname, username

**Meta-Progressão**:
O sistema de desbloqueio permanente entre Runs, sem moeda — por Conquista. Duas camadas: as 4 Conquistas de poder originais (1ª Run vencida desbloqueia o Forjador Martelo, 3ª a Bigorna, 5ª libera 2 Efeitos de Forja bônus no pool, recorde ≥ 2.500 numa Run libera Relíquias raras no pool — quando uma Conquista oferece mais de um desbloqueio, o jogador escolhe a ordem) e os 10 Títulos (ver termo próprio), todos de opção única — 14 Conquistas no total. ADR 0009 documenta a adição dos Títulos.
_Evitar_: Marco (nome antigo do termo), Progressão, unlocks, meta-jogo (meta-jogo é o sistema mais amplo)

**Título**:
Uma Conquista de Meta-Progressão cosmética — texto exibido na tela de Perfil, sem afetar poder de jogo, reivindicada automaticamente ao fim da Run assim que a condição é atingida (sempre opção única, nunca há escolha de ordem). O MVP tem 10, em 5 eixos: contagem de vitórias (10ª/15ª/25ª Run vencida), recorde de pontuação (4.000/6.000/9.000 pts), Multiplicador de Combo (×8/×12 numa Jogada), maestria de Forjador (vencer ao menos 1 Run com cada um dos 3 Forjadores) e maestria de Baralho (jogar as 40 cartas do Baralho ao menos uma vez cada). Existe pra esticar a curva de Meta-Progressão até o D30 sem produzir conteúdo mecânico novo balanceado — ver ADR 0009. ADR 0010 planeja mais dois eixos — progressão de Tier na Liga e Sequência do Desafio Diário — numa spec futura.
_Evitar_: Badge, emblema (é texto, não ícone), troféu — Título é um dos dois tipos de Conquista (o outro é Conquista de poder), não um sinônimo de Conquista

### Competição Social

**Liga**:
O sistema de ranqueamento semanal do Desafio Diário quando a base de jogadores atinge massa crítica (~300 participantes numa semana): substitui o leaderboard único (top 10 + posição própria) por Tiers e Divisões. Antes da massa crítica, a Liga não está ativa e o Desafio Diário usa o leaderboard único de sempre.
_Evitar_: Ranking (usado tanto pro leaderboard único quanto pra Liga — não confundir os dois estados)

**Tier**:
Um dos 5 patamares nomeados da Liga — Bronze, Prata, Ouro, Platina, Diamante, em ordem crescente. Bronze é piso (sem rebaixamento abaixo dele); Diamante é teto (sem promoção acima — os melhores de Diamante disputam entre si a cada semana, sem "subir" a lugar nenhum).
_Evitar_: Rank, patente — Liga é o sistema, Tier é o patamar dentro dele

**Divisão**:
O grupo de ~30 dispositivos que competem entre si dentro de um Tier, na mesma semana ISO do leaderboard do Desafio Diário. Ao fim da semana, os 5 melhores colocados sobem de Tier e os 5 piores descem — exceto nos extremos (Bronze não desce, Diamante não sobe). Jogadores empatados na fronteira de subida/descida se movem juntos, mesmo que isso resulte em mais ou menos de 5 movimentos naquela semana.
_Evitar_: Grupo, bracket, sala

**Sequência**:
A contagem de dias consecutivos (fronteira UTC, mesma de `daily_submissions.day`) em que o dispositivo submeteu ao menos uma pontuação ao Desafio Diário, independente do desempenho ou de qual tentativa (grátis ou via anúncio recompensado) gerou a submissão. Zera ao pular um dia — sem congelamento ou proteção nesta versão. Gera Títulos nos marcos de 3, 7, 15 e 30 dias.
_Evitar_: Streak (em inglês), ofensiva — e não confundir com Multiplicador de Combo, que é outro termo já definido

**Run**:
Uma sessão completa de jogo, da Rodada 1 até a derrota ou até vencer a 6ª Rodada. Ao falhar, reinicia-se imediatamente uma nova Run.
_Evitar_: Partida, run run (sem repetição)

**Loja**:
O subsistema de monetização não-intrusiva do jogo: vende cosméticos (skins de Baralho — 100% visuais, nunca tocam poder de jogo) e a remoção de anúncios (IAP não-consumível que esconde o banner). A orquestração de IO (carga de ofertas, compra, restore, sync de entitlement no launch) vive no fluxo da Loja (store/shopFlow.ts), que devolve a fatia nova para o store aplicar — mesma relação do Desafio Diário com o dailyFlow.
_Evitar_: Shop, storefront, lojinha

**Telemetria**:
Eventos de produto emitidos pelo app para observar como jogadores usam o Combo Forge em produção — retenção, progressão, calibração do DDA, fill rate de anúncio —, enviados ao Firebase Analytics e correlacionáveis ao mesmo device_id anônimo do Desafio Diário (ver ADR 0007). A orquestração de IO vive como port injetada nos flows do store, mesma relação da Loja com o shopFlow e do Desafio Diário com o dailyFlow.
_Evitar_: Analytics, tracking, logging
