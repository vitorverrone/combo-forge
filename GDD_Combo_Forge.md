**GAME DESIGN DOCUMENT**

**COMBO FORGE**

*Roguelike deckbuilder de sessão curta*

Gênero: Card Roguelike / Puzzle Numérico

Plataforma: Mobile (iOS / Android) --- portrait, one-hand play

Documento de Design de Jogo --- v1.0 --- Julho de 2026

**1. Visão Geral**

Combo Forge é um roguelike de cartas com sessões de 3 a 8 minutos, desenhado para o \"micro-momento\" mobile: fila, transporte público, intervalo de trabalho. O jogador monta combos de cartas que multiplicam pontuação de forma exponencial, tentando bater uma meta de pontos por rodada antes que as \"jogadas\" (mãos) se esgotem. A cada falha, o restart é imediato --- sem tela de derrota punitiva --- incentivando o ciclo \"só mais uma tentativa\".

Pilar de retenção: o jogo usa o Efeito Zeigarnik da quase-vitória (o jogador fica com a run anterior \"aberta\" na cabeça) combinado a uma curva de dificuldade dinâmica que mantém o jogador na zona de Flow --- nem entediado, nem ansioso. Diferente de jogos gacha, a variabilidade está nas combinações estratégicas de cartas, não em loot pago.

**2. Pilares de Design (base neurocognitiva)**

- **Flow (Csikszentmihalyi):** dificuldade ajustada dinamicamente à performance recente do jogador, mantendo o equilíbrio entre desafio e habilidade.

- **Erro de Predição de Recompensa (RPE):** multiplicadores de pontuação combinam cartas de forma não totalmente previsível, gerando picos de dopamina quando o resultado supera a expectativa.

- **Efeito Zeigarnik:** derrotas por pouca margem (ex.: faltaram 40 pontos) são destacadas visualmente para reforçar a sensação de \"tarefa inacabada\".

- **Competência (SDT):** progressão de mestria via desbloqueio de cartas e relíquias, não via sorte ou pagamento.

- **Feedback sensorial (Juiciness):** cada combo aciona resposta sonora com pitch ascendente, partículas e vibração háptica proporcional ao tamanho do combo.

Limite ético deliberado: nenhuma carta que afete o poder de jogo é vendida. A variabilidade de recompensa fica restrita a cosméticos, evitando o padrão de Razão Variável associado a Gaming Disorder descrito na literatura de referência.

**3. Core Gameplay Loop**

Loop de sessão (3--8 min):

- 1\. Jogador recebe uma mão de cartas com valores e naipes.

- 2\. Seleciona até 5 cartas para formar uma \"jogada\" (ex.: par, sequência, trinca).

- 3\. Jogada é pontuada com base em valor-base × multiplicador de combo × bônus de relíquias ativas.

- 4\. Pontuação acumulada é comparada à meta (\"blind\") da rodada.

- 5\. Se bate a meta → avança para próxima rodada, escolhe upgrade de carta/relíquia (autonomia).

- 6\. Se não bate a meta → run encerra, tela de resumo mostra distância até a meta → restart imediato disponível.

Loop de meta-progressão (entre runs):

- Desbloqueio permanente de novas cartas, relíquias e personagens (\"forjadores\") conforme marcos de runs completadas.

- Desafios diários com modificadores fixos (mesmo seed para todos os jogadores) --- cria comparação social assíncrona sem pressão de tempo agressiva.

- Passe de temporada cosmético sem expiração de itens (itens ficam disponíveis para resgate posterior, sem punição por ausência).

**4. Sistemas de Jogo**

**4.1 Sistema de Cartas e Combos**

Cartas possuem naipe, valor numérico e efeitos especiais (multiplicadores, cartas curinga, gatilhos condicionais). Relíquias são itens passivos escolhidos entre rodadas que alteram regras globais (ex.: \"cartas de espadas valem dobro\"). O espaço de combinações é grande o suficiente para gerar builds emergentes, reforçando a sensação de agência estratégica (Autonomia).

**4.2 Ajuste Dinâmico de Dificuldade**

| **Sinal de performance** | **Ajuste aplicado** |
|----|----|
| 3 derrotas seguidas na mesma rodada | Meta de pontos reduzida em 10% na próxima tentativa |
| 5 vitórias consecutivas fáceis | Meta de pontos aumentada gradualmente + relíquias raras mais frequentes |
| Tempo de decisão muito alto (hesitação) | Dicas visuais sutis de combo disponível |

**4.3 Progressão e Mastery**

- Árvore de desbloqueios não-linear: jogador escolhe qual \"forjador\" (personagem com regras próprias) evoluir primeiro.

- Estatísticas de perfil (maior combo, taxa de vitória, cartas favoritas) visíveis no perfil --- feedback de competência.

**4.4 Social Assíncrono**

- Ranking semanal do desafio diário (mesma semente para todos).

- Compartilhamento de \"replay\" de combo recorde em formato de imagem/vídeo curto para redes sociais.

**5. Estrutura de Telas / Fluxo de UX**

| **Tela** | **Função principal** |
|----|----|
| Home | Acesso rápido a: Jogar, Desafio Diário, Coleção, Loja Cosmética, Perfil |
| Run (Jogo) | Mão de cartas, meta da rodada, multiplicador em tempo real, botão de jogar mão |
| Resumo de Rodada | Pontuação obtida vs. meta, opção de upgrade, botão \"Continuar\" / \"Nova Run\" |
| Coleção | Todas as cartas e relíquias desbloqueadas, com progresso de desbloqueio |
| Perfil / Estatísticas | Recordes pessoais, histórico de runs, conquistas |
| Loja Cosmética | Skins de baralho, efeitos visuais de combo, passe de temporada |

**6. Direção de Arte e Sensorial (Juiciness Spec)**

- Paleta vibrante e alto contraste para leitura rápida de valores de carta em telas pequenas.

- Efeito sonoro de combo com pitch crescente conforme o multiplicador aumenta (reforço tátil de crescimento, como referência do próprio gênero).

- Vibração háptica curta e proporcional --- nunca constante, para não gerar fadiga sensorial.

- Animação de \"quase lá\" na tela de derrota (barra de progresso quase cheia) para reforçar o retorno.

**7. Monetização e Economia Virtual**

| **Item** | **Tipo** | **Afeta poder de jogo?** |
|----|----|----|
| Skins de baralho e cartas | Cosmético | Não |
| Efeitos visuais de combo (VFX) | Cosmético | Não |
| Passe de temporada | Cosmético, sem prazo de expiração de resgate | Não |
| Slot extra de \"forjador\" favorito | Conveniência (UI) | Não |
| Remoção de anúncios opcionais (ads recompensados) | Conveniência | Não |

Anúncios recompensados são opcionais (ex.: assistir para +1 tentativa extra em desafios diários), nunca obrigatórios para progresso core.

**8. Retenção e Métricas-Alvo**

| **Métrica**                     | **Alvo (benchmark do gênero)** |
|---------------------------------|--------------------------------|
| D1 Retention                    | 40--45%                        |
| D7 Retention                    | 16--20%                        |
| D30 Retention                   | 6--9%                          |
| Sessão média                    | 6--10 min                      |
| Sessões por dia (usuário ativo) | 2--4                           |

**9. Escopo Técnico**

- **Engine sugerida:** Unity (2D), com foco em performance em devices de entrada (Android low-end).

- **Arquitetura:** Cliente com lógica de run local; sincronização de desafio diário e leaderboard via backend leve (Firebase ou equivalente).

- **Equipe estimada MVP:** 1 game designer, 2 devs (client), 1 artista 2D, 1 dev backend (part-time), 1 QA --- \~4 meses para MVP jogável com 40 cartas e 10 relíquias.

- **Escopo de MVP:** Loop core completo, 3 forjadores, sistema de desafio diário, loja cosmética básica, sem multiplayer em tempo real.

- **Pós-lançamento:** Conteúdo sazonal (cartas/relíquias novas), eventos de desafio especial, expansão de forjadores.

**10. Riscos de Design Ético e Mitigações**

| **Risco** | **Mitigação** |
|----|----|
| Restart instantâneo vira gatilho compulsivo (sessões excessivamente longas) | Lembrete gentil de pausa após X runs consecutivas em curto intervalo de tempo |
| Pressão de comparação social no ranking diário | Ranking sempre opt-in, sem exposição pública de derrota |
| Dificuldade dinâmica manipular artificialmente frustração para converter | DDA tunado apenas para manter Flow, sem gatilho de oferta de compra pós-derrota |
