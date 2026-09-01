# 05 — Tutorial contextual na Forja (passo 3)

**What to build:** na primeira vez que o jogador chega na Forja (fase `forging` de uma Run normal, podendo acontecer numa Run diferente da que mostrou os passos 1-2 do GameScreen, caso a 1ª Rodada seja perdida antes disso), a tela mostra um destaque na lista de ofertas explicando a diferença entre Relíquia (efeito permanente pro resto da Run) e Efeito de Carta (fortalece uma carta específica). O avanço acontece ao tocar em qualquer uma das 3 ofertas — a mesma ação que o jogador já precisa fazer pra continuar jogando. Nunca aparece no Desafio Diário.

**Blocked by:** 03 (Motor do tutorial contextual).

**Status:** done

- [x] `components/ForgeScreen.tsx`: consome `store/tutorialFlow.ts` pra saber se a seção Forja deve estar ativa (Run normal, fase `forging`, ainda não vista) — gatilho independente do estado da seção GameScreen (`shouldStartForgeTutorial` não checa `gameScreenSeen`, coberto pelos testes do ticket 03).
- [x] Barra persistente no topo da tela enquanto a seção está ativa: "Passo 3 de 3" à esquerda, controle de saída à direita com o texto "Concluir" (chave `tutorial.complete`, distinta de `tutorial.skip` usada no ticket 04).
- [x] Recorte no véu cobrindo a lista de ofertas inteira (wrapper `offerList`, não uma `OfferCard` específica) + balão explicando a diferença entre Relíquia e Efeito de Carta.
- [x] Avança ao tocar em qualquer uma das 3 ofertas — `tutorialForgeOfferTouched()` disparado incondicionalmente no início de `handleOfferPress`, antes do branch por tipo/índice.
- [x] Tocar "Concluir" encerra a seção imediatamente e marca como vista (`tutorialSkipOrCompletePressed` → persistido via `persistTutorialTransition`/SQLite, não só estado local).
- [x] A seção nunca inicia durante uma Run do Desafio Diário — gate único em `shouldStartForgeTutorial` (`runMode === 'normal'`), sem duplicação nem bypass em `ForgeScreen.tsx`. Ao contrário do ticket 04, não precisou de um "abandon handler": não existe nenhum caminho pra sair da Forja sem tocar numa oferta primeiro (sem botão de abandonar/voltar nessa tela), então `activeStep === 3` nunca fica "preso".
- [x] Mesma técnica de recorte do ticket 04 (`boxShadow` no elemento real — a lista de ofertas — não coordenadas calculadas), inclusive a mesma cor do véu (`rgba(22,17,32,0.82)`, idêntica à do GameScreen/OnboardingOverlay).
- [x] `i18n/en.json` e `i18n/pt.json`: novas chaves `tutorial.complete`, `tutorial.step3Callout`, `a11y.completeTutorial`.
- [ ] Validação manual via skill `run`: **não executada nesta sessão** — sem emulador/simulador ou navegador disponível no ambiente do agente. Fica pendente pro usuário, junto com a do ticket 04.
