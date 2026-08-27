# Combo Forge: Nome de Exibição obrigatório + ranking sempre atualizado no Desafio Diário

Status: ready-for-agent

## Problem Statement

O ranking semanal do Desafio Diário hoje é 100% anônimo — mostra só posição (`rank`) e pontuação (`score`), nunca quem é quem. O top 10 é uma lista de números sem identidade, o que esvazia o propósito social de um ranking. Além disso, o ranking só aparece atrás de um botão "ver ranking": o jogador precisa lembrar de tocar nele toda vez, e mesmo assim o que aparece pode estar desatualizado (não reflete uma run que ele acabou de terminar) até tocar de novo.

## Solution

Cada dispositivo escolhe um Nome de Exibição uma única vez — pedido num modal bloqueante na primeira vez que abre a tela do Desafio Diário, sem opção de pular. Esse nome passa a aparecer junto de cada entrada do ranking. Nomes são moderados contra uma lista de termos proibidos (pt-br + en) tanto no cliente (feedback instantâneo) quanto no servidor (fonte da verdade — a chamada ao Supabase é pública e contorna qualquer filtro que exista só no app). O jogador pode trocar o nome depois na tela de Perfil, com as mesmas regras. A tela do Desafio Diário deixa de exigir um toque para ver o ranking: ele carrega sozinho ao entrar na tela e se atualiza de novo assim que uma pontuação é submetida.

## User Stories

1. Como jogador que nunca abriu o Desafio Diário, eu quero escolher um Nome de Exibição antes de poder jogar, para que minha pontuação apareça identificada no ranking.
2. Como jogador nesse primeiro momento, eu quero que o pedido de nome apareça assim que abro a tela do Desafio Diário — não no início nem no fim de uma run — para que eu não gaste uma tentativa do dia sem ainda ter nome.
3. Como jogador respondendo a esse pedido, eu quero que o modal não tenha como ser fechado sem escolher um nome válido (nem tocando fora, nem pelo botão físico de voltar do Android), para que a obrigatoriedade seja real.
4. Como jogador digitando um nome, eu quero ver imediatamente se ele é curto/longo demais ou tem caractere não permitido, sem precisar esperar uma resposta do servidor.
5. Como jogador digitando um nome com palavrão óbvio, eu quero ver a rejeição na hora, sem round-trip de rede.
6. Como jogador tentando burlar o filtro chamando a API diretamente (fora do app), eu quero que o servidor rejeite um nome ofensivo mesmo assim, para que o ranking compartilhado continue protegido.
7. Como jogador escolhendo um nome, eu quero poder usar letras com acento (ç, ã, é etc.), números e espaço, para que meu nome em português seja aceito normalmente.
8. Como jogador escolhendo um nome, eu quero que emoji e símbolos sejam recusados, para que o nome sempre renderize de forma previsível no ranking.
9. Como jogador escolhendo um nome, eu quero uma faixa de tamanho razoável (3 a 16 caracteres), para que caiba no layout do ranking sem ficar ilegível nem curto demais pra dizer algo.
10. Como jogador, eu quero poder escolher um nome que outro jogador já esteja usando, para que eu não trave num fluxo de "nome já em uso" desnecessário — o ranking não tem contas, duplicado não é um problema real.
11. Como jogador que já tem nome, eu quero poder trocá-lo depois na tela de Perfil, com as mesmas regras de validação, para não ficar preso à primeira escolha para sempre.
12. Como jogador tentando salvar um nome (seja no modal inicial, seja no Perfil) sem internet, eu quero ver um erro claro com opção de tentar de novo, e continuar bloqueado no Desafio Diário até resolver — sem que isso afete o resto do jogo (modo normal continua livre).
13. Como jogador, eu quero que a tela do Desafio Diário carregue o ranking semanal automaticamente assim que eu entro nela, sem precisar tocar em nenhum botão.
14. Como jogador que acabou de terminar uma run do dia (vitória ou derrota), eu quero que o ranking se atualize sozinho depois que minha pontuação é enviada, para ver minha posição nova sem sair e voltar da tela.
15. Como jogador vendo o ranking carregando, eu quero um indicador de carregamento no lugar da lista, para saber que algo está acontecendo.
16. Como jogador vendo o ranking depois de carregado, eu quero ver o Nome de Exibição ao lado de cada posição do top 10, para saber quem está em cada posição.
17. Como jogador, eu quero continuar vendo minha própria posição (mesmo fora do top 10) e minha pontuação, como já acontece hoje — sem regressão nesse comportamento.
18. Como jogador, eu quero que uma falha ao buscar o ranking (rede indisponível) mostre um erro claro, sem travar o resto da tela (o Desafio Diário continua jogável mesmo se o ranking falhar ao carregar).
19. Como desenvolvedor, eu quero que a lista de termos proibidos seja mantida uma única vez e espelhada entre TypeScript e SQL (como já acontece com o contrato do seed/leaderboard), para que cliente e servidor nunca divirjam sobre o que é aceito.
20. Como desenvolvedor, eu quero que o Nome de Exibição fique numa tabela própria (`players`, chave `device_id`), não numa coluna em `daily_submissions`, para que trocar o nome não exija tocar linhas de submissões passadas.
21. Como desenvolvedor, já que o jogo não foi lançado, eu quero zerar a tabela de submissões do Desafio Diário na migração, para não ter que lidar com dado legado sem nome.

## Implementation Decisions

- **Novo módulo puro `engine/displayName.ts`:** validação de formato (3–16 caracteres; letras com acento, números e espaço; sem emoji/símbolo) e checagem contra uma lista de termos proibidos própria (pt-br + en, curada pelo time — não uma lib de terceiros, pela fraca cobertura de pt-br que essas libs costumam ter). Função pura `validateDisplayName(name): DisplayNameValidation`, sem IO, retornando o motivo da rejeição (curto demais, longo demais, caractere inválido, termo proibido) para a UI mostrar a mensagem certa.
- **Lista de termos proibidos espelhada estilo `supabase/contract.ts`:** o SQL (dentro da função que grava o nome) é a fonte da verdade; o TS espelha a mesma lista, com testes de valores dourados garantindo que não desalinham. `verify-contract.mjs` ganha uma verificação a mais: nomes de teste (aceitos e rejeitados) rodados contra o Postgres real via Docker, comparados ao resultado do espelho TS.
- **Schema novo — tabela `public.players`** (chave primária `device_id`, coluna `display_name`, timestamps): guarda o nome por dispositivo, independente de submissões diárias. `get_weekly_leaderboard` passa a fazer join nela para incluir o nome em cada entrada do top 10 (e na posição própria). Nova função SQL `set_display_name(device_id, name)` faz upsert com a mesma validação de formato + lista de termos proibidos do lado do servidor, rejeitando com erro claro quando inválido.
- **Migração zera `daily_submissions`:** o jogo ainda não foi lançado — não há preocupação de retrocompatibilidade com pontuações/dispositivos existentes.
- **`DailyChallengeStorage` (port) ganha `loadDisplayName()`/`saveDisplayName(name)`:** mesmo padrão de `loadDeviceId`/`saveDeviceId`; implementação SQLite real em `store/sqlite.ts`, implementação em memória para testes.
- **`DailyBackend` (port) ganha `setDisplayName(deviceId, name): Promise<string>`:** chama a nova RPC `set_display_name`, rejeita a Promise quando o servidor recusa (moderação ou formato); devolve o nome canônico salvo (trim aplicado). `DailyLeaderboardEntry` ganha o campo `name: string`. `services/supabase.ts` implementa ambos contra o cliente Supabase existente.
- **`DailyState` (store/dailyFlow.ts) ganha `displayName: string | null`, `displayNameStatus: 'idle' | 'saving' | 'error'` e `displayNameError: string | null`.** `DailyCommand` ganha `{ type: 'setDisplayName', name }`, tratado em `runDailyCommand`: valida com `validateDisplayName` primeiro (falha sem round-trip quando dá pra saber sem o servidor), chama `deps.backend.setDisplayName`, persiste via `deps.storage.saveDisplayName` e atualiza o estado. Mesmo padrão dos comandos existentes (`start`/`watchAd`/`submit`/`fetchLeaderboard`) — nenhum módulo de fluxo novo.
- **`store/gameStore.ts`:** estado inicial de `daily.displayName` carregado de `dailyStorage.loadDisplayName()` na criação do store, mesmo padrão do `deviceId`. Nova action `setDisplayName(name)` espelhando as outras actions do Desafio Diário. A action `openDaily()` passa a também disparar `fetchLeaderboard()` (fire-and-forget, mesmo padrão de outras chamadas assíncronas disparadas sem aguardar no código atual). `submitDailyScore` passa a disparar um novo `fetchLeaderboard()` só quando a submissão termina com sucesso (não em caso de falha).
- **UI — modal bloqueante novo (`DailyChallengeScreen`):** renderizado quando `daily.displayName === null`; campo de texto + validação inline (usa `validateDisplayName` do engine, mesma função do lado cliente) + botão de confirmar (chama a nova action, mostra `displayNameStatus`/`displayNameError`) + retry em caso de falha de rede. Sem botão de fechar, sem tocar fora para dispensar. Precisa interceptar o botão físico de voltar do Android via `BackHandler` (React Native) — não há uso de `BackHandler` em nenhum outro lugar do app hoje, então é um padrão novo, não uma extensão de algo existente.
- **UI — seção nova no `ProfileScreen`:** campo de Nome de Exibição com o valor atual, editável a qualquer momento, mesma validação e mesma action `setDisplayName`. Sem limite de quantas vezes pode trocar.
- **UI — `DailyChallengeScreen`:** remove o botão "ver ranking" e o estado `daily.leaderboard === null` como gate manual; a seção do ranking sempre renderiza — estado de carregamento (`leaderboardLoading`) no lugar da lista, erro (`leaderboardError`) sem esconder o resto da tela. `LeaderboardList`/cada linha do top 10 passa a mostrar o `name` da entrada ao lado do rank e da pontuação.
- **i18n:** novas chaves em `daily.*` (título/placeholder/erros do modal de nome, mensagens de validação por motivo de rejeição) e em `profile.*` (seção de edição), en + pt.

## Testing Decisions

- Um bom teste verifica comportamento externo — dado um nome e um estado, verifica-se o resultado da validação ou o novo estado do Desafio Diário — nunca a lista de termos proibidos linha a linha nem detalhe de implementação do regex.
- `engine/displayName.ts`: testes unitários com casos dourados — nomes válidos (com acento, números, espaço), muito curtos, muito longos, com emoji/símbolo, com termo da lista proibida (pt-br e en) — cobrindo cada motivo de rejeição do tipo de retorno.
- `store/dailyFlow.ts` via `runDailyCommand`: novo comando `setDisplayName` testado com o mesmo backend fake + storage em memória de `dailyFlow.test.ts` — sucesso (persiste e atualiza estado), rejeição do servidor (nome que passa no cliente mas o backend fake recusa), falha de rede (backend fake rejeita a Promise).
- `store/gameStore.ts` (integração, `gameStore.test.ts`): `openDaily()` dispara `fetchLeaderboard`; `submitDailyScore` bem-sucedido dispara um novo `fetchLeaderboard`; submissão que falha não dispara.
- `supabase/scripts/verify-contract.mjs`: estendido para rodar a nova migração (tabela `players` + `set_display_name` + `get_weekly_leaderboard` com nome) contra Postgres real via Docker, com casos de nome aceito/rejeitado comparados ao espelho TS — mesmo padrão do seed/leaderboard já verificados hoje.
- Prior art direto: `store/dailyFlow.test.ts` (comandos do Desafio Diário via fakes), `engine/shop.test.ts` (validação pura de estado sem IO), `supabase/contract.test.ts` + `verify-contract.mjs` (contrato SQL↔TS com valores dourados).
- Fora do teste automatizado: o modal bloqueante em si (`BackHandler`, layout) — validado visualmente em emulador, como as demais telas do jogo (sem `@testing-library/react-native` no projeto).

## Out of Scope

- **Checagem de unicidade entre nomes** — duplicados são permitidos (decisão do grilling).
- **Emoji ou caracteres decorativos no nome.**
- **Denúncia/moderação manual de nomes já publicados** — a moderação é só na entrada (cliente + servidor no momento de salvar); não há fluxo de reportar um nome já salvo.
- **Histórico de nomes anteriores** — trocar o nome no Perfil sobrescreve, sem guardar o antigo.
- **Ranking do modo normal (não-diário)** — o ranking continua exclusivo do Desafio Diário.
- **Contas de usuário** — o Nome de Exibição fica atrelado ao `device_id` opaco existente, sem criar nenhum sistema de login (ADR 0001).
- **Migração de dado legado** — a tabela de submissões é zerada; não há jogadores reais ainda.
- **Rate limit de troca de nome no Perfil.**

## Further Notes

- Decisões e alternativas rejeitadas (coluna vs. tabela separada, filtro só client-side, lib de profanity pronta, nome único) estão registradas em `docs/adr/0005-nome-exibicao-desafio-diario.md`. `CONTEXT.md` já tem o termo "Nome de Exibição" e a definição de "Desafio Diário" atualizada.
- Idioma dos textos do jogo: conforme o `CLAUDE.md` raiz, os textos exibidos no jogo (placeholder, mensagens de erro do modal, etc.) são em inglês, mesmo com este documento em pt-br.
- `BackHandler` é uma API nativa do React Native (não precisa de pacote novo), mas é a primeira vez que o projeto a usa — vale atenção extra na implementação e na verificação visual em emulador (o botão físico de voltar do Android é o caso que mais importa testar manualmente).
