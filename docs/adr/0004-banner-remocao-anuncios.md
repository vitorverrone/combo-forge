# Banner full-width + compra de remoção de anúncios

O jogo ganha um banner fixo de 50dp no rodapé de todas as telas e um IAP não-consumível de remoção de anúncios (US$2,99). Decisões fechadas em grilling, seguindo a filosofia do GDD de anúncio não intrusivo.

## Objetivo do banner

O banner **não é linha de receita** — é o motor da compra de remoção. Banner é o formato de menor eCPM do AdMob (ordem de US$0,1–1 por 1.000 impressões); como receita é fraco e ainda custa UX (risco de churn, e o GDD mira D1 de 40–45%). O valor real está no incômodo que ele cria: é o que dá sentido à compra de remoção. A receita principal de anúncios continua sendo o recompensado opt-in do Desafio Diário.

## Posição e comportamento

Banner **full-width de 50dp** (`ADAPTIVE_BANNER`) em **todas as telas, inclusive a de jogo** (Rodada, Forja, Fim de Run). 50dp é exatamente o tamanho padrão de banner do SDK (o mínimo é 50dp; 30dp não existe como tamanho AdMob). O risco de clique acidental na Rodada (banner é clicável e abre o anúncio no meio do jogo) foi **aceito** — fica anotado para revisitar se o AdMob sinalizar cliques acidentais.

## O que a compra remove

A compra remove **só o banner**. O anúncio recompensado do Desafio Diário permanece disponível: ele é opt-in, dá benefício de jogo (tentativa extra) e não é "poluição de anúncio" no sentido que o comprador quer eliminar — remover o recompensado puniria quem pagou (perderia a tentativa extra). É o padrão da indústria: "remove ads" tira passivos, mantém recompensados.

## Preço

**US$2,99** — preço âncora da categoria para remoção de anúncios em jogos casuais; barato o bastante para converter, sem desvalorizar a compra (e com margem para promoções). No Play Console o valor deve ser fixado em reais, não deixado na conversão automática da loja.

## Estado sem anúncio (NO_FILL)

Enquanto o app AdMob não passa no readiness review (e para qualquer falha de fill), o rodapé **reserva os 50dp mesmo vazio** para quem não comprou. Estabilidade de layout vale mais que o espaço temporário: botões não pulam quando o anúncio começar a servir. Sem faixa decorativa no lugar do anúncio — espaço vazio neutro é mais honesto que um "anúncio quebrado". Em dev build isso não aparece: o `TestIds.BANNER` do Google sempre carrega.

## Onde compra

A oferta fica **só na Loja** (card "Remover anúncios" junto dos outros itens). Nada sobreposto ao banner — botões/overlays sobre o anúncio são violação de política do AdMob (área de toque exclusiva do anunciante) e arriscam a conta. Sem popup de oferta: o jogador que compra remoção já sabe que o banner existe, a descoberta via Loja é natural.

## Restore

Restore **automático no launch** (o RevenueCat sincroniza entitlements ao abrir) **+ botão "Restaurar compras" na Loja** como rede de segurança. Sem o botão, um jogador que troca de conta no Android pode pagar duas vezes sem saber que pode restaurar — gerando reembolso/churn. O botão é obrigatório no iOS para não-consumíveis; no Android é boa prática.

## Consequências

- Nova ad unit de **banner** no AdMob (separada da rewarded; o app já existe) + env `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID` (`_IOS` quando publicar)
- Componente `<AdBanner/>` compartilhado: 50dp fixos no rodapé de todas as telas, escondido quando a entitlement `remove_ads` está ativa
- Produto não-consumível `remove_ads` no RevenueCat + check de entitlement no banner
- Compra e restore testáveis com a Test Store key (fluxo simulado) antes da chave pública real
