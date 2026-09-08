# 01 — Extrair `dailyCallToActionState` e refatorar `DailyChallengeScreen`

**What to build:** hoje a `DailyChallengeScreen` calcula inline (via `rem`/`attemptsUsed`) qual dos 3 estados de convite mostrar ao jogador — tentativa gratuita pronta, tentativa extra pronta, ou pode assistir anúncio por outra. Extraia essa decisão para uma função pura nova em `engine/daily.ts`, `dailyCallToActionState(attempts: DailyAttempts): 'free-ready' | 'extra-ready' | 'watch-ad'`, e refatore `DailyChallengeScreen.tsx` para consumi-la em vez do `if/else` atual. As três saídas mapeiam para as chaves de i18n já existentes: `free-ready` → `daily.freeReady`, `extra-ready` → `daily.extraReady`, `watch-ad` → `daily.watchAdHint`. Nenhum texto renderizado pela tela pode mudar — este ticket é prefactoring puro, sem comportamento novo visível, que existe para dar ao ticket 02 um seam único e testado a reaproveitar (em vez de duplicar a mesma lógica de estado em dois componentes).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `dailyCallToActionState` existe em `engine/daily.ts`, exportada, cobrindo os 3 estados a partir de `DailyAttempts`
- [ ] Testes novos em `engine/daily.test.ts` (mesmo padrão table-driven das funções vizinhas: `canPlayDaily`, `canWatchExtraAd`, `hasFreeAttempt`) cobrindo os 3 estados e as transições entre eles
- [ ] `DailyChallengeScreen.tsx` usa `dailyCallToActionState` em vez do cálculo inline atual
- [ ] Verificação manual/visual (emulador) de que o texto renderizado pela `DailyChallengeScreen` é idêntico ao comportamento anterior, nos 3 estados
- [ ] `tsc --noEmit` limpo, `eslint .` sem problemas, suíte de testes passando
