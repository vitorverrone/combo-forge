# Nome de exibição obrigatório e moderado nos dois lados no Desafio Diário

Para dar identidade ao ranking semanal do Desafio Diário (hoje 100% anônimo, só rank + score),
cada dispositivo escolhe um Nome de Exibição uma vez — obrigatório, modal bloqueante na primeira
vez que abre a tela do Desafio Diário (sem fechar, sem pular, intercepta o botão voltar do
Android), editável depois no Perfil. Guardado numa tabela nova `public.players` (chave
`device_id`), não como coluna em `daily_submissions`, porque é propriedade do dispositivo, não da
submissão de um dia — `get_weekly_leaderboard` passa a fazer join nela pra montar o top 10.

Moderação de palavrão roda nos dois lados: cliente (feedback instantâneo) e servidor, dentro da
função SQL que grava o nome. A `anon key` do Supabase é pública por natureza (embutida no app),
então validar só no cliente deixaria qualquer chamada direta à API sujar o ranking compartilhado
de todo mundo. A lista de termos proibidos (pt-br + en) é própria, espelhada entre TS e SQL no
mesmo padrão de `supabase/contract.ts` (SQL fonte da verdade + testes com valores dourados) —
bibliotecas prontas de profanity filter têm cobertura fraca de pt-br.

Sem checagem de unicidade entre dispositivos (nomes duplicados são permitidos) — o projeto já é
deliberadamente sem contas de usuário (ADR 0001), e forçar nome único adicionaria lógica de
colisão sem ganho real num ranking casual semanal.

Como o jogo ainda não foi lançado, a migração zera `daily_submissions` — sem preocupação com
retrocompatibilidade de dado legado.

## Considered Options

- **Coluna em `daily_submissions`** em vez de tabela `players` separada — rejeitada: denormaliza
  o nome (repetido em cada linha do dia) e mistura duas responsabilidades (pontuação do dia vs.
  identidade do jogador).
- **Filtro de palavrão só no cliente** — rejeitada: burlável chamando a RPC do Supabase
  diretamente, já que a anon key é pública.
- **Biblioteca pronta de profanity filter** (ex.: `bad-words`) — rejeitada: cobertura de pt-br
  fraca ou inexistente pro idioma principal do jogo.
- **Nome único por dispositivo** (com sufixo automático em colisão) — rejeitada: complexidade
  (checagem de corrida, coluna extra) sem ganho perceptível pra um ranking casual sem contas.
