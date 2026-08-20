# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios, android

## Users

Casual mobile gamers killing time on commutes, work breaks, or in queues — short bursts of low-commitment play. They want immediate restart and zero punishment for stepping away.

## Product Purpose

Combo Forge is a roguelike card game for mobile that delivers satisfying 3–8 minute sessions built around numerical pattern recognition. Players select cards from a hand to form plays (pairs, straights, full houses, etc.), with scoring that compounds exponentially through a combo multiplier. The game exists to make micro-moments of downtime feel engaging and rewarding through the "one more try" loop.

## Positioning

Combo Forge differentiates through numerical puzzle combos — scoring is about recognizing number patterns (pairs, straights, full houses) rather than tactical card combat. Unlike deckbuilders that focus on strategic combat against enemies, Combo Forge turns the scoring itself into the puzzle: the player's agency is in reading the hand, choosing which pattern to form, and riding the exponential combo multiplier. This makes it more accessible (no enemy AI to balance) while preserving deep emergent builds through forge upgrades and relics.

## Operating Context

- Sessions last 3–8 minutes, designed for micro-moments (commute, break, queue)
- Portrait orientation, one-hand play
- Runs restart immediately on failure — no punitive defeat screen
- Between runs: forge upgrades (choose 1 of 3 offers), meta-progression unlocks, daily challenge with async leaderboard
- Local persistence via SQLite; backend sync for daily challenge seeds and leaderboard via Supabase
- Monetization: cosmetic shop (deck skins, combo VFX) + optional remove-ads IAP via RevenueCat; rewarded ads for extra daily attempts

## Capabilities and Constraints

- **Core loop:** 40-card deck (4 suits × 10 values), 7-card hand, 4 plays per round, score target (meta) to advance
- **Pattern system:** High Card, Pair, Two Pair, Three of a Kind, Straight, Full House, Four of a Kind — best pattern wins
- **Combo multiplier:** Compounds with each play in a round (×1, ×2, ×3, ×4)
- **Forge:** Between rounds, choose 1 of 3 offers (2 card effects + 1 relic) to strengthen the build
- **Dynamic difficulty (DDA):** Adjusts score targets to keep player in flow; disabled in daily challenge
- **Daily challenge:** Same seed for all players, weekly opt-in leaderboard, 1 free attempt + 1 via rewarded ad
- **Meta-progression:** Unlock new forgers and forge effects through milestones (runs won, score records) — no currency, no gacha
- **Cosmetic shop:** Deck skins and combo VFX (100% visual, never affects gameplay) + remove-ads
- **Break reminder:** Gentle pause suggestion after consecutive runs; never blocks play
- **3 forgers:** Apprentice (neutral/onboarding), Martelo (pattern-focused), Bigorna (combo multiplier-focused)
- **Tech:** Expo/React Native, Zustand state, pure engine layer, expo-sqlite persistence, Supabase backend, RevenueCat IAP, Google Mobile Ads

## Brand Commitments

- Name "Combo Forge" is working (not formally registered)
- No formal brand guide, voice guide, or style bible yet
- Forge-themed visual identity in incumbent code (dark charcoal-purple palette, gold accents)
- Ethical monetization commitment in GDD: no gameplay-affecting items sold, no gacha

## Evidence on Hand

- **GDD:** `GDD_Combo_Forge.md` — full game design document
- **Domain glossary:** `CONTEXT.md` — Portuguese-language domain terms for all game concepts
- **Engine:** `engine/` — pure business logic (cards, patterns, runs, DDA, progression, forge, relics, shop, breaks)
- **Store:** `store/` — Zustand state layer with SQLite persistence
- **Components:** `components/` — React Native UI screens (Start, Game, Collection, Daily, Profile, Shop, Forge)
- **Services:** `services/` — Supabase, RevenueCat, ad provider integrations
- **Theme:** `components/theme.ts` — forge palette tokens
- **Tests:** `engine/*.test.ts`, `store/*.test.ts` — comprehensive test suite

## Product Principles

1. **Flow first:** Every design decision preserves the 3–8 minute session cadence and the "one more try" compulsion loop
2. **Puzzle over combat:** The scoring system IS the game — pattern recognition and exponential combo riding, not tactical card battles
3. **Ethical engagement:** No pay-to-win, no gacha, no punitive restart — engagement comes from mastery and near-miss motivation
4. **Instant restart:** Failure is a teacher, not a punishment — the gap between "almost" and "next try" must be zero friction
5. **Accessible depth:** Easy to play (select cards, form patterns), deep to master (relic synergies, forge builds, combo optimization)
