# Análise do projeto — recomendações de melhoria

Levantamento feito em 2026-08-26 sobre o estado de `master` + as mudanças não
commitadas na árvore de trabalho. Cada item abaixo foi **verificado** rodando o
código, o `tsc` e a suíte de testes — nada aqui é suposição.

Para calibrar a leitura: a arquitetura deste projeto é sólida (ver
[O que está bem](#o-que-está-bem-e-não-deve-ser-mexido) no fim). Os problemas
listados são quase todos de **manutenção que ficou para trás**, não de decisões
erradas de design.

---

## Resumo

| Severidade | Itens |
|---|---|
| ✅ Corrigido | ~~14 testes falhando~~ · ~~`deviceId` nunca persistia~~ · ~~intersticial com ad unit errado~~ · ~~variável do Supabase dessincronizada~~ (2026-08-26) |
| 🟠 Estrutura | 107 MB de binário no histórico do git · nenhum linter/formatter · 4 docs de requisito concorrentes |
| 🟡 Consistência | Lacunas de i18n · sem escala de espaçamento · regra duplicada entre engine e UI |

---

## ✅ 1. A suíte de testes estava vermelha (14 falhas) — corrigido em 2026-08-26

`npx jest` chegou a reportar **4 suítes falhando, 14 testes, 315 passando**. O
`tsc --noEmit` passava limpo, então nada disso aparecia no typecheck.

Eram dois clusters, ambos com a mesma causa raiz: **uma constante mudou e os
testes não acompanharam**. Estado atual: **329/329 testes passando, typecheck
limpo**.

### 1a. `TARGET_GROWTH` — revertido para 1,7 pelo usuário

O commit `4478f14` ("fix: session fixes — ... target growth ...") tinha trocado
[engine/run.ts:43](engine/run.ts#L43) de `1.7` para `1.1`. O usuário reverteu
manualmente para `1.7` antes desta correção — a docstring
([engine/run.ts:97-100](engine/run.ts#L97-L100)), `engine/run.test.ts` e os três
documentos de requisito (`CONTEXT.md`, `SRS_Combo_Forge.md`,
`ESPECIFICACAO_FUNCIONAL_Combo_Forge.md`) já diziam 1,7 desde o início — não
precisaram de nenhum ajuste. `engine/run.test.ts` voltou a passar sozinho.

### 1b. Os ids do catálogo cosmético foram renomeados — testes atualizados

O commit `a0dc638` renomeou os ids internos de `skin-*` para `deck-*` e
adicionou `deck-classic` (item grátis, índice 0 do catálogo). Os testes ainda
usavam os nomes antigos. Corrigido:

- [store/shopFlow.test.ts](store/shopFlow.test.ts) — `skin-obsidian` → `deck-obsidian`, `skin-emerald` → `deck-emerald`, `skin-royal` → `deck-royal` (5 testes)
- [store/gameStore.test.ts:573-608](store/gameStore.test.ts#L573-L608) — mesma troca (3 testes)
- [engine/shop.test.ts](engine/shop.test.ts) — mesma troca + `'tem 3 skins de baralho'` → `'tem 4 skins de baralho'` (o catálogo agora tem `deck-classic` além das 3 pagas), `toHaveLength(3)` → `toHaveLength(4)`

Os `productId` do RevenueCat (`combo_forge_skin_obsidian` etc., usados em
chamadas ao provider como `provider.purchase('combo_forge_skin_obsidian')`) **não**
foram tocados — são um contrato externo diferente do id interno, e não mudaram
com o rename. Confirmado que não há risco de compra órfã.

**Um quinto ponto de falha apareceu só depois desses ajustes** (mascarado pelos
outros até então): `engine/shop.test.ts` assumia que `offerings[0]` era sempre
a skin Obsidian (`$0.99`), mas `deck-classic` (grátis, `$0`) agora entra como
primeiro item do catálogo. Trocado o acesso por índice por uma busca pelo
`productId` correto:

```ts
// antes: expect(offerings[0].price).toBe('$0.99');
const obsidian = offerings.find((o) => o.productId === 'combo_forge_skin_obsidian');
expect(obsidian?.price).toBe('$0.99');
```

> **Por que isso importava:** com a suíte vermelha, o `/implement` do fluxo de
> tickets não conseguia mais usar "testes passando" como portão de merge. Isso
> está restaurado.

---

## ✅ 2. O `deviceId` do leaderboard — corrigido em 2026-08-26

A investigação inicial (via [store/sqlite.ts](store/sqlite.ts) isolado) apontou
uma assimetria JSON entre `loadDeviceId`/`saveDeviceId`. Ao rastrear onde esse
código é chamado de verdade, o bug real era **maior**: no app publicado, o
`deviceId` nunca chegava a ser lido do SQLite nenhuma vez — era recriado do
zero a cada abertura do app.

**Causa raiz:** o store singleton (`export const gameStore = createGameStore();`
em [store/gameStore.ts:711](store/gameStore.ts#L711)) é construído na avaliação
do módulo, **antes** do bootstrap rodar — e nesse momento usa sempre o port de
memória padrão (`deps.dailyStorage ?? createMemoryDailyChallengeStorage()`,
[store/gameStore.ts:333](store/gameStore.ts#L333)). É ali que
`daily.deviceId` é resolvido, uma única vez, gravado no objeto de estado
inicial. Só depois `App.tsx` chama `initializeSqlitePersistence()`
([store/bootstrap.ts](store/bootstrap.ts)), que troca `state.dailyStorage`
pelo SQLite real — mas **não re-derivava `daily.deviceId`**, só `attempts`. O
campo ficava para sempre com o id gerado em memória, e o `saveDeviceId`
chamado na construção do store gravava numa instância de storage que era
descartada logo em seguida.

Efeito prático: cada sessão usava (e submetia ao leaderboard) um `deviceId`
novo, aleatório, nunca persistido de verdade — o jogador nunca teria uma
identidade estável no ranking semanal entre dois lançamentos do app.

**Correção aplicada** (espelhando o padrão que `attempts` já usava em
`bootstrap.ts`):

```ts
// store/bootstrap.ts — dentro de initializeSqlitePersistence(), após obter o dailyStorage real
const savedDeviceId = dailyStorage.loadDeviceId();
const deviceId = savedDeviceId ?? createDeviceId();
if (deviceId !== savedDeviceId) dailyStorage.saveDeviceId(deviceId);
// ...
daily: { ...gameStore.getState().daily, deviceId, attempts: /* já existia */ },
```

Além disso, a assimetria original de fato existia e foi corrigida junto —
`loadDeviceId` em [store/sqlite.ts](store/sqlite.ts) agora usa `readJson<string>`,
simétrico com o `writeJson` do `saveDeviceId` (mesmo padrão das outras chaves
do arquivo). Sem essa correção, mesmo com o bootstrap consertado, a primeira
leitura pós-gravação viria com aspas literais.

**Sem migração necessária:** o Play Console ainda está "em validação"
([docs/release-checklist.md](docs/release-checklist.md)) — não há instalação
real em campo cujo `deviceId` precise ser preservado.

`tsc --noEmit` limpo e 329/329 testes passando após a mudança (nenhum teste
cobria `bootstrap.ts` diretamente — ele toca `expo-sqlite/kv-store`, módulo
nativo indisponível em Jest; verificação foi manual, lendo o fluxo de ponta a
ponta).

---

## ✅ 3. O anúncio intersticial usava o ad unit do recompensado — corrigido em 2026-08-26

[services/ads.ts](services/ads.ts) tinha uma única variável de ad unit
(`EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_*`) compartilhada entre
`requestRewardedAd` e `requestInterstitialAd`. Ad units do AdMob são
específicos por formato — o próprio `.env.example` já documentava a regra
certa para o banner ("Ad unit de banner é SEPARADA da rewarded no dashboard"),
mas o intersticial não seguia essa mesma regra. Em produção,
`InterstitialAd.createForAdRequest()` com um id de rewarded não serve anúncio.
Em desenvolvimento isso passava despercebido porque cai sempre no
`TestIds.INTERSTITIAL` quando `NODE_ENV !== 'production'` — o bug só aparecia
no build de loja.

**Correção:** variável própria `EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_{ANDROID,IOS}`,
lida por uma função separada (`interstitialAdUnitId()`, espelhando
`rewardedAdUnitId()`) e passada ao `requestAdMobInterstitial`. Documentado em
[.env.example](.env.example) junto com as outras duas (rewarded, banner).

**Achado ao verificar o `docs/release-checklist.md`:** a unidade de anúncio
**Interstitial nunca foi criada** no dashboard do AdMob — só rewarded e banner
existem lá (seção 3 do checklist, histórico de 2026-08-16/21). Ou seja, o bug
não tinha como ser pego em teste manual: mesmo com o código corrigido, ainda
não há um ad unit real de intersticial para apontar em produção. Adicionei os
itens pendentes correspondentes no checklist (criar a unidade, preencher
`.env` + EAS, testar em release build) — o resto da cadeia (contador de Runs em
[store/gameStore.ts:549-557](store/gameStore.ts#L549-L557), consumo em
`RunWonScreen.tsx`/`RunLostScreen.tsx`) já estava correto e não precisou mudar.

`tsc --noEmit` limpo e 329/329 testes passando (não há teste cobrindo
`services/ads.ts` — toca o SDK nativo do AdMob via import dinâmico; verificação
manual, lendo a nova função lado a lado com a antiga).

---

## ✅ 4. Variável do Supabase dessincronizada — corrigido em 2026-08-26 (era regressão do código, não do doc)

**Correção da análise original:** o item foi escrito lendo só `.env.example`
vs. `services/supabase.ts` e concluiu que o `.env.example` estava errado. Ao
checar o histórico, é o oposto: o commit `4478f14` (2026-08-25, um dia antes
desta análise) renomeou a variável em `services/supabase.ts` de
`EXPO_PUBLIC_SUPABASE_ANON_KEY` para `EXPO_PUBLIC_SUPABASE_KEY` — sem motivo
declarado além de "fix" no commit — e não tocou em mais nenhum outro lugar do
repositório.

**Toda outra referência ao mesmo valor** — `.env.example`, `README.md`,
`SRS_Combo_Forge.md`, e principalmente os comandos `eas env:set` já executados
e documentados em [docs/release-checklist.md:327](docs/release-checklist.md#L327)
— usa `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Ou seja: o ambiente de **preview real no
EAS já tem essa variável configurada com esse nome** (verificado e validado em
2026-08-16, antes da regressão). O commit de ontem, se tivesse ido para
produção sem essa correção, teria feito `isSupabaseConfigured()` devolver
`false` no build de preview/produção — o Desafio Diário cairia em
`createUnavailableDailyBackend()` silenciosamente, apesar do EAS estar
corretamente configurado.

**Correção aplicada:** revertida a linha em
[services/supabase.ts](services/supabase.ts) de volta para
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, e o `.env` local (não versionado) renomeado
para acompanhar — sem essa segunda parte, o ambiente de desenvolvimento local
é que pararia de funcionar (o `.env` local já tinha sido atualizado para o
nome novo, incorreto, pelo mesmo commit de ontem).

`tsc --noEmit` limpo e 329/329 testes passando (nenhum teste cobre
`services/supabase.ts` diretamente — usa `@supabase/supabase-js` de verdade;
`supabase/contract.test.ts` testa o contrato RPC, não a leitura de env).

---

## 🟠 5. 107 MB de binário no histórico do git

```
combo-forge-production.aab   →  106,9 MB, commitado em a0dc638
.git/                        →  769 MB
```

A causa exata: o [.easignore](.easignore) tem `*.aab` (correto — o EAS não faz
upload dele), mas o [.gitignore](.gitignore) **não tem**. O arquivo escorregou
pela brecha entre os dois.

Já foi enviado para os dois remotes (`origin` e `pages`), então tirar do
histórico exige `git filter-repo`/BFG + `push --force` nos dois. É viável (repo
privado, provavelmente sem outros clones), mas é uma operação coordenada — não
dá para fazer de passagem.

**Mínimo imediato**, mesmo adiando a limpeza do histórico: acrescentar
`*.aab`, `*.apk` e `*.ipa` ao `.gitignore` para não repetir. Hoje nada impede o
próximo build de entrar junto.

---

## 🟠 6. Não há linter nem formatter configurado

Não existe `.eslintrc*`, `eslint.config.*`, `.prettierrc*` nem `biome.json`, e o
`package.json` não tem script `lint`. Os sintomas aparecem espalhados pelo
código — todos seriam pegos automaticamente:

| Arquivo | Problema |
|---|---|
| [components/GameScreen.tsx:2](components/GameScreen.tsx#L2) | `Modal` importado e nunca usado (o modal de abandono é uma `View` na mão) |
| [components/ShopScreen.tsx:48](components/ShopScreen.tsx#L48) | `item.id == 'deck-classic'` — `==` solto; todo o resto do repo usa `===` |
| [components/ShopScreen.tsx:139](components/ShopScreen.tsx#L139) | `function DeckPreview({ item }: any)` — sendo que `DeckSkinItem` já existe |
| [components/RunLostScreen.tsx:83](components/RunLostScreen.tsx#L83) | `<          Text style=...>` — compila, mas é lixo de formatação |
| [components/ShopScreen.tsx:59](components/ShopScreen.tsx#L59) | `) ? (                    <Text ...>` — mesmo caso |

O código tem só 4 escapes de tipo no projeto inteiro (`as any` × 3 +
`: any` × 1), o que é sinal de disciplina real. Um ESLint com
`@typescript-eslint` + `eslint-plugin-react-hooks` custaria pouco e travaria
essa erosão. O `react-hooks/exhaustive-deps` em particular vale por si só num
app com `useEffect` disparando anúncio.

---

## 🟠 7. Quatro documentos de requisito concorrentes

Na raiz do projeto:

| Documento | Linhas |
|---|---|
| `GDD_Combo_Forge.md` | 144 |
| `PRD_Combo_Forge.md` | 234 |
| `SRS_Combo_Forge.md` | 397 |
| `ESPECIFICACAO_FUNCIONAL_Combo_Forge.md` | 542 |
| **subtotal** | **1.317** |

Mais `CONTEXT.md`, `README.md`, `PRODUCT.md` e `DESIGN.md` (os dois últimos do
Impeccable) — 8 documentos de topo no total.

O fluxo definido no `CLAUDE.md` da raiz de JOGOS prevê **GDD + `CONTEXT.md` +
`docs/adr/`**. O PRD/SRS/Especificação Funcional são camadas extras, todos
carimbados "v1.0 — Agosto de 2026", e o item 1a já mostra o custo: a curva de
Meta está desatualizada em três deles simultaneamente. Quanto mais cópias da
mesma regra, mais caro fica cada mudança de balanceamento.

Sugestão: eleger `CONTEXT.md` como fonte da verdade do domínio e mover o trio
para `docs/historico/` (ou deletar — o git guarda). Se forem entregáveis
contratuais que precisam existir, ao menos marcar no topo de cada um que são
snapshots congelados e não refletem o código atual.

**`DESIGN.md` também derivou:** declara `fontFamily: "System"` em toda a escala
tipográfica, mas [components/typography.ts](components/typography.ts) usa
`Rubik` e `Selawik` desde que as fontes entraram. As **cores**, essas sim, estão
perfeitamente sincronizadas com [components/theme.ts](components/theme.ts) —
conferi token a token.

---

## 🟡 8. i18n aplicado pela metade

O [i18n/index.ts](i18n/index.ts) é bem construído: tipos inferidos do `pt.json`,
resolução por SQLite → locale do device → fallback. Mas a adoção nas telas ficou
incompleta.

**28 `accessibilityLabel` em inglês fixo**, em 13 componentes — de
`"Abandon run"` a `"Restore purchases"`. Num app que já detecta locale pt-BR,
todo leitor de tela em português vai ouvir rótulos em inglês. Como acessibilidade,
é a parte da i18n que mais importa e a única 100% não traduzida.

**Texto visível fora do `t()`:**

| Local | Texto |
|---|---|
| [components/GameScreen.tsx:91](components/GameScreen.tsx#L91) | `Base {n} · {n} pts with ×{n}` |
| [components/RunLostScreen.tsx:69](components/RunLostScreen.tsx#L69) | `'DAILY CHALLENGE · '` + `ROUND {n} · {forjador}` |
| [components/RunLostScreen.tsx:108](components/RunLostScreen.tsx#L108) | `target {run.target}` |
| [components/CollectionScreen.tsx:141](components/CollectionScreen.tsx#L141) | `All 40 base cards are always available — forge effects shape them.` |
| [components/OnboardingOverlay.tsx:130-131](components/OnboardingOverlay.tsx#L130-L131) | `Pair` / `10 + card values` |

*(Conferi o "40 base cards": 4 naipes × valores 1–10 = 40. O texto está correto,
só não está traduzido.)*

**Chaves dinâmicas anulam a tipagem:**
[components/OnboardingOverlay.tsx:47-49](components/OnboardingOverlay.tsx#L47-L49)
usa `t(\`onboarding.${stepKey}.title\` as any)`. São exatamente os 3 `as any` do
projeto. O `as any` derrota o sistema de tipos que o `i18n/index.ts` foi feito
para oferecer — uma chave removida do `pt.json` não daria erro de compilação
aqui. Um mapa explícito `STEP_KEYS → chave` resolveria sem cast.

---

## 🟡 9. `theme.ts` tem cores, mas não tem escala de espaçamento

O [components/theme.ts](components/theme.ts) define 17 cores bem nomeadas e
comentadas. Não define espaçamento, raio de borda nem tamanho de toque. O
resultado nos componentes:

- **431 valores numéricos crus** de `padding`/`margin`/`gap`/`borderRadius`
- **24 valores distintos**: `0 1 2 3 4 5 6 7 8 10 11 12 14 16 18 20 22 24 28 40 44 70 80 100`

Uma escala real não tem `7`, `11`, `22` e `70` — esses números são deriva
acumulada, não decisão. Um `spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }`
no mesmo arquivo das cores daria à UI a mesma consistência que a paleta já tem.

Caso concreto de deriva: [components/GameScreen.tsx:380](components/GameScreen.tsx#L380)
tem `marginTop: 100` no bloco de ações — um número grande e arbitrário para
empurrar os botões para baixo, exatamente o tipo de ajuste que quebra em telas
de altura diferente.

---

## 🟡 10. Duplicações que valem uma extração

**O efeito do intersticial é idêntico nas duas telas de fim.**
[RunWonScreen.tsx:26-37](components/RunWonScreen.tsx#L26-L37) e
[RunLostScreen.tsx:27-38](components/RunLostScreen.tsx#L27-L38) têm o mesmo
bloco — 3 assinaturas do store + o mesmo `useEffect`, linha por linha. Um
`useInterstitialOnRunEnd(dailyEnd)` eliminaria a cópia e garantiria que uma
correção futura pegue as duas telas.

**A regra "o baralho clássico é grátis" está escrita duas vezes, de formas
diferentes:**

```ts
// engine/shop.ts:177
if (itemId !== 'deck-classic' && !isOwned(state, itemId)) return state;

// components/ShopScreen.tsx:48
const owned = item.id == 'deck-classic' ? true : isOwned(shop.owned, item.id);
```

O conceito "item grátis / padrão" não está modelado — é um literal de string
comparado em duas camadas. Um campo `free: true` no `DeckSkinItem` (ou um
`isFreeItem(item)` exportado pelo engine) daria uma fonte só.

**E essa duplicação já produziu uma inconsistência visível:**
[ShopScreen.tsx:46](components/ShopScreen.tsx#L46) monta o contador
`{comprados}/{total}` usando `isOwned` — que devolve `false` para o clássico —
enquanto a linha 48 trata o clássico como possuído. Jogador novo abre a loja e vê
**"0/4"** mesmo tendo um baralho jogável e equipado.

Detalhe menor no mesmo tema: `deck-classic` carrega um `productId`
(`combo_forge_skin_classic`) que nunca será comprado, e que não existe no
[docs/release-checklist.md](docs/release-checklist.md) — os outros 5 estão lá.
Configuração morta.

---

## O que está bem (e não deve ser mexido)

Sendo justo com o que o projeto acertou, porque isso também orienta decisões
futuras:

**O motor puro é o ponto forte da arquitetura.** `engine/` não importa React
Native, Skia, Reanimated, Zustand nem SQLite — nada. A regra de jogo inteira é
testável em milissegundos, e é por isso que existem 315 testes passando em ~6s.
Isso não é acidente: está declarado em [engine/index.ts:1-7](engine/index.ts#L1-L7)
e foi respeitado em todos os 14 módulos.

**A aleatoriedade injetada foi pensada de verdade.** O
[engine/random.ts](engine/random.ts) não só injeta o `Rng` — o comentário
explica *por que* as ofertas de Forja precisam de uma stream separada do
embaralhamento (decisões do jogador consomem números diferentes, o que quebraria
a justiça do Desafio Diário). Esse é o tipo de raciocínio que normalmente se
perde e vira bug seis meses depois.

**Ports & adapters aplicado com consistência.** `DdaStorage`,
`ProgressionStorage`, `DailyChallengeStorage`, `ShopStorage`, `BreakStorage`,
`ShopProvider`, `AdProvider`, `DailyBackend` — todos com implementação em
memória para teste e SQLite/SDK real no app, trocados num único ponto
([store/bootstrap.ts](store/bootstrap.ts)). E o bootstrap degrada com elegância:
sem SQLite a sessão continua jogável, só não persiste.

**Cobertura onde importa.** 14 arquivos de teste no engine (só `cards.ts` e
`random.ts` ficam sem, e são triviais) + 3 no store, incluindo um
`gameStore.test.ts` de 887 linhas. Componentes sem teste é uma escolha
defensável dado que eles são finos e a lógica está toda no engine — não
considero isso um problema.

**A garantia de "cosmético nunca afeta poder" está documentada no código**
([engine/shop.ts:1-14](engine/shop.ts#L1-L14)), não só no PRD. Boa prática de
monetização, e o tipo de coisa que impede alguém de "só adicionar um bônus
pequeno" na skin paga daqui a um ano.

**Os docstrings em pt-br explicam o porquê, não o quê.** O comentário sobre
arredondamento em [engine/run.ts:99](engine/run.ts#L99) ("não 'corrigir' o
arredondamento") é literalmente uma armadilha desarmada para o próximo leitor —
ainda que o número em si tenha ficado desatualizado.

---

## Ordem sugerida

1. ~~Consertar os 14 testes~~ (itens 1a/1b) — ✅ feito em 2026-08-26.
2. ~~`deviceId` do SQLite~~ (item 2) — ✅ feito em 2026-08-26.
3. ~~Ad unit do intersticial~~ (item 3) — ✅ código corrigido em 2026-08-26; falta só criar a unidade real no dashboard AdMob (checklist atualizado).
4. ~~Variável do Supabase~~ (item 4) — ✅ feito em 2026-08-26 (revertida uma regressão de um dia atrás).
5. **`.gitignore` com `*.aab`** (item 5, parte barata) — impede que o problema cresça enquanto a limpeza do histórico não acontece.
6. **ESLint + Prettier** (item 6) — barato, e trava a erosão dos itens 8, 9 e 10 daqui para frente.
7. **Consolidar os docs** (item 7) e **escala de espaçamento** (item 9) — dívida real, mas nenhuma delas sangra hoje.
