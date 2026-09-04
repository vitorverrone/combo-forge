# 02 — Liga: leaderboard por Tier e Divisão

**What to build:** Quando a base de jogadores do Desafio Diário atingir massa crítica numa semana, o leaderboard único (top 10 + posição própria) dá lugar à Liga: o jogador vê seu Tier (Bronze/Prata/Ouro/Platina/Diamante) e sua Divisão (~30 dispositivos), com o ranking da própria Divisão em vez do ranking global, e sobe ou desce de Tier automaticamente ao fim de cada semana. Abaixo da massa crítica, a experiência atual continua inalterada.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Abaixo do limiar de massa crítica (~300 participantes na semana), a tela do Desafio Diário continua mostrando o leaderboard único existente, sem nenhuma mudança visível.
- [ ] Acima do limiar, a tela mostra o Tier e a Divisão do jogador, sua posição dentro da Divisão, e o ranking completo da Divisão (não mais o ranking global).
- [ ] Jogador que entra na Liga pela primeira vez sempre começa no Tier Bronze, sem seed pela pontuação de estreia.
- [ ] Ao fim de cada semana ISO, os 5 melhores colocados de cada Divisão sobem de Tier e os 5 piores descem — exceto Bronze (piso, sem descida) e Diamante (teto, sem subida; os melhores do Tier disputam entre si semana a semana).
- [ ] Empates exatamente na fronteira de subida/descida (rank "competition", igual ao leaderboard atual) movem todos os empatados juntos, mesmo que isso resulte em mais ou menos de 5 movimentos naquela semana.
- [ ] A resolução de Tier/Divisão de uma nova semana acontece de forma preguiçosa, na primeira consulta daquela semana — sem depender de job agendado.
- [ ] Nenhum item vendido ou recompensa desta feature afeta poder de jogo.
- [ ] A nova RPC (`get_league_leaderboard`) tem contrato espelhado em TypeScript, travado por valores dourados em testes de unidade e verificado contra um Postgres real, cobrindo: abaixo do limiar, jogador novo, resolução de subida/descida vinda da semana anterior, empate exato na fronteira, piso do Bronze e teto do Diamante.
