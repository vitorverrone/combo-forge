# DOCUMENTO DE REQUISITOS DO PRODUTO (PRD)

**COMBO FORGE**

Documento de Requisitos do Produto — v1.0 — Agosto de 2026

> Este documento cobre a visão de produto, o problema, o público-alvo, as
> regras de negócio e os fluxos de uso do Combo Forge. Para mecânicas de jogo
> detalhadas, arte e sensorial, ver o [`GDD_Combo_Forge.md`](GDD_Combo_Forge.md)
> — a "bíblia" do jogo. Para vocabulário de domínio, ver
> [`CONTEXT.md`](CONTEXT.md). Para requisitos técnicos/NFRs, ver
> [`SRS_Combo_Forge.md`](SRS_Combo_Forge.md). Para o comportamento exato de
> cada tela, ver [`ESPECIFICACAO_FUNCIONAL_Combo_Forge.md`](ESPECIFICACAO_FUNCIONAL_Combo_Forge.md).

---

## 1. Visão do Produto

Combo Forge é um roguelike de cartas para mobile (iOS/Android) que entrega
sessões de 3 a 8 minutos construídas em torno de reconhecimento de padrões
numéricos. O jogador seleciona cartas da Mão para formar Jogadas (pares,
sequências, full houses etc.); a pontuação cresce exponencialmente através de
um Multiplicador de Combo que aumenta a cada Jogada dentro da Rodada. O
produto existe para transformar micro-momentos de tempo ocioso (fila,
transporte, intervalo de trabalho) em um loop de "só mais uma tentativa"
recompensador e não-punitivo.

Diferente de deckbuilders de combate tático, a pontuação em si é o quebra-
cabeça: a agência do jogador está em ler a Mão, escolher qual Padrão formar e
surfar o Multiplicador de Combo — não em batalhar contra IA inimiga. Isso
torna o jogo mais acessível (sem IA de combate para balancear) preservando
profundidade emergente via builds de Forja e sinergias de Relíquia.

## 2. Problema e Oportunidade

**Problema do jogador:** micro-momentos de espera (fila, ônibus, intervalo)
são tempo cognitivamente disponível mas raramente bem aproveitado por jogos
mobile — a maioria exige sessões longas, pune a saída no meio do jogo, ou usa
mecânicas de recompensa variável predatórias (gacha, loot pago) para reter.

**Oportunidade:** um roguelike de cartas com sessão curta e restart
instantâneo preenche esse tempo com uma dose de domínio e progressão real
(mestria de builds, não sorte paga), sem fricção de retomar (sem tela de
derrota punitiva) e sem o padrão ético questionável de recompensa variável
associada a jogos de compulsão.

## 3. Público-Alvo

**Persona primária:** jogador casual mobile que preenche tempo morto —
trajeto, fila, intervalo de trabalho — com sessões curtas e de baixo
compromisso. Quer reinício imediato e zero punição por parar no meio.

Características:
- Já familiarizado com o vocabulário de roguelike deckbuilder (o gênero é a
  principal referência de mercado), mas não necessariamente um jogador
  hardcore do gênero.
- Joga majoritariamente em uma mão só, na vertical, em ambientes com
  distrações (transporte público, filas).
- Sensível a monetização agressiva — gacha e pay-to-win são um ponto de
  atrito de aquisição/retenção nesse público.

## 4. Posicionamento e Diferenciação

Combo Forge se diferencia por combos numéricos como quebra-cabeça: pontuar é
reconhecer padrões (pares, sequências, full houses) e não combate tático
contra inimigos. Isso o torna:
- **Mais acessível** que deckbuilders de combate — não há IA de inimigo para
  balancear nem curva de dificuldade de combate a aprender.
- **Igualmente profundo** em mestria — sinergias de Relíquia, builds de
  Forja e otimização de combo dão o mesmo espaço de decisão estratégica que
  um deckbuilder de combate, mas expresso inteiramente através de números e
  padrões.

## 5. Objetivos de Negócio e Métricas de Sucesso

Metas de retenção (benchmark do gênero, ver GDD §8):

| Métrica | Alvo |
|---|---|
| D1 Retention | 40–45% |
| D7 Retention | 16–20% |
| D30 Retention | 6–9% |
| Sessão média | 6–10 min |
| Sessões por dia (usuário ativo) | 2–4 |

Essas metas orientam decisões de produto: qualquer mudança que arrisque
alongar a sessão média além de ~10 min, ou introduza fricção no restart,
deve ser questionada contra o pilar de retenção do "one more try" (GDD §1–2).

## 6. Regras de Negócio

### 6.1 Monetização — compromisso ético (não negociável)

- **Nenhum item vendido afeta poder de jogo.** A loja vende exclusivamente
  cosméticos (skins de baralho, efeitos visuais de combo) e a remoção de
  anúncios. Nenhuma carta, Relíquia, Efeito de Forja ou vantagem de
  progressão está à venda.
- **Sem gacha.** Toda compra é direta (preço fixo, item determinado) — não
  há caixa de recompensa com resultado aleatório.
- **Progressão de conteúdo é 100% por conquista**, nunca por moeda ou
  pagamento (Forjadores, Efeitos de Forja bônus e Relíquias raras
  desbloqueiam por marcos de runs vencidas/pontuação — ver §6.3).
- **Anúncios são sempre opt-in.** O único anúncio do jogo é o recompensado
  da tentativa extra do Desafio Diário; nunca há anúncio interstitial
  forçado nem anúncio necessário para progresso core.
- Racional: evitar o padrão de Razão Variável associado a compulsão em
  jogos (GDD §2, §10) — a variabilidade de recompensa do produto fica
  inteiramente restrita a cosméticos, nunca a poder.

### 6.2 Catálogo de monetização

| Item | Tipo | Preço de referência | Afeta jogo? |
|---|---|---|---|
| Obsidian Deck (skin) | Cosmético, IAP consumível único | $0.99 | Não |
| Emerald Deck (skin) | Cosmético, IAP consumível único | $0.99 | Não |
| Royal Deck (skin) | Cosmético, IAP consumível único | $0.99 | Não |
| Remove Ads | Conveniência, IAP não-consumível | $2.99 | Não |
| Tentativa extra do Desafio Diário | Anúncio recompensado opt-in | Grátis (assistir anúncio) | Não |

Todas as compras são processadas via RevenueCat (App Store / Play Store como
backend de pagamento); preços de referência acima são os exibidos em
desenvolvimento — os preços reais em produção vêm da loja da plataforma e
podem variar por região/moeda. Ver §6.1 da SRS para o fluxo técnico de
compra/restore.

### 6.3 Progressão (regra de negócio, não só mecânica)

Toda progressão de conteúdo é gratuita e ligada a marcos de desempenho —
nunca comprável:

| Marco | Desbloqueio |
|---|---|
| 1ª Run vencida | Forjador Martelo |
| 3ª Run vencida | Forjador Bigorna |
| 5ª Run vencida | 2 Efeitos de Forja bônus (jogador escolhe a ordem) |
| Recorde de pontuação ≥ 2.500 numa Run | Relíquias raras entram no pool de ofertas |

### 6.4 Comparação social — regra de privacidade

O ranking do Desafio Diário é **sempre opt-in** (o jogador escolhe abrir o
leaderboard) e **nunca expõe derrota ou identidade de terceiros** — mostra
apenas a posição/pontuação própria e o Top 10 por rank e score, sem nome de
usuário, avatar ou qualquer dado pessoal de outros jogadores. Não há sistema
de contas/login: a identidade no leaderboard é um UUID de dispositivo opaco,
não vinculado a e-mail, nome ou qualquer dado pessoal identificável.

## 7. Fluxos de Uso Principais

(Fluxo completo botão-a-botão está na Especificação Funcional; aqui, a
jornada de produto em alto nível.)

### 7.1 Primeira sessão (onboarding)
Abre o app → overlay de onboarding (4 passos: selecionar cartas, pontuar
Padrão, multiplicador de combo, bater a Meta) → Tela Início → escolhe
Forjador (só o Aprendiz está desbloqueado) → Inicia Run → aprende jogando.

### 7.2 Sessão núcleo ("one more try")
Tela Início → Inicia Run → joga Rodadas (seleciona cartas → joga/descarta) →
vence Rodada → escolhe upgrade na Forja → próxima Rodada → ... → vence a Run
(6 Rodadas) ou perde → tela de resumo com distância até a meta ("So close!")
→ restart imediato, sem tela de derrota punitiva.

### 7.3 Retorno diário (comparação social assíncrona)
Tela Início → Desafio Diário → joga a Run do dia (mesma para todos os
jogadores) → opcionalmente assiste anúncio pra jogar de novo (sem limite,
uma Run por anúncio) → pontuação submetida automaticamente ao fim de cada
Run → opcionalmente abre o leaderboard semanal (opt-in).

### 7.4 Meta-progressão (entre sessões)
Runs vencidas acumulam estatísticas de perfil → marcos desbloqueiam novos
Forjadores/Efeitos/Relíquias → jogador revisita a Coleção para ver o que
falta e reivindicar desbloqueios pendentes de escolha de ordem.

### 7.5 Monetização (opcional, nunca bloqueante)
Tela Início → Loja → compra cosmético (equipa na hora) ou Remove Ads (banner
some imediatamente) → Restaurar Compras disponível para troca de aparelho.

## 8. Escopo do MVP

**Dentro do escopo (implementado):**
- Loop núcleo completo: Baralho de 40 cartas, 7 Padrões, Multiplicador de
  Combo, 6 Rodadas por Run, Forja entre Rodadas.
- 3 Forjadores, 10 Relíquias (2 raras), 8 Efeitos de Forja base + 2 bônus.
- Dificuldade Dinâmica (DDA) persistente entre Runs.
- Meta-progressão sem moeda (4 marcos).
- Desafio Diário com backend Supabase (seed compartilhado, leaderboard
  semanal opt-in, 1 tentativa grátis + tentativas extras ilimitadas via
  anúncio).
- Loja cosmética (4 itens) + Remove Ads via RevenueCat.
- Onboarding interativo (4 passos, dispensável).

**Fora do escopo do MVP:**
- Multiplayer em tempo real ou PvP direto.
- Contas de usuário / login (identidade é só um UUID de dispositivo local).
- Passe de temporada cosmético (mencionado no GDD como visão futura, não
  implementado nesta versão).
- Compartilhamento de replay de combo em imagem/vídeo (visão futura do GDD,
  não implementado).
- Conteúdo sazonal / eventos especiais pós-lançamento.
- iOS: anúncios (App ID/ad unit pendentes até a publicação na App Store —
  ver `docs/release-checklist.md`).

## 9. Riscos de Produto e Mitigações

Ver GDD §10 para os riscos éticos de design já mapeados (restart
compulsivo, pressão de comparação social, DDA manipulando frustração). Risco
de produto adicional:

| Risco | Mitigação |
|---|---|
| Desafio Diário indisponível sem backend configurado | Degrada para "indisponível" na UI, nunca quebra o app (ver SRS §5.1) |
| Loja com preços simulados se RevenueCat não configurado | Loja permanece navegável com provider de desenvolvimento; produção exige chave real antes do lançamento (`docs/release-checklist.md`) |
| Anúncio recompensado sem fill (app ainda não aprovado na loja de anúncios) | Degradação graciosa: tentativa extra simplesmente não é liberada, fluxo do jogo nunca trava |

## 10. Documentos Relacionados

| Documento | Papel |
|---|---|
| [`GDD_Combo_Forge.md`](GDD_Combo_Forge.md) | Bíblia do jogo: mecânicas, economia, arte/sensorial, pilares neurocognitivos |
| [`CONTEXT.md`](CONTEXT.md) | Glossário de domínio (pt-br) |
| [`SRS_Combo_Forge.md`](SRS_Combo_Forge.md) | Requisitos funcionais catalogados + requisitos não-funcionais (desempenho, segurança, compatibilidade) |
| [`ESPECIFICACAO_FUNCIONAL_Combo_Forge.md`](ESPECIFICACAO_FUNCIONAL_Combo_Forge.md) | Comportamento exato de cada tela: campos, botões, validações |
| `PRODUCT.md` | Ficha de produto no formato do Impeccable (design QA), em inglês — resumo operacional para a ferramenta de design |
| `docs/release-checklist.md` | Checklist de configuração de produção (Supabase, RevenueCat, AdMob, EAS) |
