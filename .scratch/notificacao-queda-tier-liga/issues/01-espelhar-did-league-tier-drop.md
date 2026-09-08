# 01 — Espelhar `didLeagueTierDrop` no contrato TS

**What to build:** hoje `supabase/contract.ts` já espelha as regras de subida/descida de Tier da Liga (`promoteLeagueTier`, `demoteLeagueTier`), testadas com valores dourados em `supabase/contract.test.ts` e verificadas contra Postgres real via `npm run verify:backend`. Adicione uma função pura nova, `didLeagueTierDrop(prevTier: LeagueTier, nextTier: LeagueTier): boolean`, usando a mesma ordem de Tier (Bronze piso, Diamante teto) já usada pelas funções vizinhas. Este é um ticket de prefactoring puro — sem mudança visível em nenhuma tela ou endpoint — que existe pra dar ao job semanal (ticket 03) uma lógica de comparação já testada, em vez de reimplementá-la ali.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `didLeagueTierDrop` existe em `supabase/contract.ts`, exportada
- [ ] Testes com valores dourados em `supabase/contract.test.ts` cobrindo todos os pares de Tier — queda real, subida, mesmo Tier — e os extremos (Bronze não tem "abaixo", Diamante não tem "acima")
- [ ] `tsc --noEmit` limpo, `eslint .` sem problemas, suíte de testes passando
