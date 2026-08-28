# 01 — Tentativas extras ilimitadas via anúncio no Desafio Diário

**What to build:** Hoje o Desafio Diário trava em 1 tentativa gratuita + 1 extra via
anúncio (`DAILY_MAX_ATTEMPTS = 2`, `extraUnlocked: boolean` só liga uma vez por dia).
Remove esse teto: o jogador pode assistir anúncio pra ganhar mais uma tentativa
indefinidamente, um anúncio por vez — precisa terminar a Run desbloqueada atual (vitória
ou derrota) antes de poder assistir o próximo anúncio. Nunca acumula anúncios em
sequência sem jogar entre eles.

**Design decidido em conversa (sem `/grill-with-docs` — escopo pequeno, já fechado):**
- Sem teto de tentativas por dia.
- Gate por Run: só pode assistir outro anúncio depois de consumir (jogar) a tentativa
  desbloqueada pelo anúncio anterior.
- O card "tentativas restantes X/Y" mantém o formato de fração — Y vira dinâmico
  (tentativas já desbloqueadas hoje: 1 grátis + 1 por anúncio assistido), não mais um
  teto fixo.

**Modelo de dados (`engine/daily.ts`):**
- `DailyAttempts.extraUnlocked: boolean` → `DailyAttempts.unlockedTotal: number`
  (começa em `DAILY_FREE_ATTEMPTS`, +1 a cada anúncio assistido com sucesso).
- Remove `DAILY_EXTRA_ATTEMPTS` e `DAILY_MAX_ATTEMPTS` (não fazem mais sentido sem
  teto). `DAILY_FREE_ATTEMPTS` continua existindo (gate da 1ª tentativa do dia).
- `canPlayDaily(state)`: `attemptsUsed < unlockedTotal`.
- `consumeDailyAttempt(state)`: só incrementa `attemptsUsed` (não mexe em
  `unlockedTotal`).
- `unlockExtraAttempt(state)`: `unlockedTotal + 1`.
- `canWatchExtraAd(state)`: `attemptsUsed >= unlockedTotal` (sem tentativa desbloqueada
  e não jogada esperando — é o que impõe "uma Run por anúncio"; como `unlockedTotal`
  começa em 1, isso já implica que a gratuita foi usada).

**Blocked by:** nenhuma (segue direto do Desafio Diário já em produção).

**Status:** done

- [x] `canPlayDaily`/`canWatchExtraAd`/`consumeDailyAttempt`/`unlockExtraAttempt` usam
      `unlockedTotal` em vez de `extraUnlocked`, sem teto de tentativas por dia
- [x] Assistir um anúncio com sucesso, jogar a Run, terminar (vitória ou derrota),
      assistir outro anúncio e jogar de novo funciona repetidamente (testado pelo menos
      3 ciclos em teste automatizado)
- [x] Não é possível assistir dois anúncios em sequência sem jogar a tentativa
      desbloqueada pelo primeiro entre eles (`canWatchExtraAd` fica falso enquanto
      houver tentativa desbloqueada e não jogada)
- [x] `DailyChallengeScreen`: card de tentativas mostra `X/Y` com `Y = unlockedTotal`
      (cresce a cada anúncio assistido, nunca mais um teto fixo)
- [x] `DailyChallengeScreen`: estado "sem tentativas hoje, volte amanhã" some — sempre
      que `rem === 0`, o anúncio está disponível (copy de hint reflete isso)
- [x] `StartScreen`: contador "`X/Y` tentativas usadas" usa `unlockedTotal` como `Y`
      (não mais `DAILY_MAX_ATTEMPTS`)
- [x] Texto do hint de assistir anúncio (`daily.watchAdHint`) deixa de dizer "uma
      segunda" tentativa (não é mais a 2ª, pode ser a Nª) — pt e en atualizados juntos
- [x] `daily.noAttemptsLeft` removido do i18n (pt+en) se ficar de fato inatingível
- [x] `CONTEXT.md` (glossário "Desafio Diário") e `SRS_Combo_Forge.md` (RF-27)
      atualizados para refletir tentativas ilimitadas via anúncio, uma por vez

## Comments

Implementado em `feat/01-tentativas-extras-ilimitadas`. Design fechado em conversa (sem
`/grill-with-docs` completo — escopo pequeno): sem teto, gate de uma tentativa por
anúncio, denominador `X/Y` dinâmico.

`/code-review` (Standards + Spec) rodou em paralelo. Spec: sem achados, os 9 critérios do
checklist verificados no diff. Standards: 1 achado real, corrigido — o rename
`extraUnlocked: boolean` → `unlockedTotal: number` não normalizava dado persistido no
formato antigo; um dispositivo que já tivesse jogado hoje antes do update e reabrisse o
app no mesmo dia UTC ficaria travado (nem jogar nem assistir anúncio) até o rollover do
dia seguinte sobrescrever o estado sozinho, silenciosamente. Corrigido normalizando
`unlockedTotal` ausente dentro de `dailyAttemptsForDay` (o choke point por onde toda
leitura do estado do dia já passava), com teste cobrindo o formato antigo persistido.
Achado de estilo (baixa severidade, não corrigido): `DailyChallengeScreen` infere "a
tentativa pronta é a extra" via `attemptsUsed > 0`, que só é correto porque
`DAILY_FREE_ATTEMPTS === 1` — dependência implícita, mas não documentada no callsite.

