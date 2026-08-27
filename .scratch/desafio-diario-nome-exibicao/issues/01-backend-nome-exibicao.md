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

**Status:** done

- [x] Tabela `players` existe (chave `device_id`, coluna `display_name`)
- [x] `set_display_name(device_id, name)` grava o nome quando válido (3–16 caracteres; letras
      com acento, números e espaço; sem emoji/símbolo; fora da lista de termos proibidos) e
      rejeita com erro claro quando inválido em qualquer um desses critérios
- [x] `set_display_name` não exige unicidade — dois dispositivos podem ter o mesmo nome
- [x] `get_weekly_leaderboard` devolve o `display_name` de cada entrada do top 10 e da posição
      própria (fallback previsível quando o dispositivo ainda não tem nome cadastrado)
- [x] A migração zera `daily_submissions`
- [x] `supabase/contract.ts` espelha a lista de termos proibidos e a validação de formato;
      `verify-contract.mjs` compara nomes de teste (aceitos e rejeitados) contra o Postgres real

## Comments

Implementado em `feat/01-backend-nome-exibicao`, mergeado em `master`. `/code-review`
(Standards + Spec) rodou antes do merge — achados de Standards (ordem de fases da migração,
checagem de tamanho duplicada, e a lista de termos proibidos sem verificação de igualdade
exata entre SQL e o espelho TS) foram corrigidos; Spec não teve achados. `npm run verify:backend`
confirmado contra Postgres real via Docker — todas as 5 seções (seed, Nome de Exibição,
submissão, leaderboard, acesso anônimo) passaram, incluindo a comparação da lista de termos
proibidos inteira (33 termos, sem drift).
