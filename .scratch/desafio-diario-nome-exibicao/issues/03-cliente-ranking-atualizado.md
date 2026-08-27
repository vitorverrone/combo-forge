# 03 — Cliente: ranking sempre atualizado com nomes

**What to build:** A tela do Desafio Diário deixa de exigir um toque para ver o ranking: busca o
leaderboard semanal automaticamente ao entrar na tela, e busca de novo assim que uma pontuação é
submetida com sucesso ao fim de uma run. Remove o botão "ver ranking" e o gate manual — a seção
do ranking sempre aparece (carregando, com erro, ou preenchida). Cada posição do top 10 mostra o
Nome de Exibição do jogador ao lado do rank e da pontuação.

**Blocked by:** 01 — Backend: Nome de Exibição no ranking, 02 — Cliente: Nome de Exibição
obrigatório (para demonstrar de ponta a ponta é preciso um dispositivo com nome salvo, o que o
ticket 02 entrega)

**Status:** ready-for-agent

- [ ] Abrir a tela do Desafio Diário busca o ranking semanal automaticamente, sem precisar tocar
      em nenhum botão
- [ ] O botão "ver ranking" não existe mais
- [ ] Enquanto o ranking carrega, um indicador de carregamento aparece no lugar da lista
- [ ] Terminar uma run do dia (vitória ou derrota) e submeter a pontuação com sucesso dispara uma
      nova busca do ranking automaticamente
- [ ] Uma submissão que falha não dispara nova busca do ranking
- [ ] Cada entrada do top 10 mostra o Nome de Exibição correspondente
- [ ] A posição própria continua visível (rank + pontuação), com o próprio nome
- [ ] Falha ao buscar o ranking mostra erro sem travar o resto da tela — o Desafio Diário continua
      jogável mesmo se o ranking falhar ao carregar
