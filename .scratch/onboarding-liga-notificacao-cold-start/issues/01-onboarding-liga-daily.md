# 01 — Onboarding de Liga no Desafio Diário

**What to build:** um modal de onboarding novo (`DailyOnboardingOverlay`), específico da Liga, mostrado ao jogador ao entrar no Desafio Diário — explica os 5 Tiers, a mecânica de subida/descida por Divisão semanal, que a pontuação de estreia não define o Tier inicial (ADR 0010), e a Sequência. Mesmo padrão visual/estrutural de `OnboardingOverlay` (modal com X para fechar, não bloqueante). Aparece uma única vez por dispositivo (flag persistida) e pode ser reaberto a qualquer momento por um botão "?" novo na topbar da `DailyChallengeScreen`, ao lado do botão de voltar.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] `DailyState` ganha o campo `dailyOnboardingSeen: boolean`; `DailyChallengeStorage` ganha `loadDailyOnboardingSeen()`/`saveDailyOnboardingSeen()`, carregados no boot (mesmo ponto de `attempts`/`deviceId` em `store/bootstrap.ts`).
- [x] Componente novo `DailyOnboardingOverlay` (mesmo padrão de `OnboardingOverlay`: `Modal`, X no canto superior direito para fechar, não bloqueia o resto da tela).
- [x] Conteúdo (i18n, em inglês nas strings do app — ver regra de idioma do `CLAUDE.md` raiz) explica: os 5 Tiers nomeados (Bronze→Diamante), subida/descida por Divisão ao fim da semana, pontuação de estreia não conta para o Tier inicial, e a Sequência. Mesmo conteúdo sempre, independente do estado atual da Liga para o dispositivo.
- [x] `DailyChallengeScreen` renderiza `DailyOnboardingOverlay` quando `!daily.dailyOnboardingSeen`; fechar (X) chama uma action nova `completeDailyOnboarding()` no `gameStore`, que seta `dailyOnboardingSeen: true` e persiste via o storage port.
- [x] Botão "?" novo na topbar da `DailyChallengeScreen`, ao lado do `TopButton` de voltar, que reabre `DailyOnboardingOverlay` sob demanda via estado local do componente — independe de `dailyOnboardingSeen` (mesmo padrão do "?" que já existe na `GameScreen` para o onboarding geral).
- [x] Testes de `store/dailyFlow.ts` (ou equivalente) cobrindo o round-trip de `dailyOnboardingSeen` via o storage port (default `false`, vira `true` e persiste após `completeDailyOnboarding()`), mesmo padrão de outros flags persistidos no arquivo.
- [x] Sem teste de componente para `DailyOnboardingOverlay` nem para o botão "?" (mesmo tratamento que `OnboardingOverlay` já recebe hoje — verificação manual/visual).
- [x] `tsc --noEmit` limpo, `eslint .` sem problemas, suíte de testes passando.
- [ ] Verificação visual real em emulador/simulador ou Expo web — **pendente**: sessão sem acesso a emulador/simulador. Mesma ressalva já registrada no ticket original do ADR 0012 (`docs/release-checklist.md`) — passo humano antes do próximo release.

## Comments

Implementado direto no `master` (sem branch própria — a pedido do usuário, que quer um commit único no final bundlando isto com os tickets 02-04 e as edições manuais já pendentes antes desta sessão).

- `engine/daily.ts`: `DailyChallengeStorage` ganhou `loadDailyOnboardingSeen`/`saveDailyOnboardingSeen`; `createMemoryDailyChallengeStorage` aceita um 4º parâmetro opcional pros testes. `store/sqlite.ts` implementa o par real via `combo-forge:daily-onboarding-seen` (mesmo padrão booleano do `TutorialStorage`).
- `store/dailyFlow.ts`: `DailyState` ganhou `dailyOnboardingSeen: boolean`.
- `store/gameStore.ts`: nova action `completeDailyOnboarding()` — flag direto no state + persistência, sem passar por `runDailyCommand` (não há orquestração assíncrona aqui, mesmo raciocínio já registrado na spec).
- `store/bootstrap.ts`: `dailyOnboardingSeen` recarregado do SQLite no mesmo ponto de `attempts`/`deviceId`.
- **Achado colateral (fora do escopo deste ticket)**: ao investigar esse ponto, percebi que `daily.displayName` **não** é recarregado em `store/bootstrap.ts` — só `deviceId`/`attempts` são. O singleton `gameStore` (`store/gameStore.ts:1138`, `createGameStore()` sem deps) já computa `displayName: dailyStorage.loadDisplayName()` na avaliação do módulo, usando o storage em memória (default), *antes* de `initializeSqlitePersistence()` trocar o storage pra SQLite — e o `daily: {...}` montado em `bootstrap.ts` nunca resgata `displayName` de novo depois da troca. Os testes existentes não pegam isso porque simulam "reabrir o app" criando um `createGameStore` novo direto com o storage já certo, não reproduzindo o caminho real do singleton + bootstrap. Não mexi nisso (fora do escopo do ticket 01) — mas se for real, o Nome de Exibição salvo nunca sobrevive a um cold start de verdade no app publicado, o que é uma contradição direta com o que o ticket 02 (ADR de Nome de Exibição) pretendia. Vale abrir como bug separado.
- Componente novo: 3 passos (Tiers, Divisões, Sequência) em vez dos 5 do onboarding geral — conteúdo mais enxuto, sem ilustração custom pros dois últimos passos (só o passo de Tiers tem um visual: 5 badges com a inicial de cada Tier). Descoberto durante a implementação: em pt-br, "Prata" e "Platina" colidiam na inicial ("P") — resolvido com iniciais de 2 letras só no `pt.json` (BR/PR/OU/PT/DI); o `en.json` manteve 1 letra (sem colisão).

**Pós `/code-review`** (rodado sobre o diff acumulado dos 4 tickets): 3 smells de Standards corrigidos —
- `components/TopButton.tsx` ganhou um `variant: 'back' | 'profile' | 'help'` (era `isBackButton: boolean`, só 2 modos) — o botão "?" novo da `DailyChallengeScreen` agora reaproveita `TopButton` em vez de duplicar o chrome do botão (`helpBtn`/`helpBtnText` removidos). Os 4 call sites existentes (`DailyChallengeScreen`, `ProfileScreen`, `ShopScreen`, `StartScreen`) foram ajustados; `StartScreen` passou a usar `variant="profile"`. Nova chave `a11y.help` (fallback genérico do variant) nos dois idiomas.
- `components/DailyOnboardingOverlay.tsx`: a interface `Step` (declarada mas nunca usada pra tipar nada) agora tipa `current` de fato.
- Lógica de "resetar o passo ao reabrir o modal", duplicada entre `OnboardingOverlay` e `DailyOnboardingOverlay`, extraída pro hook `components/useResetStepOnReopen.ts`, usado pelos dois (o `OnboardingOverlay` original também foi ajustado, embora seja de fora do escopo original destes tickets — a duplicata só desaparece corrigindo os dois lados).
