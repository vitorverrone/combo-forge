# DOCUMENTO DE REQUISITOS DE SOFTWARE (SRS/DRS)

**COMBO FORGE**

Documento de Requisitos de Software — v1.0 — Agosto de 2026

> Este documento cobre requisitos funcionais em nível de sistema (catálogo
> RF) e requisitos não funcionais (desempenho, segurança, compatibilidade,
> disponibilidade, dados). Para o comportamento exato de cada tela (campos,
> botões, validações), ver
> [`ESPECIFICACAO_FUNCIONAL_Combo_Forge.md`](ESPECIFICACAO_FUNCIONAL_Combo_Forge.md).
> Para regras de negócio e visão de produto, ver
> [`PRD_Combo_Forge.md`](PRD_Combo_Forge.md). Para vocabulário de domínio, ver
> [`CONTEXT.md`](CONTEXT.md).

---

## 1. Introdução

### 1.1 Propósito
Especificar os requisitos de software do Combo Forge — o que o sistema deve
fazer (requisitos funcionais) e as qualidades que deve ter (requisitos não
funcionais) — para desenvolvimento, QA e decisões de arquitetura.

### 1.2 Escopo
Aplicativo mobile (iOS/Android) construído em Expo/React Native, com lógica
de jogo local (motor puro determinístico) e dois serviços de backend de
terceiros (Supabase para o Desafio Diário, RevenueCat para IAP) mais um SDK
de anúncios (Google AdMob). Não há backend próprio além das funções RPC do
Supabase; não há contas de usuário.

### 1.3 Definições e Termos
Todo o vocabulário de domínio (Jogada, Valor-Base, Multiplicador de Combo,
Baralho, Forja, Relíquia, Rodada, Meta, DDA, Forjador, Desafio Diário,
Meta-Progressão, Loja) está definido em [`CONTEXT.md`](CONTEXT.md) — não é
repetido aqui.

## 2. Visão Geral do Sistema

### 2.1 Arquitetura em camadas

```
components/   UI (React Native) — sem regra de jogo, lê estado via hooks
store/        Zustand — estado de UI + Run + orquestração de IO (dailyFlow, shopFlow)
engine/       Motor puro — TODA regra de jogo, determinístico, sem dependência de RN
services/     Adaptadores de IO real — Supabase, RevenueCat, AdMob
supabase/     Contrato de backend (migrations SQL + espelho TS para testes)
```

`engine/` não importa nada de React Native, Zustand, Skia, Reanimated ou
SQLite — é testável em isolamento e é a fonte única de verdade das regras
(pontuação, Forja, DDA, progressão, Desafio Diário, Loja). O `store/` nunca
decide regra de jogo: aplica os eventos que o motor devolve e delega IO
(Desafio Diário, Loja) a módulos de fluxo dedicados (`dailyFlow.ts`,
`shopFlow.ts`) que nunca conhecem Zustand ou telas.

### 2.2 Stack tecnológica

| Camada | Tecnologia | Versão (package.json) |
|---|---|---|
| Framework | Expo | ~57.0.10 |
| UI | React Native | 0.86.2 / React 19.2.3 |
| Estado | Zustand | ^5.0.14 |
| Persistência local | expo-sqlite (KV store) | ~57.0.1 |
| Animação | react-native-reanimated | 4.5.1 |
| Áudio | expo-audio | ~57.0.3 |
| Háptica | expo-haptics | ~57.0.1 |
| Backend (Desafio Diário) | Supabase (`@supabase/supabase-js`) | ^2.112.3 |
| IAP | react-native-purchases (RevenueCat) | ^10.7.0 |
| Anúncios | react-native-google-mobile-ads (AdMob) | ^16.4.0 |
| Testes | Jest + jest-expo | ~29.7.0 |
| Linguagem | TypeScript | ~6.0.3 |
| Build/deploy | EAS (Expo Application Services) | perfis development/preview/production |

### 2.3 Plataformas suportadas
- **Android:** package `com.combocardforge.app`; AdMob (banner + recompensado)
  totalmente configurado (ver §5.3).
- **iOS:** bundle `com.combocardforge.app`, `supportsTablet: true`; AdMob
  pendente de App ID/ad unit reais até a publicação na App Store — o app
  funciona integralmente sem anúncios nessa plataforma até lá (degradação
  graciosa, não bloqueio).
- Orientação: **retrato exclusivo** (`"orientation": "portrait"` no
  `app.json`); não há layout paisagem ou adaptado a tablet além do
  `supportsTablet` de metadado iOS.

## 3. Requisitos Funcionais

Catálogo em nível de sistema. Comportamento de tela-a-tela (campos, textos,
estados de botão) está na Especificação Funcional; aqui, a capacidade que o
sistema deve prover.

### 3.1 Run e Jogo Núcleo

| ID | Requisito |
|---|---|
| RF-01 | O sistema deve gerar um Baralho de 40 cartas (4 Naipes × Valores 1–10) e embaralhá-lo de forma determinística a partir de um seed numérico. |
| RF-02 | O sistema deve manter uma Mão de 7 cartas (ajustável por Relíquia de Mecânica), reabastecida do Baralho após cada Jogada ou Descarte. |
| RF-03 | O sistema deve permitir ao jogador selecionar de 1 a 5 cartas da Mão e reconhecer o melhor Padrão formado (Carta Alta, Par, Dois Pares, Trinca, Sequência, Full House, Quadra). |
| RF-04 | O sistema deve calcular o Valor-Base de uma Jogada como bônus do Padrão + soma dos Valores das cartas selecionadas (considerando Efeitos de Forja e Relíquias ativas). |
| RF-05 | O sistema deve aplicar um Multiplicador de Combo à pontuação de cada Jogada, crescendo a cada Jogada dentro da Rodada (×1, ×2, ×3, ×4 por padrão; ajustável por Relíquia de Combo) e reiniciando a cada nova Rodada. |
| RF-06 | O sistema deve permitir até 2 Descartes por Rodada (ajustável por Relíquia de Mecânica), trocando cartas selecionadas da Mão por novas do Baralho sem pontuar. |
| RF-07 | O sistema deve encerrar a Rodada em vitória quando a pontuação acumulada atingir a Meta, e em derrota quando as 4 Jogadas se esgotarem sem atingi-la. |
| RF-08 | O sistema deve calcular a Meta de cada Rodada pela curva base 50 × 1,7^(R−1) (R = número da Rodada), ajustada pelo DDA quando habilitado. |
| RF-09 | O sistema deve encerrar a Run em vitória ao vencer a 6ª Rodada, ou em derrota ao perder qualquer Rodada. |
| RF-10 | Ao perder a Run, o sistema deve permitir reinício imediato (nova Run, novo seed, mesmo Forjador) sem etapas intermediárias obrigatórias. |
| RF-11 | O sistema deve oferecer uma prévia (preview) do Padrão e da pontuação projetada da seleção atual antes de confirmar a Jogada. |

### 3.2 Forja e Cartas Forjadas

| ID | Requisito |
|---|---|
| RF-12 | Ao vencer uma Rodada (1ª–5ª), o sistema deve gerar 3 ofertas de Forja: 2 Efeitos de Forja + 1 Relíquia (ou 3 Efeitos de Forja quando o teto de 3 Relíquias ativas já foi atingido). |
| RF-13 | O sistema deve permitir aplicar um Efeito de Forja a qualquer carta das 40 do Baralho (já forjada ou não), empilhando efeitos numa mesma carta. |
| RF-14 | O sistema deve permitir adquirir a oferta de Relíquia sem exigir carta-alvo, respeitando o teto de 3 Relíquias ativas por Run (a Relíquia de largada do Forjador fica fora do teto). |
| RF-15 | A fase de Forja não pode ser pulada: o sistema só avança para a próxima Rodada após uma oferta ser aplicada. |
| RF-16 | As ofertas de Forja devem ser determinísticas para uma stream de RNG derivada do seed da Run e do número da Rodada, independente da ordem de Jogadas do jogador (necessário para paridade do Desafio Diário). |

### 3.3 Dificuldade Dinâmica (DDA)

| ID | Requisito |
|---|---|
| RF-17 | O sistema deve reduzir a Meta de uma Rodada em 10% após 3 derrotas consecutivas na mesma Rodada. |
| RF-18 | O sistema deve aumentar a Meta em 10% e a frequência de Relíquia rara nas ofertas após 5 vitórias consecutivas com margem ≥ 30% acima da Meta e 1+ Jogada sobrando. |
| RF-19 | O histórico de DDA deve persistir entre Runs (não reinicia a cada nova Run) e deve poder ser desligado por configuração (usado no Desafio Diário). |

### 3.4 Meta-Progressão

| ID | Requisito |
|---|---|
| RF-20 | O sistema deve registrar estatísticas de perfil por Jogada e por fim de Run: Runs iniciadas/vencidas, recorde de pontuação, maior Multiplicador alcançado, contagem de jogadas por carta. |
| RF-21 | O sistema deve desbloquear automaticamente marcos de opção única ao fim de cada Run (1ª e 3ª vitória: Forjadores; recorde ≥ 2.500: Relíquias raras). |
| RF-22 | Para marcos com múltiplas opções (5ª vitória: 2 Efeitos de Forja bônus), o sistema deve apresentar um modal de escolha de ordem, sem forçar decisão imediata (dispensável, opção pendente na Coleção). |
| RF-23 | O sistema deve impedir a seleção de Forjadores não desbloqueados, tanto na Tela Início quanto ao iniciar uma Run. |
| RF-24 | Progressão de conteúdo não deve ser afetada por nenhuma compra (ver PRD §6.1/6.3) — nenhum caminho de código de IAP deve escrever em `PersistedProgression`. |

### 3.5 Desafio Diário

| ID | Requisito |
|---|---|
| RF-25 | O sistema deve buscar do backend um seed único por dia (fronteira UTC), idêntico para todos os jogadores. |
| RF-26 | A Run do Desafio Diário deve usar Forjador fixo (Aprendiz), todos os pools de conteúdo abertos e DDA desligado, garantindo que dois jogadores com meta-progressão diferente recebam a mesma experiência. |
| RF-27 | O sistema deve conceder 1 tentativa gratuita por dia + tentativas extras ilimitadas via anúncio recompensado assistido até o fim, uma por vez (precisa jogar a tentativa desbloqueada antes de assistir o próximo anúncio), com reinício às 00:00 UTC. |
| RF-28 | O sistema deve submeter automaticamente a pontuação da Run do dia ao backend ao final (vitória ou derrota), mantendo a melhor pontuação do dia por dispositivo. |
| RF-29 | O sistema deve permitir consultar (opt-in) um leaderboard semanal mostrando apenas a posição/pontuação do próprio dispositivo e o Top 10 (rank + score), nunca identidade ou derrota de terceiros. |
| RF-30 | O Desafio Diário não deve alterar estatísticas de perfil nem meta-progressão (é isolado do modo normal). |

### 3.6 Loja e Monetização

| ID | Requisito |
|---|---|
| RF-31 | O sistema deve listar um catálogo de itens cosméticos (skins de baralho) com preço vindo do provider de compras configurado. |
| RF-32 | O sistema deve processar a compra de um item cosmético via IAP, equipá-lo automaticamente ao concluir e persistir o estado comprado/equipado localmente. |
| RF-33 | O sistema deve processar a compra não-consumível "Remove Ads", ocultando o banner de anúncio em todas as telas imediatamente após a confirmação. |
| RF-34 | O sistema deve sincronizar a entitlement de remoção de anúncios com o provider de compras no lançamento do app, sem exigir interação do jogador, e nunca regredir uma remoção já ativa. |
| RF-35 | O sistema deve oferecer "Restaurar Compras", reaplicando cosméticos e a remoção de anúncios já adquiridos em outro dispositivo/reinstalação. |
| RF-36 | Nenhum item da Loja deve alterar regras de pontuação, Forja ou estrutura de Run — a garantia é estrutural (o catálogo só carrega dados visuais) e não apenas de conteúdo do texto exibido. |

### 3.7 Anúncios

| ID | Requisito |
|---|---|
| RF-37 | O sistema deve exibir um banner de anúncio de 50dp no rodapé de todas as telas, oculto quando a remoção de anúncios foi comprada ou quando não há ad unit configurado para a plataforma atual. |
| RF-38 | O sistema deve solicitar anúncios não-personalizados (`requestNonPersonalizedAdsOnly: true`) tanto para banner quanto para recompensado. |
| RF-39 | Falha ao carregar/exibir qualquer anúncio (NO_FILL, erro de rede, desistência do jogador) não deve travar, quebrar ou bloquear o fluxo do jogo — deve resolver graciosamente ao estado anterior. |

### 3.8 Onboarding

| ID | Requisito |
|---|---|
| RF-40 | O sistema deve exibir um tutorial de 4 passos na primeira sessão, dispensável a qualquer momento, e não deve reexibi-lo automaticamente após concluído ou pulado. |

### 3.9 Persistência entre sessões

| ID | Requisito |
|---|---|
| RF-41 | O sistema deve persistir localmente, sobrevivendo ao fechamento do app: histórico de DDA, meta-progressão (estatísticas + desbloqueios), tentativas/deviceId do Desafio Diário, estado da Loja (comprados/equipados/remoção de anúncios). |
| RF-42 | Falha de leitura/gravação da persistência local (SQLite indisponível, JSON corrompido) não deve impedir o jogo de funcionar — deve degradar para estado neutro/em memória na sessão atual. |

## 4. Requisitos Não Funcionais

### 4.1 Desempenho

- **RNF-01** — Toda avaliação de Jogada (reconhecimento de Padrão + cálculo
  de Valor-Base) deve ser síncrona e não perceptível ao usuário (motor puro
  em memória, sem IO); o pior caso de força bruta de Curinga é 10⁴
  combinações para uma Jogada de 5 cartas com múltiplos Curingas — ainda
  assim síncrono, sem necessidade de otimização adicional identificada.
- **RNF-02** — Escritas de persistência local (DDA, progressão, Loja) usam a
  API síncrona do KV store SQLite (`getItemSync`/`setItemSync`) e ocorrem a
  cada Jogada/fim de Run; o payload é pequeno (estatísticas + listas de ids),
  não há necessidade de write-behind ou batching no volume atual do MVP.
- **RNF-03** — Chamadas de rede (Supabase RPC, RevenueCat, AdMob) nunca
  bloqueiam a thread de UI nem travam a navegação — todas são assíncronas com
  estado de `loading`/`error` explícito na UI (ver Especificação Funcional).

### 4.2 Segurança

- **RNF-04 (sem PII, sem contas)** — O sistema não coleta nome, e-mail, senha
  ou qualquer identificador pessoal. A única identidade é um UUID v4 gerado
  no dispositivo (`createDeviceId`) para deduplicar tentativas/pontuações no
  Desafio Diário — opaco, não vinculável a uma pessoa fora do próprio
  dispositivo.
- **RNF-05 (superfície de banco de dados mínima)** — A tabela
  `daily_submissions` do Supabase tem Row Level Security habilitada **sem
  nenhuma política** (`revoke all ... from public, anon, authenticated`) —
  inacessível diretamente por qualquer role, inclusive a chave `anon`
  embutida no app. O único acesso é via 3 funções RPC `SECURITY DEFINER`
  (`get_daily_seed`, `submit_daily_score`, `get_weekly_leaderboard`) com
  `search_path` travado em `public`, liberadas explicitamente via `GRANT
  EXECUTE` — superfície de escrita e leitura limitada ao contrato exato
  necessário (ver `supabase/migrations/0002_daily_challenge_access.sql`).
- **RNF-06 (chaves públicas por design)** — `EXPO_PUBLIC_SUPABASE_ANON_KEY` e
  `EXPO_PUBLIC_REVENUECAT_API_KEY` são embutidas no bundle do cliente
  (prefixo `EXPO_PUBLIC_`), como é esperado para uma chave anônima/pública de
  SDK mobile; nenhuma chave secreta/privada deve jamais ser embutida no
  cliente. Nenhum `.env` é versionado (`.gitignore`); `.env.example` documenta
  as variáveis sem valores reais.
- **RNF-07 (IAP validado pela plataforma)** — Compras e restauração passam
  pelo SDK RevenueCat, que reconcilia com o App Store/Play Store; o cliente
  nunca confia em um "sucesso" auto-reportado sem confirmação do provider
  (`purchase()` resolve `true` somente após a chamada real ao SDK, `false` em
  cancelamento do jogador, lança em erro real).
- **RNF-08 (anúncios não-personalizados)** — Toda requisição de anúncio
  (banner e recompensado) usa `requestNonPersonalizedAdsOnly: true`,
  reduzindo a coleta de dados de publicidade direcionada.
- **RNF-09 (contrato de backend travado por teste)** — As fórmulas SQL
  (`get_daily_seed`, `isoWeekStart`) têm espelho em TypeScript com testes de
  valor dourado (`supabase/contract.ts` + `supabase/contract.test.ts`) e um
  script de verificação contra Postgres real (`npm run verify:backend`) —
  qualquer divergência entre o contrato assumido pelo cliente e o SQL
  publicado é detectável antes do deploy.

### 4.3 Compatibilidade

- **RNF-10** — iOS e Android, orientação retrato exclusiva; sem suporte a
  paisagem ou layout responsivo além do `supportsTablet` de metadado iOS
  (nenhum breakpoint de tablet implementado na UI).
- **RNF-11** — Cada serviço externo (Supabase, RevenueCat, AdMob) tem um
  provider "dev" ou "indisponível" que substitui automaticamente a
  implementação real quando a variável de ambiente correspondente está
  ausente — o app compila, roda e é totalmente jogável (loop núcleo) sem
  nenhuma configuração de backend/monetização/anúncio.

### 4.4 Disponibilidade e Resiliência

- **RNF-12 (o loop núcleo nunca depende de rede)** — Run, Forja, DDA, Baralho
  e Meta-Progressão são inteiramente locais/determinísticos; apenas Desafio
  Diário, Loja (preços reais) e anúncios exigem rede, e cada um degrada
  isoladamente sem afetar os demais.
- **RNF-13 (falha de IO nunca lança para a UI)** — Todo fluxo assíncrono de
  orquestração (`dailyFlow.ts`, `shopFlow.ts`) captura exceções e devolve
  estado com campo `error`/`status: 'error'` explícito — nenhuma ação de
  jogador (comprar, submeter pontuação, assistir anúncio, buscar leaderboard)
  pode lançar uma exceção não tratada até a árvore de componentes.
- **RNF-14 (ações do motor são defensivas na UI)** — Toda chamada do store ao
  motor puro (`playSelection`, `discardSelection`, `applyForgeOffer`) está
  envolta em `try/catch`; uma Jogada/Descarte/Forja inválida (defesa contra
  estado de UI dessincronizado) mantém o estado anterior intacto em vez de
  quebrar a sessão.

### 4.5 Dados e Persistência

- **RNF-15** — Persistência local via `expo-sqlite/kv-store` num banco
  dedicado (`combo-forge.db`), chaves: `combo-forge:dda`,
  `combo-forge:progression`, `combo-forge:daily-attempts`,
  `combo-forge:daily-device-id`, `combo-forge:shop` — mesmo padrão do
  storage de onboarding-seen (chave separada, mesmo banco).
- **RNF-16** — Todo JSON persistido que falhar ao parsear (versão antiga
  incompatível, corrupção) é tratado como ausente (fallback ao estado
  inicial), nunca lança.
- **RNF-17** — O estado da Loja carregado de saves antigos (anteriores ao
  campo `adsRemoved`) é normalizado com o default aplicado
  (`normalizeShopState`), sem perder os demais campos já salvos.

### 4.6 Testabilidade e Qualidade

- **RNF-18** — O motor (`engine/`) e a orquestração (`store/`) têm suíte de
  testes unitários abrangente (`*.test.ts` ao lado de cada módulo); build
  validado com `npm run typecheck` + `npm test` antes de cada release (ver
  `docs/release-checklist.md`, 18 suítes / 329 testes na última verificação
  registrada).
- **RNF-19** — Toda regra determinística (embaralhamento, ofertas de Forja,
  seed diário) é pura e recebe a fonte de aleatoriedade injetada
  (`Rng`) — testável sem mocks de tempo ou de módulos nativos.

### 4.7 Acessibilidade

- **RNF-20** — Todo elemento interativo (botão, card selecionável, item de
  lista com ação) expõe `accessibilityLabel`, `accessibilityRole="button"` e,
  quando aplicável, `accessibilityState={{ disabled, selected }}` — verificado
  em todos os componentes de tela lidos nesta especificação.
- **RNF-21** — Animações não-essenciais (pulso da barra "quase lá" na tela de
  derrota) respeitam a preferência de sistema Reduce Motion
  (`AccessibilityInfo.isReduceMotionEnabled`), desligando a pulsação e
  mantendo a barra estática quando ativa.

### 4.8 Internacionalização

- **RNF-22** — Todo texto voltado ao jogador (UI, nomes de carta/Relíquia/
  Forjador, mensagens de erro) está em inglês, por convenção do projeto (ver
  `CLAUDE.md` raiz — "In-game text in English"); não há sistema de
  tradução/i18n implementado nesta versão. Documentação de design e domínio
  (GDD, CONTEXT.md, ADRs) é pt-br.

## 5. Integrações Externas

### 5.1 Supabase (Desafio Diário)

- **Função:** fonte do seed diário compartilhado, submissão de pontuação,
  leaderboard semanal.
- **Contrato:** 3 funções RPC — `get_daily_seed(date) → int`,
  `submit_daily_score(device_id, score) → int` (melhor pontuação do dia),
  `get_weekly_leaderboard(device_id) → jsonb` (posição própria + Top 10).
- **Config:** `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **Fallback sem config ou URL inválida:** `createUnavailableDailyBackend()`
  — Desafio Diário exibido como indisponível na UI; nenhum outro subsistema
  (Loja, ads) é afetado.
- **Fórmulas travadas por teste:** `dailySeed` = primeiros 8 hex do MD5 da
  data ISO, mascarado em 31 bits; semana ISO = segunda-feira da data
  (`isoWeekStart`).

### 5.2 RevenueCat (Loja)

- **Função:** catálogo de preços, compra, restauração e checagem de
  entitlement (`remove_ads`) via App Store/Play Store.
- **Config:** `EXPO_PUBLIC_REVENUECAT_API_KEY` (chave pública do SDK).
- **Fallback sem config:** `createDevShopProvider()` — compra sempre
  simulada como bem-sucedida, preços de desenvolvimento (`devPrice` do
  catálogo); Loja permanece navegável e testável sem chave real.
- **Produtos:** 4 cosméticos consumíveis únicos + `combo_forge_remove_ads`
  (não-consumível), todos fora do fluxo de moeda do jogo.
- **Nota de ambiente:** compra real exige development build — o SDK roda em
  "Preview API Mode" (mocks JS) no Expo Go.

### 5.3 Google AdMob (anúncios)

- **Função:** banner (50dp, todas as telas) + recompensado (tentativa extra
  do Desafio Diário).
- **Config:** `EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_{ANDROID,IOS}` +
  `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_{ANDROID,IOS}`, selecionadas por
  `Platform.OS` em runtime; App ID por plataforma no `app.json` (plugin
  `react-native-google-mobile-ads`).
- **Fallback sem config da plataforma atual:** `createDevAdProvider()` —
  anúncio sempre "concluído" sem SDK real.
- **Ambiente de desenvolvimento:** usa `TestIds` oficiais do SDK
  (`TestIds.REWARDED`, `TestIds.ADAPTIVE_BANNER`) mesmo com ad unit real
  configurado, sempre que `NODE_ENV !== 'production'` — nunca consome
  impressão real fora de build de produção.
- **Módulo nativo ausente (Expo Go/web/testes):** import dinâmico com
  `catch` resolvendo `false` — nunca derruba o app.

## 6. Restrições Técnicas

- Sem multiplayer em tempo real ou qualquer sincronização de estado de jogo
  entre dispositivos além do leaderboard assíncrono opt-in.
- Sem contas de usuário/login — toda "identidade" entre sessões é local
  (SQLite) ou um UUID de dispositivo opaco (Desafio Diário).
- Orientação retrato exclusiva; sem adaptação de layout a tablet/paisagem.
- iOS não tem anúncios funcionais até publicação na App Store (App
  ID/ad unit reais pendentes — ver `docs/release-checklist.md` §3).

## 7. Modelo de Dados (visão local + backend)

### 7.1 Persistência local (SQLite KV, banco `combo-forge.db`)

| Chave | Conteúdo |
|---|---|
| `combo-forge:dda` | `DdaState` — última Rodada com derrota, falhas/vitórias fáceis consecutivas |
| `combo-forge:progression` | `PersistedProgression` — `ProfileStats` + ids de opções de desbloqueio reivindicadas |
| `combo-forge:daily-attempts` | `DailyAttempts` — data, tentativas usadas, extra liberada, melhor pontuação submetida |
| `combo-forge:daily-device-id` | UUID v4 opaco do dispositivo |
| `combo-forge:shop` | `PersistedShop` — itens comprados, skin equipada, remoção de anúncios |
| `combo-forge:onboarding-seen` | flag booleana (tutorial concluído/pulado) |

### 7.2 Backend (Supabase — tabela `daily_submissions`)

Tabela com RLS habilitada e sem políticas (inacessível diretamente); acesso
exclusivamente via as 3 funções RPC do §5.1. Estrutura completa em
`supabase/migrations/0001_daily_challenge.sql` (fonte da verdade —
`supabase/contract.ts` é o espelho de referência, não a definição).

## 8. Matriz de Rastreabilidade (módulo → RF → componente principal)

| Módulo | Requisitos | Componente(s) UI | Módulo(s) engine/store |
|---|---|---|---|
| Run e Jogo | RF-01–RF-11 | `GameScreen` | `engine/deck.ts`, `engine/patterns.ts`, `engine/run.ts` |
| Forja | RF-12–RF-16 | `ForgeScreen` | `engine/forge.ts` |
| DDA | RF-17–RF-19 | (sem tela própria — afeta a Meta em `GameScreen`) | `engine/dda.ts` |
| Meta-Progressão | RF-20–RF-24 | `CollectionScreen`, `ProfileScreen`, `UnlockChoiceModal` | `engine/progression.ts` |
| Desafio Diário | RF-25–RF-30 | `DailyChallengeScreen`, `DailySubmitStatus` | `engine/daily.ts`, `store/dailyFlow.ts`, `services/supabase.ts` |
| Loja | RF-31–RF-36 | `ShopScreen` | `engine/shop.ts`, `store/shopFlow.ts`, `services/revenuecat.ts` |
| Anúncios | RF-37–RF-39 | `AdBanner` | `engine/adProvider.ts`, `services/ads.ts` |
| Onboarding | RF-40 | `OnboardingOverlay` | `store/sqlite.ts` |
| Persistência | RF-41–RF-42 | — | `store/sqlite.ts`, `store/bootstrap.ts` |
