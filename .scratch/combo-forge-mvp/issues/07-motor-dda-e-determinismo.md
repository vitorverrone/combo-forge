# 07 — Motor: DDA e determinismo

**What to build:** O motor aplica o DDA sobre a curva base de Metas usando um histórico persistente acessado via port de storage injetado: falhar a mesma Rodada 3 vezes seguidas reduz a Meta dela em 10%; 5 vitórias fáceis consecutivas (margem ≥ 30% acima da Meta com 1+ Jogada sobrando) aumentam a Meta em 10% e a frequência de Relíquia rara. Inclui a flag "sem DDA" para o Desafio Diário e testes de determinismo de seed.

**Blocked by:** 04 — Motor: Rodada, Meta e Combo, 06 — Motor: Relíquias e Forjadores

**Status:** ready-for-agent

- [ ] Ajustes de −10%/+10% na Meta são aplicados a partir do histórico persistido por Rodada
- [ ] "Vitória fácil" é definida por margem ≥ 30% acima da Meta com 1+ Jogada sobrando
- [ ] O histórico (Rodada da última derrota, falhas consecutivas nela, vitórias fáceis consecutivas) persiste entre Runs via port de storage injetado (implementação em memória para testes)
- [ ] A flag "sem DDA" desliga todos os ajustes de Meta (usada pelo Desafio Diário)
- [ ] Teste de determinismo: mesmo seed → mesma sequência de embaralhamento e de ofertas de Forja/Relíquia
- [ ] Dicas visuais de hesitação são apenas eventos de UI, sem alterar a Meta
