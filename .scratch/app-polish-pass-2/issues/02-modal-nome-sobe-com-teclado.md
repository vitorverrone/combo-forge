# 02 — Modal de Nome de Exibição sobe com o teclado

**What to build:** ao abrir o teclado para digitar o Nome de Exibição no Desafio Diário, o modal "Escolha seu nome" sobe para não ficar atrás do teclado, mantendo ~32px de respiro entre a base do card e o topo do teclado aberto. Sem teclado aberto, o modal continua centralizado exatamente como hoje.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-agent

- [ ] `components/DisplayNameModal.tsx`: componente hoje é uma `View` absolutamente posicionada simulando overlay/modal (não usa `Modal` nativo) — a solução precisa funcionar dentro desse padrão, não assumir `Modal`. Adiciona keyboard-avoidance (ex.: `KeyboardAvoidingView` com `behavior` apropriado por plataforma, ou listener de `Keyboard` + ajuste de posição) de forma que o card suba o suficiente pra manter ~32px entre sua base e o topo do teclado.
- [ ] Checar o comportamento nativo do Android (`windowSoftInputMode`) antes de aplicar a solução, pra não duplicar o ajuste (Android por padrão já pode redimensionar a tela) — a correção deve ficar local a este componente, sem mudar `AndroidManifest`/comportamento de outras telas.
- [ ] Validação manual via skill `run`: abrir o Desafio Diário, tocar no campo de nome, confirmar visualmente que o campo de texto e o botão de salvar ficam visíveis acima do teclado tanto em iOS quanto Android (ou documentar qual plataforma não pôde ser testada no ambiente disponível).
