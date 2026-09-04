# 01 — Sequência do Desafio Diário

**What to build:** Um contador de dias consecutivos jogando o Desafio Diário. Cada submissão de pontuação (tentativa grátis ou extra via anúncio) conta um dia; pular um dia zera o contador; o recorde histórico fica marcado permanentemente via Títulos automáticos nos marcos de 3, 7, 15 e 30 dias. A Sequência atual aparece na tela do Desafio Diário e na tela de Perfil.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Qualquer submissão de pontuação ao Desafio Diário (tentativa grátis ou via anúncio recompensado) soma a Sequência quando é a primeira submissão do dia (fronteira UTC).
- [ ] Resubmissão no mesmo dia (ex.: melhorando a própria pontuação com uma tentativa extra) não altera a Sequência.
- [ ] Pular um dia sem nenhuma submissão reinicia a Sequência atual em 1 na próxima submissão (não em 0) — sem congelamento ou proteção nesta versão.
- [ ] O recorde histórico da Sequência nunca decresce, mesmo depois de a Sequência atual zerar por um dia perdido.
- [ ] Títulos automáticos (opção única, mesmo mecanismo dos Títulos existentes) são concedidos na primeira vez que o recorde histórico atinge 3, 7, 15 e 30 dias.
- [ ] Um Título de Sequência já conquistado permanece no Perfil mesmo depois de a Sequência atual zerar.
- [ ] A tela do Desafio Diário e a tela de Perfil exibem a Sequência atual.
- [ ] Nenhuma notificação push é adicionada nesta feature — é só contador in-app.
- [ ] Testes cobrem: incremento (dia seguinte), reinício (dia pulado), idempotência (mesma data duas vezes) e recorde histórico não decrescente, além da fiação que aciona a checagem de Título logo após uma submissão bem-sucedida do Desafio Diário.
