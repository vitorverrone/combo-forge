# Combo Forge: MVP — Motor de Regras, Desafio Diário e Progressão

Status: ready-for-agent

## Problem Statement

Jogadores de mobile querem sessões de 3 a 8 minutos que caibam nos micro-momentos do dia (fila, transporte, intervalo) sem exigir compromisso longo. Jogos de combo de cartas costumam punir a derrota com telas demoradas ou frustrantes, quebrando o ciclo de "só mais uma tentativa". Além disso, muitos jogos do gênero dependem de loot pago ou variabilidade aleatória para reter, em vez de recompensar a decisão estratégica — e a maioria não oferece uma comparação social justa (mesmas condições para todos) que justifique voltar diariamente.

## Solution

Um roguelike de cartas de sessão curta em que o jogador monta Jogadas (Padrões de 2–5 cartas) que multiplicam a pontuação de forma exponencial, tentando bater a Meta de cada Rodada antes que as 4 Jogadas se esgotem. O Baralho de 40 cartas é reciclado entre Rodadas; entre Rodadas, a Forja oferece a escolha de fortalecer cartas ou Relíquias, construindo uma build única por Run. O DDA mantém o jogador em Flow ajustando a Meta com base no histórico, a derrota termina em restart imediato com destaque visual do "quase lá" (Efeito Zeigarnik), e o Desafio Diário oferece a mesma Run (mesmo seed) para todos, com ranking semanal opt-in — comparação social justa sem pressão de tempo. Nenhum item que afete poder é vendido: a loja é cosmética, e anúncios recompensados são opcionais.

## User Stories

1. Como jogador, eu quero iniciar uma Run com o Baralho de 40 cartas embaralhado e uma Mão de 7 cartas, para poder avaliar minhas opções desde a primeira Rodada.
2. Como jogador, eu quero ver a Meta da Rodada atual e quantas Jogadas e Descarte me restam, para decidir com quanto risco posso jogar.
3. Como jogador, eu quero selecionar de 2 a 5 cartas da Mão e ver qual Padrão elas formam antes de confirmar, para planejar a Jogada com consciência.
4. Como jogador, eu quero que a Jogada pontue o melhor Padrão formado pelas cartas selecionadas, para que cartas extras além do mínimo do Padrão ainda contribuam com seus Valores.
5. Como jogador, eu quero que o Valor-Base seja o bônus do Padrão somado aos Valores das cartas (ex.: trinca de 7+7+7 = 25 + 21 = 46), para entender exatamente de onde vem a pontuação.
6. Como jogador, eu quero poder jogar uma Carta Alta (1 carta) quando não houver Padrão na Mão, para nunca ficar travado sem jogada válida — mesmo perdendo pontos por isso.
7. Como jogador, eu quero que o Multiplicador de Combo cresça a cada Jogada da mesma Rodada (×1, ×2, ×3, ×4), para sentir a Rodada acelerando e agendar as Jogadas mais fortes para o fim.
8. Como jogador, eu quero ver o Multiplicador de Combo zerar ao iniciar uma nova Rodada, para que cada Rodada seja um desafio renovado.
9. Como jogador, eu quero ver a pontuação acumulada da Rodada atualizada contra a Meta após cada Jogada, para saber a distância que falta em tempo real.
10. Como jogador, eu quero usar até 2 Descarte por Rodada (trocar cartas da Mão), compartilhados entre as Jogadas, para caçar o Padrão que preciso sem depender só do sorteio.
11. Como jogador, eu quero que o Descarte não usado seja perdido ao fim da Rodada, para que a decisão de quando gastá-lo tenha peso.
12. Como jogador, eu quero vencer a Rodada ao atingir a Meta antes das Jogadas se esgotarem, para avançar na Run com a sensação de objetivo cumprido.
13. Como jogador, eu quero que a Run termine quando as Jogadas se esgotarem sem atingir a Meta, para que a tensão de roguelite seja real.
14. Como jogador, eu quero reiniciar imediatamente após a derrota, sem tela punitiva, para manter o ciclo de "só mais uma tentativa".
15. Como jogador, eu quero ver, na tela de derrota, a distância que faltou para a Meta (ex.: barra quase cheia), para reforçar o Efeito Zeigarnik de tarefa inacabada.
16. Como jogador, eu quero que as cartas jogadas voltem ao Baralho na Rodada seguinte (reciclagem), para que o deck seja fixo e a estratégia fique nas Jogadas e na Forja.
17. Como jogador, eu quero formar cada um dos sete Padrões (Carta Alta, Par, Dois Pares, Trinca, Sequência, Full House e Quadra) e receber o bônus correspondente, para reconhecer o valor de cada escolha.
18. Como jogador, eu quero que a Sequência aceite Ás–5 e 10–Ás, para que os extremos do Baralho sejam jogáveis.
19. Como jogador, eu quero, ao vencer uma Rodada, escolher 1 entre 3 ofertas de Forja (2 de efeito de carta + 1 de Relíquia), para exercer autonomia sobre a direção da minha build.
20. Como jogador, eu quero aplicar um dos 4 Efeitos de Forja (+Valor, Multiplicador, Curinga, Gatilho) a uma carta do Baralho, transformando-a numa Carta Forjada, para personalizar meu deck.
21. Como jogador, eu quero que uma Carta Forjada possa ser forjada de novo em Forjas futuras, empilhando efeitos (somas antes de multiplicadores), para que cartas centrais da build cresçam com a Run.
22. Como jogador, eu quero adquirir Relíquias passivas que alteram regras globais da Run, para criar builds emergentes com as cartas.
23. Como jogador, eu quero ter no máximo 3 Relíquias ativas, com a oferta excedente virando uma terceira oferta de carta, para que o empilhamento não quebre o balanceamento.
24. Como jogador, eu quero ver as Relíquias ativas e seus efeitos claramente durante a Run, para lembrar das regras que mudei.
25. Como jogador, eu quero que falhar a mesma Rodada 3 vezes seguidas reduza a Meta dela em 10%, para sentir o alívio do DDA sem perder o desafio.
26. Como jogador, eu quero que 5 vitórias fáceis consecutivas (margem ≥ 30% acima da Meta com 1+ Jogada sobrando) aumentem a Meta e a chance de Relíquia rara, para que a dificuldade suba com a minha habilidade.
27. Como jogador, eu quero receber dicas visuais sutis de combo disponível quando estiver hesitando, para sair da paralisia sem que a Meta mude.
28. Como jogador, eu quero escolher meu Forjador antes de cada Run (Aprendiz, Martelo ou Bigorna), para definir o arquétipo da minha build.
29. Como jogador, eu quero que o Forjador traga uma Relíquia exclusiva de largada, fora do teto de 3, para que a escolha do personagem seja uma decisão de estratégia desde o início.
30. Como jogador, eu quero que o Aprendiz seja sempre disponível e o Martelo e a Bigorna sejam desbloqueados por marcos, para que a Meta-Progressão tenha alvos concretos.
31. Como jogador do Desafio Diário, eu quero jogar a mesma Run que todos os outros jogadores (mesmo seed cobrindo embaralhamento e ofertas de Forja/Relíquia), para que o ranking meça habilidade, não sorte.
32. Como jogador do Desafio Diário, eu quero que o DDA fique desligado nesse modo, para que as condições sejam idênticas para todos.
33. Como jogador do Desafio Diário, eu quero ter 1 tentativa gratuita por dia e a opção de 1 extra via anúncio recompensado, para equilibrar engajamento diário e escolha do jogador.
34. Como jogador do Desafio Diário, eu quero ver o ranking semanal opt-in com a minha posição e o top 10, sem expor derrotas de ninguém, para comparar meu desempenho sem pressão social.
35. Como jogador, eu quero desbloquear permanentemente novos Efeitos de Forja e Relíquias raras ao completar marcos (1ª, 3ª e 5ª Run vencida; recorde de ≥ 2.500 pontos), para que a progressão seja por conquista, não por moeda.
36. Como jogador, eu quero escolher a ordem de desbloqueio quando um marco oferecer mais de uma opção, para que a árvore de progressão seja não-linear.
37. Como jogador, eu quero ver estatísticas de perfil (maior combo, taxa de vitória, cartas favoritas), para ter feedback de competência de longo prazo.
38. Como jogador, eu quero que cada Jogada acione feedback sonoro com pitch ascendente e vibração háptica proporcional ao tamanho do combo, para sentir o jogo "respondendo" às minhas ações.
39. Como jogador, eu quero comprar apenas itens cosméticos (skins de baralho, efeitos visuais de combo, passe de temporada sem expiração), para garantir que nenhum item de poder esteja à venda.
40. Como jogador, eu quero que anúncios recompensados sejam sempre opcionais e nunca necessários para o progresso core, para não ser forçado a interromper a sessão.
41. Como jogador, eu quero receber um lembrete gentil de pausa após várias Runs consecutivas em curto intervalo, para que o restart instantâneo não vire gatilho compulsivo.
42. Como jogador, eu quero ver a tela de resumo da Rodada com a pontuação obtida vs. a Meta e o botão de continuar, para celebrar o progresso e seguir com contexto.

## Implementation Decisions

- **Costura única (confirmada com o usuário nesta spec):** toda a lógica de regras vive em um módulo de motor de jogo em TypeScript puro, sem dependência de React Native, Skia, Reanimated, Zustand ou SQLite. Ele expõe funções puras no formato `(estado atual, ação) → (novo estado, lista de eventos)`. A camada de UI, a de estado e a de persistência são adaptadores finos em volta dele — mesma arquitetura validada no MVP do echo-runes.
- **RNG injetado:** toda a aleatoriedade (embaralhamento, ofertas de Forja/Relíquia) recebe uma fonte de aleatoriedade injetada, para que o Desafio Diário rode o mesmo seed de forma determinística para todos os jogadores e os testes sejam reproduzíveis.
- Responsabilidades do motor:
  - Reconhecimento de Padrão e cálculo do Valor-Base — melhor Padrão das cartas selecionadas, bônus tabelado (valores sintonizáveis: Carta Alta 0, Par 5, Dois Pares 15, Trinca 25, Sequência 40, Full House 55, Quadra 70) + soma dos Valores, incluindo sequências Ás–5 e 10–Ás.
  - Multiplicador de Combo — contagem de Jogadas na Rodada (×1 a ×4), zerado ao iniciar nova Rodada.
  - Estado de Run — Baralho de 40 (4 naipes × Valores 1–10), Mão de 7, reabastecimento pós-Jogada/Descarte, reciclagem das cartas ao fim da Rodada, limite de 4 Jogadas e 2 Descarte por Rodada, Carta Alta como fallback.
  - Rodada/Meta — curva base 50 × 1,7^(R−1), vitória ao atingir a Meta, derrota ao esgotar Jogadas, vitória "fácil" definida por margem ≥ 30% com 1+ Jogada sobrando.
  - DDA — estado leve persistente entre Runs (Rodada da última derrota, falhas consecutivas, vitórias fáceis consecutivas), aplicando −10%/+10% na Meta e alterando a frequência de Relíquia rara; desligado no Desafio Diário.
  - Forja — geração de 3 ofertas (2 de Efeito de Forja + 1 de Relíquia), teto de 3 Relíquias (oferta excedente vira carta), aplicação e empilhamento de Efeitos de Forja resolvendo somas antes de multiplicadores.
  - Relíquias e Forjadores — pool de 10 Relíquias em 4 categorias (Naipe, Padrão, Mecânica — sem "+1 Jogada" — e Combo); Relíquia exclusiva de largada do Forjador fora do teto.
  - Desafio Diário — seed completo da Run (embaralhamento + ofertas), sem DDA, 1 tentativa gratuita + 1 via anúncio.
  - Meta-Progressão — marcos por conquista (1ª/3ª/5ª Run vencida, recorde ≥ 2.500), escolha de ordem de desbloqueio, estatísticas de perfil.
- O estado da Run é uma estrutura de dados serializável, sem referências a componentes de UI.
- A camada de estado (Zustand) apenas despacha ações do jogador para o motor e armazena o estado resultante; nenhuma regra de jogo vive no store.
- A camada de persistência (SQLite, conforme ADR 0001) guarda o estado de meta-progressão: marcos atingidos, estatísticas de perfil e o estado leve do DDA.
- O backend (Supabase, conforme ADR 0001) tem um contrato mínimo para o Desafio Diário: servir o seed do dia, receber submissão de pontuação e devolver o ranking semanal (posição própria + top 10). Nada além disso vive no backend no MVP.
- A camada de renderização (Skia desenhando, Reanimated animando, expo-haptics para vibração) consome os eventos emitidos pelo motor para acionar o Juiciness (pitch ascendente, haptics proporcionais, animação de "quase lá"); não contém lógica de regra.
- Monetização (RevenueCat para IAP cosméticos + AdMob para anúncios recompensados, conforme ADR 0001): nenhum item que afete poder é vendido; anúncios recompensados são opt-in e nunca bloqueiam progresso core.
- Os números da curva de Meta, dos bônus de Padrão e dos Efeitos de Forja são sintonizáveis — a spec define a forma das fórmulas, não os valores finais.

## Testing Decisions

- Um bom teste verifica apenas o comportamento externo do motor: dado um estado inicial e uma ação (ex.: jogar uma trinca na 3ª Jogada), verifica-se o novo estado e os eventos emitidos — nunca a estrutura interna do cálculo.
- Módulos testados: o motor de regras puro — reconhecimento de Padrões e Valor-Base, crescimento e reset do Multiplicador de Combo, reciclagem do Baralho e reabastecimento da Mão, fluxo de Rodada/Meta, regras de DDA (incluindo persistência entre Runs), geração de ofertas de Forja com teto de Relíquias, e determinismo do Desafio Diário (mesmo seed → mesma sequência de Run).
- Prior art: o MVP do echo-runes usa a mesma arquitetura de motor puro com testes no pacote isolado do motor, rodando via linha de comando sem simulador — o Combo Forge segue esse padrão e reusa a configuração.
- O determinismo é testado explicitamente: duas Runs geradas com o mesmo seed produzem o mesmo embaralhamento e as mesmas ofertas de Forja/Relíquia.

## Out of Scope

- Multiplayer em tempo real.
- Compartilhamento de replay (imagem/vídeo) de combo recorde — citado no GDD, fica para pós-MVP.
- Passe de temporada completo e eventos de conteúdo sazonal.
- Conteúdo pós-lançamento (cartas, Relíquias e Forjadores adicionais).
- Relíquia de Mecânica "+1 Jogada" — deliberadamente fora do MVP (ADR de Relíquias), reservada para conteúdo futuro.
- Loja além do cosmético básico (skins de baralho, VFX de combo).
- Contas de usuário além do opt-in do ranking do Desafio Diário.
- Versões web/desktop.

## Further Notes

- **Idioma dos textos do jogo:** conforme o CLAUDE.md raiz de `D:\Sites\JOGOS`, os textos exibidos no jogo (UI, nomes de Padrões, tutoriais) são em inglês, mesmo que o glossário de domínio (`CONTEXT.md`) e este documento estejam em pt-br — a tradução acontece ao escrever o código, não termo a termo.
- O Juiciness (pitch ascendente, haptics proporcionais, animação de "quase lá") é parte do contrato de qualidade do MVP, não polimento opcional — é o que sustenta o pilar de RPE.
- Mitigações éticas do GDD permanecem: ranking opt-in sem expor derrota, DDA tunado apenas para Flow (sem gatilho de compra pós-derrota), lembrete de pausa após Runs consecutivas.
- Os ADRs 0001 (stack RN/Expo + Supabase), 0002 (Baralho reciclado) e 0003 (Desafio Diário com seed completo e DDA desligado) são a base técnica/design desta spec — mudanças que os contradigam devem ser explicitamente sinalizadas.
