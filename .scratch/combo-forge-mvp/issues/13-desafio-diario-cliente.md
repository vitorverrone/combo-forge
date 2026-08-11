# 13 — Desafio Diário (cliente)

**What to build:** O modo Desafio Diário no app: a mesma Run para todos os jogadores (seed completo vindo do backend, cobrindo embaralhamento e ofertas de Forja), DDA desligado (Metas fixas), 1 tentativa gratuita por dia + a possibilidade de 1 tentativa extra via anúncio (através de uma abstração de provider implementada pelo ticket 16), submissão da pontuação ao backend e ranking semanal opt-in com posição própria + top 10.

**Blocked by:** 07 — Motor: DDA e determinismo, 10 — Forja na UI, 12 — Backend Supabase

**Status:** ready-for-agent

- [ ] O seed do dia é baixado do backend e usado para gerar a Run completa de forma determinística (embaralhamento + ofertas de Forja/Relíquia)
- [ ] O DDA fica desligado no modo diário — Metas fixas e iguais para todos
- [ ] 1 tentativa gratuita por dia; a tentativa extra só é liberada pelo provider de anúncio (abstração; implementação real no ticket 16)
- [ ] Ao fim da Run, a pontuação final é submetida ao backend
- [ ] Tela de ranking semanal opt-in mostra a posição própria e o top 10, sem expor derrotas de ninguém
