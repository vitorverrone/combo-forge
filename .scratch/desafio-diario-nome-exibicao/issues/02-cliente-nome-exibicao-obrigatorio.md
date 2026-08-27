# 02 — Cliente: Nome de Exibição obrigatório

**What to build:** No app, pedir o Nome de Exibição do jogador uma única vez — modal bloqueante
(sem fechar, sem tocar fora, intercepta o botão físico de voltar do Android) na primeira vez que
a tela do Desafio Diário é aberta, antes de poder jogar. Validação de formato instantânea no
cliente (mesmas regras do backend, ticket 01), com a chamada ao servidor como fonte da verdade
final. Editável depois, a qualquer momento, numa seção nova da tela de Perfil, com a mesma
validação. Falha de rede ao salvar mostra erro com opção de tentar de novo, sem afetar o resto do
app (só o Desafio Diário fica bloqueado enquanto o nome não é salvo).

**Blocked by:** 01 — Backend: Nome de Exibição no ranking

**Status:** done

- [x] `engine/displayName.ts` valida formato (3–16 caracteres; letras com acento, números e
      espaço; sem emoji/símbolo) e lista de termos proibidos, devolvendo o motivo da rejeição
- [x] Ao abrir o Desafio Diário pela primeira vez (sem nome salvo), um modal bloqueante pede o
      nome antes de qualquer outra ação na tela
- [x] O modal não tem como ser fechado sem salvar um nome válido — nem tocando fora, nem pelo
      botão físico de voltar do Android
- [x] Digitar um nome inválido mostra o erro correspondente sem esperar resposta do servidor
- [x] Um nome válido no cliente mas rejeitado pelo servidor mostra o erro do servidor
- [x] Falha de rede ao salvar mostra erro com retry; o resto do app continua livre enquanto isso
- [x] Depois de salvo, o nome pode ser trocado a qualquer momento numa seção nova do Perfil, com
      a mesma validação
- [x] Nome salvo sobrevive a reabrir o app (persistido)

## Comments

Implementado em `feat/02-cliente-nome-exibicao-obrigatorio`, mergeado em `master`. Verificado
visualmente no emulador: modal bloqueia corretamente, validação ao vivo funciona sem round-trip
de rede, botão físico de voltar é interceptado (`BackHandler`, primeiro uso no projeto), seção do
Perfil renderiza e permite trocar o nome.

**Pendência de infra (não é gap de código desta ticket):** o projeto Supabase hospedado usado por
este ambiente de dev ainda não tem a migração da ticket 01 (`0003_display_name.sql`) aplicada —
só foi verificada localmente via Docker (`npm run verify:backend`). Isso ficou evidente ao testar
o modal no emulador: a chamada real ao `set_display_name` falhou com "Could not find the
function public.set_display_name" — o que, na prática, validou de graça o caminho de erro do
servidor/rede (mensagem exibida, Salvar continua disponível pro retry, resto do app livre).
Falta aplicar a migração no projeto Supabase real antes do fluxo funcionar ponta-a-ponta.

Review (Standards + Spec) feito manualmente — os 2 sub-agentes do `/code-review` falharam por
limite de sessão da API. 2 achados de julgamento (duplicação de JSX entre o modal e a edição no
Perfil; `displayNameError` guarda ora um código de motivo, ora uma mensagem de servidor), ambos
mantidos como estão — motivo comentado no código.
