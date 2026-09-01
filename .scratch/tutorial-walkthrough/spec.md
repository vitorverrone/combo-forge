# Tutorial Interativo (Coach-mark)

Status: ready-for-agent

## Problem Statement

Jogadores não estão notando os botões Limpar e Descartar na tela de jogo —
eles existem, funcionam, mas passam despercebidos. Separadamente, jogadores
não entendem bem o que são Relíquias nem a escolha entre Relíquia e Efeito
de Carta que aparece ao vencer cada Rodada (a Forja) — o onboarding
estático de hoje (4 passos, antes do jogo começar) nunca menciona Relíquias
ou a Forja. Uma tentativa anterior de resolver isso com a biblioteca
`react-native-copilot` não agradou: o comportamento dela é um tour de
"próximo/próximo" sobre um spotlight, sem esperar a ação de verdade do
jogador (selecionar a carta, tocar em Descartar) — o jogador só observa,
não pratica.

## Solution

Um sistema de coach-mark construído do zero, específico do Combo Forge, com
duas partes:

1. Um **5º passo novo no onboarding estático** (antes do jogo começar),
   inserido antes do "Vamos Forjar" que já existe hoje, explicando o
   *conceito* de Relíquia (efeito permanente pro resto da Run) e Efeito de
   Carta (fortalece uma carta específica).
2. Um **tutorial contextual de 3 passos**, guiado por spotlight, que
   aparece durante a jogatina de verdade (não antes dela): destaca um
   elemento real da tela (recorte na Mão, nos botões Limpar/Descartar, na
   lista de ofertas da Forja), some com o resto da tela ao redor, e explica
   o que fazer. Ao contrário do `react-native-copilot`, o avanço da maior
   parte dos passos é gatilhado pela ação real do jogador — tocar na carta,
   tocar em Limpar/Descartar, tocar numa oferta da Forja — não por um botão
   fixo de "próximo". A exceção é o passo 2 (Limpar/Descartar), que também
   ganha um botão "Próximo" explícito, porque a ação demonstrada ali é
   opcional numa Jogada de verdade — travar o avanço nela seria fricção
   desnecessária.

Mecanismo escolhido (de 5 ideias divergentes exploradas em wireframe —
`.scratch/tutorial-walkthrough/wireframes-tutorial-thumbnails.html`): recorte
no véu (scrim escurecido com um "buraco" exato no elemento-alvo, técnica de
`box-shadow` gigante aplicada no próprio elemento real — sem depender de
medir posição em coordenadas calculadas) + balão de instrução + uma barra
persistente no topo com "Passo N de M" e um controle de saída ("Pular
tutorial", virando "Concluir" no último passo, onde não sobra mais nada pra
pular). Wireframe completo das 4 telas em
`.scratch/tutorial-walkthrough/wireframes-tutorial.html`.

## User Stories

1. Como jogador iniciante, quero que o onboarding explique o que são
   Relíquias e a escolha da Forja antes de eu começar a jogar, para que eu
   não chegue na Forja sem contexto nenhum.
2. Como jogador, quero que esse novo passo do onboarding apareça na mesma
   sequência dos 4 passos que já existem (seleção de cartas, Padrões,
   Combo, Alvo), como um 5º passo antes de "Vamos Forjar", para que a
   experiência continue sendo um único fluxo, não dois tutoriais separados.
3. Como jogador jogando minha primeira Run normal, quero ver um destaque na
   1ª carta da minha Mão explicando que posso tocar até 5 cartas para
   formar uma Jogada, para que eu entenda a mecânica central assim que
   começo a jogar de verdade.
4. Como jogador, quero que esse destaque só avance quando eu realmente
   tocar numa carta — qualquer carta, não uma específica — para que eu
   pratique a ação em vez de só ler sobre ela.
5. Como jogador que já selecionou uma carta, quero ver um destaque nos
   botões Limpar e Descartar explicando o que cada um faz, para que eu note
   que eles existem.
6. Como jogador nesse mesmo passo, quero poder tocar em Limpar ou Descartar
   para avançar (a ação real), mas também ter um botão "Próximo" visível
   caso eu não queira limpar nem descartar agora, para que o tutorial não
   me force a fazer algo que não preciso fazer naquele momento.
7. Como jogador que venceu minha primeira Rodada e chegou na Forja, quero
   ver um destaque na lista de ofertas explicando a diferença entre
   Relíquia (efeito permanente pro resto da Run) e Efeito de Carta
   (fortalece uma carta específica), para que eu entenda o que estou
   escolhendo.
8. Como jogador nesse passo da Forja, quero que o destaque avance ao tocar
   em qualquer uma das 3 ofertas — a mesma ação que eu já preciso fazer pra
   continuar jogando — para que o tutorial não me peça uma ação extra além
   da que o jogo já exige.
9. Como jogador em qualquer um dos 3 passos contextuais, quero poder tocar
   em "Pular tutorial" a qualquer momento, para que eu não fique preso nele
   se já entendi ou não quero continuar.
10. Como jogador no último passo (a Forja), quero que o controle de saída
    diga "Concluir" em vez de "Pular tutorial", para que o rótulo descreva
    o que a ação realmente faz (não sobra mais nada pra pular).
11. Como jogador que já viu o tutorial contextual de GameScreen (passos 1 e
    2), não quero vê-lo de novo nas próximas Runs, para que ele não vire
    uma interrupção repetitiva.
12. Como jogador que já viu o tutorial contextual da Forja (passo 3), não
    quero vê-lo de novo nas próximas vezes que chegar na Forja, pela mesma
    razão.
13. Como jogador cujo primeiro passo pela Forja aconteceu numa sessão
    diferente de quando vi os passos 1 e 2 (ex.: perdi a 1ª Rodada da minha
    primeira Run, então nunca cheguei na Forja naquela vez), quero que o
    passo 3 ainda apareça na primeira vez real que eu chegar lá — mesmo que
    isso seja numa Run diferente —, para que a lacuna de conhecimento sobre
    Relíquias/Forja seja mesmo preenchida.
14. Como jogador jogando o Desafio Diário, não quero que nenhum passo do
    tutorial contextual apareça ali, para que minha tentativa cronometrada
    e o ranking semanal comparável entre jogadores não sejam afetados por
    uma pausa de tutorial que outros jogadores não tiveram.
15. Como jogador em pt-br ou em inglês, quero que todo o texto do tutorial
    (onboarding e contextual) apareça no meu idioma, seguindo a mesma
    convenção já usada no resto do app.
16. Como jogador usando leitor de tela ou navegação por foco, quero que o
    destaque do tutorial e o balão de instrução sejam anunciados
    corretamente, para que a experiência guiada não dependa só de
    visualizar a tela.
17. Como desenvolvedor mantendo este código, quero que a lógica de "qual
    passo está ativo e o que avança pra o próximo" seja uma função pura,
    separada da renderização, para que dê pra testar sem precisar montar
    componentes.
18. Como desenvolvedor, quero que a tentativa anterior e abandonada com
    `react-joyride` (dependência solta no `package.json`, código pela
    metade em `GameScreen.tsx`/`OnboardingOverlay.tsx`, com um bug real de
    hook chamado condicionalmente) seja removida como parte desta
    implementação, para que não sobre código morto ou quebrado no
    repositório.
19. Como jogador escolhendo "Pular tutorial" ou "Concluir" no meio de um
    passo contextual, quero que a decisão seja lembrada mesmo que eu feche
    o app logo em seguida, para que pular realmente signifique "não me
    mostre de novo".

## Implementation Decisions

- **Novo módulo `store/tutorialFlow.ts`**, no mesmo padrão arquitetural já
  estabelecido por `store/dailyFlow.ts`: um comando único (algo como
  `runTutorialCommand(state, event)`) que recebe o estado do tutorial
  contextual (qual passo está ativo — `null` | 1 | 2 | 3 —, se a seção
  GameScreen já foi vista, se a seção Forja já foi vista) e um evento
  (`cardTouched`, `clearOrDiscardTouched`, `nextPressed`,
  `skipOrCompletePressed`, `forgeOfferTouched`), e devolve o novo estado.
  Função pura, sem conhecimento de Zustand, telas ou navegação — mesma
  regra já seguida por `dailyFlow.ts`/`shopFlow.ts`. O `store/gameStore.ts`
  consome esse módulo e aplica as fatias que ele devolve, do jeito que já
  faz com os outros dois flows.
- **Dois passos contextuais são disparados por gatilhos independentes, não
  por um único fluxo linear**: a seção GameScreen (passos 1-2) dispara na
  primeira vez que o jogador está numa Run **normal** (não Desafio Diário)
  na Rodada 1, fase `playing`; a seção Forja (passo 3) dispara na primeira
  vez que o jogador chega na fase `forging` de uma Run normal — podendo
  acontecer numa sessão/Run diferente da que mostrou os passos 1-2, se a
  1ª Run for perdida antes da Rodada 1 ser vencida. Duas flags persistidas
  separadas, não uma só.
- **Persistência via o mesmo padrão já usado por `hasSeenOnboarding`/
  `completeOnboarding`** (`components/OnboardingOverlay.tsx`): chaves
  próprias no SQLite key-value store (`expo-sqlite/kv-store`), uma pra cada
  seção contextual. Sem resumo de passo-a-passo: se o app fechar no meio de
  uma seção não concluída, ela reaparece inteira na próxima vez (mesmo
  comportamento simples que o onboarding estático já tem hoje).
- **Onboarding estático ganha um 5º passo** ("Relíquias e a Forja"),
  seguindo exatamente o padrão já existente de `STEP_KEYS`/`STEP_VISUALS`
  em `OnboardingOverlay.tsx` — chaves i18n novas, um visual próprio (um
  ícone de Relíquia ao lado de uma carta com Efeito, lado a lado). Inserido
  antes do passo final atual, que continua sendo o CTA "Vamos Forjar".
- **Mecanismo visual do tutorial contextual** (validado no wireframe
  mid-fi): uma barra persistente no topo da tela mostrando "Passo N de 3" +
  um controle de saída à direita (texto "Pular tutorial", trocando pra
  "Concluir" no passo 3, onde não sobra nada a pular); o elemento-alvo
  ganha um recorte no véu escurecido — implementado como `box-shadow`
  grande diretamente no elemento real já presente no fluxo normal da tela
  (não uma camada calculada por coordenadas) —, e um balão de instrução
  (mesma forma visual de um `callout` já usado em outras telas) explicando
  a ação logo abaixo do elemento destacado. O passo 2 (Limpar/Descartar)
  ganha adicionalmente um botão "Próximo" na barra do topo, ao lado do
  controle de saída — os outros dois passos não precisam disso porque a
  única ação disponível neles já é obrigatória pra continuar jogando.
- **Passo 2 destaca os dois botões (Limpar + Descartar) num recorte só**,
  não dois recortes separados — lê como "esses dois, juntos", que é
  exatamente o par que hoje passa despercebido.
- **Passo 3 (Forja) não trava numa oferta específica**: o recorte cobre a
  lista de ofertas inteira, e o avanço acontece ao tocar em QUALQUER
  oferta — a mesma ação que o jogador já precisa fazer pra continuar
  jogando. Isso evita depender de um resultado determinístico de RNG só
  pro tutorial (as 3 ofertas de cada Forja já variam por seed).
- **Remove a tentativa abandonada com `react-joyride`**: dependência
  solta no `package.json` (nunca chegou a ser commitada) e as edições
  parciais em `GameScreen.tsx`, `OnboardingOverlay.tsx` e `RelicRow.tsx`
  que a acompanham — incluindo um bug real de Hook do React chamado depois
  de um retorno condicional (`useEffect` após `if (run === null) return
  null`). Este spec substitui essa tentativa por inteiro; nenhum código
  dela é reaproveitado.
- **Novas chaves i18n** em `i18n/en.json` e `i18n/pt.json` pra todo o texto
  novo (5º passo do onboarding, barra do tutorial, balões de instrução dos
  3 passos contextuais) — inglês e português lado a lado, seguindo a
  convenção já estabelecida no resto do arquivo.

## Testing Decisions

- **`store/tutorialFlow.ts`** ganha testes unitários no mesmo estilo de
  `store/dailyFlow.test.ts`/`store/shopFlow.test.ts`: função pura, testada
  com estados de entrada conhecidos e eventos simulados — sem montar
  nenhum componente. Cobre: qual passo fica ativo depois de cada evento,
  que os dois gatilhos (GameScreen vs. Forja) são independentes, que
  "Pular"/"Concluir"/"Próximo" produzem os resultados esperados, e que uma
  seção já marcada como vista não reaparece.
- **Posicionamento visual, o recorte em si e a renderização da barra do
  tutorial** não ganham teste automatizado — mesmo precedente já
  estabelecido em todos os tickets de UI/copy deste polish pass (sem
  arquivo `.test.tsx` no repo até hoje). Validação manual via skill `run`.
- **Persistência das flags** (SQLite key-value) segue sem teste dedicado,
  mesmo padrão de `hasSeenOnboarding`/`completeOnboarding`, que também não
  têm teste hoje.

## Out of Scope

- Rever o tutorial já visto a partir do Perfil/Configurações — não pedido,
  e o onboarding estático de hoje também não tem esse ponto de entrada.
- Resumir uma seção do tutorial contextual no meio de um passo, caso o app
  feche antes de terminar — a seção inteira reaparece do zero, mesma regra
  do onboarding estático.
- Qualquer destaque contextual fora dos 3 passos definidos aqui (ex.: um
  tour pela tela de Coleção ou da Loja) — fora do escopo levantado nesta
  conversa.
- O mecanismo "selo de novidade" (ideia #5 do board de divergência) — não
  foi o escolhido; fica registrado no board como alternativa considerada.
- Protótipo clicável (`view=proto`) dos wireframes — não foi pedido; a
  revisão aconteceu nas views Grid/Slides.

## Further Notes

- Board de divergência (5 mecanismos considerados) em
  `.scratch/tutorial-walkthrough/wireframes-tutorial-thumbnails.html`;
  wireframes mid-fi das 4 telas finais em
  `.scratch/tutorial-walkthrough/wireframes-tutorial.html`. Ambos os
  arquivos documentam as decisões via marcadores numerados e a régua de
  notas ao lado de cada tela.
- A tentativa anterior com `react-native-copilot` mencionada no início da
  conversa não deixou rastro no código (nunca chegou a ser instalada); a
  tentativa com `react-joyride` encontrada solta no working tree durante
  esta sessão é a única que precisa de limpeza explícita (ver
  Implementation Decisions).
