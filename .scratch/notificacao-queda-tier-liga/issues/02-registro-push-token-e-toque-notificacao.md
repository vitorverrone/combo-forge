# 02 — Registro de push token + toque na notificação navega pro Desafio Diário

**What to build:** o pipeline completo do lado do jogador para a infraestrutura de push (ADR-0012), de ponta a ponta, funcionando mesmo antes do job semanal (ticket 03) existir. Schema novo no Supabase: tabela `push_tokens` (device_id, expo_push_token, platform, updated_at — token mais recente sobrescreve o anterior, sem histórico) e RPC `register_push_token(p_device_id, p_token, p_platform)`, expostos ao `anon` com o mesmo padrão de segurança das demais funções do contrato (`SECURITY DEFINER`, RLS sem acesso direto). No cliente: uma porta nova `PushProvider` no `engine/` (permissão, obtenção do token, listener de resposta de notificação), implementada de verdade em `services/push.ts` via `expo-notifications` (import dinâmico, nunca lança — mesmo padrão de `services/ads.ts`/`services/updates.ts`: sem módulo nativo ou qualquer falha do SDK, resolve estado "indisponível" e o app continua funcionando normalmente) e com um fake em memória para testes. Um flow novo orquestra: soft-ask dentro da `DailyChallengeScreen` (banner/botão "Avisar se eu cair de Tier?") mostrado só na primeira vez que a Liga ativa pro dispositivo, e não mostrado de novo se for recusado (estado local persistido, independente do status de permissão do SO); ao aceitar, dispara o prompt nativo do SO e, se concedido, registra o token via `register_push_token`; e um listener que, ao detectar toque numa notificação, chama a action `openDaily` já existente no `gameStore`.

**Blocked by:** None — can start immediately (roda em paralelo com o ticket 01).

**Status:** ready-for-agent

- [ ] Tabela `push_tokens` e RPC `register_push_token` existem no Supabase, com o mesmo padrão de segurança (RLS, `SECURITY DEFINER`) das demais funções do contrato
- [ ] Porta `PushProvider` existe em `engine/`, com implementação em memória para testes
- [ ] `services/push.ts` implementa `PushProvider` via `expo-notifications`; ambiente sem módulo nativo (Expo Go/web/testes) nunca quebra o app
- [ ] Soft-ask aparece na `DailyChallengeScreen` na primeira vez que a Liga ativa pro dispositivo (`active: true` pela primeira vez) — nunca no cold start
- [ ] Soft-ask não aparece de novo depois de recusado, mesmo em sessões futuras
- [ ] Aceitar o soft-ask dispara o prompt nativo do SO; concedida a permissão, o token é registrado via `register_push_token` (verificável: linha nova/atualizada em `push_tokens`)
- [ ] Tocar numa notificação de teste (ex.: enviada pela ferramenta de teste do Expo Push) chama `openDaily` e o app abre direto na `DailyChallengeScreen`
- [ ] Testes de `store/pushFlow.ts` (ou equivalente) usando o `PushProvider` fake, mesmo padrão de `store/dailyFlow.test.ts`/`store/shopFlow.test.ts` — cobrindo soft-ask não repetido após recusa, registro de token ao conceder permissão, e o listener de toque chamando `openDaily`
- [ ] `tsc --noEmit` limpo, `eslint .` sem problemas, suíte de testes passando
- [ ] Verificação funcional real em emulador/simulador (soft-ask, prompt do SO, toque em notificação de teste)
