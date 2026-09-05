# Ligas e Sequência do Desafio Diário

O Desafio Diário hoje só tem leaderboard único (top 10 + posição própria, ADR 0001/0003) — funciona bem pra quem está perto do topo, mas é invisível pra maioria (comparação social só motiva quando o rival é alcançável). Decidimos por duas extensões de competição social nesta rodada de design (sessão de `/grill-with-docs`, 2026-09-04), mantendo o pilar ético do GDD: nada vendido afeta poder de jogo, recompensa de progressão é cosmética/textual.

## Decisão: Liga

Quando o Desafio Diário atingir massa crítica (~300 participantes numa semana ISO), o leaderboard único dá lugar a uma **Liga**: 5 **Tiers** nomeados (Bronze, Prata, Ouro, Platina, Diamante), cada um dividido em **Divisões** de ~30 dispositivos. Ao fim de cada semana, os 5 melhores de cada Divisão sobem de Tier e os 5 piores descem — exceto Bronze (piso, sem descida) e Diamante (teto, sem subida; os melhores do Tier disputam entre si semana a semana, sem "subir" a lugar nenhum). Empate na fronteira de subida/descida (herdando o ranking "competition" 1,1,3 já usado em `get_weekly_leaderboard`) move todos os empatados juntos, sem critério de desempate adicional — pode dar mais ou menos que 5 movimentos numa semana. Todo jogador novo entra em Bronze, sem seed pela pontuação de estreia. A recompensa de progressão de Tier é um novo eixo de Título (ADR 0009), sem item visual/cosmético novo.

> **Atualização (2026-09-05):** limiar baixado de ~300 para ~30 participantes/semana (`supabase/migrations/0005_league_threshold.sql`) — o jogo ainda não tinha lançado e não havia como estimar quanto tempo levaria pra acumular 300 participantes reais; com ~30 (igual a uma Divisão cheia), a Liga ativa assim que existir gente suficiente pra preencher uma única Divisão, em vez de ficar invisível por tempo indeterminado. Mesmo espírito do "Gatilho de revisão" abaixo: número de design revisitável, não travado por dado real.

Antes da massa crítica, o comportamento atual (leaderboard único) continua valendo — ver "Alternativas consideradas" pro motivo de não forçar Divisões desde o dia 1.

## Decisão: Sequência

O contador de **Sequência** soma 1 a cada dia (fronteira UTC, mesma de `daily_submissions.day`) em que o dispositivo submete qualquer pontuação ao Desafio Diário — sem piso de desempenho, sem distinguir tentativa grátis de tentativa via anúncio recompensado. Perder um dia zera o contador; não há congelamento/proteção nesta versão. Marcos de 3, 7, 15 e 30 dias geram novos Títulos — 7 e 30 propositalmente espelham as janelas de retenção D7/D30 do GDD §8, então o marco jogável funciona como proxy da métrica que a feature tenta mover.

## Alternativas consideradas

- **Divisões pequenas (~15) desde o lançamento**: mais "íntimo", mas dobra o número de divisões pra mesma população — atrasaria ainda mais a ativação da Liga com a base de jogadores pequena que um lançamento novo tem. Descartada.
- **Seed de Tier pela pontuação de estreia**: evitaria o jogador forte "perder tempo" subindo do zero, mas fere o pilar de Competência do GDD (mastery via desempenho sustentado, não uma run isolada) e exige uma heurística de calibração nova. Descartada.
- **Congelamento de Sequência** (proteção contra 1 falha): valor de retenção real e testado (Duolingo), mas adiciona um item de inventário novo inteiro (quantidade, quando ganha, quando gasta, exibição) — escopo de uma decisão de produto própria. Não descartada de vez, ver gatilho de revisão abaixo.
- **Notificação push de Sequência em risco**: é a peça que mais moveria D7/D30 na prática, mas exige uma capability nova (permissão de OS, SDK, UX de opt-in, agendamento) sem nenhuma infraestrutura de push hoje no projeto. Registrada como item pendente, possivelmente compartilhando infra com o "lembrete de pausa não-bloqueante" já sugerido pelo premortem de lançamento (`.scratch/premortem-lancamento/`).

## Fora de escopo desta rodada (backlog para ciclos futuros)

- Desafiar amigo via link (usando a mesma seed do dia)
- Lista de amigos / comparação por par — `device_id` não tem conta (ADR 0001/0005), então precisa resolver identidade entre dispositivos primeiro
- Season com reset e season pass cosmético (GDD §3, nunca especificado)
- Congelamento de Sequência (streak freeze)
- Notificação push de Sequência em risco
- Recompensa visual (moldura/borda) por Tier de Liga, como evolução futura do reconhecimento textual

## Gatilho de revisão

Mesmo padrão do ADR 0009: se a telemetria pós-lançamento mostrar Sequências quebrando majoritariamente por esquecimento (não abandono real — ex.: sessão anterior com boa pontuação/engajamento, mas nenhuma submissão no dia seguinte) acima de um limiar a definir, isso reabre o pipeline (`/grill-with-docs` → `/to-spec` → `/to-tickets`) pra avaliar congelamento de Sequência e/ou notificação push.

## Consequências

- `get_weekly_leaderboard` (e o schema em `supabase/migrations/`) precisa de uma tabela nova de atribuição Divisão/Tier por `device_id`, e de lógica de contagem de participantes pra decidir quando a Liga ativa.
- Sequência é um novo estado persistido — mesma disciplina de `save-systems` (schema/migração) que o campo `winsByForger` do ADR 0009 já seguiu.
- Perfil ganha exibição de Tier atual e Sequência atual, além dos Títulos já existentes.
- Este ADR fecha a decisão de design, não a implementação — segue para `/to-spec` → `/to-tickets` → `/implement` no pipeline normal.
