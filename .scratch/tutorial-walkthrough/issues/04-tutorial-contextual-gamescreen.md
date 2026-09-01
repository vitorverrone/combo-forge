# 04 — Tutorial contextual no GameScreen (passos 1 e 2)

**What to build:** na primeira Run normal do jogador, a tela de jogo mostra um destaque guiado em 2 passos: primeiro na Mão de cartas ("toque numa carta"), depois — assim que uma carta é selecionada — nos botões Limpar e Descartar juntos. O jogador interage de verdade pra avançar (tocar numa carta; tocar em Limpar/Descartar), com um botão "Próximo" adicional só no passo 2 pra quem não quiser limpar nem descartar naquele momento. Nunca aparece no Desafio Diário.

**Blocked by:** 03 (Motor do tutorial contextual).

**Status:** ready-for-agent

- [ ] `components/GameScreen.tsx`: consome `store/tutorialFlow.ts` pra saber se a seção GameScreen deve estar ativa (Run normal, Rodada 1, ainda não vista) e qual dos 2 passos está no ar.
- [ ] Barra persistente no topo da tela enquanto a seção está ativa: "Passo N de 3" à esquerda, controle de saída à direita ("Pular tutorial") — camada visualmente distinta do chrome do próprio jogo (Rodada/Pontuação/barra de Meta continuam sendo informação do jogo, não do tutorial).
- [ ] Passo 1: recorte no véu (scrim escurecido com um "buraco" exato) na 1ª carta da Mão + balão de instrução explicando que dá pra tocar em até 5 cartas pra formar uma Jogada. Avança ao tocar em qualquer carta da Mão (não precisa ser a 1ª).
- [ ] Passo 2: recorte cobrindo os botões Limpar e Descartar juntos (um recorte só, não dois) + balão explicando o que cada um faz. Avança ao tocar em Limpar OU Descartar (ação real) OU ao tocar no botão "Próximo" adicional da barra do topo.
- [ ] Tocar "Pular tutorial" em qualquer um dos 2 passos encerra a seção imediatamente e marca como vista (não reaparece nas próximas Runs).
- [ ] A seção nunca inicia durante uma Run do Desafio Diário (`runMode === 'daily'`).
- [ ] O recorte usa a técnica já validada no wireframe: `box-shadow` grande aplicado diretamente no elemento real já presente no fluxo normal da tela (a carta, o wrapper dos 2 botões) — não uma camada posicionada por coordenadas calculadas.
- [ ] `i18n/en.json` e `i18n/pt.json`: novas chaves pros textos da barra e dos 2 balões de instrução.
- [ ] Validação manual via skill `run`: percorrer os 2 passos numa Run nova, confirmar que "Pular tutorial" funciona em cada um, confirmar que uma 2ª Run não mostra a seção de novo, confirmar que o Desafio Diário nunca mostra a seção.
