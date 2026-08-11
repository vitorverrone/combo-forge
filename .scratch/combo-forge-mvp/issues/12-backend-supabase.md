# 12 — Backend Supabase

**What to build:** O projeto Supabase com o contrato mínimo do Desafio Diário (conforme ADR 0001 e a spec): servir o seed do dia (que cobre embaralhamento e ofertas de Forja/Relíquia), receber submissões de pontuação e devolver o leaderboard semanal (posição própria + top 10). Testável via API, independentemente do app.

**Blocked by:** 01 — Scaffolding do projeto

**Status:** ready-for-agent

- [ ] Entidades do backend para seed diário, submissões e leaderboard semanal existem
- [ ] O endpoint de seed retorna o seed do dia de forma determinística para todos os jogadores
- [ ] O endpoint de submissão registra a pontuação (uma por tentativa válida por dia)
- [ ] O leaderboard semanal devolve a posição própria + top 10
- [ ] URL e chaves de acesso estão documentadas como variáveis de ambiente (nada hardcoded)
