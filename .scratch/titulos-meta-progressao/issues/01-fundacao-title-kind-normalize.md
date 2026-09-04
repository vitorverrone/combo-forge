# 01 — Fundação: `computeUnlocks` trata `kind: 'title'` + `normalizeProgression`

**What to build:** infraestrutura de suporte pros marcos "Título" (ADR 0009), sem nenhum marco novo ainda — verificável só por teste, invisível ao jogador nesta ticket. `UnlockKind` ganha uma variante `{ kind: 'title' }`; `computeUnlocks` (`engine/progression.ts`) para de tratar essa variante como se fosse `rareRelics` (bug latente: hoje o `else` final do loop assume que qualquer `unlock.kind` que não seja `'forger'`/`'forgeEffect'` é `'rareRelics'`, o que passaria a marcar `rareRelics: true` incorretamente assim que a primeira opção `kind: 'title'` existir). Uma nova função `normalizeProgression(state: PersistedProgression | null): PersistedProgression`, espelhando `normalizeShopState` (`engine/shop.ts`), mas com merge profundo em `stats` (não raso) — preparação pro campo `winsByForger` que a ticket 03 introduz em `ProfileStats`. Fica ligada em `store/bootstrap.ts`, no mesmo ponto onde `normalizeShopState(shopStorage.load())` já roda hoje pra Loja, substituindo `progression: saved ?? DEFAULT_PROGRESSION` sem normalização nenhuma.

**Blocked by:** None — pode começar imediatamente.

**Status:** ready-for-agent

- [ ] `UnlockKind` (`engine/progression.ts`) ganha a variante `{ readonly kind: 'title' }`.
- [ ] `computeUnlocks` trata `kind: 'title'` como no-op explícito (não adiciona a `forgers`/`extraEffects`, não marca `rareRelics: true`) — com teste cobrindo uma `MilestoneOption` sintética `kind: 'title'` reivindicada.
- [ ] `normalizeProgression(state, null)` retorna `DEFAULT_PROGRESSION`.
- [ ] `normalizeProgression` com um `PersistedProgression` "antigo" (cast, sem `winsByForger` em `stats` — ainda que o campo só exista de fato a partir da ticket 03, o teste desta ticket já cobre o merge profundo com um `stats` parcial arbitrário) preserva o resto de `stats` e `claimedOptions` sem perdê-los.
- [ ] `store/bootstrap.ts` usa `normalizeProgression(saved)` no lugar de `saved ?? DEFAULT_PROGRESSION`.
- [ ] Typecheck, testes (`engine/progression.test.ts`, e os testes existentes de `store/bootstrap.ts` se houver) e lint passam.
