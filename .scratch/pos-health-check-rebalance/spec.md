# Combo Forge: Onboarding e Rebalance pós Health-Check

Status: ready-for-agent

## Problem Statement

O health-check de 2026-08-28 (desk-review com 3 subagents — Veterano, Novato, Analista; `docs/playtest/health-check-2026-08-28.md`) achou dois problemas reais e independentes que ameaçam as metas de retenção da GDD (D1 40–45%, D7 16–20%, D30 6–9%):

- Jogadores novatos não entendem as regras a tempo da primeira derrota. O app já tem toque-pra-selecionar e um tutorial de 4 passos (`OnboardingOverlay`), mas o tutorial nunca lista o bônus de cada Padrão nem explica por que a Meta cresce a cada Rodada — e essas informações também não estão disponíveis durante o jogo em si, só num preview genérico de nome do Padrão.
- Jogadores experientes resolvem o jogo em poucas Runs. O Multiplicador de Combo escala exponencialmente enquanto o DDA só ajusta a Meta em ±10%, e o Forjador Bigorna é estritamente melhor que os outros dois — não existe escolha real de arquétipo nem desafio sustentado. Um achado adicional (não estava no relatório original): o próprio boost de Relíquia rara do DDA alimentava esse desequilíbrio, favorecendo a Relíquia mais forte de Multiplicador de Combo exatamente quando o jogador já estava numa sequência de vitórias fáceis.

## Solution

Duas frentes independentes, em branches paralelas (decisão de sequenciamento desta sessão de grilling — ver Further Notes):

- **P0 — Onboarding**: fechar os gaps de conteúdo do tutorial existente (lista de Padrões com bônus, explicação da Meta) e dar aos jogadores uma referência de Padrões acessível a qualquer momento da Run, não só na primeira abertura do app. Documentar na GDD a UI e o tutorial que já existem no código mas não estão descritos lá.
- **P1 — Balance**: reduzir os multiplicadores mais fortes na fonte (Chain Reaction, Forjador Bigorna), corrigir o loop onde o boost de Relíquia rara do DDA alimentava esse mesmo outlier, tornar o DDA assimétrico a favor de conter vitórias fáceis, e dar aos três Forjadores identidades de build genuinamente diferentes.

Os números e o racional completo desta frente já foram travados numa sessão de `/grilling` e registrados em `docs/adr/0006-rebalance-p1-pos-health-check.md` e no `CONTEXT.md` atualizado — esta spec implementa o que já está decidido ali, não reabre as decisões.

## User Stories

1. Como jogador novato, eu quero ver, no passo de padrões do tutorial, os 7 Padrões com o que os forma e quantos pontos cada um vale, para saber de onde vem minha pontuação assim que eu jogar minha primeira Trinca.
2. Como jogador novato, eu quero, no passo final do tutorial, entender que a Meta cresce a cada Rodada, para não me surpreender quando uma Rodada que antes era fácil fica mais difícil.
3. Como jogador, eu quero um ícone de referência sempre visível na tela de jogo que abre a lista dos 7 Padrões com composição e bônus, para consultar a qualquer momento durante uma Run, não só na primeira vez que abro o app.
4. Como jogador, eu quero que a lista de Padrões mostrada no tutorial e no modal de referência seja sempre consistente com os bônus reais do motor, para nunca ver um número que não bate com o que realmente pontuei.
5. Como leitor da GDD, eu quero que ela documente a UI de seleção de cartas (toque, botões Jogar/Descartar/Limpar) e o tutorial de onboarding existente, para que o documento reflita o app real.
6. Como jogador experiente, eu quero que a Relíquia Chain Reaction cresça o Multiplicador de Combo num passo menor, para que uma única oferta de sorte não resolva a Run sozinha.
7. Como jogador experiente, eu quero que o Forjador Bigorna comece a Run com um Multiplicador de Combo inicial menor, para que escolher Bigorna não seja estritamente melhor que os outros Forjadores.
8. Como jogador, eu quero que o Forjador Aprendiz ganhe uma carta extra na Mão, para ter uma identidade própria de build (mais opções de Padrão) em vez de nenhum efeito.
9. Como jogador, eu quero que o Forjador Martelo dobre seu bônus de Trinca, para que perseguir esse Padrão seja uma estratégia de especialista que compensa.
10. Como jogador em sequência de vitórias fáceis, eu quero que a Meta suba mais rápido do que hoje, para que o DDA feche mais rápido o gap aberto por builds fortes.
11. Como jogador que falha a mesma Rodada repetidamente, eu quero que a redução da Meta continue igual a hoje, para não tornar Rodadas travadas fáceis demais.
12. Como jogador em sequência de vitórias fáceis, eu quero que o boost de Relíquia rara não favoreça Relíquias de categoria Combo, para que o próprio DDA não me ofereça o item que mais acelera o desequilíbrio bem na hora em que eu já estou ganhando fácil.
13. Como jogador do Desafio Diário, eu quero que o RNG determinístico de ofertas de Forja continue produzindo a mesma sequência para o mesmo seed mesmo com a exclusão de categoria Combo do boost, para que o ranking semanal continue justo (ADR 0003).
14. Como maintainer, eu quero que a exclusão de Relíquias de categoria Combo do boost de raridade seja coberta por teste, para que esse comportamento não seja revertido por acidente numa refatoração futura.

## Implementation Decisions

- **Costura confirmada com o usuário**: uma nova constante de descrição de composição por Padrão em `engine/patterns.ts` (ao lado de `PATTERN_BONUS` já existente) é a fonte única consumida tanto pelo tutorial quanto pelo modal de referência — evita duas listas hardcoded divergentes e é testável pela mesma costura de motor puro já usada no repo.
- `engine/patterns.ts`: nova constante mapeando cada `PatternKind` a uma descrição curta de composição (ex.: Trinca → "3 cartas do mesmo valor"), ao lado de `PATTERN_BONUS`.
- `components/OnboardingOverlay.tsx`: passo `scorePattern` passa a renderizar a lista completa dos 7 Padrões (nova constante + `PATTERN_BONUS`) em vez do exemplo único de Par; passo `beatTarget` ganha uma frase explicando que a Meta cresce por Rodada.
- Novo componente de modal de referência de Padrões, aberto por um ícone "?" persistente em `components/GameScreen.tsx`, reaproveitando o padrão visual de modal já usado em `UnlockChoiceModal`. Lista os 7 Padrões com composição e bônus; sem estado além de aberto/fechado.
- `GDD_Combo_Forge.md`: nova seção (ou subseção do Core Gameplay Loop) documentando a interação real — toque pra selecionar 1–5 cartas, botões Jogar/Descartar/Limpar, e o tutorial de 4 passos do onboarding.
- Sem versionamento da flag `combo-forge:onboarding-seen` — app ainda não tem usuários reais, só builds de teste.
- `engine/relics.ts`: `comboGrowth.step` da Relíquia `combo-plus` (Chain Reaction) muda de 2 para 1.5.
- `engine/forgers.ts`: Relíquia de largada do Forjador `anvil` (Bigorna) muda `comboStart.multiplier` de 2 para 1.5; Relíquia de largada do Forjador `hammer` (Martelo) muda `pattern.bonus` de 10 para 20; Forjador `apprentice` (Aprendiz) ganha uma Relíquia de largada nova (`effect: { kind: 'handSize', amount: 1 }`) — hoje não tem `startingRelic`.
- `engine/dda.ts`: `DEFAULT_DDA_CONFIG.easyWinAdjustment` muda de 0.1 para 0.15; `failureAdjustment` permanece 0.1 — mudança assimétrica, intencional (ver ADR 0006).
- `engine/forge.ts`: em `generateForgeOffers`, quando `rareRelicBoost` está ativo, o subconjunto `rares` usado no sorteio passa a excluir Relíquias de categoria `combo`. Se essa exclusão esvaziar `rares`, o boost simplesmente não tem efeito naquela chamada — cai para o sorteio normal entre `available`, sem lançar erro.
- Determinismo do Desafio Diário (ADR 0003) precisa se manter: a exclusão de categoria `combo` no `rareRelicBoost` não introduz nova fonte de aleatoriedade — filtra o pool candidato antes do sorteio, na mesma stream de RNG já injetada.

## Testing Decisions

- Bom teste verifica comportamento externo (dado um estado/config, o resultado), nunca a estrutura interna — mesmo princípio já usado em `dda.test.ts`/`relics.test.ts`.
- Módulos testados:
  - `engine/patterns.ts`: a nova constante de descrições bate 1:1 com as chaves de `PATTERN_BONUS` (nenhum Padrão faltando ou duplicado).
  - `engine/dda.ts`: `easyWinAdjustment` = 0.15 aplicado corretamente na Meta; `failureAdjustment` permanece 0.1 e inalterado — estende `dda.test.ts`.
  - `engine/relics.ts`: `comboGrowth.step` = 1.5 do Chain Reaction aplicado em `comboMultiplier` — estende `relics.test.ts`.
  - `engine/forgers.ts`: novos valores de `Anvil` (`comboStart` 1.5), `Hammer` (`pattern.bonus` 20) e `Apprentice` (`startingRelic` com `handSize` +1) — estende `forgers.test.ts`.
  - `engine/forge.ts`: com `rareRelicBoost` ativo, `generateForgeOffers` nunca retorna uma Relíquia de categoria `combo`, testado repetindo com várias seeds/streams — estende `forge.test.ts`.
- Prior art: `engine/dda.test.ts`, `engine/relics.test.ts`, `engine/forgers.test.ts`, `engine/forge.test.ts` já cobrem os módulos tocados, no mesmo estilo (funções puras, sem mocks).
- Determinismo do Desafio Diário: reexecutar (ou estender) o teste existente de "mesmo seed → mesma sequência de ofertas" pra confirmar que a exclusão de categoria `combo` não quebra a reprodutibilidade.
- Sem teste automatizado para `OnboardingOverlay`, o novo modal de referência, ou o texto da GDD — sem precedente de teste de componente no repo (checado nesta sessão: zero arquivos `.test.tsx` em `components/`); validação manual via skill `run`.

## Out of Scope

- Detector de multiplicador no DDA (alternativa arquitetural mais robusta, adiada — ver ADR 0006, "Alternativas consideradas").
- Rebalance do bônus base Quadra vs. Trinca (achado P2 do health-check; os valores de `PATTERN_BONUS` em si não mudam nesta spec).
- Boost de recompensa na primeira Jogada / RPE do minuto 1 (achado P2 do health-check — ex.: `×1.2` na 1ª Jogada, Forja garantida — não decidido nesta sessão de grilling).
- Tela de derrota mostrando a margem que faltou (achado P2 "Polish" do health-check).
- Versionamento da flag de onboarding (não necessário agora — sem usuários reais).
- Novo re-run do `game-health-check` para validar as mudanças — recomendado como próximo passo, mas não faz parte desta spec.

## Further Notes

- P0 e P1 são independentes por decisão explícita de sequenciamento (sessão de `/grilling`) e devem virar tickets/branches separados, implementáveis em paralelo.
- Depois que as duas branches mergearem, vale reexecutar o `game-health-check` pra confirmar que os achados do relatório de 2026-08-28 foram endereçados antes de considerar o P1 encerrado — se o Veterano ainda achar o jogo raso, a opção "detector de multiplicador" (fora de escopo aqui) volta à mesa.
- Os ADRs 0003 (Desafio Diário com seed completo e DDA desligado) e 0006 (este rebalance) são a base técnica/design desta spec — mudanças que os contradigam devem ser explicitamente sinalizadas.
