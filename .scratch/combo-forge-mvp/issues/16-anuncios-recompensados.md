# 16 — Anúncios recompensados

**What to build:** Os anúncios recompensados opt-in via AdMob (conforme ADR 0001): a 1 tentativa extra do Desafio Diário (o provider consumido pelo ticket 13). Anúncios são sempre opcionais, nunca necessários para o progresso core, e nunca são oferecidos como gatilho de conversão após uma derrota (mitigação ética do GDD).

**Blocked by:** 13 — Desafio Diário (cliente)

**Status:** ready-for-agent

- [ ] Assistir ao anúncio recompensado libera a 1 tentativa extra do Desafio Diário
- [ ] O anúncio nunca é obrigatório; o progresso core funciona integralmente sem ele
- [ ] Falha no carregamento/exibição do anúncio não bloqueia nem quebra o fluxo do jogo
- [ ] A oferta de anúncio não é acionada como gatilho de conversão após uma derrota
