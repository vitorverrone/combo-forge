# 03 — Padding horizontal nos botões do modal de abandonar run

**What to build:** os botões "Continuar"/"Abandonar" do modal de confirmação de abandono de run ganham respiro lateral mínimo, para que o texto (em qualquer idioma, especialmente pt-br que costuma ser mais longo) não fique colado na borda do botão.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-agent

- [ ] `components/GameScreen.tsx`: estilo `overlayBtn` (compartilhado pelos botões `game.keepPlaying`/`game.abandon`) ganha `paddingHorizontal: spacing[8]` (token de espaçamento existente em `theme.ts`, não um número solto) — mínimo de 8px pedido. `overlayBtnPrimary`/`overlayBtnDanger` continuam só com cor, sem mudança de padding.
- [ ] Validação manual via skill `run` em pt-br e em inglês: confirmar visualmente que o texto dos dois botões não encosta na borda em nenhum dos dois idiomas.
