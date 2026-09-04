# Banner some durante a Rodada ativa — reversão parcial do ADR 0004

O ADR 0004 decidiu o banner full-width em "todas as telas, inclusive a de jogo", aceitando conscientemente o risco de clique acidental durante a Rodada (revisável "se o AdMob sinalizar cliques acidentais"). O premortem de lançamento (2026-09-03, `.scratch/premortem-lancamento/`) apontou esse risco como um modo de falha concreto: o polegar do jogador desliza durante a seleção de cartas sob pressão de tempo, toca o banner, e o interstitial de terceiro que abre quebra o Flow — o pilar central de design do jogo — bem no momento de maior imersão de uma sessão de 3–8 minutos. Decidimos não esperar o AdMob sinalizar; o risco em si já é motivo suficiente.

A correção é cirúrgica, não uma reversão total: o banner some só quando `run.phase === 'playing'` — a Rodada ativa, onde o jogador está selecionando cartas sob pressão de tempo. Continua aparecendo na Forja (escolha deliberada entre 3 ofertas, sem pressão de tempo), nas telas de fim de Rodada/fim de Run, e em todas as demais telas (Home, Loja, Coleção, Perfil, Desafio Diário) — o banner continua cumprindo o papel que o ADR 0004 já descrevia ("motor da compra de remoção, não linha de receita").

## Alternativas consideradas

- **Esconder em toda a `screen === 'game'`** (Rodada + Forja + fim de Rodada + fim de Run): mais simples de implementar, elimina o risco por completo, mas esconde o banner também em telas sem pressão de tempo nenhuma — perde exposição sem reduzir risco adicional. Descartada: a Forja e as telas de fim de Rodada/Run não são o cenário que motivou a mudança.

## Consequências

- `shouldShowBanner` (`engine/adProvider.ts`) ganha um terceiro parâmetro, `runPhase: RunPhase | undefined`, e passa a decidir também a Rodada ativa (`runPhase !== 'playing'`) — a regra continua inteira e pura numa função testável, mesmo precedente já usado por `shouldStartForgeTutorial`/`shouldStartGameScreenTutorial` (`store/tutorialFlow.ts`), que também recebem a fase da Run como parâmetro em vez de decidir dentro de um componente. Achado do code-review: a primeira versão desta mudança deixava a condição só dentro de `AdBanner.tsx`, fragmentando a regra entre o componente e o engine.
- `components/AdBanner.tsx` lê `run?.phase` do store e só chama `shouldShowBanner(adsRemoved, adUnitId, run?.phase)` — sem lógica própria.
- O ADR 0004 permanece válido para as demais telas; este ADR documenta a exceção, não substitui o anterior.
