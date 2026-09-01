# 05 — Tutorial contextual na Forja (passo 3)

**What to build:** na primeira vez que o jogador chega na Forja (fase `forging` de uma Run normal, podendo acontecer numa Run diferente da que mostrou os passos 1-2 do GameScreen, caso a 1ª Rodada seja perdida antes disso), a tela mostra um destaque na lista de ofertas explicando a diferença entre Relíquia (efeito permanente pro resto da Run) e Efeito de Carta (fortalece uma carta específica). O avanço acontece ao tocar em qualquer uma das 3 ofertas — a mesma ação que o jogador já precisa fazer pra continuar jogando. Nunca aparece no Desafio Diário.

**Blocked by:** 03 (Motor do tutorial contextual).

**Status:** ready-for-agent

- [ ] `components/ForgeScreen.tsx`: consome `store/tutorialFlow.ts` pra saber se a seção Forja deve estar ativa (Run normal, fase `forging`, ainda não vista) — gatilho independente do estado da seção GameScreen (tickets 03/04).
- [ ] Barra persistente no topo da tela enquanto a seção está ativa: "Passo 3 de 3" à esquerda, controle de saída à direita com o texto "Concluir" (não "Pular tutorial" — é o último passo, não sobra nada pra pular).
- [ ] Recorte no véu cobrindo a lista de ofertas inteira (não uma oferta específica) + balão explicando a diferença entre Relíquia e Efeito de Carta. Avança ao tocar em qualquer uma das 3 ofertas.
- [ ] Tocar "Concluir" encerra a seção imediatamente e marca como vista (não reaparece nas próximas vezes que o jogador chegar na Forja).
- [ ] A seção nunca inicia durante uma Run do Desafio Diário.
- [ ] Mesma técnica de recorte da ticket 04 (`box-shadow` no elemento real, não coordenadas calculadas).
- [ ] `i18n/en.json` e `i18n/pt.json`: novas chaves pros textos da barra e do balão de instrução.
- [ ] Validação manual via skill `run`: chegar na Forja pela 1ª vez numa Run nova, confirmar que "Concluir" funciona, confirmar que a Forja de uma 2ª Run não mostra a seção de novo, confirmar que o Desafio Diário nunca mostra a seção.
