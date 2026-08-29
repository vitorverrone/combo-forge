# App Polish Pass 2

Status: ready-for-agent

## Problem Statement

Depois do primeiro polish pass (orientação, tooltip, erro de rede, traduções),
o usuário levantou mais 5 pontos jogando o app:

1. O anúncio intersticial só aparece a cada 2 runs — o usuário quer que
   apareça a cada run.
2. No Desafio Diário, ao abrir o teclado para digitar o Nome de Exibição, o
   modal "Escolha seu nome" fica atrás do teclado — não dá pra ver o que se
   está digitando nem o botão de salvar.
3. No modal de "Abandonar run?", os botões "Continuar"/"Abandonar" não têm
   respiro nas laterais — em pt-br (textos mais longos que o inglês
   original) o texto encosta na borda do botão.
4. O Forjador Anvil (Bigorna) começa com o Multiplicador de Combo em ×1.5 em
   vez de ×1 — mas o alvo de pontuação de cada rodada é o mesmo dos outros
   Forjadores. O usuário acha que isso deixa o Anvil fácil demais.
5. A descrição do Efeito de Forja de Gatilho ("Adiciona +X pts quando
   jogado na jogada Y de uma rodada") está com uma ordem de frase confusa
   em pt-br.

## Solution

1. O anúncio intersticial passa a aparecer ao final de toda run normal
   (Desafio Diário continua sem intersticial, como já é hoje).
2. O modal de Nome de Exibição sobe quando o teclado abre, mantendo ~32px
   de respiro entre a base do modal e o topo do teclado.
3. Os botões do modal de abandonar run ganham padding horizontal mínimo de
   8px.
4. O alvo de pontuação das 6 rodadas é escalado por ×1.5 especificamente
   quando o Forjador ativo é o Anvil — a primeira variação de alvo por
   Forjador no jogo. Aplicado antes do ajuste de DDA, na mesma ordem em que
   o DDA já ajusta o alvo-base hoje.
5. A descrição do Efeito de Gatilho é reescrita em ambos os idiomas para
   soar mais natural: pt-br passa de "quando jogado na jogada {{n}} de uma
   rodada" para "quando jogado na {{n}}ª jogada da rodada"; inglês espelha
   a mesma reestruturação ("on play {{n}} of a round" → "on the {{n}}th
   play of the round").

## User Stories

1. Como jogador, quero ver um anúncio intersticial ao final de cada run
   normal, não só a cada 2 runs, para que o modelo de monetização gere mais
   receita por sessão.
2. Como jogador que já removeu anúncios (`adsRemoved`), não quero ver
   nenhum anúncio intersticial mesmo com a nova cadência, para que a
   compra de "Remover Anúncios" continue valendo o que promete.
3. Como jogador no Desafio Diário, quero que o intersticial continue sem
   aparecer nas runs do Desafio, para que a experiência do Desafio Diário
   não mude (ela já não tem intersticial hoje).
4. Como jogador digitando meu Nome de Exibição no Desafio Diário, quero que
   o modal suba quando o teclado abrir, para que eu veja o campo de texto e
   o botão de salvar enquanto digito.
5. Como jogador, quero pelo menos 32px de espaço entre o modal de Nome de
   Exibição e o teclado aberto, para que a interface não pareça
   apertada/colada no teclado.
6. Como jogador num device onde o teclado nunca abre por cima do modal
   (ex.: tablet com tela grande o suficiente), quero que o modal continue
   no mesmo lugar de sempre, para que a mudança não introduza um
   deslocamento desnecessário.
7. Como jogador tentando abandonar uma run, quero ler claramente os textos
   "Continuar" e "Abandonar" nos botões do modal de confirmação, para que
   eu não hesite em qual botão é qual por causa de texto colado na borda.
8. Como jogador em pt-br (textos tipicamente mais longos que o inglês),
   quero que os botões desse modal tenham respiro suficiente pros dois
   idiomas, para que a UI não regrida se um texto crescer.
9. Como jogador escolhendo o Forjador Anvil, quero que o alvo de pontuação
   das rodadas seja mais alto que o dos outros Forjadores, para que o
   Multiplicador de Combo inicial mais alto (×1.5) seja uma troca real de
   dificuldade, não um bônus gratuito.
10. Como jogador escolhendo Apprentice ou Hammer, quero que o alvo de
    pontuação das rodadas continue exatamente como é hoje, para que o
    rebalance do Anvil não afete os outros Forjadores.
11. Como jogador no Desafio Diário (seed compartilhada, ranking semanal),
    quero que o alvo de pontuação continue igual para todo mundo
    independente do Forjador, para que o ranking continue justo — o
    Desafio Diário usa um Forjador fixo/neutro e não deve variar por
    escolha de Forjador do jeito que uma run normal varia.
12. Como jogador com uma Relíquia/Efeito que ajusta o alvo via DDA
    (histórico de vitórias/derrotas), quero que o ajuste de DDA continue
    funcionando em cima do alvo já escalado pelo Anvil, para que as duas
    mecânicas (rebalance por Forjador + DDA) componham sem conflito.
13. Como jogador lendo a descrição de um Efeito de Forja de Gatilho, quero
    entender de forma clara que "jogada Y" se refere à jogada dentro da
    rodada atual (1 a 4, resetando a cada rodada), para que eu saiba
    exatamente quando o bônus vai disparar.
14. Como jogador em pt-br, quero ler "na 4ª jogada da rodada" em vez de "na
    jogada 4 de uma rodada", para que a frase soe natural e não uma
    tradução literal do inglês.
15. Como jogador em inglês, quero a mesma reestruturação de frase ("on the
    4th play of the round"), para que os dois idiomas fiquem consistentes
    entre si.

## Implementation Decisions

### 1. Cadência do anúncio intersticial

- `store/gameStore.ts`: `INTERSTITIAL_RUNS_INTERVAL` muda de `2` para `1`.
  Toda a lógica ao redor (contador `interstitialRunsSinceAd`, guarda de
  `adsRemoved`, exclusão das runs do Desafio Diário) permanece exatamente
  como está — é uma mudança de uma constante, não de estrutura.
- Nenhuma mudança de schema/persistência: o contador já existe e seu
  comportamento sob intervalo=1 é apenas "sempre atinge o intervalo",
  então nenhuma migração é necessária.

### 2. Modal de Nome de Exibição sobe com o teclado

- `components/DisplayNameModal.tsx` hoje é uma `View` absolutamente
  posicionada (overlay full-screen simulando modal), não um `Modal`
  nativo do React Native — a solução precisa funcionar dentro desse
  padrão, não assumir `Modal`.
- Abordagem: envolver o conteúdo do card num `KeyboardAvoidingView`
  (`behavior="padding"` no iOS, `behavior="height"` ou ajuste manual no
  Android — Android por padrão já redimensiona a `Activity` via
  `windowSoftInputMode`, então a implementação deve checar o
  comportamento real por plataforma antes de aplicar padding duplicado).
  Alternativa considerada e preterida: mudar `android:windowSoftInputMode`
  no manifest — afeta a Activity inteira (todas as telas), não só este
  modal, então fica descartada em favor de uma solução local ao
  componente.
- O espaçamento de 32px é medido entre a borda inferior do card do modal e
  o topo do teclado quando aberto (não entre o card e a borda da tela) —
  usar a altura do teclado reportada pelo listener/`KeyboardAvoidingView`
  como base do cálculo, não um valor fixo de deslocamento.
- Sem teclado aberto, o modal deve renderizar exatamente como hoje
  (centralizado) — a mudança só se aplica quando o teclado está visível.

### 3. Padding horizontal dos botões do modal de abandonar run

- `components/GameScreen.tsx`, estilo `overlayBtn` (compartilhado por
  `game.keepPlaying` e `game.abandon`): ganha `paddingHorizontal:
  spacing[8]` (mínimo pedido) — usar o token de espaçamento existente
  (`theme.ts`, `spacing[8]`), não um número mágico solto.
- `overlayBtnPrimary`/`overlayBtnDanger` continuam só com cor — nenhuma
  mudança de padding ali, já que o padding agora vive no estilo base
  compartilhado.

### 4. Alvo de rodada escalado ×1.5 para o Anvil

- `engine/run.ts`: `baseTarget(roundNumber)` passa a aceitar um parâmetro
  adicional para o Forjador ativo (ou um multiplicador já resolvido pelo
  chamador — decisão de assinatura fica com quem implementar, mas a regra
  de negócio é: `forger === 'anvil'` → alvo × 1.5, qualquer outro Forjador
  → alvo inalterado).
- A escala do Anvil é aplicada **antes** do ajuste de DDA (`adjustTarget`,
  `engine/dda.ts`) — mesma ordem que já existe entre `baseTarget` e
  `adjustTarget` hoje, só com um passo a mais no meio.
- O Desafio Diário usa uma seed compartilhada e ranking semanal — o alvo
  de rodada ali **não** varia por Forjador. Já verificado no código atual:
  `store/dailyFlow.ts:149` chama `engineStartRun` com `forger:
  'apprentice'` fixo (comentário already no código: "Forjador fixo
  (Aprendiz) ... a Run do dia é idêntica para todos os jogadores") — a
  run do Desafio nunca passa `'anvil'`, então o rebalance é automaticamente
  neutro ali sem precisar de nenhuma lógica extra de exclusão.
- `engine/run.ts:202` já tem `forger: ForgerId = 'apprentice'` como
  parâmetro da função que monta cada Rodada (o mesmo escopo de onde
  `baseTarget(roundNumber)` é chamado, linha 214) — o Forjador já está
  disponível nesse ponto do código; a mudança é usá-lo, não introduzir um
  parâmetro novo do zero.
- `Forger`/`ForgerId` (`engine/forgers.ts`) não precisa ganhar nenhum
  campo novo — a regra "só Anvil, ×1.5" pode viver inteiramente dentro de
  `baseTarget`/quem a chama, sem alterar o catálogo de Forjadores.

### 5. Reescrita da descrição do Efeito de Gatilho

- `i18n/en.json` chave `format.forgeEffect.trigger`: de `"Adds +{{bonus}}
  pts when played on play {{triggerPlay}} of a round"` para `"Adds
  +{{bonus}} pts on the {{triggerPlay}}th play of the round"`.
- `i18n/pt.json` mesma chave: de `"Adiciona +{{bonus}} pts quando jogado
  na jogada {{triggerPlay}} de uma rodada"` para `"Adiciona +{{bonus}} pts
  quando jogado na {{triggerPlay}}ª jogada da rodada"`.
- Sem mudança de tipo/dado — `TriggerEffect.triggerPlay` continua um
  `number` puro; a interpolação em `components/format.ts` já passa esse
  valor cru para o `i18n.t()`, então o `ª`/`th` é só texto ao redor da
  interpolação, não formatação de número (o inglês usa sempre "th" — não
  há necessidade de "1st"/"2nd"/"3rd" porque os valores hoje no pool são
  só 2, 3 e 4, e mesmo se um "1" ou "2" aparecesse no futuro, "1th"/"2th"
  seria uma imprecisão gramatical aceitável frente à complexidade de gerar
  sufixo ordinal correto em inglês para um texto de descrição secundária —
  registrado como decisão consciente, não descuido).

## Testing Decisions

- **#1 (cadência do intersticial)**: teste de store puro em
  `store/gameStore.test.ts`, mesmo padrão dos testes já existentes de
  `interstitialRunsSinceAd`/`showInterstitial` — só muda o número de runs
  necessário para disparar `showInterstitial: true`.
- **#4 (alvo do Anvil)**: teste de função pura em `engine/run.test.ts`
  sobre `baseTarget()`/o que quer que exponha o cálculo do alvo — cobrir
  Anvil com alvo ×1.5 em pelo menos 2 rodadas diferentes, outro Forjador
  com alvo inalterado, e (se aplicável) o Desafio Diário confirmando que
  não varia por Forjador. Testar comportamento externo (o número
  resultante), não a forma interna do cálculo.
- **#2 (modal sobe com teclado), #3 (padding dos botões), #5 (reescrita de
  texto)**: sem teste automatizado — mesmo padrão já estabelecido nos
  tickets anteriores deste projeto (`app-polish-pass/issues/01`, `02`):
  mudanças puramente visuais/de texto, sem precedente de teste de
  componente neste repo. Validação manual via skill `run` no
  emulador/device.

## Out of Scope

- Qualquer outro Forjador ganhar variação de alvo de rodada — só o Anvil,
  por decisão explícita do usuário.
- Mudar a cadência de qualquer outro tipo de anúncio (banner, recompensado
  do Desafio Diário) — só o intersticial de fim de run.
- Revisar/reescrever outras descrições de Efeito de Forja (`valueBonus`,
  `multiplier`, `wildcard`) — só a de `trigger`, que foi a única
  reportada como confusa.
- Padding horizontal de outros modais do app (`RunWonScreen`,
  `UnlockChoiceModal`, `DisplayNameModal`) — já têm padding adequado hoje
  (verificado no levantamento que precedeu este spec); só o modal de
  abandonar run estava sem.
- Sistema genérico de keyboard-avoidance reutilizável para outros
  formulários do app — a correção é local ao `DisplayNameModal.tsx`; não
  há outro campo de texto atrás de modal hoje no app.

## Further Notes

- Itens #1 e #4 têm efeito direto em monetização/dificuldade — vale
  observar métricas (taxa de conclusão de run do Anvil, receita de
  intersticial) depois do lançamento, mas isso é acompanhamento
  pós-implementação, não parte do ticket.
- O item #4 é a primeira vez que o motor tem uma regra "forger-aware" fora
  da Relíquia exclusiva de largada (`startingRelic`) — vale ficar de olho
  se isso é o início de um padrão maior (ex.: outros Forjadores ganhando
  variações próprias de alvo no futuro) ou um caso isolado; não decidido
  aqui, só registrado como precedente.
