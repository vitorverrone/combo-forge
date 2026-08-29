# 01 — Anúncio intersticial a cada run

**What to build:** o anúncio intersticial passa a aparecer ao final de toda run normal concluída, em vez de a cada 2 runs. Jogadores que compraram "Remover Anúncios" continuam sem ver nenhum intersticial; runs do Desafio Diário continuam sem intersticial (comportamento já existente, inalterado).

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-agent

- [ ] `store/gameStore.ts`: `INTERSTITIAL_RUNS_INTERVAL` muda de `2` para `1`. Nenhuma outra mudança estrutural — o contador (`interstitialRunsSinceAd`), a guarda de `adsRemoved` e a exclusão das runs do Desafio Diário permanecem exatamente como estão.
- [ ] Teste em `store/gameStore.test.ts` cobrindo: (a) `showInterstitial` fica `true` ao final da 1ª run normal concluída (não mais só na 2ª); (b) com `adsRemoved: true`, `showInterstitial` nunca vira `true`; (c) uma run do Desafio Diário concluída não dispara `showInterstitial`.
