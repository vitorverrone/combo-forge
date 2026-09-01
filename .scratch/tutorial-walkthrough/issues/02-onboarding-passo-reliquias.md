# 02 — 5º passo do onboarding: Relíquias e a Forja

**What to build:** antes de começar a jogar, o onboarding estático (hoje 4 passos: seleção de cartas, Padrões, Combo, Alvo) ganha um 5º passo explicando o conceito de Relíquia (efeito permanente pro resto da Run) e Efeito de Carta (fortalece uma carta específica) — inserido antes do CTA final "Vamos Forjar", que continua sendo o último passo.

**Blocked by:** 01 (Remove a tentativa abandonada com react-joyride) — mesmo arquivo (`OnboardingOverlay.tsx`) tocado por ambos.

**Status:** ready-for-agent

- [ ] `components/OnboardingOverlay.tsx`: novo passo `relics` adicionado a `STEP_KEYS`/`STEP_VISUALS`, seguindo exatamente o padrão já existente dos outros 4 passos — inserido antes do passo final atual (que continua com o CTA "Vamos Forjar").
- [ ] Visual próprio do novo passo (mesmo padrão dos outros `StepVisual`): um ícone de Relíquia ao lado de uma carta com Efeito, lado a lado.
- [ ] `i18n/en.json` e `i18n/pt.json`: novas chaves de título/corpo/dica pro passo, seguindo a mesma estrutura (`title`/`body`/`tip`) já usada pelos outros 4 passos.
- [ ] Os dots de progresso do onboarding passam a refletir 5 passos (não 4) automaticamente, já que são derivados de `STEP_KEYS.length` — confirmar que nada mais no componente assume "4 passos" como valor fixo.
- [ ] Validação manual via skill `run`: percorrer o onboarding completo em pt-br e em inglês, confirmar que o novo passo aparece na posição certa e que "Vamos Forjar" continua fechando o fluxo.
