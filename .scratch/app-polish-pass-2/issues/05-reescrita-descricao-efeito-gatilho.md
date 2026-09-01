# 05 — Reescrita da descrição do Efeito de Gatilho

**What to build:** a descrição do Efeito de Forja de Gatilho fica mais clara e natural em ambos os idiomas — de "Adiciona +X pts quando jogado na jogada Y de uma rodada" para "Adiciona +X pts quando jogado na Yª jogada da rodada" (pt-br), com a mesma reestruturação em inglês.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-human

- [x] `i18n/en.json`, chave `format.forgeEffect.trigger`: de `"Adds +{{bonus}} pts when played on play {{triggerPlay}} of a round"` para `"Adds +{{bonus}} pts on the {{triggerPlay}}th play of the round"`.
- [x] `i18n/pt.json`, mesma chave: de `"Adiciona +{{bonus}} pts quando jogado na jogada {{triggerPlay}} de uma rodada"` para `"Adiciona +{{bonus}} pts quando jogado na {{triggerPlay}}ª jogada da rodada"`.
- [x] Nenhuma mudança de tipo/dado — `triggerPlay` continua um `number` puro interpolado cru; o inglês usa sempre "th" (sem sufixo ordinal correto tipo "1st"/"2nd"/"3rd") — decisão consciente registrada no spec, não pendência. Confirmado: `forgeEffectDescription()` em `components/format.ts` não mudou, só o texto da chave.
- [ ] Validação manual via skill `run`: abrir a tela de Coleção (Efeitos de Forja) ou a Forja durante uma run, conferir visualmente a nova frase em pt-br e em inglês para um Efeito de Gatilho existente (ex.: `trigger-3-20` ou `trigger-4-30`). **Bloqueada neste ambiente pelo mesmo motivo já documentado nos tickets anteriores** (`.scratch/app-polish-pass/issues/02-i18n-gaps.md`, tickets 02 e 03 deste polish pass): o único build instalado no emulador disponível é um APK standalone com o bundle JS embutido, não um dev-client conectado ao Metro. Mudança é puramente texto (troca de chave i18n já existente, sem lógica nova), verificada diretamente lendo o JSON resultante (`node -e "require('./i18n/en.json').format.forgeEffect.trigger"` etc.) — confiança alta sem precisar de screenshot. Confirmação visual real precisa de um dev-client build novo.
