# 01 — Scaffolding do projeto

**What to build:** A base do repositório: um app Expo/TypeScript que inicializa e roda no simulador, um pacote isolado para o motor de regras puro (a costura única definida na spec), a configuração de testes rodando via linha de comando, e as dependências da stack (Zustand, Skia, Reanimated, SQLite, expo-haptics, @supabase/supabase-js) instaladas e configuradas. Nenhuma feature de jogo ainda — só o esqueleto sobre o qual todas as fatias seguintes vão aterrissar.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] App Expo (TypeScript) inicializa e roda no simulador iOS/Android, exibindo uma tela com o título do jogo
- [ ] Pacote do motor de regras (TypeScript puro, sem dependência de React Native, Skia, Reanimated, Zustand ou SQLite) existe como módulo isolado, importável pelo app
- [ ] Configuração de testes roda uma suíte vazia passando via linha de comando, sem exigir simulador/dispositivo
- [ ] Zustand, Skia, Reanimated, SQLite, expo-haptics e @supabase/supabase-js estão instalados e configurados como dependências, mesmo que ainda não usados por nenhuma feature
