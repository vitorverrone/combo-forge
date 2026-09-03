# 01 — Port de telemetria (Firebase Analytics) instalado e conectado

**What to build:** A infraestrutura de telemetria do app — um port `TelemetryProvider` (mesmo molde de `AdProvider`/`DailyBackend`/`ShopProvider`), sua implementação real sobre o Firebase Analytics, e a fiação no `gameStore`/bootstrap. Nenhum evento de produto dispara ainda neste ticket — é a base que os tickets 02, 03 e 04 usam.

**Blocked by:** Nenhum — pode começar imediatamente.

**Status:** ready-for-agent

- [ ] `TelemetryProvider` existe em `engine/` com um método `logEvent(name, params)` genérico e `setUserId(deviceId)`; `createDevTelemetryProvider()` é uma implementação no-op pura, usada por padrão em testes e no `gameStore`.
- [ ] `@react-native-firebase/app` e `@react-native-firebase/analytics` instalados e configurados via config plugin do Expo (mesmo padrão de `react-native-google-mobile-ads`/`react-native-purchases` — exige EAS dev client), com o `google-services.json` do projeto Firebase Android.
- [ ] `createAppTelemetryProvider()` existe em `services/firebaseAnalytics.ts`, implementando o port sobre o SDK real do Firebase Analytics.
- [ ] `gameStore` tem um novo campo `telemetry: TelemetryProvider`, com `createDevTelemetryProvider()` como padrão (mesmo padrão de `adProvider`/`dailyBackend`/`shopProvider`).
- [ ] `store/bootstrap.ts` substitui o campo pelo `createAppTelemetryProvider()` e chama `telemetry.setUserId(deviceId)` no mesmo ponto onde o `deviceId` já é resolvido (carregado do storage ou criado via `createDeviceId()`).
- [ ] `npm test` e `npm run typecheck` continuam verdes — nenhum teste existente passa a tocar o Firebase real.
- [ ] Build de dev instalado num device/emulador não crasha com o SDK do Firebase integrado.
