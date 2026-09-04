# 01 — Fundação: `computeUnlocks` trata `kind: 'title'` + `normalizeProgression`

**What to build:** infraestrutura de suporte pros marcos "Título" (ADR 0009), sem nenhum marco novo ainda — verificável só por teste, invisível ao jogador nesta ticket. `UnlockKind` ganha uma variante `{ kind: 'title' }`; `computeUnlocks` (`engine/progression.ts`) para de tratar essa variante como se fosse `rareRelics` (bug latente: hoje o `else` final do loop assume que qualquer `unlock.kind` que não seja `'forger'`/`'forgeEffect'` é `'rareRelics'`, o que passaria a marcar `rareRelics: true` incorretamente assim que a primeira opção `kind: 'title'` existir). Uma nova função `normalizeProgression(state: PersistedProgression | null): PersistedProgression`, espelhando `normalizeShopState` (`engine/shop.ts`), mas com merge profundo em `stats` (não raso) — preparação pro campo `winsByForger` que a ticket 03 introduz em `ProfileStats`. Fica ligada em `store/bootstrap.ts`, no mesmo ponto onde `normalizeShopState(shopStorage.load())` já roda hoje pra Loja, substituindo `progression: saved ?? DEFAULT_PROGRESSION` sem normalização nenhuma.

**Blocked by:** None — pode começar imediatamente.

**Status:** done

- [x] `UnlockKind` (`engine/progression.ts`) ganha a variante `{ readonly kind: 'title' }`.
- [x] `computeUnlocks` trata `kind: 'title'` como no-op explícito (não adiciona a `forgers`/`extraEffects`, não marca `rareRelics: true`) — a lógica do switch foi extraída pra `applyUnlockKind(draft, unlock)`, testada direto com uma `UnlockKind` sintética `{ kind: 'title' }` (achado do code-review: `OPTION_INDEX` é privado e só existe a partir dos `MILESTONES` reais, não dava pra injetar uma `MilestoneOption` sintética sem essa extração).
- [x] `normalizeProgression(state, null)` retorna `DEFAULT_PROGRESSION`.
- [x] `normalizeProgression` com um `PersistedProgression` "antigo" (cast, sem `winsByForger` em `stats`) preserva o resto de `stats` e `claimedOptions` sem perdê-los.
- [x] `store/bootstrap.ts` usa `normalizeProgression(saved)` no lugar de `saved ?? DEFAULT_PROGRESSION`.
- [x] Typecheck, testes (`engine/progression.test.ts`) e lint passam — 455 testes, suíte inteira verde.
