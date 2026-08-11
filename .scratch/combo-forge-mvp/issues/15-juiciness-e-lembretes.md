# 15 — Juiciness e lembretes

**What to build:** O feedback sensorial que sustenta os pilares de RPE e Flow: efeito sonoro com pitch ascendente conforme o Multiplicador de Combo cresce, vibração háptica curta e proporcional ao tamanho do combo (nunca constante, para evitar fadiga), animação de "quase lá" na derrota por margem pequena, e o lembrete gentil de pausa após várias Runs consecutivas em curto intervalo. Todo o feedback é acionado por eventos do motor, sem lógica de regra na UI.

**Blocked by:** 09 — Fim de Rodada e derrota, 10 — Forja na UI

**Status:** done

- [x] Cada Jogada aciona feedback sonoro com pitch ascendente proporcional ao Multiplicador de Combo
- [x] Vibração háptica curta e proporcional ao tamanho do combo, sem vibração constante
- [x] Derrota por margem pequena destaca visualmente a barra de progresso "quase cheia"
- [x] Lembrete gentil de pausa aparece após X Runs consecutivas em intervalo curto, sem bloquear o jogo
- [x] O feedback é disparado por eventos emitidos pelo motor; a UI não contém regra de jogo
