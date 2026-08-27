# 02 — Cliente: Nome de Exibição obrigatório

**What to build:** No app, pedir o Nome de Exibição do jogador uma única vez — modal bloqueante
(sem fechar, sem tocar fora, intercepta o botão físico de voltar do Android) na primeira vez que
a tela do Desafio Diário é aberta, antes de poder jogar. Validação de formato instantânea no
cliente (mesmas regras do backend, ticket 01), com a chamada ao servidor como fonte da verdade
final. Editável depois, a qualquer momento, numa seção nova da tela de Perfil, com a mesma
validação. Falha de rede ao salvar mostra erro com opção de tentar de novo, sem afetar o resto do
app (só o Desafio Diário fica bloqueado enquanto o nome não é salvo).

**Blocked by:** 01 — Backend: Nome de Exibição no ranking

**Status:** ready-for-agent

- [ ] `engine/displayName.ts` valida formato (3–16 caracteres; letras com acento, números e
      espaço; sem emoji/símbolo) e lista de termos proibidos, devolvendo o motivo da rejeição
- [ ] Ao abrir o Desafio Diário pela primeira vez (sem nome salvo), um modal bloqueante pede o
      nome antes de qualquer outra ação na tela
- [ ] O modal não tem como ser fechado sem salvar um nome válido — nem tocando fora, nem pelo
      botão físico de voltar do Android
- [ ] Digitar um nome inválido mostra o erro correspondente sem esperar resposta do servidor
- [ ] Um nome válido no cliente mas rejeitado pelo servidor mostra o erro do servidor
- [ ] Falha de rede ao salvar mostra erro com retry; o resto do app continua livre enquanto isso
- [ ] Depois de salvo, o nome pode ser trocado a qualquer momento numa seção nova do Perfil, com
      a mesma validação
- [ ] Nome salvo sobrevive a reabrir o app (persistido)
