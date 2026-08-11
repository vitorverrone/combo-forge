# 06 — Motor: Relíquias e Forjadores

**What to build:** O motor aplica as Relíquias (pool de 10 em 4 categorias — Naipe, Padrão, Mecânica sem "+1 Jogada" e Combo — com máximo de 3 ativas) ao cálculo de pontuação e à estrutura da Rodada, e implementa os Forjadores (Aprendiz, Martelo, Bigorna) com Relíquia exclusiva de largada fora do teto. Entrega a aplicação das regras com testes.

**Blocked by:** 04 — Motor: Rodada, Meta e Combo, 05 — Motor: Forja e Cartas Forjadas

**Status:** ready-for-agent

- [ ] Relíquias de Naipe e Padrão alteram o cálculo do Valor-Base; de Mecânica alteram estrutura (ex.: +1 Descarte, +1 carta na Mão, nunca +1 Jogada); de Combo alteram o Multiplicador de Combo
- [ ] O teto de 3 Relíquias ativas é respeitado em qualquer caminho de aquisição
- [ ] Cada Forjador tem sua Relíquia exclusiva aplicada na largada da Run, fora do teto de 3
- [ ] Aprendiz começa sem relíquia; Martelo (Padrão) e Bigorna (Combo) aplicam seus arquétipos
- [ ] As Relíquias ativas fazem parte do estado serializável da Run
