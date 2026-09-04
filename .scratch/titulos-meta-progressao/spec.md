# Combo Forge: Títulos — segunda camada de Meta-Progressão

Status: ready-for-agent

## Problem Statement

Os 4 marcos de Meta-Progressão (`engine/progression.ts`) se esgotam por volta da 5ª Run vencida — dia 4–5 de uso típico. O premortem de lançamento (`.scratch/premortem-lancamento/`, deep dive #4 "Conteúdo esgota antes do D30") apontou isso como um dos 8 modos de falha: depois do último marco (recorde ≥ 2.500 pts), não sobra nenhum gancho de progressão pra justificar reabrir o app, e as metas de retenção D7 (16–20%) e D30 (6–9%) do GDD dependem de conteúdo que sustente esse retorno.

## Solution

Adicionar 10 **Títulos** — marcos de Meta-Progressão cosméticos (texto exibido no Perfil, sem afetar poder de jogo), reempacotando estatísticas de perfil já rastreadas (`runsWon`, `bestRunScore`, `maxMultiplier`, `cardPlays`) em 5 eixos de maestria, mais uma stat nova (`winsByForger`) pro eixo de maestria de Forjador. Os 4 marcos de poder originais não mudam. ADR 0009 (`docs/adr/0009-titulos-meta-progressao.md`) documenta a decisão, incluindo o gatilho numérico de revisão pós-lançamento. Total: 14 marcos.

## User Stories

1. Como jogador, eu quero ganhar um Título ao vencer minha 10ª Run, para que eu tenha um próximo objetivo assim que os marcos de poder originais (que terminam na 5ª Run) se esgotarem.
2. Como jogador, eu quero ganhar um Título ao vencer minha 15ª Run, para que a curva de Meta-Progressão continue além da 10ª.
3. Como jogador, eu quero ganhar um Título ao vencer minha 25ª Run, para que jogadores muito engajados ainda tenham um marco de vitórias em aberto bem depois da primeira semana.
4. Como jogador, eu quero ganhar um Título ao bater 4.000 pontos numa única Run, para que meu recorde de pontuação continue tendo um próximo degrau depois dos 2.500 do marco original.
5. Como jogador, eu quero ganhar um Título ao bater 6.000 pontos numa única Run, para que a curva de recorde de pontuação continue esticando.
6. Como jogador, eu quero ganhar um Título ao bater 9.000 pontos numa única Run, para que builds muito otimizadas tenham um objetivo de recorde ainda mais alto.
7. Como jogador, eu quero ganhar um Título ao alcançar Multiplicador de Combo ×8 numa Jogada, para que o crescimento do Multiplicador — hoje só rastreado no Perfil sem nenhum marco — vire um objetivo de Meta-Progressão.
8. Como jogador, eu quero ganhar um Título ao alcançar Multiplicador de Combo ×12 numa Jogada, para que exista um segundo degrau de maestria de Multiplicador acima do ×8.
9. Como jogador, eu quero ganhar um Título ao vencer ao menos uma Run com cada um dos 3 Forjadores (Aprendiz, Martelo, Bigorna), para que experimentar os 3 estilos de build vire um objetivo reconhecido, não só uma escolha de tela inicial.
10. Como jogador, eu quero ganhar um Título ao jogar cada uma das 40 cartas do Baralho ao menos uma vez (em qualquer Jogada, em qualquer Run), para que explorar o Baralho inteiro — não só as combinações mais óbvias — vire um objetivo reconhecido.
11. Como jogador, eu quero ver meus Títulos conquistados listados na tela de Perfil junto com os marcos de poder, para que eu tenha visibilidade de tudo que já desbloqueei e do que falta — sem precisar de uma tela nova só pra isso.
12. Como jogador, eu quero ver um banner de "novo desbloqueio" ao final de uma Run em que ganhei um Título, no mesmo lugar onde já vejo esse banner para Forjador/Efeito de Forja/Relíquias raras, para que a recompensa seja percebida no momento em que foi conquistada.
13. Como jogador que já tinha progresso salvo antes desta atualização (sem a stat `winsByForger`), eu quero que meu save carregue normalmente com `winsByForger` zerado para os 3 Forjadores, para que a atualização não corrompa nem resete meu progresso existente.
14. Como jogador, eu quero que vencer uma Run com um Forjador que eu já tinha vencido antes não quebre nem duplique o registro de maestria daquele Forjador, para que a contagem continue correta independente de quantas vezes eu repito o mesmo Forjador.
15. Como jogador, eu quero que perder uma Run não conte pra maestria de Forjador (só vitórias contam), para que o Título reflita genuinamente "venci com os 3", não "tentei com os 3".
16. Como jogador, eu quero que jogar a mesma carta várias vezes não acelere nem atrapalhe a maestria de Baralho além de marcá-la como jogada, para que o objetivo seja genuinamente "todas as 40 cartas", não uma contagem de repetições.
17. Como jogador que joga em português, eu quero que o nome e a descrição de cada Título novo apareçam traduzidos, no mesmo padrão dos marcos existentes, para que a experiência continue consistente com o resto do app.
18. Como product owner, eu quero que ganhar qualquer um dos 10 Títulos novos dispare o evento de telemetria `milestone_unlocked` já existente (ADR 0007/ticket 03) com o `milestoneId` correto, para que eu consiga medir, com dado real pós-lançamento, quantas Runs os jogadores levam até esgotar os 14 marcos — sem precisar instrumentar nada novo.

## Implementation Decisions

- **`engine/progression.ts` é o único módulo que muda de fato** (seam mais alto e único proposto — `ProfileScreen.tsx`, `RunWonScreen.tsx`, `RunLostScreen.tsx` e `UnlockChoiceModal.tsx` já renderizam `MILESTONES`/`recentUnlocks` de forma genérica por id + i18n, e continuam funcionando sem alteração):
  - `MILESTONES` ganha 10 entradas novas, cada uma com uma única `MilestoneOption` (mesma forma dos 3 marcos de opção única já existentes — sem escolha de ordem, reivindicação automática via `claimReachedSingles`).
  - `UnlockKind` ganha uma variante nova: `{ kind: 'title' }` (sem payload — o Título em si já é o `title`/descrição da `MilestoneOption`, não desbloqueia nenhum conteúdo de jogo consumido em runtime).
  - **Correção necessária em `computeUnlocks`**: o loop hoje resolve `unlock.kind` com um if/else de 3 ramos onde o `else` final assume `rareRelics` — correto hoje porque só existem 3 kinds, mas passaria a marcar `rareRelics: true` incorretamente para qualquer opção `kind: 'title'` reivindicada. Precisa de um ramo explícito pra `'title'` que não altera `UnlocksState` (no-op).
  - `ProfileStats` ganha o campo `winsByForger: Readonly<Record<ForgerId, number>>`, com `DEFAULT_PROFILE_STATS` inicializando os 3 Forjadores em 0.
  - `recordRunEnd` ganha um parâmetro `forger: ForgerId`, incrementando `winsByForger[forger]` quando `won` é true (e não alterando em derrota).
  - Nova função `normalizeProgression(state: PersistedProgression | null): PersistedProgression`, espelhando `normalizeShopState` (`engine/shop.ts`) — mas com uma diferença: como `winsByForger` fica aninhado dentro de `stats`, um merge raso (`{...DEFAULT_PROGRESSION, ...state}`, o padrão usado em `normalizeShopState` porque `PersistedShop` é um objeto plano) não bastaria — precisa mesclar `stats` também: `{...DEFAULT_PROGRESSION, ...state, stats: {...DEFAULT_PROFILE_STATS, ...state?.stats}}`.
  - Condição de maestria de Baralho (`deckMastery`): `Object.keys(stats.cardPlays).length >= 40` — reusa a chave `naipe:valor` já usada por `cardPlays`, sem stat nova.
- **`store/gameStore.ts`**: o call site de `recordRunEnd` dentro de `advanceProgression` passa `result.run.forger` (já disponível em `RunState.forger`) como o novo parâmetro.
- **`store/bootstrap.ts`**: o carregamento da meta-progressão (`progression: saved ?? DEFAULT_PROGRESSION`, hoje sem normalização) passa a ser `progression: normalizeProgression(saved)`, no mesmo ponto onde `normalizeShopState(shopStorage.load())` já roda para a Loja — cobre saves gravados antes desta mudança, que não têm `winsByForger`.
- **`i18n/en.json` e `i18n/pt.json`**: entradas `milestones.<id>.title`, `milestones.<id>.description` e `milestoneOptions.<id>.title` para os 10 marcos novos — copy em inglês no `en.json` (texto de jogo, ver `CLAUDE.md` raiz) e tradução em `pt.json`, seguindo o padrão dos marcos existentes.
- **Sem UI nova**: nenhuma tela, modal ou seção nova — só as 10 entradas em `MILESTONES` fluindo pelos componentes já existentes.
- **`docs/agents/domain.md`/`CONTEXT.md`**: já atualizado nesta sessão (termo "Título" + reescrita de "Meta-Progressão"), não faz parte deste ticket de implementação.

## Testing Decisions

- Um bom teste verifica comportamento externo: dado um `PersistedProgression`/`ProfileStats` de entrada, verifica-se a condição do marco, o `UnlocksState` derivado ou o resultado de `recordRunEnd`/`normalizeProgression` — nunca detalhe de como o loop de `computeUnlocks` está estruturado internamente.
- Seam primário — `engine/progression.test.ts` (mesmo arquivo que já testa os 4 marcos originais):
  - Cada um dos 10 marcos novos: condição falsa antes do limiar, verdadeira no limiar exato e acima dele (mesmo padrão dos testes existentes de `scoreRecord2500`).
  - `computeUnlocks` com uma opção `kind: 'title'` reivindicada não marca `rareRelics: true` nem adiciona a `forgers`/`extraEffects` — regressão direta do bug latente descrito acima.
  - `recordRunEnd` incrementa `winsByForger[forger]` só em vitória, nunca em derrota; vencer duas vezes com o mesmo Forjador incrementa (não duplica um registro booleano) — e a condição do marco de maestria de Forjador (`Object.values(winsByForger).every((count) => count > 0)`, ou equivalente) é testada com 0, 1 e 3 Forjadores já vencidos.
  - `deckMastery`: condição falsa com 39 cartas distintas jogadas, verdadeira com as 40.
  - `normalizeProgression`: `null` vira `DEFAULT_PROGRESSION`; um `PersistedProgression` antigo (cast, sem `winsByForger` em `stats`) recebe o default `{apprentice: 0, hammer: 0, anvil: 0}` sem perder o resto de `stats` nem `claimedOptions` — mesmo formato do teste existente `normalizeShopState aplica default false a saves antigos sem adsRemoved` (`engine/shop.test.ts`).
- Seam secundário, fino — `store/gameStore.test.ts`: uma Run vencida com um Forjador específico (via `chooseForger`) reflete o `forger` certo em `progression.stats.winsByForger` no estado final — regressão de fiação, mesmo padrão usado no ticket 02 pra `runsStartedCount`/`lastRunLostAt`.
- Fora do teste automatizado: cópia i18n (`en.json`/`pt.json`) — mesmo tratamento que o resto da cópia de marcos existente, sem suíte de tradução no projeto.
- Prior art: `engine/progression.test.ts` (marcos existentes), `engine/shop.test.ts` (`normalizeShopState`), `store/gameStore.test.ts` (regressões de fiação do ticket 02).

## Out of Scope

- **Conteúdo mecânico novo** (relíquias, Efeitos de Forja ou um 4º Forjador adicionais) — alternativa descartada no ADR 0009; não faz parte desta spec.
- **Emblema (ícone) por Título** — só texto; nenhuma produção de arte nova (`create-game-assets`) entra nesta spec.
- **Título ativo/equipável** — os Títulos só aparecem listados no Perfil (já existente); não há conceito de destacar um Título fora dessa lista.
- **Extensão do eixo de vitórias além da 25ª Run, ou de qualquer outro eixo** — se o gatilho de revisão do ADR 0009 disparar (mediana de Runs vencidas até os 14 marcos abaixo de 30), isso abre um novo ciclo pelo pipeline, não uma extensão automática aqui.
- **Mudança no `docs/release-checklist.md`** — esta spec não introduz nenhuma dependência externa (SDK, conta, aprovação de loja) que precise de checklist novo.

## Further Notes

- **Base de design:** ADR 0009 (`docs/adr/0009-titulos-meta-progressao.md`) registra a decisão do grilling, incluindo as alternativas descartadas e o gatilho numérico de revisão pós-lançamento.
- **Origem:** premortem de lançamento (`.scratch/premortem-lancamento/premortem-transcript-20260903-162414.md`), deep dive #4.
- **Sinergia com a telemetria já implementada** (`.scratch/telemetria-minima/`): o evento `milestone_unlocked` já emite `milestoneId`, correlacionável a `run_started` pelo mesmo `device_id` — a mediana de Runs até esgotar os 14 marcos (o próprio gatilho de revisão do ADR 0009) já é derivável dos dados sem nenhuma instrumentação nova.
