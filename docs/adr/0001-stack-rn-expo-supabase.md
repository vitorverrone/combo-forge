# Stack do MVP: React Native + Expo + Supabase (não Unity + Firebase)

O GDD recomendava Unity 2D + Firebase. Decidimos seguir a stack já validada no echo-runes — React Native + Expo (EAS Build), desenho com Skia, animação com Reanimated, estado com Zustand, persistência local com SQLite e monetização com RevenueCat + AdMob — e usar **Supabase** como backend apenas para o Desafio Diário (seed diário + leaderboard semanal).

Unity foi descartado pela mesma razão documentada no ADR do echo-runes: uma engine 2D dedicada traz complexidade de integração desnecessária para um MVP cujo escopo é provar a mecânica — e o ecossistema dos jogos da casa é JS/TS (echo-runes e astral-colony são React Native). Supabase foi preferido ao Firebase por oferecer Postgres de verdade, realtime e free tier generoso, sem vendor lock-in; o volume é trivial (um JSON de seed por dia + leaderboard semanal).
