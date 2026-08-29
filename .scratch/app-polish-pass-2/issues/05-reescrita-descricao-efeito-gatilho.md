# 05 — Reescrita da descrição do Efeito de Gatilho

**What to build:** a descrição do Efeito de Forja de Gatilho fica mais clara e natural em ambos os idiomas — de "Adiciona +X pts quando jogado na jogada Y de uma rodada" para "Adiciona +X pts quando jogado na Yª jogada da rodada" (pt-br), com a mesma reestruturação em inglês.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-agent

- [ ] `i18n/en.json`, chave `format.forgeEffect.trigger`: de `"Adds +{{bonus}} pts when played on play {{triggerPlay}} of a round"` para `"Adds +{{bonus}} pts on the {{triggerPlay}}th play of the round"`.
- [ ] `i18n/pt.json`, mesma chave: de `"Adiciona +{{bonus}} pts quando jogado na jogada {{triggerPlay}} de uma rodada"` para `"Adiciona +{{bonus}} pts quando jogado na {{triggerPlay}}ª jogada da rodada"`.
- [ ] Nenhuma mudança de tipo/dado — `triggerPlay` continua um `number` puro interpolado cru; o inglês usa sempre "th" (sem sufixo ordinal correto tipo "1st"/"2nd"/"3rd") — decisão consciente registrada no spec, não pendência.
- [ ] Validação manual via skill `run`: abrir a tela de Coleção (Efeitos de Forja) ou a Forja durante uma run, conferir visualmente a nova frase em pt-br e em inglês para um Efeito de Gatilho existente (ex.: `trigger-3-20` ou `trigger-4-30`).
