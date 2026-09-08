Status: ready-for-agent

# Notificação push de queda de Tier na Liga

Referências: [ADR-0012](../../docs/adr/0012-notificacao-queda-tier-liga.md), [ADR-0010](../../docs/adr/0010-ligas-e-sequencia-desafio-diario.md), [ADR-0001](../../docs/adr/0001-stack-rn-expo-supabase.md), `CONTEXT.md` (termos Liga, Tier, Divisão, Notificação).

## Problem Statement

Hoje, quando um dispositivo desce de Tier na Liga ao fim da semana (os 5 piores colocados da própria Divisão, ADR-0010), ninguém avisa o jogador — ele só descobre se abrir o Desafio Diário por conta própria e checar a seção de Liga. Não existe nenhum mecanismo que traga o jogador de volta ao app depois de uma semana ruim, apesar da Liga ser justamente o sistema desenhado pra gerar esse tipo de gancho de retorno.

## Solution

O app ganha sua primeira infraestrutura de notificação push (Expo Push Notification Service), construída de forma genérica — token por `device_id`, serviço de despacho reaproveitável — mas com um único gatilho implementado nesta rodada: **queda de Tier**. Um job semanal novo no Supabase (SQL-only, via `pg_cron` + `pg_net` — sem Edge Functions, ADR-0001) calcula proativamente o Tier da semana nova de todo dispositivo participante, compara com o Tier anterior e dispara um push pros casos de queda, com token registrado. A permissão do sistema operacional é pedida com contexto — só quando o dispositivo entra na Liga pela primeira vez — e tocar na notificação leva direto pra seção de Liga do Desafio Diário.

## User Stories

1. Como jogador cujo dispositivo acabou de entrar na Liga pela primeira vez (Liga ativou, `active: true`), quero ver um convite dentro do próprio app pra ativar notificações de queda de Tier, para que eu decida com contexto, sem ser interrompido por um prompt do sistema sem explicação.
2. Como jogador que aceita o convite dentro do app, quero que o prompt nativo de permissão do sistema operacional apareça em seguida, para que eu conceda a permissão de verdade e o app consiga registrar meu token de push.
3. Como jogador que recusa o convite dentro do app, quero que ele não apareça de novo toda vez que eu abrir o Desafio Diário, para que o app não fique insistindo numa decisão que eu já tomei.
4. Como jogador que concede a permissão, quero que meu token de push seja registrado no backend vinculado ao meu `device_id`, para que o servidor saiba pra onde mandar a notificação quando eu cair de Tier.
5. Como jogador com token registrado cujo Tier caiu ao fim da semana (ex.: Ouro → Prata), quero receber uma notificação push nomeando o Tier novo, para que eu saiba o que aconteceu mesmo sem abrir o app.
6. Como jogador cujo Tier subiu ou ficou igual ao fim da semana, quero NÃO receber nenhuma notificação, para que o push só me alcance quando for uma informação que eu realmente preciso agir.
7. Como jogador sem token de push registrado (nunca concedeu permissão, ou negou), quero que o job semanal simplesmente pule meu dispositivo sem erro, para que a ausência de push não quebre o cálculo do Tier de ninguém.
8. Como jogador no Tier Bronze (piso, sem rebaixamento — ADR-0010), quero nunca receber uma notificação de queda, já que estruturalmente não existe queda abaixo de Bronze.
9. Como jogador, ao tocar na notificação de queda de Tier quero ser levado direto pra seção de Liga do Desafio Diário (não só pra Start Screen), para que eu veja minha situação nova sem toques extras.
10. Como jogador que reabre o app depois de receber (ou não) uma notificação, quero que o comportamento normal da `DailyChallengeScreen` (RPC preguiçosa de `get_league_leaderboard`) continue funcionando exatamente como hoje, para que a introdução do job semanal não quebre nem duplique o cálculo do meu Tier.
11. Como desenvolvedor mantendo o backend, quero que o job semanal seja idempotente (reaproveitando o `on conflict do nothing` que a RPC já usa em `league_placements`), para que rodar o job mais de uma vez na mesma semana (falha e retry, por exemplo) nunca produza um Tier ou uma notificação duplicada.
12. Como desenvolvedor mantendo o backend, quero que a lógica de "o Tier caiu?" tenha um espelho TypeScript testável com valores dourados (mesmo padrão do resto do contrato SQL), para que a regra de comparação de Tier nunca divirja silenciosamente entre o SQL real e o que o time entende que ela faz.
13. Como desenvolvedor mantendo o cliente, quero que a permissão, o token e o listener de toque na notificação vivam atrás de uma porta (`PushProvider`), com uma implementação em memória para testes, para que a lógica de orquestração (quando pedir permissão, quando registrar o token, o que fazer ao tocar) seja testável sem depender do SDK nativo.
14. Como jogador usando o app no Expo Go, na web, ou em qualquer ambiente sem o módulo nativo de notificação, quero que o app continue funcionando normalmente (sem crash, sem tela quebrada), para que a ausência da capability nunca bloqueie o jogo — mesmo padrão que anúncios (`services/ads.ts`) e updates (`services/updates.ts`) já seguem.

## Implementation Decisions

- **Schema novo (`supabase/migrations/`)**: tabela `push_tokens` (`device_id` chave primária, `expo_push_token`, `platform`, `updated_at`) — token mais recente sobrescreve o anterior (upsert), sem histórico, mesmo espírito de `players`. RLS habilitado, sem acesso direto — só via RPC, mesmo padrão de `league_placements`.
- **RPC nova**: `register_push_token(p_device_id text, p_token text, p_platform text)` — upsert em `push_tokens`. Exposta ao `anon` como as demais funções do contrato (`SECURITY DEFINER`, `search_path` travado).
- **Job semanal SQL-only** (ADR-0001: sem Edge Functions): uma função SQL nova (ex.: `_run_league_tier_drop_notifications()`) agendada via extensão `pg_cron`, rodando pouco depois da virada da semana ISO (ex.: segunda 00:05 UTC). Para cada dispositivo com uma linha em `league_placements` na semana anterior: reaproveita `_resolve_league_tier` (já existe, migration 0004) pra calcular o Tier novo, insere em `league_placements` (`on conflict do nothing`, mesma idempotência da RPC), e onde o Tier novo for pior que o anterior (usando a mesma ordem de Tier — bronze piso, diamond teto), e existir uma linha em `push_tokens` pro `device_id`, despacha um push via a extensão `pg_net` (chamada HTTP assíncrona direto do Postgres para a Expo Push API) — sem Edge Function.
- **`get_league_leaderboard` (RPC existente) não muda de comportamento.** Continua exatamente como hoje: resolução preguiçosa, rede de segurança para qualquer dispositivo que o job não tenha coberto (corrida no instante exato da virada de semana, por exemplo). O job é uma adição, não uma substituição.
- **Separação de responsabilidade dentro do job**: a função que calcula "quem caiu de Tier e tem token registrado" deve ser separável (outra função SQL, ou uma CTE isolada) da parte que efetivamente despacha via `pg_net` — a primeira parte é testável diretamente (entrada determinística, saída determinística); a segunda depende de rede e é mais difícil de exercitar em teste automatizado (ver Testing Decisions).
- **Espelho TS (`supabase/contract.ts`)**: nova função pura, algo como `didLeagueTierDrop(prevTier: LeagueTier, nextTier: LeagueTier): boolean`, usando a mesma ordem de Tier que `promoteLeagueTier`/`demoteLeagueTier` já usam ali. Espelha a regra de comparação usada pelo job SQL.
- **Port novo em `engine/`**: `PushProvider`, com responsabilidades análogas a `AdProvider`/`TelemetryProvider` — solicitar permissão do SO, obter o token de push (Expo push token), e registrar um listener de toque em notificação. Implementação em memória para testes (mesmo padrão de `createMemoryDailyChallengeStorage` etc.).
- **Adapter real em `services/push.ts`**: implementa `PushProvider` com `expo-notifications` — import dinâmico (mesmo padrão de `services/ads.ts`/`services/updates.ts`: falha de módulo nativo, ambiente sem suporte, ou erro do SDK nunca lança, sempre resolve um estado "indisponível" sem quebrar o app). Adiciona a dependência `expo-notifications` e o plugin correspondente em `app.json`.
- **Orquestração**: um flow novo (`store/pushFlow.ts` ou equivalente) cuida de: (a) decidir quando mostrar o soft-ask (Liga ativa pela primeira vez pro dispositivo + soft-ask ainda não recusado — estado local persistido, verificado independentemente do status de permissão do SO, já que recusar o soft-ask não muda esse status), (b) disparar o prompt do SO e registrar o token via `register_push_token` quando concedida, e (c) reagir ao toque na notificação chamando a action `openDaily` já existente no `gameStore` (`store/gameStore.ts:598`).
- **UI**: soft-ask novo dentro da `DailyChallengeScreen`, na seção de Liga — banner/botão simples ("Avisar se eu cair de Tier?"), textos novos no namespace `daily.*` de i18n (pt/en).
- **Copy da notificação em si** (enviada pelo servidor, não pelo app) nomeia o Tier novo por nome (ex.: "Você caiu para Prata") — texto vive no job SQL/serviço de despacho, não no app; deve existir em pt-br e en (mesmo padrão de i18n do resto do produto, ainda que o mecanismo de tradução seja diferente por não passar pelo `i18next` do cliente).

## Testing Decisions

- Um teste só deve verificar comportamento externo (input → output), não detalhes de implementação — mesmo princípio já seguido em `engine/daily.test.ts` e `supabase/contract.test.ts`.
- `didLeagueTierDrop` ganha testes com valores dourados em `supabase/contract.test.ts`, cobrindo todos os pares de Tier (queda real, subida, mesmo Tier, e os extremos Bronze/Diamond) — mesmo padrão das funções de Liga já testadas ali (`promoteLeagueTier`, `demoteLeagueTier`).
- A parte "quem caiu de Tier e tem token registrado" do job SQL é verificada contra Postgres real via `npm run verify:backend` (`supabase/scripts/verify-contract.mjs`, já existe) — aplica as migrations, popula `league_placements`/`push_tokens` de cenários conhecidos, chama a função diretamente, e verifica a lista resultante. A parte que efetivamente despacha via `pg_net` (chamada de rede real) fica fora dessa verificação automatizada — é a mesma fronteira que qualquer chamada de rede real tem neste projeto (ex.: `services/ads.ts` também não testa o SDK do AdMob de verdade em testes automatizados).
- `PushProvider` (a porta) ganha um fake em memória, testado via `store/pushFlow.test.ts` (mesmo padrão de `store/dailyFlow.test.ts`, `store/shopFlow.test.ts`) — cobrindo: soft-ask não aparece duas vezes depois de recusado, token é registrado no backend quando a permissão é concedida, e o listener de toque chama `openDaily`.
- O soft-ask em si (`DailyChallengeScreen`) não recebe teste automatizado dedicado — mesma convenção já estabelecida no projeto pra componentes finos (lógica no motor/flow, UI sem framework de teste de componente, `docs/analise-melhorias.md` item 8).
- Verificação funcional real (emulador/simulador) cobrindo: soft-ask aparecendo na primeira entrada na Liga, prompt do SO, e (quando possível simular) toque numa notificação de teste levando pra `DailyChallengeScreen`. O disparo real do job semanal via `pg_cron` em produção não é verificável antes do primeiro rollout de uma semana real — fica registrado no `docs/release-checklist.md` como item de verificação pós-deploy, não como teste automatizado.

## Out of Scope

- Notificação de Sequência em risco e o lembrete de pausa não-bloqueante (ADR-0010, premortem de lançamento) — ficam de backlog, reaproveitando a mesma infra genérica quando forem especificados.
- Tela/toggle de configuração de notificação no Perfil — se o jogador recusar o soft-ask ou a permissão do SO, reativar exige ir manualmente nos Ajustes do sistema (comportamento padrão de plataforma); nenhuma UI de configuração nova nesta rodada.
- Re-perguntar a permissão depois de uma recusa — o soft-ask aparece só até ser recusado uma vez.
- Notificações com mídia rica (imagem, ação inline) — texto simples apenas.
- Qualquer alteração em `get_league_leaderboard` ou no comportamento hoje existente da `DailyChallengeScreen`.
- Painel do Desafio Diário na Start Screen (ADR-0011) — feature separada, já especificada em `.scratch/desafio-diario-painel-start/`.

## Further Notes

- Esta é a primeira peça de infraestrutura agendada do projeto (`pg_cron`) e a primeira dependência de notificação push — vale considerar `/wizard` pra parte de configuração externa que um agente não alcança sozinho (habilitar as extensões `pg_cron`/`pg_net` no projeto Supabase, credenciais do Expo Push se necessário, permissões nativas no build EAS).
- Objetivo de produto declarado (ADR-0012, reabrindo o ADR-0010): mover D7/D30 — a copy e a UX do soft-ask devem evitar linguagem de urgência manipuladora, consistente com o pilar de competição social justa do GDD.
