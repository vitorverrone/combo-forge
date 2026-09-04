# 03 — Liga: Título de progressão de Tier

**What to build:** Jogador que atinge um novo Tier da Liga pela primeira vez (Prata, Ouro, Platina ou Diamante) ganha um Título permanente no Perfil, reconhecendo o progresso mesmo que seja rebaixado depois.

**Blocked by:** 02 — Liga: leaderboard por Tier e Divisão (precisa que a consulta ao Tier do jogador já exista para observar quando ele sobe).

**Status:** ready-for-agent

- [ ] Jogador que atinge Prata, Ouro, Platina ou Diamante pela primeira vez recebe um Título automaticamente (opção única, mesmo mecanismo dos Títulos existentes).
- [ ] Bronze não gera Título — é o Tier de entrada, não uma conquista.
- [ ] O Título permanece no Perfil mesmo que o jogador seja rebaixado de volta a um Tier inferior depois.
- [ ] O maior Tier já alcançado é registrado localmente e atualizado sempre que uma consulta à Liga revelar um Tier mais alto que o já registrado.
- [ ] Nenhum item vendido ou recompensa desta feature afeta poder de jogo.
- [ ] Testes cobrem os novos marcos de Título sobre um estado de progressão sintético (sem depender de uma consulta real à Liga).
