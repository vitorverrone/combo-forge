# 01 — Banner em todas as telas (dev/test)

**Status:** ready-for-agent

**What to build:** o jogador vê um banner full-width de 50dp no rodapé de todas as telas (início, jogo, perfil, coleção, Desafio Diário, loja). Em build de desenvolvimento o banner é o anúncio de teste do Google (`TestIds.BANNER`, sempre carrega); em produção usa a ad unit real de banner da plataforma. O espaço de 50dp fica reservado mesmo quando o anúncio não carrega (`NO_FILL`), para o layout nunca pular.

**Blocked by:** None — can start immediately.

- [ ] Banner `ADAPTIVE_BANNER` full-width de 50dp renderizado no rodapé em todas as telas, sem sobrepor conteúdo
- [ ] Em dev (`NODE_ENV !== 'production'`) usa `TestIds.BANNER`; em produção usa a ad unit real selecionada por plataforma (Android via `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID`; iOS idem `_IOS` quando configurada)
- [ ] Sem env da plataforma, o app degrada sem quebrar (banner não renderiza; jogo intacto) — mesmo padrão do rewarded
- [ ] Espaço de 50dp reservado mesmo com `NO_FILL` (estabilidade de layout)
- [ ] Regra de visibilidade pura testável (ex.: `shouldShowBanner`) com testes no seam
- [ ] Validação em dev build no emulador: banner de teste visível em todas as telas, navegação intacta

**Dependência externa (não bloqueante):** a ad unit de **banner** no dashboard do AdMob (ação humana, fluxo do rewarded) — só necessária para o env real de produção; o ticket funciona com `TestIds.BANNER` em dev.
