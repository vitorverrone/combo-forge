# Combo Forge: Polish pós-teste (UX/bugs + lacunas de tradução pt-br)

Status: ready-for-agent

## Problem Statement

Uma rodada de teste no app real (emulador + build de preview no tablet) achou quatro problemas de UX/robustez e uma quantidade grande de texto sem tradução pt-br, espalhada por onboarding, Home, Loja e Coleção — o app troca pra pt-br via `i18n`, mas várias telas ainda mostram inglês porque o dado de origem nunca foi ligado ao sistema de tradução, não porque falta o texto em si.

- Em tablet/foldable aberto, o jogo gira acompanhando o dispositivo em vez de ficar travado em portrait. Causa raiz identificada: dois config plugins nativos foram adicionados juntos no mesmo commit (`64e34ee`) com objetivos que colidem — `withAndroidResizable` força `android:resizeableActivity="true"` (pra ganhar o selo de qualidade "large screen" da Play Store), enquanto `withOrientationLockCompat` tenta restaurar o travamento em portrait via `PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`. Na prática a Activity redimensiona pra paisagem (por causa do primeiro) enquanto o conteúdo interno insiste em ficar portrait — nem trava de verdade, nem fica genuinamente responsivo.
- A tooltip de Relíquia (toque no ícone, na tela de jogo) só fecha sozinha (timer de 3s) ou tocando em outro ícone de Relíquia — não existe "tocar em qualquer lugar da tela fecha".
- Sem internet, os erros do Desafio Diário (buscar seed, leaderboard, salvar Nome de Exibição) mostram o texto técnico cru do erro do Supabase/fetch, sem nenhum tratamento amigável.
- O botão de assistir anúncio (tentativa extra do Desafio Diário) já desabilita e troca de texto (`daily.adLoading`) ao tocar, mas sem indicador visual (spinner) — no intervalo entre o toque e a UI nativa do anúncio realmente aparecer, pode não ser perceptível que algo está acontecendo.
- Lacunas de tradução: título "Ride o Combo" no onboarding mistura inglês com português; composição dos Padrões (`PATTERN_COMPOSITIONS`) é uma constante 100% hardcoded em inglês, sem nenhuma ligação ao i18n; nome dos Forjadores (`Apprentice`/`Hammer`/`Anvil`) é dado bruto do motor, sem tradução; descrição dos Decks cosméticos (`engine/shop.ts`) é hardcoded em inglês; categoria de Relíquia (`suit`/`pattern`/`mechanic`/`combo`) é renderizada como valor bruto do union type; título/descrição dos Marcos de Meta-Progressão (`engine/progression.ts`) são strings hardcoded em inglês, consumidas cruas em 4 telas diferentes (Home, Coleção, Perfil, modal de escolha de desbloqueio) — inclusive explicando por que a descrição de "Straight Line"/"Chain Reaction" aparecia em inglês: são as duas únicas Relíquias raras do pool, e enquanto bloqueadas mostram a descrição do Marco de desbloqueio (hardcoded), não a descrição da própria Relíquia (que já é traduzida corretamente via `relicDescription()`).

## Solution

Duas frentes independentes, sequenciáveis em paralelo:

- **P0 — UX/robustez**: travamento real de orientação em telas grandes, tooltip de Relíquia fecha ao tocar fora, mensagem amigável de sem-internet, spinner no carregamento do anúncio.
- **P1 — Lacunas de tradução pt-br**: liga ao sistema de i18n existente (mesmo padrão já usado por `patternName`/`relicDescription`/`forgeEffectLabel` em `components/format.ts`) tudo que hoje é dado bruto do motor renderido sem passar por `t()`.

## User Stories

1. Como jogador de tablet, eu quero que o jogo fique travado em portrait de verdade — precisando girar o tablet manualmente pra sair do modo paisagem — pra não ter a experiência quebrada por um layout que meio-gira, meio-não-gira.
2. Como jogador, eu quero que a tooltip de Relíquia feche ao tocar em qualquer lugar da tela, não só esperando o timer ou tocando em outro ícone, pra não atrapalhar minha jogada.
3. Como jogador sem internet, eu quero uma mensagem clara dizendo que não há conexão, em vez do erro técnico do backend, pra entender o que fazer (tentar de novo, checar minha rede).
4. Como jogador, eu quero ver um indicador visual claro (spinner) assim que toco em "assistir anúncio", pra saber que o toque foi registrado enquanto o anúncio carrega.
5. Como jogador em pt-br, eu quero o passo "Ride o Combo" do onboarding totalmente em português, sem mistura de idioma.
6. Como jogador em pt-br, eu quero a composição dos 7 Padrões (tutorial + modal de referência "?") traduzida, não só o bônus e o nome.
7. Como jogador em pt-br, eu quero o nome dos Forjadores (Aprendiz/Martelo/Bigorna) e sua descrição em português na Home e na Coleção — mantendo nomes de Relíquia e de Deck em inglês, que é a convenção intencional do jogo.
8. Como jogador em pt-br, eu quero a descrição dos Decks cosméticos da Loja traduzida (o nome do Deck continua em inglês).
9. Como jogador em pt-br, eu quero a categoria de cada Relíquia (Naipe/Padrão/Mecânica/Combo) e a descrição de toda Relíquia — incluindo as raras Straight Line e Chain Reaction — traduzidas na tela de Coleção.
10. Como jogador em pt-br, eu quero título e descrição de todos os Marcos de Meta-Progressão traduzidos, em toda tela que os mostra (Home, Coleção, Perfil, modal de escolha de desbloqueio).

## Implementation Decisions

### P0 — UX/robustez

- **Orientação em tablet**: `plugins/withAndroidResizable.js` muda `android:resizeableActivity` de `'true'` para `'false'` — abre mão do selo de qualidade "large screen" da Play Store em troca do travamento real que o GDD já pede ("Plataforma: Mobile — portrait, one-hand play", não é design pensado pra paisagem/tablet). As propriedades de `withOrientationLockCompat` (bloqueio de override de orientação por app/usuário) permanecem, já que continuam relevantes independente de `resizeableActivity`. **Primeira tentativa, não 100% garantida** — precisa validação num tablet real via novo build EAS; se a Activity ainda acompanhar a orientação física, é sinal de que falta mais alguma propriedade de compat, tratado como achado de bug numa iteração seguinte, não reabre esta decisão.
- **Tooltip de Relíquia fecha ao tocar fora**: `RelicRow` deixa de possuir `openRelicId` como estado interno (`useState`) e passa a recebê-lo como prop controlada (`openRelicId`, `onOpenRelicIdChange`) — só relevante no modo não-compact (o modo compact, usado em Forja/Resumo de Rodada, não renderiza tooltip). `GameScreen` passa a possuir esse estado e renderiza um overlay full-screen transparente (mesmo padrão de `styles.overlay` já usado pro modal de abandonar run), visível só quando `openRelicId !== null`, com `zIndex` acima do conteúdo do jogo mas abaixo da própria tooltip — toque nesse overlay fecha a tooltip sem também acionar o elemento por baixo (mesmo comportamento já usado pelos outros overlays do app).
- **Erro de sem-internet**: `store/dailyFlow.ts::messageOf` ganha uma checagem específica antes do fallback genérico — o fetch do React Native lança `TypeError` com mensagem `"Network request failed"` de forma consistente pra falha de conectividade (sem dependência nova: já é o comportamento padrão do polyfill de fetch do RN, não precisa de `netinfo` ou biblioteca de rede). Quando a checagem bate, devolve uma nova chave i18n (`daily.networkError` — "Sem conexão com a internet. Verifique sua rede e tente novamente." / "No internet connection. Check your network and try again.") em vez de `error.message` cru. Erros que não batem esse padrão continuam caindo no fallback atual (`error.message`) — não é objetivo desta ticket tratar todo tipo de erro de backend, só o caso de conectividade.
- **Spinner no anúncio**: o loading via texto (`daily.adLoading` → `t('daily.watchAdLoading')`) já existe e continua — a mudança é só visual, adicionando um `ActivityIndicator` pequeno ao lado do texto enquanto `daily.adLoading` é `true`, no mesmo botão.

### P1 — Lacunas de tradução

Mesmo padrão já estabelecido em `components/format.ts` (`PATTERN_I18N_KEY` + `patternName()`, `relicDescription()`, `forgeEffectLabel()`): uma constante `Record<Chave, string>` mapeando cada valor discreto pra uma chave i18n, mais uma função helper que chama `i18n.t(...)`. Nenhuma mudança na convenção existente de que **nomes próprios de Relíquia e de Deck continuam em inglês** — só Forjador é exceção (decisão explícita do usuário nesta sessão), porque `CONTEXT.md` já define os nomes pt-br canônicos (Aprendiz/Martelo/Bigorna) como vocabulário de domínio, então a tradução usa esses termos, não precisa inventar nome novo.

- **`i18n/pt.json`**: corrige `onboarding.rideCombo.title` — hoje `"Ride o Combo"`, mistura de idioma — pra uma tradução completa e idiomática.
- **Composição de Padrão**: `engine/patterns.ts` remove o export `PATTERN_COMPOSITIONS` (hardcoded); `components/format.ts` ganha `PATTERN_COMPOSITION_I18N_KEY` (mapeando `PatternKind` → chave `format.patternComposition.<kind>`) e a função `patternComposition(kind)`. Novas chaves em `en.json`/`pt.json` sob `format.patternComposition.*` — os 7 valores em inglês de `PATTERN_COMPOSITIONS` viram o conteúdo de `en.json`; `pt.json` ganha a tradução. `components/PatternList.tsx` troca `PATTERN_COMPOSITIONS[kind]` por `patternComposition(kind)`.
- **Nome do Forjador**: `components/format.ts` ganha `FORGER_NAME_I18N_KEY` (mapeando `ForgerId` → `format.forgerName.<id>`) e `forgerName(id)`. Chaves novas em `en.json` (Apprentice/Hammer/Anvil, mesmo texto de hoje) e `pt.json` (Aprendiz/Martelo/Bigorna). `components/StartScreen.tsx` (linhas 140, 144, e o `t('a11y.forgerOption', { name: ... })` nas linhas 122-126) e `components/CollectionScreen.tsx` (linhas 115, 120) trocam `candidate.name`/`forger.name` cru por `forgerName(candidate.id)`/`forgerName(forger.id)`. `engine/forgers.ts`'s `Forger.name` (o dado bruto em inglês) continua existindo — é a fonte da versão em inglês, mas deixa de ser renderido diretamente em UI.
- **Descrição de Deck**: `components/format.ts` ganha `deckSkinDescription(item: DeckSkinItem)`, mesma forma de `relicDescription`, com chaves `format.deckSkin.<id>` (`deck-classic`, `deck-obsidian`, `deck-emerald`, `deck-royal`) em `en.json`/`pt.json` — inglês espelha o texto atual de `engine/shop.ts`, pt-br é tradução nova. `components/ShopScreen.tsx` linha 56 troca `item.description` por `deckSkinDescription(item)`. `item.name` continua renderizado cru (convenção mantida).
- **Categoria de Relíquia**: `components/format.ts` ganha `relicCategoryLabel(category: RelicCategory)`, chaves novas `format.relicCategory.<category>` (namespace novo — não reaproveita `format.relic.*`, que já é usado pra descrição de efeito, não categoria). `components/CollectionScreen.tsx` linha 166 troca `relic.category` cru por `relicCategoryLabel(relic.category)`.
- **Marcos de Meta-Progressão**: `Milestone.title`/`.description` e `MilestoneOption.title`, hoje `string` puro em `engine/progression.ts`, continuam como estão (engine não ganha dependência de i18n — mesma regra já seguida por `PatternKind`/`RelicEffect`/`ForgeEffect`, cujos nomes/textos de exibição também vivem fora do motor). `components/format.ts` ganha `milestoneTitle(id)`/`milestoneDescription(id)`/`milestoneOptionTitle(id)` — os ids já são estáveis (`firstRunWon`, `thirdRunWon`, `fifthRunWon`, `scoreRecord2500`, `unlock-forger-hammer`, etc., já usados como `key` de React) — com chaves novas `milestones.<id>.title`/`.description` e `milestoneOptions.<id>.title` em `en.json`/`pt.json` (inglês espelha o texto atual, pt-br é tradução nova). Todos os consumidores trocam pra usar os helpers: `components/StartScreen.tsx` (linha 147), `components/CollectionScreen.tsx` (linhas 95, 98, 126, 174, 213 — a linha 174 é a correção direta do achado "Straight Line"/"Chain Reaction": hoje mostra `rareMilestone?.description` cru, passa a mostrar `milestoneDescription(rareMilestone.id)`), `components/ProfileScreen.tsx` (linhas 113, 115) e `components/UnlockChoiceModal.tsx` (linhas 44-45, 65) — essas duas últimas não estavam no pedido original, mas usam a mesma fonte de dado; corrigir só as 4 telas pedidas deixaria essas duas ainda em inglês, uma inconsistência que o próprio achado do audit já expôs.

## Testing Decisions

- Sem teste automatizado para nenhuma das mudanças de UI/render (mesmo precedente já estabelecido: zero arquivos `.test.tsx` no repo) — validação manual via skill `run` (emulador) para o que dá pra testar sem tablet físico (tooltip, spinner, textos pt-br), e novo build EAS + teste manual no tablet real para o travamento de orientação (não valida em emulador — a causa raiz é específica de tela grande/Android 16 compat mode).
- `engine/patterns.test.ts`: o teste existente que checava `PATTERN_COMPOSITIONS` tem as mesmas chaves de `PATTERN_BONUSES` é removido junto com o export (não faz mais sentido testar uma constante que deixou de existir no motor) — a paridade de chaves passa a ser garantida pelo tipo (`Record<PatternKind, string>` do novo `PATTERN_COMPOSITION_I18N_KEY` já força o TypeScript a exigir todas as chaves).
- Erro de rede: teste unitário em `store/dailyFlow.test.ts` cobrindo que um `TypeError('Network request failed')` vira a mensagem amigável, e que outros tipos de erro continuam caindo no fallback atual — comportamento puro, testável sem mock de rede real.

## Out of Scope

- CI real pra pegar drift de tradução automaticamente (ex.: checar que toda chave de `en.json` tem par em `pt.json`) — vale como oportunidade futura, não faz parte desta spec.
- Qualquer outro tipo de erro de backend além de falha de conectividade (ex.: erro 500, rate limit) — só o caso "sem internet" está no escopo.
- Reverter a convenção de nome de Relíquia/Deck em inglês — decisão explícita do usuário nesta sessão de manter só Forjador como exceção.

## Further Notes

- P0 e P1 são independentes e podem ser implementadas em branches paralelas, mesmo padrão já usado na spec `pos-health-check-rebalance` desta sessão.
- A correção de orientação em tablet é a única mudança desta spec sem validação automatizada possível — depende de build EAS + teste manual no aparelho físico do usuário antes de considerar o achado fechado.
