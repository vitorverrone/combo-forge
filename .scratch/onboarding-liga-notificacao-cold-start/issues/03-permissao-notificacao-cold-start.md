# 03 — Permissão de notificação no cold start (remove soft-ask)

**What to build:** substitui o soft-ask dentro do app (`PushSoftAskBanner`, ADR 0012 ticket 02, já em produção) por um pedido direto da permissão nativa do sistema operacional, disparado uma única vez no cold start absoluto da primeira sessão do app — sem nenhum card/banner do jogo antes ou depois. Instalações que já responderam ao soft-ask antigo não são reafetadas (o SO não reabre um prompt já decidido). A notificação de queda de Tier (ADR 0012, ticket 03 — job semanal) continua funcionando sem alteração para quem concedeu a permissão.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Removidos: `PushSoftAskState` e `shouldShowPushSoftAsk` (`engine/pushProvider.ts`); `acceptPushSoftAsk` e `declinePushSoftAsk` (`store/pushFlow.ts`); `PushSoftAskBanner` e seu uso (`components/DailyChallengeScreen.tsx`); as actions `acceptPushSoftAsk`/`declinePushSoftAsk` do `gameStore.ts` (incluindo `push.softAskState` da fatia `PushState`).
- [x] `PushFlowStorage` troca `loadSoftAskState`/`saveSoftAskState` (3 estados) por `hasRequestedPushPermission(): boolean` / `saveRequestedPushPermission(): void`.
- [x] Nova função `requestPushPermissionOnColdStart(deviceId: string, deps: PushFlowDeps): Promise<void>` em `store/pushFlow.ts`: se `storage.hasRequestedPushPermission()` for `true`, no-op. Senão, chama `provider.requestPermission()`; se `'granted'`, busca o token via `provider.getExpoPushToken()` e registra com `backend.registerToken`; ao final (concedida, negada, ou indisponível), sempre chama `storage.saveRequestedPushPermission()`. Nunca lança — mesmo contrato de falha-silenciosa dos outros providers.
- [x] `store/bootstrap.ts` (`initializeSqlitePersistence`) chama `void requestPushPermissionOnColdStart(deviceId, pushFlowDeps)` fire-and-forget, no mesmo ponto onde já dispara `void gameStore.getState().syncRemoveAdsEntitlement()` — roda antes de qualquer tela montar.
- [x] Listener de toque em notificação (`registerNotificationTapListener` → `openDaily`) continua funcionando sem alteração.
- [x] Testes: `store/pushFlow.test.ts` reescrito para `requestPushPermissionOnColdStart` — cenários de permissão concedida (registra token), negada (não registra, marca "já solicitado"), indisponível (idem), falha do backend ao registrar (best-effort, não quebra), e já solicitado antes (no-op, nenhuma chamada aos ports). Mesma estrutura de mocks já usada no arquivo (`makeFakePushBackend`, `createMemoryPushProvider`).
- [x] `engine/pushProvider.test.ts`: remove os testes de `shouldShowPushSoftAsk` (função removida, sem substituto).
- [x] `tsc --noEmit` limpo, `eslint .` sem problemas, suíte de testes passando.
- [ ] Verificação funcional real em emulador/simulador (prompt nativo aparece no primeiro launch, token registrado) — passo humano antes do próximo release, mesma ressalva já registrada no ticket original do ADR 0012 (`docs/release-checklist.md`).

## Comments

Implementado direto no `master` (sem branch própria — mesmo combinado dos tickets anteriores).

- `engine/pushProvider.ts`: removidos `PushSoftAskState`/`shouldShowPushSoftAsk` e o import de `LeagueStanding` que só servia a eles. `engine/pushProvider.test.ts` foi **deletado** (só testava a função removida, sem substituto — nada ficou órfão).
- `store/pushFlow.ts`: reescrito — `PushFlowStorage` agora é `hasRequestedPushPermission()`/`saveRequestedPushPermission()` (booleano); `PushState`/`PushFlowState`/`loadPushState` foram removidos por completo (sem UI observando progresso, não há mais estado de push no store); `requestPushPermissionOnColdStart(deviceId, deps)` é a função nova, best-effort e idempotente.
- `store/pushFlow.test.ts`: reescrito (9 testes: 7 pra `requestPushPermissionOnColdStart`, 2 pra `registerNotificationTapListener`, inalterado).
- `store/sqlite.ts`: `createSqlitePushFlowStorage` migrado pro par booleano, nova chave `combo-forge:push-permission-requested` (a antiga `combo-forge:push-soft-ask-state` fica órfã em instalações antigas — sem migração de dado, mesmo espírito de outras trocas de schema já feitas no projeto sem migração retroativa).
- `store/gameStore.ts`: removida a fatia `push: PushState` do `GameState` inteira (não só `softAskState`) — nada mais lê `get().pushProvider`/`pushBackend`/`pushStorage` fora da nova action; `pushFlowSlice` (helper que montava `PushFlowState`) também removido, `pushFlowDeps` ficou. Nova action `requestPushPermissionOnColdStart()`.
- `store/bootstrap.ts`: dispara `void gameStore.getState().requestPushPermissionOnColdStart()` fire-and-forget, logo depois de `syncRemoveAdsEntitlement()` — antes de qualquer tela montar (cold start absoluto, conforme decidido no grill).
- `components/DailyChallengeScreen.tsx`: removidos o componente `PushSoftAskBanner`, seu uso, os hooks `push`/`acceptPushSoftAsk`/`declinePushSoftAsk`, e os estilos `pushSoftAsk*` (8 entradas).
- `i18n/en.json`/`pt.json`: removidas as chaves `daily.pushSoftAskTitle/Body/Accept/Decline` e `a11y.acceptPushSoftAsk/declinePushSoftAsk` (JSON validado depois da edição).
- Decisão de design registrada no grill anterior a esta implementação: `pushProvider`/`pushBackend`/`pushStorage` continuam como campos do `GameState` (ainda usados por `registerNotificationTapListener` e pela nova action) — só a fatia `push` (estado reativo de UI) desapareceu.
