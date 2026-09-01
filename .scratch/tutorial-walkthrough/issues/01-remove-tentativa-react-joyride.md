# 01 — Remove a tentativa abandonada com react-joyride

**What to build:** o repositório volta a um estado limpo, sem a tentativa anterior e inacabada de tutorial via `react-joyride` — dependência removida, componentes voltam ao comportamento de hoje (Rodada 1 normal, botão "?" abre a referência de Padrões como sempre abriu), sem código morto nem bugs deixados pra trás.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-human

- [x] `package.json`/`package-lock.json`: remove a dependência `react-joyride` (nunca chegou a ser commitada — instalada localmente, mas presente no `package.json` do working tree). Confirmado: o snapshot commitado (`chore: snapshot da tentativa...`) já não tinha mais a linha de dependência (removida em algum ponto antes do commit, fora desta sessão) — os dois arquivos já batiam com o estado limpo, sem diff a aplicar. O pacote órfão ainda instalado em `node_modules/react-joyride` (sem entrada em `package.json`) foi removido diretamente.
- [x] `components/GameScreen.tsx`: reverte para o comportamento commitado — botão "?" volta a abrir `PatternReferenceModal` (não `OnboardingOverlay`), remove o `useEffect` com bug de Hook chamado depois do retorno condicional (`if (run === null) return null`), remove os imports/estado ligados ao `react-joyride` (`useJoyride`, `showOnboarding`, `hasSeenTutorial`, `markTutorialAsSeen`, `scrollViewRef`).
- [x] `components/OnboardingOverlay.tsx` e `components/RelicRow.tsx`: revertem qualquer edição solta ligada à mesma tentativa. `RelicRow.tsx` já não tinha diff nenhum contra o estado limpo — nada a reverter ali.
- [x] `store/gameStore.ts`: remove `hasSeenTutorial`/`markTutorialAsSeen` (ou qualquer campo equivalente da tentativa abandonada) — o novo motor do tutorial (ticket 03) recria o que for necessário do zero, com o desenho correto.
- [x] `components/PatternReferenceModal.tsx`: confirma que o arquivo continua existindo e é usado (a tentativa abandonada tinha removido o import) — não deletar. Restaurado (tinha sido deletado pela tentativa).
- [x] Typecheck, lint e suíte de testes completos passam sem erro depois da limpeza. `tsc --noEmit` limpo, `eslint .` sem erros (só 3 warnings pré-existentes e não relacionados, dentro de `.claude/skills/wireframe/references/viewer.js` — arquivo de referência de um skill, não código do app), `jest` 357/357. Achado extra durante a limpeza (não listado originalmente, mesmo objetivo do ticket): `i18n/en.json`/`pt.json` tinham uma chave `common.previous`/"Anterior" órfã, deixada pela tentativa abandonada (usada só pelo botão "Anterior" do `OnboardingOverlay.tsx` da experiência) — removida também.
