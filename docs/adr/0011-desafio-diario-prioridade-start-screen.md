# Desafio Diário em destaque na Start Screen

O Desafio Diário hoje divide a Start Screen com o botão de Run normal, mas em segundo plano — botão secundário, sem destaque, com só um contador de tentativas como pista. Decidimos (sessão de `/grill-with-docs`, 2026-09-08) inverter essa hierarquia: o Desafio Diário passa a ter um **painel** próprio, entre o leque de cartas e o seletor de Forjador, mostrando tentativas restantes e Sequência atual (quando > 0); o botão "Iniciar Run" perde o destaque dourado e vira secundário. A motivação é retenção D7/D30 (GDD §8) — o Desafio Diário é o mecanismo estrutural de retorno recorrente do jogo (seed único por dia, ranking semanal, Sequência), então merece ser a primeira ação sugerida ao abrir o app, mesmo pra quem nunca completou uma Run. O onboarding (que já ensina o loop principal via Run normal) continua intacto — só muda o que domina visualmente depois dele.

## Considered Options

- **Troca simples de cor entre os botões existentes**, sem painel dedicado — mais barata, mas sem espaço pra crescer quando Sequência/Tier de Liga (ADR-0010) ganharem mais destaque textual/visual no futuro. Descartada.
- **Aplicar a hierarquia nova só depois da 1ª Run completa** (o jogador "graduaria" pro destaque no Daily) — mais gradual, mas adiciona um estado de progressão novo sem ganho claro: quanto mais cedo o jogador souber que existe motivo pra voltar amanhã, melhor pro D7. Descartada.
- **Incluir Tier de Liga no painel** — exigiria uma chamada de rede nova só pra popular a Start Screen (hoje esse dado só é buscado ao abrir a `DailyChallengeScreen`). Adiado, não descartado.
- **Estender a mesma prioridade às telas de fim de Run** (`RunWonScreen`/`RunLostScreen`) — outro ponto de contato natural pra retenção, mas com perguntas de design próprias (antes ou depois do intersticial? só se ainda não jogou o Daily hoje?). Fica pra uma iteração futura separada, não descartada.

## Consequences

- `components/StartScreen.tsx` ganha um painel novo do Desafio Diário entre o leque de cartas e o seletor de Forjador; o botão de Run normal perde a cor dourada e vira secundário.
- O painel reaproveita `dailyAttemptsForDay` e `progression.stats.dailyStreakCurrent`, ambos já presentes no store — nenhuma chamada de rede nova na Start Screen.
- O texto do painel varia entre os 3 estados que `DailyChallengeScreen` já calcula (tentativa grátis pronta / tentativa extra pronta / pode assistir anúncio por outra); o toque sempre navega pra `DailyChallengeScreen`, nunca dispara o anúncio direto da Start Screen.
- Nomenclatura: o elemento é chamado de "painel" em pt-br (docs, ADRs, specs) — nunca "card"/"cartão" — porque "Carta" já é termo reservado no glossário pra carta de baralho. No código, o identificador em inglês (ex.: `DailyChallengeCard`) segue a convenção normal de nomes de componente e não colide, já que código é em inglês.
- Fora de escopo desta rodada: `RunWonScreen`/`RunLostScreen`, Tier de Liga no painel — ambos ficam de backlog pra ciclos futuros.
