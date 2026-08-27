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
| ✅ Corrigido | ~~14 testes falhando~~ · ~~`deviceId` nunca persistia~~ · ~~intersticial com ad unit errado~~ · ~~variável do Supabase dessincronizada~~ · ~~binário no `.gitignore`~~ · ~~sem linter/formatter~~ · ~~i18n pela metade~~ (2026-08-26) |
| 🟠 Estrutura | limpeza do histórico do git (`.aab` já saiu do índice, mas o blob de 107 MB segue no histórico) · 4 docs de requisito concorrentes |
| 🟡 Consistência | sem escala de espaçamento · regra duplicada entre engine e UI |

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

## ✅ 5. 107 MB de binário no histórico do git — mínimo aplicado em 2026-08-26

A causa exata já estava certa: o [.easignore](.easignore) tem `*.aab` (correto
— o EAS não faz upload dele), mas o [.gitignore](.gitignore) não tinha. O
`combo-forge-production.aab` (106,9 MB, commitado em `a0dc638`) escorregou pela
brecha entre os dois.

**Aplicado — o "mínimo imediato" que o item já previa:**
- `*.aab`, `*.apk` e `*.ipa` adicionados ao [.gitignore](.gitignore).
- `git rm --cached combo-forge-production.aab` — o arquivo sai do índice do
  git, mas **continua no disco** (build local intacto, nada deletado).

**Não aplicado, continua como próximo passo separado:** a limpeza do
histórico (`git filter-repo`/BFG + `push --force` em `origin` e `pages`). Já
foi enviado aos dois remotes, é uma operação coordenada e destrutiva por
natureza — fica para quando o usuário decidir explicitamente fazer essa
faxina. O `.git/` continua em ~769 MB até lá; o que mudou é que **nenhum novo
build vai voltar a inflar isso**.

---

## ✅ 6. ESLint + Prettier configurados em 2026-08-26

Não existia `.eslintrc*`, `eslint.config.*`, `.prettierrc*` nem script `lint`.
Configurado via `npx expo lint` (que instala `eslint@^9` + `eslint-config-expo`
e gera `eslint.config.js`) — com um ajuste importante: o `expo lint` **sem
argumentos só varre `/src`, `/app` e `/components`** por padrão, o que deixaria
`engine/`, `store/`, `services/` e `i18n/` — onde mora a maior parte da lógica
— fora do lint. O script `lint` do `package.json` foi trocado para `eslint .`
(cobre o repo inteiro; `eslint.config.js` só ignora `dist/*`).

Adicionado também `prettier` + `eslint-config-prettier` (desliga as regras de
_estilo_ do ESLint que conflitariam com o Prettier), config em
`.prettierrc.json` (`singleQuote`, `trailingComma: all`, `printWidth: 100` —
calibrado no estilo que o código já usava) e os scripts `format`/`format:check`.

**Decisão consciente que fica registrada aqui:** `prettier --check .` acusa
123 arquivos com diferença de formatação — o código nunca passou por um
formatter, então isso é esperado (nenhum arquivo é *sinal de bug*, é só
divergência de estilo: quebra de linha, espaçamento). Rodar `prettier --write .`
agora produziria um diff enorme e não relacionado a nada que os itens 5/6
pediam. Deixado como uma decisão separada e explícita para quando o usuário
quiser — `*.md` já está excluído em [.prettierignore](.prettierignore)
(Prettier não deveria reformatar prosa).

**A primeira rodada de `eslint .` já achou coisa real** (35 problemas: 5 erros
+ 30 warnings). Todos corrigidos nesta mesma passada — nada ficou pendurado:

| Achado | O que era | Correção |
|---|---|---|
| 5× erro `react-hooks/refs` em [RunLostScreen.tsx](components/RunLostScreen.tsx) | `const pulse = useRef(new Animated.Value(1)).current;` — a regra nova do `eslint-plugin-react-hooks` (v7, compatível com o React Compiler) proíbe ler `.current` durante o render | Trocado para `useMemo(() => new Animated.Value(1), [])` — o valor precisa existir no render (vai pro `style` da `Animated.View`), então `useRef` não serve aqui; `useMemo` não é rastreado como ref pela regra |
| `item.id == 'deck-classic'` em [ShopScreen.tsx:48](components/ShopScreen.tsx#L48) | `==` solto, já sinalizado no item original | Trocado para `===`. **A duplicação de fundo** (a mesma regra "clássico é grátis" escrita separadamente em `engine/shop.ts` e aqui) é o item 10, não mexida agora — só a comparação solta |
| `function DeckPreview({ item }: any)` em [ShopScreen.tsx:139](components/ShopScreen.tsx#L139) | `any`, já sinalizado no item original | Tipado como `{ item: DeckSkinItem }` (o tipo já existia no engine) |
| 3× `as any` em [OnboardingOverlay.tsx:47-49](components/OnboardingOverlay.tsx#L47-L49) | chave de i18n montada por template string, cast para escapar do tipo | Removidos os casts — `tsc --noEmit` continua limpo sem eles: `STEP_KEYS[step]` (tupla `as const`) já dá a `t()` a união literal certa, o cast nunca foi necessário |
| Formatação quebrada em `RunLostScreen.tsx`/`ShopScreen.tsx` (`<          Text`, `) ? (          <Text`) | já sinalizada no item original | Corrigida automaticamente pelo `eslint --fix` |
| `Modal`, `getForger`, `MAX_SELECTION` não usados em [GameScreen.tsx](components/GameScreen.tsx) | `Modal` já sinalizado no item original; os outros dois apareceram no lint | Imports removidos |
| 5 imports/vars não usados em [CollectionScreen.tsx](components/CollectionScreen.tsx) (`cardKey`, `SUITS`, `cardLabel`, `isRedSuit`, `deck`) | **achado durante a limpeza**: só eram usados dentro de um bloco JSX inteiro comentado (`{/* Deck Cards */}`, linhas 136-153) — e esse bloco já referenciava `SUIT_SYMBOL`, que nem chegou a ser importado. Ou seja, o bloco já estava quebrado antes de ser comentado, não é uma feature pronta pra voltar | Imports removidos; o bloco comentado (a feature em si) foi deixado como está — decisão de produto (reativar essa visão do baralho ou não) não é escopo de limpeza de lint |
| `getForger`, `relicDescription`, `dailyPlayable`, `canPlayDaily` não usados em [StartScreen.tsx](components/StartScreen.tsx) | `dailyPlayable` calcula se o jogador pode jogar o Desafio Diário, mas o botão nunca ficou desabilitado com base nisso | Removidos. **Não** adicionei `disabled={!dailyPlayable}` no botão — pode ser intencional (deixar entrar na tela mesmo sem tentativas, p.ex. pra ver o leaderboard); é uma decisão de produto, não uma correção óbvia |
| `react-hooks/exhaustive-deps` faltando `progress` em [StartScreen.tsx:57](components/StartScreen.tsx#L57) | `useSharedValue` do Reanimated é referencialmente estável entre renders | Adicionado `progress` às deps — não muda quando o efeito roda (só uma vez, no mount), só satisfaz a regra |
| `forToday()` não usada em [store/dailyFlow.ts](store/dailyFlow.ts) | helper que calcula o rollover do dia (`dailyAttemptsForDay` + `utcDateIso`) — mas os 4 comandos (`start`/`watchAd`/`submit`/`fetchLeaderboard`) reimplementam a mesma lógica inline em vez de chamá-la | Função morta removida. **Não** refatorei os 4 call sites pra usá-la — trocaria comportamento em 4 lugares de uma vez, isso é escopo do item 10 (duplicações), não de limpeza de lint |
| `daily`/`storage` desestruturados sem uso em [store/gameStore.ts](store/gameStore.ts) (`playSelection`/`discardSelection`) | sobra de copiar-colar entre as duas ações | Removidos da desestruturação |
| `import/no-duplicates` (`../engine` importado 3× em `gameStore.ts`) | três blocos de import separados do mesmo módulo | `eslint --fix` mesclou automaticamente; a formatação resultante (uma linha em branco solta, `ShopStorage} from` sem espaço) foi limpa manualmente depois |
| `import/no-named-as-default-member` em [i18n/index.ts](i18n/index.ts) | `i18n.use(...)` — falso positivo conhecido: `i18next` exporta `use` tanto como método da instância padrão quanto como named export, e `i18n.use().init()` é o jeito documentado oficialmente de inicializar | `eslint-disable-next-line` com o motivo explicado no comentário — não é código pra "consertar", já estava certo |
| Vars não usadas em 4 arquivos de teste (`engine/deck.test.ts`, `engine/run.test.ts`, `store/gameStore.test.ts`, `store/shopFlow.test.ts`) | helpers/reatribuições não lidas | Removidos/ajustados sem mudar nenhuma asserção existente |

`tsc --noEmit` limpo, `eslint .` sem nenhum problema, 329/329 testes passando
depois de cada mudança (não só no final).

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

## ✅ 8. i18n aplicado pela metade — corrigido em 2026-08-26

O escopo real era maior do que a análise original media. Uma varredura completa
(não só o grep que gerou a lista original) achou **42 `accessibilityLabel` em
inglês fixo, espalhados por 15 componentes** — não 28 em 13. A diferença: o
grep original só pegava `accessibilityLabel="..."` (string literal); os
`accessibilityLabel={\`...\`}` (template string, com nome de item/carta/naipe
interpolado) não entravam no padrão e ficaram de fora da contagem. Todos os 42
foram traduzidos — `pt.json`/`en.json` ganharam um namespace `a11y` novo,
reaproveitando chaves já existentes onde o texto já era idêntico a um rótulo
visível (`common.decideLater`, `common.cancel`, `game.keepPlaying`,
`shop.restorePurchases`, `start.startRun`, `start.dailyChallenge`).

**Um bug de verdade apareceu no meio da varredura, fora da lista original:**
[i18n/pt.json](i18n/pt.json) e [i18n/en.json](i18n/en.json) já tinham
`runLost.shortOfTarget` com tags `<1>...</1>` — sintaxe do `<Trans>` do
react-i18next para embutir um componente estilizado no meio da frase. Só que
[components/RunLostScreen.tsx](components/RunLostScreen.tsx) nunca usou
`<Trans>` — chamava `t('runLost.shortOfTarget', {...})` puro e jogava o
resultado direto num `<Text>`. Efeito: **todo jogador que perdia uma run via
literalmente `<1>46 pontos (18%)</1>` na tela**, tags incluídas. Reforça a
suspeita: o estilo `missingValue` (cor de destaque) já existia no
`StyleSheet.create` do arquivo, **também nunca referenciado em lugar nenhum**
— o autor original claramente pretendia usar `<Trans>` com esse estilo e
nunca terminou de plugar. Corrigido usando a API `components` do `<Trans>`
(`components={{ 1: <Text style={styles.missingValue} /> }}`), que evita a
sintaxe `{{pts}}` como filho de JSX — essa sintaxe colide com a tipagem de
`children` do `<Text>` do React Native (`Object literal may only specify
known properties`), um atrito conhecido de `Trans` + RN + TypeScript.

**Duas chaves de tradução já existiam, prontas, e nunca eram chamadas** —
sinal de que a UI foi escrita antes das chaves, ou as chaves foram criadas e a
integração ficou pra depois e não foi finalizada:
- `game.base` ("Base") e `game.pts` ("pts") — [components/GameScreen.tsx](components/GameScreen.tsx)
  montava a linha de preview do padrão hardcoded em inglês
  (`Base {n} · {n} pts with ×{n}`) ao lado dessas duas chaves. Agora usa
  `t('game.base')`/`t('game.pts')` + uma chave nova `game.previewSuffix`
  ("with ×{{multiplier}}"/"com ×{{multiplier}}"). De quebra, a própria tela
  usava `PATTERN_NAME` (o mapa **não traduzido**, com o comentário explícito
  "for internal use (tests, etc.)" em [components/format.ts](components/format.ts))
  em vez de `patternName()` (a versão traduzida, já usada em todo o resto do
  app) — trocado.
- `daily.weekOf` ("Week of {{start}} – {{end}}"/"Semana de {{start}} – {{end}}")
  — [components/DailyChallengeScreen.tsx](components/DailyChallengeScreen.tsx)
  construía o rótulo da semana na mão, com um array `MONTHS` hardcoded em
  inglês (`['Jan', 'Feb', ...]`) que nem essa chave usava. Trocado por
  `Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' })` +
  `t('daily.weekOf', {...})` — a abreviação do mês agora segue o idioma atual
  automaticamente, em vez de sempre inglês.

**Mais três strings hardcoded achadas na varredura, fora da lista original:**
- `components/DailyChallengeScreen.tsx` — fallback `daily.error ?? "Couldn't load
  today's seed. Please try again."`. Nova chave `daily.seedLoadError`.
- `components/CollectionScreen.tsx` — fallback `status?.milestone.description ??
  'Locked'`. Reaproveitada `common.locked` (já existia).
- `components/OnboardingOverlay.tsx` — `"Pair"` no visual de exemplo do passo
  "Score the Pattern" reaproveita `format.pattern.pair` (a mesma chave que
  `patternName()` já usa em todo o resto do app, via `PatternKind.Pair`);
  `"10 + card values"` ganhou a chave nova `onboarding.patternExampleBase`.

**Os 3 `as any` do projeto** (`components/OnboardingOverlay.tsx:47-49`, chave
de i18n montada por template string) — removidos. `tsc --noEmit` confirma que
nunca foram necessários: `STEP_KEYS[step]` (tupla `as const`) já devolve a
união literal certa de nomes de passo, e o TypeScript infere sozinho o tipo
do template `` `onboarding.${stepKey}.title` `` como união de chaves válidas.

**Intencionalmente não mexido:**
- O texto "All 40 base cards..." em `CollectionScreen.tsx` — vive inteiro
  dentro do bloco JSX comentado (feature desligada) já discutido no item 6.
  Traduzir texto de um bloco morto não muda nada pro jogador; a decisão sobre
  reativar essa visão do baralho continua em aberto, fora do escopo de i18n.
- `common.back` (a seta "←") — outra chave órfã, nunca chamada (cada tela
  hardcoda o glifo `←` direto no `<Text>`). Diferente dos outros órfãos desta
  seção, não é um bug: o glifo não precisa de tradução por idioma. Não fiz
  nada aqui — mencionado só por transparência, já que apareceu na mesma
  varredura.

**Correção a uma afirmação do item 6:** a tabela daquele item dizia que a
formatação quebrada (`<          Text`, `) ? (          <Text`) em
`RunLostScreen.tsx`/`ShopScreen.tsx` tinha sido "corrigida automaticamente
pelo `eslint --fix`". Isso estava errado — reconferi agora e as duas ainda
estavam quebradas; `eslint --fix` corrige violações de regras de lint, não
espaçamento arbitrário dentro de JSX (isso é trabalho do Prettier, que não
rodou no repo inteiro — item 6 mesmo, "decisão consciente"). Corrigidas à mão
agora, como efeito colateral de mexer nos dois arquivos por causa do i18n.

`tsc --noEmit` limpo, `eslint .` sem nenhum problema, 329/329 testes passando.
Sem teste automatizado cobrindo o texto renderizado das telas (não há
`@testing-library/react-native` no projeto) — verificação foi simular
`i18next.t()`/interpolação de cada chave nova em pt e en via script Node,
lendo o resultado, mais leitura cuidadosa de cada arquivo editado.

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
5. ~~`.gitignore` com `*.aab` + ESLint/Prettier~~ (itens 5 e 6) — ✅ feito em 2026-08-26. Falta, como decisão separada e explícita: limpar o `.aab` do *histórico* do git (`filter-repo`/BFG + force-push coordenado nos dois remotes) e rodar `prettier --write .` pela primeira vez (123 arquivos, diff grande e não relacionado a bug nenhum).
6. ~~i18n pela metade~~ (item 8) — ✅ feito em 2026-08-26 (42 accessibilityLabel, `<Trans>` do RunLostScreen, e mais 5 strings hardcoded achadas na varredura).
7. **Consolidar os docs** (item 7) e **escala de espaçamento** (item 9) — dívida real, mas nenhuma delas sangra hoje.
