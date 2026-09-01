# 03 — Motor do tutorial contextual (reducer + persistência)

**What to build:** um módulo isolado e testável que decide qual passo do tutorial contextual está ativo e o que faz avançar pro próximo, com as duas flags de "já visto" persistidas entre sessões — sem nenhuma tela usando esse módulo ainda (isso fica pras tickets 04 e 05).

**Blocked by:** 01 (Remove a tentativa abandonada com react-joyride) — evita reconstruir em cima de campos que a limpeza remove (`hasSeenTutorial`/`markTutorialAsSeen`).

**Status:** ready-for-agent

- [ ] Novo módulo `store/tutorialFlow.ts`, mesmo padrão arquitetural de `store/dailyFlow.ts`/`store/shopFlow.ts`: um comando único (`runTutorialCommand(state, event)`) que recebe o estado do tutorial (qual passo está ativo — nenhum, 1, 2 ou 3 —, se a seção GameScreen já foi vista, se a seção Forja já foi vista) e um evento (`cardTouched`, `clearOrDiscardTouched`, `nextPressed`, `skipOrCompletePressed`, `forgeOfferTouched`), devolvendo o novo estado. Função pura, sem conhecimento de Zustand, telas ou navegação.
- [ ] Os dois gatilhos são independentes: uma função que decide "a seção GameScreen deveria começar agora?" (Run normal, Rodada 1, fase `playing`, seção ainda não vista) e outra pra "a seção Forja deveria começar agora?" (Run normal, fase `forging`, seção ainda não vista) — nenhuma das duas depende da outra ter sido vista.
- [ ] Persistência via o mesmo padrão já usado por `hasSeenOnboarding`/`completeOnboarding` (`expo-sqlite/kv-store`, `SQLiteStorage`): duas chaves próprias, uma pra cada seção. Sem resumo de passo-a-passo — uma seção não concluída reaparece inteira da próxima vez que o gatilho disparar (mesma regra do onboarding estático).
- [ ] `store/gameStore.ts` ganha o estado e as ações mínimas pra expor esse módulo à UI (sem ainda ser consumido por nenhuma tela) — mesmo padrão de exposição já usado pelos outros flows.
- [ ] Testes unitários em `store/tutorialFlow.test.ts`, mesmo estilo de `store/dailyFlow.test.ts`: cobre qual passo fica ativo depois de cada evento, que os dois gatilhos (GameScreen vs. Forja) são de fato independentes, que "Pular"/"Concluir"/"Próximo" produzem os resultados esperados, e que uma seção já marcada como vista não reaparece nem some o estado do reducer.
