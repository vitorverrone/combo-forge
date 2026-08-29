# 03 — Padding horizontal nos botões do modal de abandonar run

**What to build:** os botões "Continuar"/"Abandonar" do modal de confirmação de abandono de run ganham respiro lateral mínimo, para que o texto (em qualquer idioma, especialmente pt-br que costuma ser mais longo) não fique colado na borda do botão.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** done

- [x] `components/GameScreen.tsx`: estilo `overlayBtn` (compartilhado pelos botões `game.keepPlaying`/`game.abandon`) ganha `paddingHorizontal: spacing[8]` (token de espaçamento existente em `theme.ts`, não um número solto) — mínimo de 8px pedido. `overlayBtnPrimary`/`overlayBtnDanger` continuam só com cor, sem mudança de padding.
- [ ] Validação manual via skill `run` em pt-br e em inglês: confirmar visualmente que o texto dos dois botões não encosta na borda em nenhum dos dois idiomas. **Bloqueada neste ambiente pelo mesmo motivo já documentado nos tickets anteriores** (`.scratch/app-polish-pass/issues/02-i18n-gaps.md`, `.scratch/app-polish-pass-2/issues/02-modal-nome-sobe-com-teclado.md`): o único build instalado no emulador disponível é um APK standalone com o bundle JS embutido, não um dev-client conectado ao Metro. Mudança é puramente CSS (`paddingHorizontal` num `flex: 1` já existente), sem lógica nova a validar além do resultado visual — confiança vem do typecheck limpo e da leitura do estilo resultante (8px de cada lado, dentro do texto mais longo já visto em pt-br "ABANDONAR"/"CONTINUAR"). Confirmação visual real precisa de um dev-client build novo.
