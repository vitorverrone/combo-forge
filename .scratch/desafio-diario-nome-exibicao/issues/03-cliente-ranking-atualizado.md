# 03 — Cliente: ranking sempre atualizado com nomes

**What to build:** A tela do Desafio Diário deixa de exigir um toque para ver o ranking: busca o
leaderboard semanal automaticamente ao entrar na tela, e busca de novo assim que uma pontuação é
submetida com sucesso ao fim de uma run. Remove o botão "ver ranking" e o gate manual — a seção
do ranking sempre aparece (carregando, com erro, ou preenchida). Cada posição do top 10 mostra o
Nome de Exibição do jogador ao lado do rank e da pontuação.

**Blocked by:** 01 — Backend: Nome de Exibição no ranking, 02 — Cliente: Nome de Exibição
obrigatório (para demonstrar de ponta a ponta é preciso um dispositivo com nome salvo, o que o
ticket 02 entrega)

**Status:** done

- [x] Abrir a tela do Desafio Diário busca o ranking semanal automaticamente, sem precisar tocar
      em nenhum botão
- [x] O botão "ver ranking" não existe mais
- [x] Enquanto o ranking carrega, um indicador de carregamento aparece no lugar da lista
- [x] Terminar uma run do dia (vitória ou derrota) e submeter a pontuação com sucesso dispara uma
      nova busca do ranking automaticamente
- [x] Uma submissão que falha não dispara nova busca do ranking
- [x] Cada entrada do top 10 mostra o Nome de Exibição correspondente
- [x] A posição própria continua visível (rank + pontuação), com o próprio nome
- [x] Falha ao buscar o ranking mostra erro sem travar o resto da tela — o Desafio Diário continua
      jogável mesmo se o ranking falhar ao carregar

## Comments

Implementado em `feat/03-cliente-ranking-atualizado`, mergeado em `master`. Corrigida de
passagem uma lacuna pré-existente: `fetchLeaderboard` só dava um `set()` no fim, depois do await
inteiro — `leaderboardLoading` nunca chegava a virar `true` de verdade na store. Adicionado um
`set()` intermediário antes do await; a mesma lacuna segue existindo (fora do escopo desta
ticket) em `daily.status`/`daily.adLoading` (`startDailyChallenge`/`watchAdForExtraAttempt`).

Verificado no emulador (duas AVDs — Pixel_9 e Pixel_Tablet): o modal de nome aparece, o fetch
automático do ranking dispara sozinho ao entrar na tela, e o estado de erro renderiza sem travar
a tela. **Não foi possível confirmar visualmente nomes aparecendo no ranking de verdade** — as
duas AVDs bateram no mesmo erro de TLS (`Trust anchor for certification path not found`) ao
tentar HTTPS pro Supabase, mesmo com DNS/ICMP funcionando normalmente — indica algo na rede desta
máquina (não no código; mesmo erro sistemático em dois emuladores diferentes). Isso validou de
graça o caminho de erro do fetch do ranking (mostra a mensagem, não trava a tela), mas não o
caminho de sucesso com nomes reais.

`/code-review` (Standards + Spec) rodou em paralelo desta vez (o limite de sessão da ticket 02
já tinha resetado). Spec sem achados. Standards: 1 achado de julgamento (o fix do loading
corrigiu só `fetchLeaderboard`, não os dois lugares estruturalmente idênticos) — mantido como
está, por ser exatamente o que a ticket pedia.
