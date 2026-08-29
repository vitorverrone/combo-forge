# 01 — UX/robustez: orientação, tooltip, erro de rede, loading do anúncio

**What to build:** o jogo trava de verdade em portrait em tablets/telas grandes (hoje meio-gira acompanhando o dispositivo); a tooltip de Relíquia fecha ao tocar em qualquer lugar da tela, não só sozinha ou trocando de ícone; erros de conectividade no Desafio Diário mostram uma mensagem amigável de "sem internet" em vez do erro técnico cru do Supabase/fetch; o botão de assistir anúncio ganha um spinner visível além do texto que já troca hoje.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-agent

- [ ] `plugins/withAndroidResizable.js`: muda `android:resizeableActivity` de `'true'` para `'false'`; atualiza o comentário do arquivo pra refletir a nova intenção (travamento real, não mais suporte a redimensionamento). Mantém `withOrientationLockCompat` como está.
- [ ] `components/RelicRow.tsx`: `openRelicId` deixa de ser `useState` interno e passa a ser prop controlada (`openRelicId: string | null`, `onOpenRelicIdChange: (id: string | null) => void`), usada só no modo não-compact.
- [ ] `components/GameScreen.tsx`: passa a possuir o estado `openRelicId`, repassa como prop pro `RelicRow`, e renderiza um overlay full-screen transparente (mesmo padrão de `styles.overlay` já usado pelo modal de abandonar run) visível só quando `openRelicId !== null`, com `zIndex` acima do conteúdo do jogo e abaixo da tooltip — toque no overlay fecha a tooltip (`onOpenRelicIdChange(null)`) sem acionar o que está por baixo.
- [ ] `store/dailyFlow.ts`: `messageOf` ganha checagem para `TypeError` com mensagem `"Network request failed"` (falha de conectividade do fetch do React Native) — quando bate, devolve a chave i18n `daily.networkError` em vez do `error.message` cru. Outros tipos de erro continuam no fallback atual.
- [ ] `i18n/en.json` e `i18n/pt.json`: nova chave `daily.networkError` ("No internet connection. Check your network and try again." / "Sem conexão com a internet. Verifique sua rede e tente novamente.").
- [ ] `components/DailyChallengeScreen.tsx`: botão de assistir anúncio ganha um `ActivityIndicator` pequeno ao lado do texto quando `daily.adLoading` é `true` (o texto que já troca pra `daily.watchAdLoading` permanece).
- [ ] Teste em `store/dailyFlow.test.ts` cobrindo que um `TypeError('Network request failed')` no fetch do seed/leaderboard/nome de exibição vira a mensagem de `daily.networkError`, e que outros tipos de erro continuam caindo no fallback (`error.message`) — comportamento puro, sem mock de rede real.
- [ ] Validação manual do fechamento de tooltip e do spinner do anúncio via skill `run` (emulador) — sem precedente de teste de componente no repo.
- [ ] Validação manual do travamento de orientação **num tablet real**, via novo build EAS preview — não valida em emulador (a causa raiz é específica de tela grande/Android 16 compat mode). Se a Activity ainda acompanhar a orientação física após essa mudança, é achado de bug pra uma iteração seguinte, não reabre esta ticket.
