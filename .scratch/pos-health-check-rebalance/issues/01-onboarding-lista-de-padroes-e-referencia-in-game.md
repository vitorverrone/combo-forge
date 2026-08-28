# 01 — Onboarding: lista de Padrões + referência in-game

**What to build:** o jogador vê, no passo `scorePattern` do tutorial de onboarding, os 7 Padrões do jogo com o que os forma e quantos pontos cada um vale, em vez do exemplo genérico único de Par; o passo `beatTarget` explica que a Meta cresce a cada Rodada. Além disso, a qualquer momento durante uma Run, o jogador pode tocar num ícone "?" persistente na tela de jogo e ver essa mesma lista de Padrões — não precisa depender só da memória do tutorial visto uma vez. A GDD passa a documentar a UI de seleção de cartas (toque, botões Jogar/Descartar/Limpar) e o tutorial de onboarding, que já existem no código mas não estavam descritos no documento.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** done

- [x] `engine/patterns.ts` ganha uma nova constante mapeando cada `PatternKind` a uma descrição curta de composição (ex.: Trinca → "3 cartas do mesmo valor"), ao lado de `PATTERN_BONUS` já existente — fonte única consumida pelo tutorial e pelo modal de referência.
- [x] Teste garante que essa nova constante tem exatamente as mesmas chaves de `PATTERN_BONUS` (nenhum Padrão faltando ou duplicado), estendendo `engine/patterns.test.ts`.
- [x] `components/OnboardingOverlay.tsx`, passo `scorePattern`: renderiza os 7 Padrões (nome, composição, bônus) em vez do exemplo único de Par.
- [x] `components/OnboardingOverlay.tsx`, passo `beatTarget`: texto explica que a Meta cresce a cada Rodada.
- [x] Novo componente de modal de referência de Padrões, aberto por um ícone "?" persistente em `components/GameScreen.tsx`, reaproveitando o padrão visual de modal já usado em `UnlockChoiceModal`. Lista os 7 Padrões com composição e bônus; sem estado além de aberto/fechado.
- [x] `GDD_Combo_Forge.md` ganha uma seção (ou subseção do Core Gameplay Loop) documentando a UI de seleção de cartas e o tutorial de onboarding existente.
- [x] Sem versionamento da flag `combo-forge:onboarding-seen` — não é necessário, o app ainda não tem usuários reais.
- [x] Validação manual do fluxo (tutorial + modal "?") via skill `run` — sem precedente de teste de componente no repo, então esta parte não ganha teste automatizado.
