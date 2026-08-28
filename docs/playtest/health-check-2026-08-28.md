# Game Health Check: Combo Forge

**Data**: 2026-08-28 · **Modo**: Desk-Review · **Análise**: 3 subagents (Veterano, Novato, Analista)

---

## Veredito por Pilar de Design

| Pilar (da GDD) | Entregue? | Evidência |
|---|---|---|
| **Flow** (dificuldade dinâmica) | Parcial | Veterano: DDA é teatral (±10% não fecha gap de 2–3× multiplicador). Analista: ±10% é ajuste leve demais contra exponencial. Novato: sequer vê a curva (fórmula invisível). |
| **Erro de Predição de Recompensa** | Parcial | Novato: nenhum pico de dopamina nas rodadas 1–2; primeira jogada ×1 não gera surpresa. Veterano: reward concentrado em outliers (Chain Reaction + ×3 forja). |
| **Efeito Zeigarnik** | Não | Novato: confuso demais para sentir "quase vitória"; frustração supera retenção. Veterano: percebe RNG, não maestria. |
| **Competência (SDT)** | Parcial | Progressão gated por wins, não por performance relativa. Veterano: 70% luck, 30% skill. Novato: não distingue o que controlou. |
| **Juiciness** | Não testado | Design descrito (som pitch, partículas, haptic) mas não verificado em desk-review. |

---

## Divergências entre Veterano e Novato (Achados Diagnósticos)

| Perspectiva | Veredito | O que Revela |
|---|---|---|
| **Veterano** | "Trivial — multiplier stacking derrota tudo; DDA inerte; RNG domina" | Core está **quebrado**: exponencial multiplicador (×2–×3) vs. ajuste linear (±10%) não combina matematicamente. |
| **Novato** | "Muito confuso — controles, padrões, valores, multiplicador nunca foram explicados" | Core está **bem desenhado**, mas comunicação é fraca: GDD vende "puzzle numérico" sem explicar regras de entrada. |
| **Gap Diagnóstico** | Um acha trivial (entendeu tudo); outro acha impossível (entendeu nada) | **Raiz**: Tutorial deficiente + UI não descritos na GDD. Mecânica é viável se explicada bem. |

**Recomendação**: Não é um bug de design core — é uma falha de comunicação. Veterano vai aproveitar bem uma versão clara; Novato vai rejeitar a atual apesar de bem desenhada.

---

## Análise Quantitativa de Balanceamento

**Fontes analisadas**: `engine/patterns.ts`, `engine/cards.ts`, `engine/relics.ts`, `engine/forge.ts`, `engine/dda.ts`, `GDD Section 4.2`, CONTEXT.md (curva base).

### Tabela de Outliers

| Elemento | Range Esperado | Valor Real | Problema | Severidade |
|---|---|---|---|---|
| **Multiplicador ×3 forja** | Eficiência ~1:1 vs +Value | ×20× melhor em R4–6 (exponencial vs linear) | Domina toda estratégia; trivializa se oferecido cedo | 🔴 P1 |
| **"Combo Cascata" (Anvil + Chain Reaction + ×3)** | ~+60% esperado | ×20 multiplicador total (vs ×10 base) | 20–30% runs Anvil trivializadas em R6 | 🔴 P1 |
| **Quadra vs Trinca** | +45% esperado | +180% (bonus 70 vs 25) | Padrão muito raro; high-roll ocasional aceitável | 🟡 P2 |
| **DDA ±10%** | Deve fechar gaps 20–50% | Fecha 10%, não fecha 200%+ | Teórico vs prático mismatch | 🔴 P1 |
| **Anvil vs Apprentice** | Tradeoff esperado | Anvil estritamente melhor (×2 vs ×1) | Nunca escolher Apprentice/Hammer depois | 🟡 P1 |
| **Reward primeira jogada** | Pico de dopamina esperado | ×1 multiplicador = nenhum boost perceptível | RPE pilar falha no minuto 1 | 🟡 P2 |

### Cruzamento com Play Real (Desk-Mode)

- **Veterano encontrou**: "×3 multiplier em carta baixa + Straight loops = meta de R3 batida com plays sobrando" (evidência: 68×3 + 68×4 = 476 pontos vs meta 144).
- **Analista confirmou**: Curva exponencial (×2–×3) domina curva linear (+Value). Multiplicadores são 20× mais eficientes em rodadas tardias.
- **Novato**: Não chegou a explorar estratégias (confuso demais com padrões/valores básicos).

---

## Perspectiva do Veterano

**Resumo**: Card roguelike veteran, fluente em deckbuilder synergy e economia de recursos.

**Sessão Típica (5 runs)**:

1. **Runs 1–2**: Base difficulty, Apprentice. "Trivial — qualquer Straight/Trigger combo passa fácil." Veterano está entediado.
2. **Run 3**: Lucky Forge (×3 multiplicador). "Speedrun — meta batida por R3, plays sobrando." Veterano percebe problema: RNG domina.
3. **Runs 4–5**: Unlock Anvil. "Nunca vou pegar Apprentice/Hammer de novo. Está resolvido."
4. **Endgame (10+ runs)**: Viu todos os Forge effects. Otimizou card selection (Straights > 3-of-kind > rest). Realiza: "Multiplicadores quebram tudo. O jogo é solved: pedir sorte na Forja."

**Avaliação Final**:
- **Estratégia dominante**: "Multiplicador > everything else. Pedir ×3 na Forge, chain Straights, ignore resto."
- **Skill ceiling**: Baixo (reconhecer padrão = poker 101; calcular Valor-Base = aritmética; única decisão com dente = qual Forge efeito pegar).
- **RNG vs Skill ratio**: ~70% luck (Forge offers), ~30% skill (otimizando dado o offer).
- **Tempo até boredom**: ~6–8 horas. Combination space é trivial (40 cartas fixas, resolvido em 5 runs).
- **Comparação ao gênero**: Slay the Spire (300+ cartas, rarity gates, hidden synergies) >> Balatro (infinite contexts) >> **Combo Forge** (40 fixed, no reroll, no depth).

**Veredito de uma linha**:
*Strategically shallow — multiplicador stacking trivializa challenge, DDA não compensa, Forge RNG domina choice; puzzle mechanics interessante mas profundidade insuficiente para engagement além de uma noite.*

---

## Perspectiva do Novato

**Resumo**: First-time player de Card Roguelike. Nunca tocou no gênero. Lê apenas o que um novo player veria na GDD.

**Primeiros 5 Minutos**:

- **Minuto 0**: Clico "Jogar". Vejo cartas na tela.
  - Confusão 1: Controles? Click? Drag? A GDD não descreve.
  - Confusão 2: Quantas cartas na mão? GDD diz "mão de cartas", CONTEXT.md diz 7, mas GDD não menciona.

- **Minuto 1**: Selecionei 3 cartas (suponho que seja uma "jogada"). Agora confirmo?
  - Confusão 3: "Até 5 cartas" (GDD) vs. CONTEXT.md mostra exemplos de 1–5. Posso jogar 1?
  - Confusão 4: O jogo reconhece automaticamente que é uma Trinca? GDD diz "forma uma 'jogada' (ex: par, trinca)" mas não diz se é automático ou manual.

- **Minuto 2**: Jogo mostra "Pontuação: 46". Meta: "Meta 150".
  - Confusão 5: Como chegou a 46? CONTEXT.md tem exemplo ("trinca de 7+7+7 = 25 + 21 = 46") mas novo jogador não leu CONTEXT.md.
  - Confusão 6: Qual é a meta? GDD não explica que começa em 50. CONTEXT.md diz "50 × 1,7^(R−1)" — fórmula que novo jogador não vai entender.

- **Minuto 3**: Segunda jogada. Pontuação sobe para ~120.
  - Confusão 7: "Multiplicador de combo" entrou em ação (×2 na 2ª jogada), mas GDD nunca explicou *quando* ele entra ou por que minha pontuação duplicou.
  - Esperança: "Ah, cada jogada dá mais pontos! Isso é legal."

- **Minuto 4**: Terceira e quarta jogadas. Chego a 147. Faltam 3 pontos. Tenho 0 jogadas.
  - Realização: Perdi por 3 pontos.
  - Frustração: GDD promete "derrotas por pouca margem reforçam Zeigarnik", mas sem entender a fórmula, sinto apenas confusão + frustração.

**Reward Gap Crítico**:
- 1ª jogada: ×1 multiplicador = nenhum boost. "Apenas... pontuei?"
- Rodadas 1–2: Meta é 50 → 85. Qualquer Straight mediano passa. Nenhum pico de "aha!" ou dopamina.
- Esperado: picos de recompensa (RPE) — Zeigarnik — sensação de crescimento.
- Real: crickets até rodada 3–4.

**Avaliação Final**:
- **Entendo o conceito?** Sim, depois de ler CONTEXT.md inteiro (não apenas "seções essenciais").
- **Entendo como controlar?** Não. A GDD não menciona toques, drags, botões.
- **Entendo por que meu primeiro jogo foi fácil?** Não. Meta não é transparente.
- **Abriria amanhã?** Só se o primeiro jogo tivesse tutorial explicando padrões e eu tivesse sentido um "quase venci!" genuíno — não sabendo se esse momento vai chegar.

**Veredito de uma linha**:
*Inteligibilidade comprometida por falta de descrição UI (como seleciono cartas), valores de padrão não explicitados, curva invisível — regras relegadas ao CONTEXT.md ou dedução; novo jogador não retorna sem onboarding claro.*

---

## Metas de Retenção da GDD — Risco Identificado

| Métrica-alvo (GDD) | Alvo | Achado que Ameaça |
|---|---|---|
| **D1 Retention** | 40–45% | Tutorial deficiente; confusão sobre padrões, valores, multiplicador na entrada. Novato não entende as regras → não voltar. **Risco: ALTO** |
| **D7 Retention** | 16–20% | RNG de Forja domina (70% luck vs 30% skill); Veterano percebe ser gated por sorte, não maestria. Teto de habilidade baixo (40 cartas fixas). **Risco: MÉDIO** |
| **D30 Retention** | 6–9% | Combinação space resolvida em 5 runs; loop repetitivo após entender multiplicadores; falta content novo ou desafio emergente. **Risco: MÉDIO** |
| **Sessão média** | 6–10 min | Novato: confuso, sai cedo. Veterano: otimiza, pode ser mais rápido (runs speedrunned com luck). Impacto: talvez 5–7 min vs 6–10 alvo. **Risco: BAIXO-MÉDIO** |
| **Sessões/dia** | 2–4 | Zeigarnik (pilar base) prometido mas confusão impede sentiment de "quase vitória". Retenção comprometida. **Risco: MÉDIO** |

---

## Checklist de Risco de Churn

- ✅ **Primeira jogada não dá reward perceptível**: ×1 multiplicador = zero boost, nenhum pico de dopamina no minuto 1.
- ✅ **Tutorial e regras invisíveis**: CONTEXT.md é oculto; GDD não menciona padrões até exemplo de Novato.
- ✅ **Padrões não explicados**: Carta Alta, Par, Dois Pares, Trinca, Sequência, Full House, Quadra — zero menção na GDD Section 3 (core loop).
- ✅ **Meta invisível**: Curva 50 × 1,7^(R−1) não está explicada na GDD; novo jogador não sabe por que meta é 150.
- ✅ **RNG de Forja demoraliza**: 70% luck vs 30% skill; Veterano sente impotência; Novato sente aleatório.
- ❓ **Controles obscuros**: GDD não descreve como selecionar cartas; UI pode ser intuitiva se bem feita, mas não documentada.

---

## Discussão Aprofundada: Insights Técnicos

### 1. O Problema Não É Core, É Comunicação

**Achado**: Veterano acha trivial (RNG domina). Novato acha confuso (regras ocultas). Analista encontra outliers reais.

**A lacuna**: A GDD é *game-designer-facing* (descreve intenção, pilares, fórmulas abstratas), mas falta completamente uma descrição *player-facing* (como funciona na tela?).

Exemplo:
- **GDD diz**: "pontuação acumulada é comparada à meta da rodada"
- **Player vê**: Um número "150" em algum lugar
- **Player não sabe**: Por que 150? Como vai mudar? Vai ficar mais fácil ou difícil?

**Ação**: Antes de rebalancear, escrever **spec de onboarding** que explique:
- Cada padrão com seu bônus na ordem de frequência (Carta Alta primeira).
- Como multiplicador de combo se acumula (1ª play ×1 = "sem boost", 2ª ×2 = "dobra").
- Exemplo de Rodada 1 real com números concretos.

---

### 2. Multiplicador é Exponencial; DDA é Linear — Mismatch Matemático

**O problema técnico**:

```
Damage escala exponencialmente: ×3 × ×4 × (Straight bonus) = 12–15× boost
DDA ajusta linearmente: ±10% meta

Resultado: Uma run com ×3 multiplicador oferecido na Forge #1 é ~12× mais fácil
que uma run sem ele. DDA nunca vira essa chave (±10% é rounding error em 12×).
```

**Impacto**: Se DDA não mantém Flow, o pilar central falha. Veterano cakewalk com sorte, frustrado sem sorte. Novato não entende por que uma run é trivial e outra impossível.

**Opções técnicas** (nenhuma é trivial):

| Opção | Prós | Contras |
|---|---|---|
| Ampliar DDA (±20%) | Simples; muda um número. | Ainda não fecha 12×; runs com ×3 podem ficar fáceis mesmo depois. |
| Reduzir multiplicador pool | Equilibra exponencial/linear. | Remove "combo crescente" (core fantasy). |
| Detector de multiplicador em DDA | "Detectou ×3, reduz meta"—feedback loop real. | Complexo de implementar; requer tracking. |
| Trocar multiplicador por aditivo | Lineariza tudo; ±10% funciona. | **Quebra fantasy**—multiplicadores é o core. |

**Recomendação**: Combinar redução de Chain Reaction rarity + ampliar DDA para ±15% é menos intrusivo. Testa se 20–30% das runs Anvil ainda trivializadas após mudança.

---

### 3. Forger Choice é Ilusória — Rebalancear para Real Tradeoff

**Achado**: Anvil > Hammer >> Apprentice sempre. Não há tradeoff genuíno.

**Problema**: GDD promete "não-linear tree; jogador escolhe qual forjador evoluir". Real: Após unlock Anvil, nunca mais escolher outro.

**Rebalance proposto**:

| Forger | Status atual | Proposta | Rationale |
|---|---|---|---|
| **Apprentice** | ×1, nada | ×1 + "draw 8 cartas em mão (vs 7)" | Mais opções de padrão/sinergia; diferencial genuíno. |
| **Hammer** | ×1 + "+20% Three-of-a-Kind" | ×1 + "+50% Three-of-a-Kind + Triggers de Trinca dão +30" | Trinca é padrão raro; torna-o chase pattern legítimo. Ativa estratégia própria. |
| **Anvil** | ×2 starter (dominante) | ×1.5 starter + "Warm Up sempre em Forge #1" | ×1.5 é menos brutalmente melhor. Warm Up garantido = seguro, menos "pray for multiplier". |

**Efeito**: Cada Forger tem identity e tradeoff:
- **Apprentice**: Explorador (8 cartas = mais descoberta de sinergia).
- **Hammer**: Especialista (Trinca é seu pattern; build ao redor).
- **Anvil**: Estável (multiplicador garantido cedo; menos RNG).

---

### 4. RPE Pilar Falha No Minuto 1 — Corrigir Cedo

**Achado do Novato**: Primeira jogada ×1 = "apenas... pontuo?" Nenhum pico de dopamina.

**Por que importa**: Zeigarnik (pilar) depende de RPE (pilar). Player só sente "quase vitória" se tiver sentido crescimento antes. Sem RPE no minuto 1, Zeigarnik fica inerte.

**Soluções rápidas**:

1. **Bonus inicial**: Todos os runs começam com ×1.2 na primeira jogada. (Sinaliza "crescimento".)
2. **Primeira Forja garantida**: Forge #1 sempre oferece carta de valor alto (+5 bônus). Valida "collect big cards" imediatamente.
3. **Pattern hint visual**: Se player forma Straight na 1ª jogada, UI destaca "Sequência! +40 bônus". Dopamina via recognition.

**Impacto**: RPE ativa cedo; Novato tem "aha moment" antes de primeira derrota; Zeigarnik carregado quando derrota chegar.

---

## Próximos Passos Recomendados

**Três caminhos**:

1. **Atacar P0 primeiro (Tutorial)**
   - Escrever onboarding spec + exemplos concretos na GDD.
   - Não precisa tocar código; é documentação.
   - Beneficia ambos: Veterano leitura clara, Novato guia de entrada.

2. **Atacar P1 primeiro (Balance)**
   - Reduzir Chain Reaction rarity; ajustar Anvil ×1.5; rebalancear Forgers.
   - Precisa tocar código (engine/).
   - Beneficia Veterano (remove trivialidade); não ajuda Novato sem Tutorial.

3. **Ambos em paralelo**
   - Tutorial agora; code changes em outra branch.
   - Re-run health-check depois de ambas as mudanças.

---

## Recomendações Priorizadas

| Prioridade | Categoria | Achado | Ação Sugerida |
|---|---|---|---|
| 🔴 P0 | Design / Onboarding | Tutorial deficiente ameaça D1 (40–45%) | Escrever onboarding spec na GDD: listar padrões com bônus (Carta Alta +0, Par +10, Trinca +25, etc.); explicar multiplicador de combo com exemplo (1ª jogada ×1, 2ª ×2, etc.); wireframe tela de primeira jogada com dicas de padrão; tutorial deve tornar regras óbvias antes de primeira derrota. |
| 🔴 P1 | Balance | Multiplicador ×3 trivializa (20–30% runs) | Reduzir Chain Reaction rarity de rare para ultra-rare (0.25); ou reduzir seu step de +2 para +1.5. Rebalancear Anvil: considerar ×1.5 em vez de ×2 starter. Re-run análise pós-ajuste para validar. |
| 🔴 P1 | Design | DDA inerte (±10% vs 2–3× multiplicador) | Ampliar DDA: considerar ±20% ajuste ou ±5 meta points (absoluto); ou disparar rare relic boost detectando ×1.5× multiplicador (feedback loop real). Ou aceitar light DDA e rebalancear via Forge pool (menos multiplicadores, mais diverse efeitos). |
| 🟡 P1 | Design / Forger Choice | Anvil estritamente melhor (×2 vs ×1) | Rebalancear Forgers: Hammer +20% Three-of-a-Kind (padrão raro, diferencial); Anvil ×1.5 starter; Apprentice ×1 + sidekick efeito (ex: 8 cartas em mão vs 7). Cada um genuinamente diferente; choice importa. |
| 🟡 P2 | Design / RPE | Primeira jogada não gera dopamina | Considerar boost inicial: todos runs começam com ×1.2 na 1ª jogada? Ou garantir 1ª Forja oferece carta de valor alto (+5 bônus) validando estratégia cedo. Testa se RPE pilar ativa mais rápido. |
| 🟢 P2 | Polish | Ciclo de vitória visível | GDD promete "derrotas destacadas visualmente"; verificar que tela de derrota mostra margem (ex: "faltaram 3 pontos") em lugar proeminente. Se implementado bem, Zeigarnik pilar ativa. |

---

## Notas de Síntese

**O problema central não é o core de jogo** — multiplicadores vs. padrões é uma mecânica sólida. **É a comunicação**: Novato não entende as regras, Veterano percebe RNG, ambos saem. 

A solução é dupla:
1. **Tutorial claro** (P0): Padrões, bônus, multiplicador com exemplos antes de primeira sessão.
2. **Rebalanceamento de outliers** (P1): Multiplicadores dominam; reduzir Chain Reaction e Anvil power, fazer Forger choice genuíno.

Com essas mudanças, o game tem potencial. Sem elas, D1 retention sofre.

---

**Relatório concluído**: 2026-08-28 · Desk-Review Mode · 3 subagents · Achados classificados (P0–P2) e rotados.
