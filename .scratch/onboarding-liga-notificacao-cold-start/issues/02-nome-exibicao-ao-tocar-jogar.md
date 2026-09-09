# 02 — Nome de Exibição só ao tocar em "jogar"

**What to build:** o `DisplayNameModal` deixa de abrir sozinho ao montar a tela do Desafio Diário. Passa a abrir apenas quando o jogador toca no botão principal de jogar e ainda não tem um Nome de Exibição salvo; salvando o nome com sucesso, a Run começa automaticamente (sem precisar tocar em jogar de novo). Já tendo nome salvo, tocar em jogar continua indo direto para a Run, sem nenhum modal extra.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] `DailyState` ganha o campo `pendingPlayIntent: boolean` (default `false`).
- [x] Novo `DailyCommand`: `{ type: 'requestPlay' }`, tratado em `runDailyCommand`:
  - Com `displayName !== null`: comportamento idêntico ao `{ type: 'start' }` de hoje (reaproveita a mesma lógica interna, não duplica).
  - Com `displayName === null`: não mexe em tentativas/seed/Run; devolve o mesmo `DailyState` com `pendingPlayIntent: true`.
- [x] `{ type: 'setDisplayName', name }`: ao salvar com sucesso, se `pendingPlayIntent` estava `true`, encadeia a mesma lógica interna de início de Run (reaproveitada de `requestPlay`/`start`) e devolve `pendingPlayIntent: false` no resultado. Falha de validação/salvamento não altera `pendingPlayIntent` — a intenção de jogar continua pendente até o nome salvar com sucesso.
- [x] `DailyChallengeScreen`: `DisplayNameModal` passa a renderizar só quando `daily.displayName === null && daily.pendingPlayIntent` (não mais só `daily.displayName === null`). O botão de jogar (CTA principal) passa a chamar uma action nova `requestPlay()` no `gameStore` (espelha `startDailyChallenge`) em vez de `startDailyChallenge()` direto.
- [x] Testes novos em `store/dailyFlow.test.ts`: `requestPlay` com `displayName` presente (inicia Run igual a `start`) e ausente (não inicia, marca `pendingPlayIntent: true`); `setDisplayName` com `pendingPlayIntent: true` e nome válido (inicia a Run e zera o flag); `setDisplayName` com `pendingPlayIntent: true` e nome inválido/rejeitado (não inicia Run, `pendingPlayIntent` continua `true`). Mesmo padrão dos testes existentes de `start`/`setDisplayName` já no arquivo.
- [x] `tsc --noEmit` limpo, `eslint .` sem problemas, suíte de testes passando.

## Comments

Implementado direto no `master` (sem branch própria — mesmo combinado do ticket 01: commit único no final bundlando tudo).

- `store/dailyFlow.ts`: `pendingPlayIntent: boolean` no `DailyState` (não persistido — estado de UI de sessão). Novo comando `requestPlay` reaproveita `startDailyChallenge` quando já há nome; `setDisplayName` reaproveita a mesma função internamente pra encadear o início da Run quando `pendingPlayIntent` era `true`.
- `store/gameStore.ts`: nova action `requestPlay()`, espelha `startDailyChallenge()` (mesmo `applyDailyResult`).
- `components/DailyChallengeScreen.tsx`: CTA principal chama `requestPlay()`; `DisplayNameModal` só renderiza com `displayName === null && pendingPlayIntent`. Comentário de topo do arquivo atualizado (estava descrevendo o modal como bloqueante-ao-entrar, que não é mais o caso).
- Seam confirmado com o usuário: só `store/dailyFlow.ts`/`dailyFlow.test.ts` (6 testes novos/ajustados). Sem teste de componente, mesmo tratamento do ticket 01.
- Sem verificação visual em emulador/simulador (mesma ressalva dos tickets anteriores — sessão sem acesso).

**Bug real encontrado pelo usuário jogando no device (pós-implementação):** tocar em "jogar" sem nome, salvar o nome, fechava o modal mas **não iniciava a Run** — a tentativa gratuita já aparecia como consumida (só dava pra jogar de verdade assistindo o anúncio pra tentativa extra). Causa: a action `setDisplayName` em `store/gameStore.ts` fazia só `set({ daily: result.daily })`, nunca aplicando `result.run`/`result.rng`/navegação — sobrou de antes do ticket 02, quando `setDisplayName` nunca produzia uma Run. O seam combinado (`dailyFlow.ts` isolado) não pegou isso porque `dailyFlow.ts` devolve `run` corretamente; a lacuna estava na integração da action com esse resultado, um nível acima do seam testado. Corrigido trocando pra `set(applyDailyResult(result))` (mesmo helper que `startDailyChallenge`/`requestPlay` já usavam) + teste de regressão novo em `store/gameStore.test.ts` (nível de action, não só de `dailyFlow.ts`) cobrindo o fluxo ponta a ponta: `requestPlay` sem nome → `setDisplayName` → `screen === 'game'`, `run !== null`, tentativa consumida.
