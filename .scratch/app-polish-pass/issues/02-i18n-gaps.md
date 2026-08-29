# 02 — Lacunas de tradução pt-br: onboarding, Home, Loja, Coleção

**What to build:** liga ao sistema de i18n existente (mesmo padrão de `components/format.ts` já usado por `patternName`/`relicDescription`/`forgeEffectLabel`) tudo que hoje é dado bruto do motor renderido sem passar por `t()`: título do onboarding, composição dos Padrões, nome e descrição dos Forjadores, descrição dos Decks, categoria e descrição de Relíquia (incluindo as raras, que hoje mostram a descrição do Marco de desbloqueio em inglês em vez da própria descrição), e título/descrição de todos os Marcos de Meta-Progressão em toda tela que os mostra. Nome de Relíquia e de Deck continuam em inglês (convenção intencional do jogo) — só Forjador é exceção, usando os termos pt-br já definidos em `CONTEXT.md` (Aprendiz/Martelo/Bigorna).

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-agent

- [ ] `i18n/pt.json`: corrige `onboarding.rideCombo.title` (hoje `"Ride o Combo"`, mistura de idioma) para uma tradução completa.
- [ ] `engine/patterns.ts`: remove o export `PATTERN_COMPOSITIONS` (hardcoded em inglês).
- [ ] `components/format.ts`: ganha `PATTERN_COMPOSITION_I18N_KEY` (`PatternKind` → chave `format.patternComposition.<kind>`) e a função `patternComposition(kind)`.
- [ ] `i18n/en.json` e `i18n/pt.json`: novas chaves `format.patternComposition.<kind>` para os 7 Padrões — inglês espelha o texto atual de `PATTERN_COMPOSITIONS`, pt-br é tradução nova.
- [ ] `components/PatternList.tsx`: troca `PATTERN_COMPOSITIONS[kind]` por `patternComposition(kind)`.
- [ ] `engine/patterns.test.ts`: remove o teste de paridade de chaves entre `PATTERN_COMPOSITIONS` e `PATTERN_BONUSES` (a constante deixou de existir; a paridade agora é garantida pelo tipo `Record<PatternKind, string>` do novo mapa de chaves).
- [ ] `components/format.ts`: ganha `FORGER_NAME_I18N_KEY` (`ForgerId` → chave `format.forgerName.<id>`) e a função `forgerName(id)`.
- [ ] `i18n/en.json` e `i18n/pt.json`: novas chaves `format.forgerName.<id>` para os 3 Forjadores — inglês (Apprentice/Hammer/Anvil, mesmo texto atual), pt-br (Aprendiz/Martelo/Bigorna, termos já definidos em `CONTEXT.md`).
- [ ] `components/StartScreen.tsx`: troca `candidate.name` cru (linhas 140, 144) por `forgerName(candidate.id)`; o `t('a11y.forgerOption', { name: ... })` (linhas 122-126) passa a interpolar o nome traduzido.
- [ ] `components/CollectionScreen.tsx`: troca `forger.name` cru (linhas 115, 120) por `forgerName(forger.id)`.
- [ ] `components/format.ts`: ganha `deckSkinDescription(item: DeckSkinItem)`, mesma forma de `relicDescription`.
- [ ] `i18n/en.json` e `i18n/pt.json`: novas chaves `format.deckSkin.<id>` para os 4 Decks (`deck-classic`, `deck-obsidian`, `deck-emerald`, `deck-royal`) — inglês espelha o texto atual de `engine/shop.ts`, pt-br é tradução nova. Nome do Deck (`item.name`) continua sem tradução.
- [ ] `components/ShopScreen.tsx`: troca `item.description` cru (linha 56) por `deckSkinDescription(item)`.
- [ ] `components/format.ts`: ganha `relicCategoryLabel(category: RelicCategory)`.
- [ ] `i18n/en.json` e `i18n/pt.json`: novas chaves `format.relicCategory.<category>` (namespace novo, distinto de `format.relic.*` que já é usado pra descrição de efeito) para as 4 categorias (`suit`/`pattern`/`mechanic`/`combo`).
- [ ] `components/CollectionScreen.tsx`: troca `relic.category` cru (linha 166) por `relicCategoryLabel(relic.category)`.
- [ ] `components/format.ts`: ganha `milestoneTitle(id)`, `milestoneDescription(id)` e `milestoneOptionTitle(id)`, usando os ids já estáveis de `engine/progression.ts` (`firstRunWon`, `thirdRunWon`, `fifthRunWon`, `scoreRecord2500`, ids de `MilestoneOption` como `unlock-forger-hammer`) como chave de lookup — `engine/progression.ts` em si não ganha dependência de i18n (mesma regra já seguida pelo resto do motor).
- [ ] `i18n/en.json` e `i18n/pt.json`: novas chaves `milestones.<id>.title`/`.description` e `milestoneOptions.<id>.title` para todos os Marcos e opções — inglês espelha o texto atual de `engine/progression.ts`, pt-br é tradução nova.
- [ ] `components/StartScreen.tsx` (linha 147), `components/CollectionScreen.tsx` (linhas 95, 98, 126, 213), `components/ProfileScreen.tsx` (linhas 113, 115) e `components/UnlockChoiceModal.tsx` (linhas 44-45, 65): trocam `milestone.title`/`.description`/`.description` cru pelos helpers `milestoneTitle`/`milestoneDescription`/`milestoneOptionTitle` correspondentes.
- [ ] `components/CollectionScreen.tsx` (linha 174): corrige o achado do audit — hoje mostra `rareMilestone?.description` cru quando uma Relíquia rara (Straight Line, Chain Reaction) está bloqueada; passa a mostrar `milestoneDescription(rareMilestone.id)`. A descrição da própria Relíquia (linha 172, `relicDescription(relic)`) já está corretamente traduzida — some ao ficar destravada, sem mudança necessária ali.
- [ ] Validação manual em pt-br de todas as telas tocadas (onboarding, Home, Loja, Coleção, Perfil, modal de escolha de desbloqueio) via skill `run` — sem precedente de teste de componente no repo, então esta parte não ganha teste automatizado.
