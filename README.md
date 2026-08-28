# Combo Forge 🃏

Roguelike de cartas mobile de sessão curta (3–8 min). Monte combos de cartas que multiplicam a pontuação e tente bater a Meta de cada Rodada antes que suas Jogadas se esgotem.

**Stack:** React Native · Expo (SDK 57) · TypeScript · Zustand · Supabase · RevenueCat · AdMob

---

## Pré-requisitos

| Ferramenta | Versão mínima | Instalação |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | incluído no Node |
| Expo CLI | – | `npm install -g expo-cli` |
| EAS CLI | 12+ | `npm install -g eas-cli` |
| Android Studio | Hedgehog+ | [developer.android.com/studio](https://developer.android.com/studio) |
| JDK | 17+ | incluído no Android Studio |

> **Windows:** certifique-se de que `ANDROID_HOME` e `JAVA_HOME` estão nas variáveis de ambiente do sistema.

---

## Instalação

```bash
# Clone o repositório
git clone <url-do-repo>
cd combo-forge

# Instale as dependências
npm install
```

---

## Variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp .env.example .env
```

Edite o `.env` com as chaves do seu projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<sua-chave-anon>

EXPO_PUBLIC_REVENUECAT_API_KEY=<sua-chave-revenuecat>

EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID=<ad-unit-id>
EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID=<ad-unit-id>
```

> Sem as variáveis de env, o jogo funciona normalmente — compras e anúncios usam o provider de dev (simulados).

---

## Rodando no emulador Android

Este projeto usa **Native Modules** (Skia, Reanimated, expo-audio, etc.), então **não funciona no Expo Go**. É necessário um **Development Build**.

### Passo 1 — Configure o emulador no Android Studio

1. Abra o **Android Studio**
2. Vá em **More Actions → Virtual Device Manager**
3. Clique em **Create Device**
4. Escolha um dispositivo (ex.: Pixel 8) e uma imagem do sistema **API 34+**
5. Conclua e inicie o emulador (▶ Play)

> **Dica:** verifique se o emulador aparece com `adb devices` antes de prosseguir.

---

### Passo 2 — Compile o Development Build local

Execute uma única vez (ou sempre que mudar código nativo):

```bash
npm run android
# equivalente a: expo run:android
```

Isso compila o APK de desenvolvimento, instala no emulador e abre o Metro bundler. Aguarde — a primeira compilação pode levar vários minutos.

---

### Passo 3 — (Alternativa) Build via EAS

Se preferir buildar na nuvem (sem precisar do Android Studio para compilar):

```bash
# Login na conta Expo
eas login

# Build de desenvolvimento (gera APK interno)
eas build --profile development --platform android
```

Após o build, baixe o `.apk` gerado e arraste para a janela do emulador (ou instale via `adb install <arquivo.apk>`).

---

### Passo 4 — Inicie o servidor Metro (se já tiver o app instalado)

Se o Development Build já estiver instalado no emulador, basta rodar:

```bash
npm start
# equivalente a: expo start
```

Abra o app no emulador. O Metro conecta automaticamente.

---

### TESTAR O APK COM ANUNCIOS DE TESTE

### 1 - Setar variaveis

```bash
npx eas env:set --environment preview --name EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID --value ca-app-pub-3940256099942544/9214589741 --visibility plaintext --non-interactive
npx eas env:set --environment preview --name EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID --value ca-app-pub-3940256099942544/1033173712 --visibility plaintext --non-interactive
npx eas env:set --environment preview --name EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID --value ca-app-pub-3940256099942544/5224354917 --visibility plaintext --non-interactive
```

### 2 Rodar o comando

```bash
npx eas build --profile preview --platform android --no-wait --non-interactive
```

### 3 Depois que o build terminar voltar as variaveis

```bash
npx eas env:set --environment preview --name EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID --value ca-app-pub-7753200620000515/1366979567 --visibility plaintext --non-interactive
npx eas env:set --environment preview --name EXPO_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID --value ca-app-pub-7753200620000515/8281372704 --visibility plaintext --non-interactive
npx eas env:set --environment preview --name EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID --value ca-app-pub-7753200620000515/2212947942 --visibility plaintext --non-interactive
```

---

### ⚡ Fast Refresh (Hot Reload) e Controles

O Expo possui **Fast Refresh** habilitado por padrão. Qualquer modificação que você salvar no código (como em `components/` ou `store/`) será refletida instantaneamente no emulador sem que o app perca o estado atual.

Se precisar controlar o emulador manualmente pelo terminal onde o Metro está rodando, use os seguintes atalhos:
- `r` — Recarrega o app manualmente (Full Reload).
- `d` — Abre o **Developer Menu** no emulador (útil para inspecionar elementos ou debugar).
  - *Dica:* Você também pode abrir o Developer Menu pressionando `Ctrl + M` (Windows/Linux) ou `Cmd + D` (macOS) com a janela do emulador em foco.
- `j` — Abre o depurador do Chrome/Edge.

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor Metro |
| `npm run android` | Compila e roda no Android (emulador/device) |
| `npm run ios` | Compila e roda no iOS (macOS + Xcode necessários) |
| `npm run web` | Inicia no navegador |
| `npm test` | Roda os testes com Jest |
| `npm run typecheck` | Verifica tipos TypeScript |
| `npm run verify:backend` | Valida o contrato do backend Supabase |

---

## Estrutura do projeto

```
combo-forge/
├── App.tsx              # Entry point
├── index.ts             # Registro do app
├── app.json             # Configuração Expo
├── eas.json             # Configuração EAS Build
├── components/          # Telas e componentes React Native
├── engine/              # Lógica de jogo (cartas, padrões, pontuação)
├── store/               # Estado global (Zustand)
├── services/            # Integrações externas (Supabase, RevenueCat, AdMob)
├── plugins/             # Plugins Expo customizados
├── assets/              # Fontes, imagens, sons
└── supabase/            # Migrations e scripts do backend
```

---

## Documentação

| Arquivo | Conteúdo |
|---|---|
| [`CONTEXT.md`](./CONTEXT.md) | Glossário completo da linguagem do jogo |
| [`GDD_Combo_Forge.md`](./GDD_Combo_Forge.md) | Game Design Document |
| [`PRD_Combo_Forge.md`](./PRD_Combo_Forge.md) | Product Requirements Document |
| [`SRS_Combo_Forge.md`](./SRS_Combo_Forge.md) | Software Requirements Specification |
| [`ESPECIFICACAO_FUNCIONAL_Combo_Forge.md`](./ESPECIFICACAO_FUNCIONAL_Combo_Forge.md) | Especificação funcional detalhada |
| [`DESIGN.md`](./DESIGN.md) | Guia de design visual |
