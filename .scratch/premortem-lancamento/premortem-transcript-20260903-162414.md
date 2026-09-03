# Premortem — Lançamento do Combo Forge (incl. monetização atual)

**Data:** 2026-09-03
**Enquadramento:** 6 meses se passaram. O lançamento do Combo Forge — jogo completo, incluindo a estratégia de monetização atual (banner full-width, interstitial, rewarded, IAP remove_ads US$2,99) — falhou. Está encerrado. Estamos olhando pra trás tentando entender o que deu errado.

## Contexto reunido

**O quê:** Combo Forge — roguelike de cartas mobile de sessão curta (3–8 min), MVP feature-complete (motor de jogo, backend Supabase, desafio diário com ranking, loja cosmética, tutorial), ainda não lançado nas lojas.

**Para quem:** jogadores mobile casuais em "micro-momentos" (fila, transporte, intervalo de trabalho), iOS/Android.

**O que é sucesso:** metas do GDD — D1 40–45%, D7 16–20%, D30 6–9%, sessão média 6–10min, 2–4 sessões/dia de usuário ativo; monetização sustentável via cosméticos + IAP de remoção de anúncios (US$2,99) + rewarded opt-in, sem pay-to-win.

## Razões de falha (premortem bruto)

1. Banner full-width visível durante a própria tela de jogo (Rodada) sabota a retenção D1.
2. Modelo de monetização (cosmético + remove_ads único + rewarded opt-in) não sustenta CAC num gênero pós-Balatro concorrido.
3. Risco de compulsão (restart instantâneo + RPE + Zeigarnik), aceito sem mitigação ativa, vira dano reputacional.
4. Profundidade de conteúdo (40 cartas, 10 relíquias, 3 forjadores, 5 marcos) se esgota antes do D30.
5. DDA calibrado só com perfis simulados erra a calibração contra jogadores reais.
6. App nunca passa (ou demora demais) no readiness review do AdMob, ficando sem receita de anúncio real na janela crítica.
7. Nenhum plano de ASO/aquisição de usuários documentado — app fica invisível na loja.
8. Capacidade real da equipe (provavelmente solo) não sustenta cadência pós-lançamento (conteúdo sazonal, moderação, manutenção de SDK).

---

## Deep dives

### 1. Banner durante o gameplay

**História:** O AdMob real passou no readiness review na semana 3 pós-lançamento — a flag `EXPO_PUBLIC_ADMOB_LIVE_ADS` virou `true` em produção sem reabrir a discussão do ADR-0004. O banner de 50dp full-width, testado só em telas estáticas, foi ligado na tela de Rodada exatamente como especificado. Ninguém tinha simulado o cenário real: um jogador numa fila de banco, com uma mão só, resolvendo um combo sob pressão de tempo — o polegar desliza 2mm baixo demais e toca o banner. Interstitial de terceiro abre, a sessão é interrompida no meio de uma forja, e o Flow que era o pilar central do design é destruído por um evento alheio ao jogo.

O time monitorou CTR do rewarded do Desafio Diário — que subiu — mas ninguém segmentou retenção D1 por tamanho de tela. Em telas menores, a taxa de toque acidental era 3–4x maior. Não existia evento rastreado de "sessões abortadas por saída de app nos 10s após spawn do banner". Quando o D1 fechou em 24% (meta 40–45%), a equipe investigou onboarding e DDA por semanas, porque a hipótese "o próprio anúncio quebra a experiência" nunca foi colocada na mesa — o ADR já havia "aceito" esse risco.

**Suposição subjacente:** um risco "aceito e anotado para revisitar" seria de fato revisitado quando o AdMob liberasse anúncios reais, mas nenhum gatilho automático ou métrica dedicada foi criado para forçar essa revisão.

**Sinais de alerta:** taxa de saída de app nos 15s após interstitial disparado na Rodada, segmentada por tamanho de tela; D1 segmentado por coorte exposta vs. não exposta a live ads na Rodada.

### 2. Monetização insuficiente

**História:** Soft-launch mostrou o problema em três semanas: conversão para IAP ~1,2%, dentro do esperado para cosmético puro — mas o ticket médio não cobria o CPI de US$1,80–2,40 que o gênero pós-Balatro exigia num leilão de UA disputado por clones diretos. O ADR-0004 apostava que "o banner é o motor da compra de remoção" — mas isso só converte com volume de instalação orgânica, que nunca chegou sem UA agressivo. O Desafio Diário (receita principal de anúncios, segundo o ADR) dependia de retenção D7 alta pra gerar impressões repetidas — e D7 real ficou abaixo de 15%, porque o roteiro cosmético não dava motivo suficiente pra reabrir o jogo. No mês 4, CAC medido (US$3,10) superou o LTV projetado (US$1,40); UA foi cortado a zero.

**Suposição subjacente:** um modelo 100% cosmético geraria retenção alta o bastante para que o LTV superasse o CAC de um gênero nichado sem orçamento de UA proporcional.

**Sinais de alerta:** retenção D7 abaixo de 20% no soft-launch; CPI de UA pago superando US$2,00 nas primeiras duas semanas sem queda de conversão de IAP acompanhando.

### 3. Compulsão sem mitigação

**História:** O lançamento correu tecnicamente bem. Na semana 3, um criador de conteúdo de "app detox" comparou o loop de restart instantâneo a um caça-níquel, mostrando 40 minutos de gameplay ininterrupto. O vídeo viralizou citando exatamente o padrão previsto no GDD (Zeigarnik empurrando pro restart sem fricção). Alguém vazou uma captura do GDD (seção 10) mostrando textualmente que o lembrete de pausa existiu, foi testado e foi removido "conscientemente, sem contramedida". A narrativa virou "estúdio sabia e retirou a proteção de propósito". Reviews citaram "sessões de 3h+"; duas lojas sinalizaram o app pra revisão de política de bem-estar digital. Retenção D1 até subiu com o loop compulsivo — o dano foi de confiança e imprensa, e nunca converteu de volta em instalações.

**Suposição subjacente:** "risco aceito conscientemente e documentado internamente" equivale a risco mitigado, quando na prática é o oposto — documentar sem agir cria o registro que prova negligência deliberada quando descoberto.

**Sinais de alerta:** duração média de sessão subindo de ~15min para 45min+ nas primeiras duas semanas sem novo conteúdo que justifique; menções orgânicas de "compulsivo"/"vício" em reviews antes de qualquer cobertura formal de imprensa.

### 4. Conteúdo esgota antes do D30

**História:** Por volta do dia 4–5, quem jogava 2–4 sessões/dia já tinha vencido 3 Runs, desbloqueado a Bigorna e visto os 2 Efeitos de Forja extras do marco de 5ª Run. Restava só o marco de recorde ≥2.500 e, depois disso, nada — repetição de combinações já vistas entre 40 cartas e 10 relíquias. D7 nunca chegou perto de 16–20%, porque o conteúdo que sustentaria o dia 7 já tinha sido consumido no dia 5. O rebalanceamento pós-health-check ajustou dificuldade, mas não criou motivo para reabrir o app. "Conteúdo sazonal" (GDD seção 9) não tinha ticket nem spec; a primeira leva de cartas/relíquias novas só saiu 10 semanas após o lançamento — tarde demais pra reter a coorte de D0.

**Suposição subjacente:** 5 marcos de meta-progressão bastariam para esticar o interesse até depois do D7, sem medir quantas sessões cada marco realmente consome.

**Sinais de alerta:** tempo médio (em sessões) até atingir o marco de recorde ≥2.500 caindo abaixo de ~10–12 sessões em testes internos; nenhum ticket de conteúdo pós-lançamento aberto até a data de lançamento.

### 5. DDA mal calibrado

**História:** O DDA foi calibrado contra dois perfis simulados (`game-health-check`), o que já forçou uma recalibração pré-lançamento — tratada como "problema resolvido", não como sinal de que perfis sintéticos nunca cobririam a variância real. Em produção, veteranos com builds de Relíquia rara não-Combo empilham vantagem estrutural fora do multiplicador, e a régua de "vitória fácil" fica cada vez mais fácil de bater — o DDA nunca alcança, runs viram rotina, veteranos saem em semanas. Novatos reais, com curva de aprendizado mais errática que qualquer script, batem a mesma Rodada 3 vezes, a Meta cai 10%, mas a nova Meta ainda excede a habilidade real deles. Os dois extremos do Flow (tédio e ansiedade) se manifestam em coortes diferentes, mascarados pelos números agregados de retenção.

**Suposição subjacente:** que dois perfis de jogador simulados por subagentes generalizam para a distribuição real de comportamento de milhares de jogadores.

**Sinais de alerta:** retenção D7 bimodal por coorte de skill (não a média geral); % de jogadores recebendo boost de +15% e % recebendo redução de -10% subindo ao mesmo tempo, em vez do meio se estabilizar.

### 6. Bloqueio no readiness review do AdMob

**História:** O app sobe pras lojas com `EXPO_PUBLIC_ADMOB_LIVE_ADS` ainda desligado. O review exige tráfego real sustentado, e sem UA pago (que dependia da receita de anúncio pra se pagar) o app não sai do estado "limited ads serving". O rodapé de 50dp fica vazio na maior parte das sessões dos primeiros usuários reais, exatamente na janela em que a curva de retenção está sendo formada. O Desafio Diário (fonte principal de receita segundo o ADR) tem fill rate baixo nos rewarded, gerando frustração no próprio feature que deveria compensar a ausência de banner. QA de policy do AdMob sinaliza o posicionamento do banner durante o gameplay como violação, adicionando outro ciclo de revisão. Aos 6 meses, o app nunca teve uma janela contínua de anúncios reais servindo.

**Suposição subjacente:** que o readiness review do AdMob seria uma formalidade rápida, e não um gargalo dependente do próprio tráfego que o lançamento deveria gerar.

**Sinais de alerta:** `EXPO_PUBLIC_ADMOB_LIVE_ADS` ainda `false` 7–10 dias após o lançamento; fill rate do rewarded no Desafio Diário abaixo de ~70% nas primeiras sessões.

### 7. Sem plano de aquisição de usuários

**História:** O Combo Forge chegou ao lançamento tecnicamente impecável — dezenas de tickets fechados, ADRs cobrindo arquitetura e monetização. Na semana do soft launch, alguém abriu o App Store Connect e o Google Play Console e só então percebeu que "Combo Forge" já era usado por outros apps, que screenshots precisavam ser gerados do zero, e que não havia ideia de quais keywords o público buscava pós-Balatro. A ficha foi publicada num fim de semana, genérica, sem teste de ícone. Nos primeiros 30 dias, o app ficou nas páginas 3–4 dos resultados de busca, atrás de clones que investiram em ASO desde o dia 1. Sem UA nem parceria de divulgação, o tráfego foi de poucas dezenas de instalações/dia. No mês 3, com menos de 500 instalações totais, ficou claro que o produto — validado internamente como divertido — nunca chegaria ao volume necessário pros sistemas de monetização gerarem receita relevante.

**Suposição subjacente:** um produto tecnicamente bem construído seria descoberto pelo mercado por conta própria, sem que a descoberta precisasse ser projetada como qualquer outro sistema do jogo.

**Sinais de alerta:** nenhum arquivo/ticket menciona ASO, keywords, App Store Connect ou orçamento de marketing até a semana do lançamento; nenhum protótipo de ficha de loja existe antes do ticket de lançamento ser marcado "done".

### 8. Capacidade da equipe não sustenta operação ao vivo

**História:** O lançamento em si saiu limpo — o fluxo de tickets sustentou isso bem, porque é trabalho batch, sem relógio. Na semana 3, o Desafio Diário liga e o ranking semanal expõe um nome ofensivo no top 10 — não existe fila de moderação, só o dev solo, que só vê o problema quando alguém reporta. Na semana 6, o Google Play empurra uma política nova de anúncios; o update do AdMob SDK quebra o RevenueCat no Android — dependência cruzada não coberta em nenhum ticket, porque nenhum ticket "existe" pra manutenção reativa. Enquanto isso é debugado, o conteúdo sazonal do mês atrasa, porque é a mesma pessoa. D30 desaba. No mês 4, uma query de leaderboard degrada com o crescimento da tabela — ninguém dimensionou isso porque em dev era sempre um punhado de linhas de teste. Reviews de 1 estrela citam "trava no ranking".

**Suposição subjacente:** que a cadência "um ticket por vez, sem prazo" que funcionou pré-lançamento se traduz automaticamente em capacidade de responder a incidentes concorrentes e imprevisíveis em produção.

**Sinais de alerta:** tempo entre report de bug em produção e primeiro commit de fix ultrapassando 48h de forma recorrente; tickets sazonais adiados/reduzidos de escopo pela segunda vez consecutiva no ciclo planejado.

---

## Síntese

**Falha mais provável:** Ausência de plano de ASO/aquisição de usuários — é o único gap já verificável hoje, não uma hipótese sobre o futuro: apesar de dezenas de tickets meticulosos cobrindo cada sistema de jogo, nenhum arquivo no repositório toca ASO, keywords, orçamento de UA ou ficha de loja.

**Falha mais perigosa:** Dano reputacional por compulsão sem mitigação — porque, diferente de um problema de monetização (que sangra devagar e é corrigível), uma narrativa de "o estúdio sabia e retirou a proteção de propósito" é assimétrica, rápida e difícil de reverter, e o próprio GDD já documenta a decisão por escrito.

**Suposição oculta comum:** o time trata "risco identificado e documentado conscientemente" como equivalente a "risco sob controle" — aparece no banner (risco aceito, sem gatilho de revisão), na compulsão (mitigação removida, sem contramedida) e no AdMob (review tratado como formalidade). Documentar um risco não é mitigá-lo.

**Plano revisado (ações concretas):**
1. Antes de ligar `EXPO_PUBLIC_ADMOB_LIVE_ADS` em produção, testar com beta reais em telas pequenas a taxa de toque acidental/saída de app na Rodada; se passar 2x a taxa das telas estáticas, tirar o banner da tela de jogo.
2. Submeter o app ao AdMob readiness review 2–3 semanas antes da data de lançamento, usando tráfego de um grupo de beta testers reais para gerar volume.
3. Escrever e testar a ficha de loja (ícone, screenshots, keywords, descrição) antes de submeter, com um mini teste pago (~US$300–500) num soft launch de 1–2 países pra medir CPI real antes do lançamento global.
4. Reinstaurar alguma forma de lembrete de pausa opcional (não bloqueante) antes do lançamento — o problema não é a mitigação específica que foi removida, é ter zero.
5. Rodar um beta fechado de 2+ semanas com jogadores reais (não simulados), medindo retenção D7 por cluster de skill, antes de travar a calibração do DDA.
6. Escrever pelo menos o primeiro ticket de conteúdo sazonal (mês 1) antes do lançamento, não como frase solta do GDD.
7. Reservar um orçamento de tempo semanal fixo só para manutenção reativa (bugs, SDK, moderação), separado do tempo de feature nova.

**Checklist pré-lançamento:**
- [ ] AdMob readiness review submetido e aprovado com tráfego de beta real, 2–3 semanas antes do lançamento.
- [ ] Ficha de loja completa (ícone, screenshots, keywords, descrição) escrita e revisada antes da submissão.
- [ ] Beta fechado de 2+ semanas medindo retenção D7 segmentada por skill e taxa de toque acidental no banner durante a Rodada.
- [ ] Decisão registrada (com gatilho de reversão mensurável) sobre mitigação mínima de tempo de sessão — não apenas "risco aceito".
- [ ] Primeiro ticket de conteúdo sazonal pós-lançamento (mês 1) escrito antes do lançamento.
