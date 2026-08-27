# 01 — Backend: Nome de Exibição no ranking

**What to build:** Estender o backend do Desafio Diário (Supabase) para guardar um Nome de
Exibição por dispositivo e expor esse nome em cada entrada do ranking semanal. Nova tabela
`public.players` (chave `device_id`, coluna `display_name`), nova função `set_display_name`
(upsert com validação de formato e moderação contra uma lista de termos proibidos própria,
pt-br + en — a mesma lista que o cliente vai espelhar no ticket 02), e `get_weekly_leaderboard`
atualizada para fazer join em `players` e devolver o nome junto de cada posição (própria e top
10). A migração zera `daily_submissions` — o jogo ainda não foi lançado, sem dado legado a
preservar. Testável via API/Postgres real (Docker), sem depender do app.

**Blocked by:** Nenhum — pode começar imediatamente

**Status:** ready-for-agent

- [ ] Tabela `players` existe (chave `device_id`, coluna `display_name`)
- [ ] `set_display_name(device_id, name)` grava o nome quando válido (3–16 caracteres; letras
      com acento, números e espaço; sem emoji/símbolo; fora da lista de termos proibidos) e
      rejeita com erro claro quando inválido em qualquer um desses critérios
- [ ] `set_display_name` não exige unicidade — dois dispositivos podem ter o mesmo nome
- [ ] `get_weekly_leaderboard` devolve o `display_name` de cada entrada do top 10 e da posição
      própria (fallback previsível quando o dispositivo ainda não tem nome cadastrado)
- [ ] A migração zera `daily_submissions`
- [ ] `supabase/contract.ts` espelha a lista de termos proibidos e a validação de formato;
      `verify-contract.mjs` compara nomes de teste (aceitos e rejeitados) contra o Postgres real
