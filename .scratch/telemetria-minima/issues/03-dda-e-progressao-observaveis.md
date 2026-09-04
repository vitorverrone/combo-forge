# 03 — DDA e progressão observáveis

**What to build:** Os eventos que tornam a calibração do DDA e a profundidade da meta-progressão observáveis. Depois deste ticket dá pra medir a distribuição real de ajustes de DDA por coorte de habilidade (o DDA hoje só foi calibrado contra perfis simulados) e quantas sessões um jogador leva até esgotar os marcos de meta-progressão desbloqueáveis.

**Blocked by:** 01 — Port de telemetria (Firebase Analytics) instalado e conectado.

**Status:** done

- [x] O ponto do `gameStore` que chama `persistDda`/`updateDda` (`engine/dda.ts`) dispara `dda_adjustment` com a direção (Meta reduzida ou aumentada) e o gatilho (3 derrotas seguidas / 5 vitórias fáceis) — só quando o ajuste resultante muda a Meta de fato, não a cada Rodada. Classificado por `ddaAdjustment()`, novo em `engine/dda.ts`.
- [x] O ponto do `gameStore` que chama `claimOption`/`claimReachedSingles` (`engine/progression.ts`) dispara `milestone_unlocked` com o identificador do marco — `milestoneId` (ex.: `fifthRunWon`) e `optionId` (ex.: `value-bonus-7`), achado do code-review: só `optionId` não identifica o marco em si nos casos multi-opção.
- [x] Testes cobrindo os dois eventos acima com o `TelemetryProvider` fake, incluindo o caso em que uma Rodada é resolvida sem mudança na Meta do DDA (sem disparo de `dda_adjustment`) — 13 testes novos entre `dda.test.ts` e `gameStore.test.ts`.
