# Combo Forge: banner full-width + compra de remoção de anúncios

Status: ready-for-agent

## Problem Statement

O jogo tem uma única forma de anúncio — o recompensado opt-in do Desafio Diário — e uma loja 100% cosmética. Não existe linha de receita passiva nem um IAP de conveniência: o jogador que quer apoiar o jogo ou remover qualquer incômodo de anúncio não tem o que comprar. Sem um banner, o IAP de remoção de anúncios (o formato mais comum de conveniência em jogos casuais) não tem objeto — não há o que remover.

## Solution

Um banner full-width de 50dp (`ADAPTIVE_BANNER`) fixo no rodapé de todas as telas (inclusive a de jogo), servido pelo AdMob com uma ad unit própria de banner, e um IAP não-consumível "Remover anúncios" (US$2,99) vendido na Loja. A compra esconde o banner em todas as telas imediatamente; o anúncio recompensado do Desafio Diário **permanece** (é opt-in e dá benefício de jogo — não é poluição que o comprador quer eliminar). O banner é o motor da compra de remoção, não uma linha de receita: o valor está no incômodo que ele cria, e o retorno direto é secundário. Antes da aprovação do app no AdMob (readiness review), o banner real não serve anúncio (`NO_FILL`) — o espaço de 50dp é reservado mesmo vazio, para estabilidade de layout; em dev build o `TestIds.BANNER` do Google sempre carrega e o fluxo inteiro é validável hoje.

## User Stories

1. Como jogador, eu quero ver um banner de anúncio no rodapé em todas as telas (início, jogo, perfil, coleção, Desafio Diário, loja), para que o jogo tenha uma linha de monetização passiva e a compra de remoção tenha valor.
2. Como jogador, eu quero que o banner ocupe a largura toda da tela com 50dp de altura (`ADAPTIVE_BANNER`), para que se integre ao layout sem parecer um retângulo de 320dp flutuando.
3. Como jogador, eu quero ver o banner também durante a Rodada (tela de jogo), para que a exposição seja consistente em toda a sessão — o risco de clique acidental durante o jogo é aceito e revisável se o AdMob sinalizar.
4. Como jogador, eu quero que o banner não se sobreponha ao conteúdo — o rodapé reserva os 50dp e o conteúdo da tela fica acima dele, para que nada importante fique oculto.
5. Como jogador, eu quero que o espaço do banner permaneça reservado (50dp) mesmo quando o anúncio não carrega (estado `NO_FILL`, app ainda não aprovado no AdMob), para que o layout não "pule" quando o anúncio começar a servir.
6. Como jogador em build de desenvolvimento, eu quero ver o anúncio de teste do Google (`TestIds.BANNER`) no lugar do real, para validar o fluxo completo sem gastar impressões reais nem depender da aprovação do AdMob.
7. Como jogador, eu quero comprar "Remover anúncios" na Loja por US$2,99 (IAP não-consumível), para nunca mais ver o banner.
8. Como jogador, eu quero que, imediatamente após a compra, o banner desapareça de todas as telas (inclusive da tela atual), para que o resultado da compra seja instantâneo e visível.
9. Como jogador que comprou, eu quero que o banner continue oculto em sessões futuras (estado persistido), para que a compra seja permanente.
10. Como jogador que comprou e trocou de aparelho ou reinstalou, eu quero restaurar a compra pelo botão "Restaurar compras" na Loja, para não pagar duas vezes.
11. Como jogador que comprou, eu quero que o restore aconteça automaticamente ao abrir o app (o RevenueCat reentrega a entitlement no launch), para que mesmo sem tocar em nada o banner continue oculto.
12. Como jogador que comprou a remoção de anúncios, eu quero continuar assistindo anúncio recompensado no Desafio Diário para liberar a tentativa extra, para não perder o benefício de jogo que escolhi assistir.
13. Como jogador, eu quero que nenhum anúncio seja obrigatório — o banner é passivo e o recompensado é opt-in, para que o progresso core nunca dependa de anúncio.
14. Como jogador que ainda não comprou, eu quero que nada além do banner apareça sobre o anúncio (sem botões/overlays sobre ele), para que a experiência siga as políticas do AdMob e a conta não seja penalizada.

## Implementation Decisions

- **Produto `remove_ads` fora do `COSMETIC_CATALOG` (confirmado com o usuário nesta spec):** o catálogo cosmético tem a garantia explícita "itens 100% visuais, nunca tocam poder de jogo"; o remove-ads não é cosmético. Ele vira um IAP não-consumível separado, com o check de entitlement no port `ShopProvider` (novo método, tipo `hasEntitlement(entitlementId)`), espelhando como o rewarded entrou via port `AdProvider`. O preço exibido vem do provider (oficina do RevenueCat); em dev, o provider dev devolve o preço dev (ex.: `$2.99`).
- **Entitlement única `remove_ads`:** o RevenueCat expõe uma entitlement (não um productId de catálogo) para a remoção; o check é feito no port e o store guarda o resultado como `adsRemoved: boolean` no estado. Compra e restore passam pelo mesmo caminho de entitlement.
- **Banner via AdMob com ad unit própria:** nova variável `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID` (e `_IOS` quando publicar), selecionada por plataforma via `Platform.OS`, mesmo padrão do rewarded em `services/ads.ts`. Em dev (`NODE_ENV !== 'production'`) usa `TestIds.BANNER`. Ad unit de banner é separada da rewarded no dashboard do AdMob.
- **Componente `<AdBanner/>` compartilhado e fino:** renderiza `BannerAd` do `react-native-google-mobile-ads` com `BannerAdSize.ADAPTIVE_BANNER`, em um container de altura fixa 50dp. Lê do store: (a) `adsRemoved` (oculto se true) e (b) a config de ads. Não contém regra de negócio — só renderização. Reserva os 50dp sempre que visível (estado `NO_FILL` incluso), por decisão de design (estabilidade de layout).
- **Regra de visibilidade pura:** `shouldShowBanner(adsRemoved: boolean): boolean` — função pura no engine (ou módulo equivalente testável), trivial (`!adsRemoved`) mas explícita e testável.
- **Estado no store (`gameStore`):** novo campo `adsRemoved: boolean` + ação `purchaseRemoveAds()` (chama `shopProvider.purchase`/entitlement, marca `adsRemoved`, persiste) e o `restorePurchases()` existente passa a marcar `adsRemoved` quando a entitlement vem do restore. Persistência do estado via port `ShopStorage` (SQLite no app, memória nos testes), como o `owned` da loja.
- **Integração no `App.tsx`:** o `<AdBanner/>` entra no rodapé do layout raiz (fora do `SafeAreaView` de topo, como `BreakReminderBanner`/`GameFeedback`), renderizado em todas as telas — a troca de tela não o remonta.
- **Restore automático no launch:** o RevenueCat sincroniza entitlements ao configurar; o bootstrap/`loadShop` reflete `adsRemoved` quando o SDK reporta a entitlement — sem UI extra, além do botão existente "Restaurar compras" na Loja (que também atualiza `adsRemoved`).
- **Oferta só na Loja (confirmado com o usuário):** card "Remove Ads" (US$2,99) na `ShopScreen`, com o mesmo padrão dos itens cosméticos (preço do provider, estado de compra, busy). Nada sobreposto ao banner — viola política do AdMob.
- **Preço:** US$2,99 definido no RevenueCat; valor em reais fixado manualmente no Play Console na publicação (não confiar na conversão automática).
- **Sem mudança no rewarded:** o Desafio Diário e o `AdProvider` ficam intactos; a compra não os toca.

## Testing Decisions

- Um bom teste verifica o comportamento externo: dado o estado e uma ação (ex.: comprar a remoção), verifica-se o novo estado (banner oculto) e a persistência — nunca a estrutura interna do provider.
- Módulos testados, no seam mais alto do projeto (o `gameStore` com deps injetáveis, mesmo padrão de `gameStore.test.ts`/`dailyFlow.test.ts`):
  - `purchaseRemoveAds()` — chama o provider, marca `adsRemoved: true`, persiste no storage; provider que devolve false (cancelamento) não marca nada.
  - `restorePurchases()` — devolve a entitlement remove-ads, marca `adsRemoved: true` e persiste; restore sem a entitlement não altera.
  - `shouldShowBanner()` — regra pura (banner oculto se `adsRemoved`, visível se não).
  - Carregamento do estado persistido no boot — `adsRemoved` sobrevive à recriação do store.
- Prior art: `store/dailyFlow.test.ts` (rewarded via port com provider fake) e `store/gameStore.test.ts` (compra/restore da loja com provider fake) — os mesmos fakes de `ShopProvider` ganham o novo método de entitlement.
- Fora do teste unitário: renderização nativa do `BannerAd` (módulo nativo) — validada em dev build no emulador com o `TestIds.BANNER` (anúncio de teste sempre carrega), mesmo fluxo de validação do rewarded.

## Out of Scope

- **Banner iOS:** ad unit `_IOS` e publicação ficam para quando o app for à App Store (hoje o iOS usa Test App ID, seguro). O código já seleciona por plataforma.
- **Remoção do anúncio recompensado:** a compra remove só o banner; o rewarded do Desafio Diário permanece (ADR 0004).
- **Interstitial/outros formatos de anúncio.**
- **Criação dos IAPs reais nas lojas** (Play Console/App Store Connect) e troca da chave pública do RevenueCat — itens do release-checklist, dependem de ação humana.
- **Overlay/popup de oferta de remoção** — deliberadamente fora (decisão do grilling: oferta só na Loja).
- **Web/desktop.**
- **Customização de posição/altura do banner** (sempre 50dp, rodapé).

## Further Notes

- **Base de design:** ADR 0004 (`docs/adr/0004-banner-remocao-anuncios.md`) registra as decisões do grilling — este spec é a tradução delas em contrato implementável.
- **Estado atual do AdMob:** o app criado no AdMob está no fluxo "unpublished"; antes do readiness review + vínculo com a loja, o banner real retorna `NO_FILL`. Por isso a reserva de 50dp é parte do contrato (estabilidade de layout) e a validação de ponta a ponta usa o `TestIds.BANNER` em dev.
- **Idioma dos textos do jogo:** conforme o CLAUDE.md raiz, os textos exibidos no jogo são em inglês ("Remove Ads", "Restore Purchases") mesmo que este documento e o glossário estejam em pt-br.
- **Risco aceito:** clique acidental no banner durante a Rodada (banner é clicável e abre o anúncio) — aceito no grilling; revisitar se o AdMob sinalizar cliques acidentais.
