# ESPECIFICAÇÃO FUNCIONAL

**COMBO FORGE**

Especificação Funcional — v1.0 — Agosto de 2026

> Este documento descreve o comportamento exato de cada tela do ponto de
> vista do usuário: elementos visíveis, botões, condições de habilitado/
> desabilitado, validações e o que cada ação dispara. Fórmulas e regras que
> atravessam várias telas estão consolidadas na §0. Para vocabulário, ver
> [`CONTEXT.md`](CONTEXT.md); para requisitos de sistema, ver
> [`SRS_Combo_Forge.md`](SRS_Combo_Forge.md).

---

## 0. Regras de Negócio Transversais

Esta seção existe para não repetir a mesma fórmula em cada tela que a usa.

### 0.1 Pontuação de uma Jogada

```
Valor-Base = bônus do Padrão
           + Σ (Valor da carta × modificadores de Efeito de Forja × modificador de Relíquia de Naipe)
           + bônus de Relíquia de Padrão (se houver)

Pontos da Jogada = Valor-Base × Multiplicador de Combo da Jogada atual
```

- Bônus por Padrão: Carta Alta 0, Par 5, Dois Pares 15, Trinca 25, Sequência
  40, Full House 55, Quadra 70.
- Efeitos de Forja resolvem **somas antes de multiplicadores** (+Valor e
  Gatilho somam primeiro; Multiplicador multiplica o total depois),
  independente da ordem em que foram aplicados na carta.
- O Ás sempre soma seu Valor impresso (1) no Valor-Base, mesmo quando
  participa de uma Sequência como 11 (Sequência 10–Ás).
- Multiplicador de Combo da N-ésima Jogada da Rodada = 1 + (N−1), ou seja
  ×1/×2/×3/×4 nas Jogadas 1–4; Relíquia `comboStart` muda o ponto de
  partida, `comboGrowth` muda o passo.
- Curinga (Efeito de Forja): a carta conta como o Valor que maximiza o
  melhor Padrão possível (e, empatando o Padrão, a maior soma).

### 0.2 Meta (Blind) de uma Rodada

```
Meta base da Rodada R = round(50 × 1,7^(R−1))
```

Ajustada pelo DDA quando habilitado (desligado no Desafio Diário):
- **−10%** se a Rodada atual é a mesma da última derrota e o jogador já
  falhou nela 3 vezes seguidas.
- **+10%** (e ↑ chance de Relíquia rara na próxima Forja) se o jogador
  acumulou 5 vitórias consecutivas "fáceis" (pontuação final ≥ 130% da Meta
  com pelo menos 1 Jogada sobrando).
- Os dois ajustes usam sempre a Meta base como ponto de partida (não
  compostos entre si).

### 0.3 Estrutura da Run

- 6 Rodadas por Run; 4 Jogadas por Rodada; Mão de 7 cartas (padrão); 2
  Descartes por Rodada (padrão) — ambos ajustáveis por Relíquia de Mecânica
  (nunca altera o número de Jogadas).
- Vencer as Rodadas 1–5 abre a Forja (obrigatória); vencer a 6ª encerra a Run
  em vitória sem Forja.
- Perder qualquer Rodada encerra a Run em derrota imediatamente.

### 0.4 Limites de seleção e ação

- Seleção de cartas para Jogar/Descartar: 1 a 5 cartas por vez (o motor
  aceita 1–5; a UI limita a seleção simultânea a `MAX_SELECTION = 5`).
- Só é possível tocar/selecionar cartas atualmente na Mão.
- Jogar e Descartar exigem seleção não-vazia; Descartar exige
  `discardsRemaining > 0`.

## 1. Tela Início (`StartScreen`)

**Propósito:** hub principal — escolher Forjador, iniciar Run, navegar para
Perfil/Coleção/Loja/Desafio Diário.

**Elementos:**
- Barra de navegação superior: botões **PROFILE**, **COLLECTION**, **SHOP**
  (destacado em dourado — é a entrada de monetização).
- Título "COMBO FORGE" + subtítulo "Choose your Forger".
- Lista de cartões de Forjador (um por `Forger` em `FORGERS`: Apprentice,
  Hammer, Anvil), cada um mostrando nome, Relíquia de largada (ou "no
  starting relic" para o Aprendiz) e estado de seleção/bloqueio.
- Botão **DAILY CHALLENGE**, com contador "`X`/2 attempts used" (+ "· done
  for today" quando esgotado).
- Botão **START RUN**.

**Regras e validações:**
- Um cartão de Forjador bloqueado (não desbloqueado pela meta-progressão)
  exibe `🔒` antes do nome, opacidade reduzida, e a dica textual do marco que
  falta (ex.: "Win your first run."); `accessibilityState.disabled = true` —
  toque não tem efeito.
- Tocar num Forjador desbloqueado seleciona-o (borda dourada); a seleção
  persiste apenas em memória (estado do store), não em disco — reabrir o app
  volta ao Aprendiz.
- **START RUN**: sempre habilitado; se por alguma inconsistência o Forjador
  selecionado não estiver desbloqueado, a ação é silenciosamente ignorada
  (defesa de estado, não deveria ocorrer via UI normal). Ao ter sucesso: gera
  novo seed, inicia a Run (Rodada 1) e navega para a Tela Jogo.
- **DAILY CHALLENGE**: sempre habilitado (a tela seguinte trata
  disponibilidade de tentativas); navega para a Tela Desafio Diário.
- **PROFILE** / **COLLECTION** / **SHOP**: sempre habilitados; navegam para
  as respectivas telas.
- **Onboarding:** na primeira execução (flag `combo-forge:onboarding-seen`
  ausente), a Tela Início é coberta por um overlay modal de tutorial (ver
  §11) antes de qualquer interação ficar visível por trás dele.

## 2. Tela Jogo (`GameScreen`)

**Propósito:** tela principal de uma Rodada em andamento (`run.phase ===
'playing'`); despacha para telas de fase quando a Rodada muda de estado (ver
§3–§6).

**Elementos:**
- Cabeçalho: "Round `N`" (+ selo "DAILY" se `runMode === 'daily'`), nome do
  Forjador + pontuação total da Run; bloco de pontuação "`score` / `target`".
- Barra de progresso (score/target, 0–100%).
- 3 pílulas: **Plays** (Jogadas restantes), **Discards** (Descartes
  restantes), **COMBO** (Multiplicador da próxima Jogada, com cor do VFX de
  combo equipado).
- Fileira de Relíquias ativas (largada do Forjador + adquiridas).
- Painel de prévia: com seleção válida, mostra o nome do Padrão + "Base
  `X` · `X×mult` pts with ×`mult`"; sem seleção, mostra a dica "Select 2–5
  cards to preview your play".
- Mão de cartas (grade que quebra linha), skin aplicando a paleta cosmética
  equipada (se houver).
- Barra de ações fixa no rodapé: **DISCARD**, **CLEAR**, **PLAY (`n`/5)**.

**Regras e validações:**
- Tocar numa carta da Mão alterna sua seleção; toque é ignorado se a carta
  não está na Mão atual (defesa) ou se a seleção já tem 5 cartas e a carta
  tocada não está entre elas (limite `MAX_SELECTION`).
- Carta selecionada sobe visualmente (`translateY(-14px)`) com borda dourada
  de 3px.
- **DISCARD**: desabilitado se a seleção está vazia OU `discardsRemaining
  <= 0`. Ao confirmar: cartas selecionadas voltam ao Baralho, mesmo número é
  comprado, 1 Descarte é consumido, seleção é limpa. Não pontua.
- **CLEAR**: desabilitado se a seleção está vazia. Limpa a seleção sem
  consumir Descarte nem Jogada.
- **PLAY**: desabilitado se a seleção está vazia. Rótulo mostra a contagem
  atual (`PLAY (2/5)`). Ao confirmar:
  1. Motor avalia o Padrão e calcula os pontos (§0.1) e emite o evento
     `played`.
  2. Cartas jogadas vão para o descarte da Rodada; Mão é reabastecida.
  3. Se `score ≥ target`: Rodada vencida — se for a 6ª Rodada, a Run termina
     em vitória (Tela Run Vencida, §5); senão entra em Forja (Tela Forja,
     §3, com 3 ofertas geradas).
  4. Se `playsRemaining` chega a 0 sem atingir a Meta: Rodada e Run perdidas
     (Tela Run Perdida, §6).
  5. Caso contrário, a Tela Jogo permanece, pronta para a próxima seleção.
  6. Uma Jogada inválida (defesa — não deveria ocorrer via UI normal, ex.:
     seleção com carta duplicada) é capturada silenciosamente; o estado
     permanece intacto.
- Toda ação que encerra uma Run (vitória ou derrota) também: (a) atualiza o
  histórico do lembrete de pausa e pode disparar o banner de pausa (ver
  §12); (b) no modo normal, atualiza estatísticas de perfil e pode disparar
  desbloqueios de meta-progressão (banner "NEW UNLOCK" ou modal de escolha,
  ver §9); (c) no modo `daily`, dispara a submissão automática da pontuação
  ao backend (§8) e não toca estatísticas/meta-progressão.

## 3. Tela Forja (`ForgeScreen`)

**Propósito:** escolher 1 upgrade (dentre 3 ofertas) ao vencer uma Rodada
(1ª–5ª). Fase `run.phase === 'forging'`; não pode ser pulada.

**Elementos:**
- Cabeçalho "ROUND `N` CLEARED" / "The Forge" / "Pick one upgrade to carry
  into the next round."
- Fileira compacta das Relíquias ativas.
- 3 cartões de oferta, cada um `cardEffect` ("CARD EFFECT" + nome/descrição
  do Efeito de Forja) ou `relic` ("RELIC" + nome/descrição da Relíquia).
- Ao tocar uma oferta de **Efeito de Forja**: abre um seletor de carta-alvo
  organizado por Naipe (as 40 cartas do Baralho), com cartas já forjadas
  destacadas (fundo diferenciado + indicador dourado). Abaixo, botões
  **CANCEL** / **FORGE**.
- Ao tocar uma oferta de **Relíquia**: abre um painel de confirmação com nome
  + descrição da Relíquia. Abaixo, botões **CANCEL** / **TAKE IT**.

**Regras e validações:**
- Tocar a mesma oferta já aberta a fecha (cancela a seleção); tocar outra
  oferta troca o painel ativo.
- Seletor de carta-alvo: tocar uma carta a marca como alvo (borda dourada);
  **FORGE** fica desabilitado até uma carta ser escolhida.
- **FORGE** (oferta de carta): aplica o Efeito de Forja à carta alvo,
  empilhando se ela já tiver efeitos anteriores; carta pode já ter sido
  forjada antes (o hint "Already-forged cards keep stacking effects." avisa
  disso). Fecha o painel e avança para a fase `roundWon` (Tela Rodada
  Vencida, §4).
- **TAKE IT** (oferta de Relíquia): adquire a Relíquia, respeitando o teto de
  3 Relíquias ativas por Run (a de largada do Forjador não conta no teto).
  Quando o teto já foi atingido, o motor não oferece Relíquia — a 3ª oferta
  vira mais um Efeito de Forja automaticamente (regra do motor, sem ação do
  jogador). Fecha o painel e avança para `roundWon`.
- **CANCEL** (ambos os painéis): fecha o painel sem aplicar nada; as 3
  ofertas continuam disponíveis para nova escolha.
- Não há caminho de UI para sair da Forja sem aplicar uma oferta (sem botão
  "pular" ou navegação de voltar).

## 4. Tela Rodada Vencida (`RoundWonScreen`)

**Propósito:** resumo da Rodada vencida antes de avançar (fase
`roundWon`).

**Elementos:**
- "ROUND `N` CLEARED" / "Target beaten!"
- Cartão com Score, Target, e Margem (score − target, com sinal `+`).
- Fileira compacta de Relíquias ativas.
- Nota "`Forger` · Run total `X` pts".
- Botão **NEXT ROUND →**.

**Regras:**
- **NEXT ROUND**: sempre habilitado nesta fase. Avança para a próxima
  Rodada (recicla o Baralho, reembaralha, compra nova Mão, reinicia
  Descartes, reinicia Jogadas para 4), calcula a nova Meta (§0.2) e volta
  para a Tela Jogo.

## 5. Tela Run Vencida (`RunWonScreen`)

**Propósito:** celebração ao vencer as 6 Rodadas.

**Elementos:**
- "ALL 6 ROUNDS CLEARED" (ou "DAILY CHALLENGE · CLEARED" no modo diário) /
  "Run Complete!" (ou "Daily Complete!").
- Banner "NEW UNLOCK(S): ..." se algum desbloqueio de meta-progressão foi
  concedido ao fim desta Run (apenas modo normal).
- Subtítulo "`Forger` forged a `X`-point run."
- Cartão "FINAL SCORE" com o total da Run.
- No modo diário: bloco de status de submissão (§10 — `DailySubmitStatus`).
- Fileira compacta de Relíquias ativas.
- Botão primário: **PLAY AGAIN** (modo normal) ou **DAILY CHALLENGE** (modo
  diário).
- Botão secundário: **CHANGE FORGER** (modo normal, volta à Tela Início) ou
  **HOME** (modo diário, volta à Tela Início).

**Regras:**
- **PLAY AGAIN**: inicia imediatamente uma nova Run (novo seed, mesmo
  Forjador), sem passar pela Tela Início.
- **DAILY CHALLENGE**: navega para a Tela Desafio Diário (não inicia Run
  automaticamente).
- **CHANGE FORGER / HOME**: volta para a Tela Início, descartando o estado
  da Run atual.
- No modo diário, se a submissão automática da pontuação (disparada ao
  vencer a Run) falhar, o bloco de status mostra "Score not submitted" com
  botão **RETRY**.

## 6. Tela Run Perdida (`RunLostScreen`)

**Propósito:** encerramento por derrota — destaca o "quase lá" (Efeito
Zeigarnik) e oferece restart imediato.

**Elementos:**
- "ROUND `N` · `Forger`" (+ "DAILY CHALLENGE · " no modo diário) / título
  "So close!" (quando a margem faltante é ≤ 10% da Meta) ou "Run over"
  (caso contrário).
- Texto "You were `X` pts (`Y`%) short of the target." (ou "The target
  slipped away." se `score ≥ target`, caso de borda).
- Banner "NEW UNLOCK(S): ..." se algum desbloqueio foi concedido nesta Run
  (apenas modo normal).
- No modo diário: bloco de status de submissão (§10).
- Barra de progresso `score`/`target`; quando "so close" (margem ≤ 10%), a
  barra pulsa suavemente em vermelho — **desligado se o sistema tem Reduce
  Motion ativado** (a barra fica estática, sem pulso).
- "Run total: `X` pts".
- Fileira compacta de Relíquias ativas.
- Botão primário: **TRY AGAIN** (modo normal) ou **DAILY CHALLENGE** (modo
  diário).
- Botão secundário: **CHANGE FORGER** (modo normal) ou **HOME** (modo
  diário).

**Regras:**
- **TRY AGAIN**: reinicia imediatamente uma nova Run (novo seed, mesmo
  Forjador) — nenhuma etapa intermediária, nenhuma confirmação. Este é o
  requisito central de "restart sem fricção" do produto (PRD §2, §7.2).
- **DAILY CHALLENGE**: navega para a Tela Desafio Diário.
- **CHANGE FORGER / HOME**: volta para a Tela Início.
- Mesma lógica de retry de submissão do modo diário que a Tela Run Vencida
  (§5).

## 7. Tela Coleção (`CollectionScreen`)

**Propósito:** mostrar tudo que existe no jogo (Forjadores, cartas, Efeitos
de Forja, Relíquias) com progresso de desbloqueio, e permitir reivindicar
desbloqueios pendentes.

**Elementos, por seção:**
- **Forgers** (`X`/3): uma linha por Forjador com nome, descrição da Relíquia
  de largada, selo UNLOCKED ou dica de bloqueio (marco necessário).
- **Deck Cards** (sempre "40/40"): grade das 40 cartas do Baralho por Naipe
  — nota explicando que todas estão sempre disponíveis; Efeitos de Forja é
  que as diferenciam (não há desbloqueio de carta em si).
- **Forge Effects** (`X`/10): 8 Efeitos base sempre UNLOCKED + 2 bônus
  (desbloqueados via marco da 5ª vitória) — cada bônus mostra selo
  UNLOCKED, botão **UNLOCK** (se o marco já foi atingido mas a opção ainda
  não foi reivindicada) ou dica de bloqueio.
- **Relics** (`X`/10): as 8 comuns sempre visíveis; as 2 raras mostram selo
  de bloqueio com a dica do marco (recorde ≥ 2.500) até desbloqueadas.
- Resumo "`N` forgers to unlock · win runs to progress".
- Botão **BACK**.

**Regras:**
- Botão **UNLOCK** num Efeito de Forja bônus: aparece apenas quando o marco
  correspondente já foi atingido e a opção ainda não foi reivindicada
  (`status.available`). Ao tocar: reivindica a opção, ela passa a UNLOCKED
  imediatamente e entra no pool de ofertas de Forja de Runs futuras. (Este é
  o mesmo mecanismo do modal de escolha de ordem, §9 — a Coleção é onde a
  opção "não escolhida primeiro" fica disponível depois.)
- Itens ainda bloqueados (marco não atingido) não são acionáveis — mostram
  apenas a dica textual do marco.
- **BACK**: volta para a Tela Início.

## 8. Tela Perfil (`ProfileScreen`)

**Propósito:** estatísticas de longo prazo e progresso dos marcos.

**Elementos:**
- Cartão de estatísticas: **Best run score**, **Runs won** (`won`/`started`),
  **Win rate** (`won/started` arredondado, 0% se nenhuma Run iniciada),
  **Biggest combo** (`×maxMultiplier`).
- Seção "Favorite cards": até 3 cartas mais jogadas (empate desempatado
  alfabeticamente pela identidade `naipe:valor`), ou texto vazio "No cards
  played yet — start a run!" se nenhuma Jogada ainda.
- Seção "Milestones": uma linha por marco (`MILESTONES`) com indicador
  (ponto cinza/verde), título, descrição e estado — **Locked** (condição não
  atingida), **Ready** (condição atingida, ao menos uma opção não
  reivindicada) ou **Done** (todas as opções do marco já reivindicadas).
- Nota "Forgers unlocked: `X`/3".
- Botão **BACK**.

**Regras:**
- Esta tela é somente leitura — nenhuma ação além de **BACK** (volta à Tela
  Início). Reivindicar desbloqueios acontece na Coleção (§7) ou no modal de
  escolha (§9).

## 9. Modal de Escolha de Desbloqueio (`UnlockChoiceModal`)

**Propósito:** quando um marco concede mais de uma opção ao mesmo tempo (o
único caso no MVP: 5ª vitória → 2 Efeitos de Forja bônus), o jogador escolhe
qual entra primeiro.

**Quando aparece:** automaticamente, sobrepondo qualquer tela, assim que o
motor detecta um marco multi-opção atingido e ainda não totalmente
reivindicado (avaliado ao fim de cada Run no modo normal).

**Elementos:**
- "MILESTONE REACHED" / título e descrição do marco.
- Texto "Pick which unlock comes first — the rest stay available in the
  Collection."
- Uma opção por item não reivindicado do marco (rótulo "NEW" + título +
  dica curta quando aplicável).
- Botão **LATER**.

**Regras:**
- Tocar uma opção: reivindica-a imediatamente (some do modal, some da lista
  de pendências), fecha o modal, e mostra um banner "NEW UNLOCK" nas telas
  de fim de Run subsequentes.
- **LATER**: fecha o modal sem reivindicar nada; a(s) opção(ões)
  permanece(m) disponível(is) com botão **UNLOCK** na Coleção (§7) e o
  modal pode reaparecer em runs futuras enquanto houver opção pendente.
- Este modal nunca bloqueia a navegação de forma persistente — é
  dispensável a qualquer momento via LATER.

## 10. Tela Desafio Diário (`DailyChallengeScreen`)

**Propósito:** jogar a Run diária compartilhada e consultar o leaderboard
semanal opt-in.

**Elementos:**
- Cabeçalho "SAME RUN FOR EVERYONE · `YYYY-MM-DD`" (data UTC do dia
  corrente) / "DAILY CHALLENGE" / explicação curta.
- Cartão "ATTEMPTS LEFT `X`/2 used" com dica contextual: tentativa grátis
  pronta / tentativa extra pronta / "watch an ad to unlock" / "no attempts
  left today — come back tomorrow".
- Botão **📺 WATCH AD · EXTRA ATTEMPT** (só aparece quando aplicável — ver
  regras).
- Botão **PLAY DAILY CHALLENGE**.
- Mensagem de erro (se a busca do seed falhar).
- Divisor.
- Seção "THIS WEEK'S LEADERBOARD": botão **VIEW WEEKLY LEADERBOARD** (antes
  de carregado) ou a lista carregada (posição própria + Top 10).
- Botão **BACK**.

**Regras e validações:**
- **WATCH AD**: visível apenas quando `canWatchExtraAd` é verdadeiro (a
  tentativa gratuita já foi usada hoje, a extra ainda não foi liberada, e
  ainda há tentativas possíveis). Desabilitado durante o carregamento do
  anúncio (rótulo muda para "WATCHING…"). Ao concluir com sucesso (assistido
  até o fim): libera a tentativa extra para hoje. Desistência, falha de
  carregamento ou provider sem anúncio: nenhuma mudança de estado, botão
  reabilitado.
- **PLAY DAILY CHALLENGE**: desabilitado se não há tentativa disponível hoje
  (`!playable`) ou se uma busca já está em andamento (rótulo "LOADING
  SEED…"). Ao confirmar: busca (ou reusa, se já em cache do dia) o seed do
  backend, consome 1 tentativa, monta a Run do dia (Forjador Aprendiz, DDA
  desligado, todos os pools abertos) e navega para a Tela Jogo em modo
  `daily`. Falha na busca do seed: tentativa **não** é consumida, mensagem
  de erro exibida, jogador pode tentar novamente.
- **VIEW WEEKLY LEADERBOARD**: desabilitado durante o carregamento (rótulo
  "LOADING…"). Ao concluir: substitui o botão pela lista — semana (segunda-
  feira ISO), "YOUR BEST" (posição + pontuação própria, ou "No score yet"),
  Top 10 (rank + pontuação; 1º lugar destacado em dourado; "No scores this
  week yet." se vazio). Falha na busca: mensagem de erro exibida.
- O rollover do contador de tentativas acontece automaticamente na virada
  do dia UTC (00:00), sem exigir reabrir o app manualmente na fronteira —
  toda leitura de `attempts` recalcula para o dia corrente.
- **BACK**: volta para a Tela Início.

## 11. Overlay de Onboarding (`OnboardingOverlay`)

**Propósito:** tutorial de 4 passos na primeira execução.

**Quando aparece:** automaticamente sobre a Tela Início, apenas se a flag
`combo-forge:onboarding-seen` ainda não foi gravada localmente.

**Conteúdo (4 passos, fixos):**
1. "Select Cards" — como selecionar cartas da Mão.
2. "Score the Pattern" — hierarquia de Padrões.
3. "Ride the Combo" — como o Multiplicador cresce e reseta.
4. "Beat the Target" — vencer a Rodada e a recompensa da Forja.

**Elementos por passo:** contador "`n`/4", título, corpo, dica; botões
**SKIP** e **NEXT** (o último passo troca **NEXT** por **LET'S FORGE**).

**Regras:**
- **SKIP** (qualquer passo) ou **LET'S FORGE** (último passo): ambos
  concluem o onboarding — gravam a flag localmente e fecham o overlay. Não
  há diferença funcional entre pular e completar; a flag apenas evita
  reexibição futura.
- **NEXT** (passos 1–3): avança para o próximo passo.
- Falha ao gravar a flag (SQLite indisponível) não impede o fechamento do
  overlay — apenas o tutorial pode reaparecer na próxima sessão.

## 12. Banner de Lembrete de Pausa (`BreakReminderBanner`)

**Propósito:** sugestão gentil e dispensável de pausa.

**Quando aparece:** sobrepõe qualquer tela quando o motor decide que a
sugestão é devida (3 Runs consecutivas com fim em cadeia de até 10 min entre
si, e nenhuma sugestão exibida nos últimos 30 min).

**Elementos:** "☕ Time for a break?" + texto explicativo + botão **OK, I'LL
TAKE A MOMENT**.

**Regras:**
- **OK, I'LL TAKE A MOMENT**: única ação possível. Registra o momento da
  sugestão (inicia o cooldown de 30 min) e fecha o banner. **Não pausa nem
  bloqueia o jogo** — é puramente informativo/dispensável.
- Não há outra forma de fechar o banner (sem "X" ou toque fora) além deste
  botão — decisão deliberada para garantir que o jogador reconheça a
  sugestão (mas nunca há bloqueio de jogo por trás dela).

## 13. Tela Loja (`ShopScreen`)

**Propósito:** compra de cosméticos e remoção de anúncios; único ponto de
monetização direta do produto.

**Elementos:**
- "SHOP" / "Cosmetic Only" + garantia "✓ Never affects gameplay power —
  deck skins and combo effects are purely visual."
- Seção **Remove Ads**: linha com nome, descrição, e botão de preço (ou selo
  "PURCHASED" se já comprado).
- Seção **Deck Skins**: uma linha por skin do catálogo (Obsidian, Emerald,
  Royal).
- Seção **Combo Effects**: uma linha por efeito (Golden Combo).
- Mensagem "Loading prices…" durante carga; mensagem de erro em falha de
  carga.
- Botão **RESTORE PURCHASES** + dica "Bought on another device? Restore to
  unlock here too."
- Botão **BACK**.

**Regras e validações, por linha de item:**
- **Não comprado**: mostra botão de preço (preço real do provider se
  carregado; senão o `devPrice` do catálogo como placeholder). Tocar inicia
  a compra — botão mostra "…" enquanto `purchasing === item.id`. Sucesso:
  item passa a "owned" e é **equipado automaticamente** (skin de baralho ou
  VFX de combo aplicados nas próximas Jogadas/Runs); persistido localmente.
  Cancelamento pelo jogador (fechou o diálogo nativo de compra): nenhuma
  mudança, sem mensagem de erro. Falha real de compra/rede: mensagem de erro
  exibida na tela.
- **Comprado, não equipado**: mostra botão **EQUIP**. Tocar troca o item
  equipado da mesma categoria (uma skin de baralho + um VFX de combo por vez)
  — sem IO, efeito imediato e persistido.
- **Comprado e equipado**: mostra selo **EQUIPPED** (sem ação disponível —
  já é o estado atual).
- **Remove Ads**: mesmo padrão de preço/compra das linhas acima, mas sem
  estado "equipável" — ao comprar, mostra selo **PURCHASED** e o banner de
  anúncio (`AdBanner`, §14) some de todas as telas imediatamente, sem
  precisar reiniciar o app.
- **RESTORE PURCHASES**: desabilitado enquanto uma restauração já está em
  andamento (rótulo "RESTORING…"). Ao concluir: reaplica como "owned"
  qualquer cosmético comprado no passado (identificado pelo provider),
  reaplica a remoção de anúncios se a entitlement estiver ativa (nunca
  regride uma remoção já ativa localmente), e persiste o resultado.
- **BACK**: volta para a Tela Início.
- Ao abrir a tela, os preços reais são carregados automaticamente do
  provider configurado (RevenueCat) — se nenhuma chave estiver configurada,
  os preços de desenvolvimento do catálogo são usados como fallback
  silencioso (a Loja continua totalmente navegável e testável).

## 14. Banner de Anúncio (`AdBanner`)

**Propósito:** único formato de anúncio não-recompensado do produto — banner
persistente de 50dp no rodapé.

**Onde aparece:** rodapé de **todas** as telas (montado uma vez em `App.tsx`,
fora da navegação entre telas).

**Regras de visibilidade:**
- **Oculto** quando a remoção de anúncios foi comprada (`adsRemoved ===
  true`) OU quando não há ad unit configurado para a plataforma atual (regra
  pura `shouldShowBanner`).
- **Visível** caso contrário — reserva sempre os 50dp de altura mesmo se o
  anúncio individual falhar ao carregar (NO_FILL), para que o layout nunca
  "pule" quando um anúncio eventualmente aparecer.
- Em desenvolvimento, usa sempre o `TestId` oficial de banner adaptativo do
  SDK (não é o ad unit real de produção); nada configurável pelo jogador.
- Sem interação do jogador possível além do próprio conteúdo do anúncio (o
  banner não é dispensável individualmente — apenas via compra de Remove
  Ads na Loja).

## 15. Status de Submissão Diária (`DailySubmitStatus`)

Componente compartilhado pelas Telas Run Vencida (§5) e Run Perdida (§6) no
modo diário.

**Estados possíveis (`submitStatus`):**
- `idle`: nada exibido (submissão ainda não foi disparada).
- `submitting`: "Submitting score…".
- `submitted`: "✓ Score submitted" (estilo de sucesso).
- `failed`: "Score not submitted" + botão **RETRY** (estilo de erro).

**Regras:**
- A submissão é disparada automaticamente pelo sistema ao fim de qualquer
  Run em modo `daily` (vitória ou derrota) — nunca por ação manual do
  jogador, exceto o retry após falha.
- **RETRY**: reenvia a mesma pontuação da Run ao backend. Se uma submissão
  já está em andamento ou já foi confirmada (`submitting`/`submitted`), uma
  nova tentativa de envio (automática ou manual) é ignorada — o servidor
  mantém a melhor pontuação do dia por dispositivo de qualquer forma, então
  reenvios não têm risco de regressão mesmo se disparados por engano.
