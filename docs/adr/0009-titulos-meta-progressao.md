# Títulos — segunda camada de Meta-Progressão

O premortem de lançamento (2026-09-03, `.scratch/premortem-lancamento/`, deep dive #4 "Conteúdo esgota antes do D30") apontou que os 4 marcos originais de Meta-Progressão (`engine/progression.ts`) se esgotam por volta da 5ª Run vencida — dia 4–5 de uso típico —, muito antes da janela de retenção D30 (6–9%) que o GDD mira. Depois do último marco (recorde ≥ 2.500 pts), não sobra nenhum gancho de progressão pra justificar reabrir o app.

## Decisão

Os 4 marcos de poder originais não mudam. Somam-se 10 **Títulos** — marcos cosméticos (texto no Perfil, sem afetar poder de jogo), reivindicados automaticamente ao fim da Run, sempre de opção única. Total: 14 marcos.

Optamos por reempacotar dados já rastreados (`runsWon`, `bestRunScore`, `maxMultiplier`, `cardPlays`) em vez de desenhar conteúdo mecânico novo (relíquias/efeitos/Forjador adicionais): mais barato — zero balanceamento e zero arte nova —, e ainda serve ao pilar de Competência do GDD ("estatísticas de perfil visíveis... feedback de competência"), já que os Títulos são literalmente essas estatísticas viradas em marco.

Os 10 Títulos, em 5 eixos:

| Eixo | Marcos | Stat |
|---|---|---|
| Vitórias | 10ª, 15ª, 25ª Run vencida | `runsWon` |
| Recorde de pontuação | 4.000, 6.000, 9.000 pts numa Run | `bestRunScore` |
| Multiplicador de Combo | ×8, ×12 numa Jogada | `maxMultiplier` |
| Maestria de Forjador | Vencer 1 Run com cada um dos 3 Forjadores | `winsByForger` (stat nova) |
| Maestria de Baralho | Jogar as 40 cartas do Baralho ao menos 1× cada | derivado de `cardPlays` |

## Alternativas consideradas

- **Conteúdo mecânico novo** (mais relíquias, Efeitos de Forja, um 4º Forjador) como recompensa dos marcos extras: mais fiel ao pilar de Competência na letra ("desbloqueio de cartas e relíquias"), mas exige balanceamento e produção de arte/copy antes do `/implement` — escopo bem maior pra um mitigador de premortem. Descartada por ora; nada impede que uma extensão futura da curva (ver gatilho de revisão abaixo) volte a essa opção.
- **Emblema (ícone) em vez de Título (texto)**: mesma ideia, mas com arte nova por marco — adiciona uma dependência de `create-game-assets` que atrasaria o `/implement`. Descartada; texto cobre o mesmo feedback de competência sem essa dependência.
- **Título ativo escolhível** (o jogador escolhe qual Título fica em destaque): adiciona uma mecânica de seleção e um lugar de exibição fora do Perfil — escopo de UI maior sem ganho claro sobre só listar os Títulos conquistados. Descartada.

## Gatilho de revisão

O ADR-0004 original "aceitou um risco pra revisitar depois" (clique acidental no banner) sem nenhum gatilho real de revisão, e essa revisão nunca aconteceu — foi o próprio premortem que forçou a correção (ADR-0008). Pra não repetir o padrão aqui: se a telemetria pós-lançamento (`milestone_unlocked` já emite `milestoneId`, correlacionável a `run_started` pelo mesmo `device_id` — ADR 0007) mostrar que a **mediana de Runs vencidas até reivindicar os 14 marcos fica abaixo de 30**, isso sinaliza que o conteúdo ainda esgota cedo demais pra sustentar D30 — abre-se um novo ciclo pelo pipeline (`/grill-with-docs` → `/to-spec` → `/to-tickets`) pra esticar a curva de novo, incluindo reconsiderar a alternativa de conteúdo mecânico novo descartada acima.

## Consequências

- `ProfileStats` (`engine/progression.ts`) ganha o campo novo `winsByForger` — como é campo novo num estado persistido (SQLite via `store/sqlite.ts`), passa pela disciplina de `save-systems` (schema/migração) na implementação.
- Os 10 Títulos são `Milestone`s de opção única (mesma forma dos 3 marcos de opção única já existentes), reivindicados por `claimReachedSingles` sem nenhuma mudança de mecanismo.
- A tela de Perfil ganha uma lista dos Títulos conquistados (troféu simples, sem "título ativo").
