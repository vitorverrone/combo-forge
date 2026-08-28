# Rebalance P1 pós health-check: nerf na fonte + DDA assimétrico + Forjadores com identidade própria

O health-check de 2026-08-28 (`docs/playtest/health-check-2026-08-28.md`) achou que o Multiplicador de Combo escala exponencialmente enquanto o DDA só ajustava a Meta ±10% — incapaz de compensar builds de sorte — e que o Forjador Bigorna era estritamente melhor que Aprendiz/Martelo, sem tradeoff real. Decidimos não escolher uma única alavanca e sim combinar três frentes:

1. **Nerf na fonte dos outliers**: o passo de crescimento do Multiplicador de Combo da Relíquia Chain Reaction cai de 2 para 1.5; o Multiplicador de Combo inicial do Bigorna cai de 2 para 1.5.
2. **DDA assimétrico**: o ajuste de vitórias fáceis sobe de 10% para 15%; o de falhas consecutivas permanece em 10% — só o lado que precisa conter o snowball fica mais forte, evitando punir runs travadas além do necessário.
3. **Identidade real pros três Forjadores**: Aprendiz ganha +1 carta na Mão (explorador — mais opções de Padrão); Martelo dobra o bônus de Trinca (especialista — vale perseguir o padrão); Bigorna perde poder bruto mas continua a opção estável (Multiplicador de Combo garantido cedo).

**Achado que motivou o item 1, e o mais fácil de reintroduzir por acidente**: o boost de Relíquia rara (ativado após 5 vitórias fáceis seguidas) sorteava entre *todas* as Relíquias raras, incluindo a Chain Reaction — ou seja, o próprio sistema pensado pra ajudar o DDA a conter builds fortes empurrava a Relíquia mais forte de Multiplicador de Combo bem na hora em que o jogador já estava ganhando fácil. A correção exclui Relíquias de categoria Combo do pool elegível a esse boost. Qualquer novo boost de raridade precisa preservar essa exclusão, ou o mesmo loop volta.

## Alternativas consideradas

- **Só ampliar o DDA, sem nerf na fonte**: descartado — mesmo a ±20% não fecha um gap de 12–15× criado por multiplicadores exponenciais; é rounding error contra o problema real.
- **Detector de multiplicador no DDA** (reduzir a Meta ao detectar que o jogador pegou Chain Reaction/Bigorna): mais correto arquiteturalmente como feedback loop, mas exige tracking novo de estado. Adiado — reavaliar num novo health-check se o combo acima não for suficiente.
- **Trocar o Multiplicador de Combo por bônus aditivo**: descartado sem debate — contradiz o Pilar 2 da GDD (Erro de Predição de Recompensa via multiplicadores), não é uma decisão de balance, é reabrir um pilar de design que ninguém pediu pra reabrir.
