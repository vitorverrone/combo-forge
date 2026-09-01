# 01 — Remove a tentativa abandonada com react-joyride

**What to build:** o repositório volta a um estado limpo, sem a tentativa anterior e inacabada de tutorial via `react-joyride` — dependência removida, componentes voltam ao comportamento de hoje (Rodada 1 normal, botão "?" abre a referência de Padrões como sempre abriu), sem código morto nem bugs deixados pra trás.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-agent

- [ ] `package.json`/`package-lock.json`: remove a dependência `react-joyride` (nunca chegou a ser commitada — instalada localmente, mas presente no `package.json` do working tree).
- [ ] `components/GameScreen.tsx`: reverte para o comportamento commitado — botão "?" volta a abrir `PatternReferenceModal` (não `OnboardingOverlay`), remove o `useEffect` com bug de Hook chamado depois do retorno condicional (`if (run === null) return null`), remove os imports/estado ligados ao `react-joyride` (`useJoyride`, `showOnboarding`, `hasSeenTutorial`, `markTutorialAsSeen`, `scrollViewRef`).
- [ ] `components/OnboardingOverlay.tsx` e `components/RelicRow.tsx`: revertem qualquer edição solta ligada à mesma tentativa.
- [ ] `store/gameStore.ts`: remove `hasSeenTutorial`/`markTutorialAsSeen` (ou qualquer campo equivalente da tentativa abandonada) — o novo motor do tutorial (ticket 03) recria o que for necessário do zero, com o desenho correto.
- [ ] `components/PatternReferenceModal.tsx`: confirma que o arquivo continua existindo e é usado (a tentativa abandonada tinha removido o import) — não deletar.
- [ ] Typecheck, lint e suíte de testes completos passam sem erro depois da limpeza.
