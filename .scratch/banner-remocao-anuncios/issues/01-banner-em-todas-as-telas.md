# 01 — Banner em todas as telas (dev/test)

**Status:** resolved

**What to build:** o jogador vê um banner full-width de 50dp no rodapé de todas as telas (início, jogo, perfil, coleção, Desafio Diário, loja). Em build de desenvolvimento o banner é o anúncio de teste do Google (`TestIds.BANNER`, sempre carrega); em produção usa a ad unit real de banner da plataforma. O espaço de 50dp fica reservado mesmo quando o anúncio não carrega (`NO_FILL`), para o layout nunca pular.

**Blocked by:** None — can start immediately.

- [x] Banner full-width de 50dp (`ANCHORED_ADAPTIVE_BANNER`) renderizado no rodapé em todas as telas, sem sobrepor conteúdo — nota: o enum desta versão do SDK não tem mais `ADAPTIVE_BANNER` (migrou para `ANCHORED_`/`LARGE_ANCHORED_`/`INLINE_`); o `ANCHORED_ADAPTIVE_BANNER` é o equivalente clássico ancorado de ~50dp
- [x] Em dev (`NODE_ENV !== 'production'`) usa `TestIds.ADAPTIVE_BANNER` (test id oficial de banner adaptativo); em produção usa a ad unit real selecionada por plataforma (Android via `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID`; iOS idem `_IOS` quando configurada)
- [x] Sem env da plataforma, o app degrada sem quebrar (banner não renderiza; jogo intacto) — mesmo padrão do rewarded
- [x] Espaço de 50dp reservado mesmo com `NO_FILL` (estabilidade de layout)
- [x] Regra de visibilidade pura testável (`shouldShowBanner`, type guard) com testes no seam (engine/adProvider.test.ts)
- [x] Validação em dev build no emulador: banner de teste visível em todas as telas (START, GAME/Rodada, PROFILE, COLLECTION, SHOP, DAILY CHALLENGE), navegação intacta, sem sobreposição de conteúdo (ScrollViews terminam em y=2269; banner ocupa o rodapé a partir de y=2269)

**Dependência externa (não bloqueante):** a ad unit de **banner** no dashboard do AdMob (ação humana, fluxo do rewarded) — só necessária para o env real de produção; o ticket funciona com `TestIds.BANNER` em dev.
