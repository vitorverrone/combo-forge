---
name: Combo Forge
description: Dark forge-themed roguelike card game UI — gold accents on charcoal-purple, parchment cards
colors:
  primary: "#e0a53e"
  primary-dark: "#b9842a"
  background: "#161120"
  surface: "#221a30"
  surface-elevated: "#241b33"
  surface-selected: "#2a2140"
  surface-border: "#3a2f4c"
  backdrop: "rgba(22,17,32,0.8)"
  card-face: "#f2e9d8"
  card-ink: "#221a2e"
  red: "#c1352c"
  text: "#f4ede1"
  text-dim: "#a89bb8"
  danger: "#e05c4e"
  success: "#7fc98a"
  text-on-primary: "#241a05"
typography:
  display:
    fontFamily: "System"
    fontSize: "34px"
    fontWeight: 900
    letterSpacing: "4px"
  title:
    fontFamily: "System"
    fontSize: "30px"
    fontWeight: 900
    letterSpacing: "2px"
  headline:
    fontFamily: "System"
    fontSize: "24px"
    fontWeight: 900
    letterSpacing: "0px"
  body:
    fontFamily: "System"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0px"
  label:
    fontFamily: "System"
    fontSize: "12px"
    fontWeight: 800
    letterSpacing: "1px"
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.textOnPrimary}"
    rounded: "{rounded.lg}"
    padding: "16px 0"
  button-primary-pressed:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.textOnPrimary}"
    rounded: "{rounded.lg}"
    padding: "16px 0"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "14px 0"
  card-base:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px"
  card-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: Combo Forge

## Overview

**Creative North Star: "The Dark Anvil"**

Combo Forge's visual world is a dark anvil — the place where heat meets craft in charcoal darkness. The UI lives in a deep purple-black void, with forge gold emerging as the single source of warmth and authority. Every interactive surface floats as a raised panel against the near-black background, and the gold accent is reserved exclusively for what matters: the title, the primary action, the score, the active selection. Parchment-toned card faces provide a tactile counterpoint — physical objects held against an intangible dark space.

The system is high-contrast by necessity: portrait mobile, one-hand play, small screens where readability is survival. Heavy font weights (800–900) and generous letter-spacing make every label scan instantly. There is no decorative flourish — the darkness is the atmosphere, and the gold is the punctuation. The forge theme is carried entirely through color and material contrast, not through ornamental assets.

**Key Characteristics:**
- Deep charcoal-purple void as universal background
- Single warm accent (forge gold) for authority and action
- Parchment card faces as tactile, physical objects against the dark
- Heavy typographic weight with wide letter-spacing for mobile legibility
- Tonal layering (no shadows except on cards and floating banners)
- Generous border-radii for approachable, touch-friendly surfaces

## Colors

The palette is a forge at night: one warm light source against deep darkness, with parchment and red as supporting materials.

### Primary
- **Forge Gold** (#e0a53e): The single accent. Used for titles, primary action buttons, score values, active selections (gold borders), the progress bar fill, and section eyebrows. Its warmth against the dark background creates immediate visual hierarchy.
- **Forge Gold Dark** (#b9842a): Pressed state for primary buttons. A shift down in luminance, not hue — the same gold, slightly cooler under pressure.

### Neutral
- **Charcoal Void** (#161120): The universal background. A deep purple-black that reads as infinite depth — the forge's darkness.
- **Anvil Surface** (#221a30): Elevated panels, cards, HUD elements. A subtle step lighter than the void, creating tonal layering without shadows. Every floating element uses this as its base.
- **Surface Elevated** (#241b33): A step above surface for chips, relic badges, and small containers that need subtle distinction from their parent surface.
- **Surface Selected** (#2a2140): Active/selected state background — used for chosen forger cards, selected offer cards, and active modal options. Signals engagement through a warmer surface tone.
- **Anvil Border** (#3a2f4c): The dividing line between surface and void. A muted purple-gray that defines edges without competing for attention. Used on 1px borders around panels and cards.
- **Backdrop** (rgba(22,17,32,0.8)): Modal overlay — void at 80% opacity. Dims the background while keeping the forge palette visible underneath.
- **Parchment Cream** (#f2e9d8): Card faces only. The warm, tactile material that represents the physical cards in the player's hand — deliberately the lightest color in the system, creating strong figure-ground contrast.
- **Ink** (#221a2e): Text and symbols on parchment card faces. A near-black that ensures crisp legibility on the cream surface.
- **Primary Text** (#f4ede1): All text on dark backgrounds. A warm off-white that avoids the harshness of pure white while maintaining contrast.
- **Dim Text** (#a89bb8): Secondary information, labels, descriptions, hints. A muted lavender-gray that recedes behind primary text.

### Semantic
- **Ember Red** (#c1352c): Red card suits (hearts, diamonds). A saturated, warm red that reads as heat — physically appropriate for a forge theme.
- **Danger** (#e05c4e): Error states, lock hints, loss feedback. A slightly cooler red than the suit color, distinguishing system feedback from game content.
- **Success** (#7fc98a): Victory feedback, unlocked badges, equipped indicators. A soft green that feels like relief — the opposite of the forge's heat.

### Named Rules

**The Gold Rule.** Forge Gold appears on ≤ 15% of any given screen. Its rarity is the point — it marks authority (titles), action (primary buttons), and value (scores). When everything is gold, nothing is.

**The Tonal Layer Rule.** Depth is conveyed through three tonal layers only: Void → Surface → Content. No shadows except on cards and floating overlays (banners, modals). The system is flat-by-default.

## Typography

**Display Font:** System (San Francisco on iOS, Roboto on Android)
**Body Font:** System (same)

**Character:** The typography is heavy and wide — built for glanceability on small mobile screens in motion. Weights range from 600 (body) to 900 (titles, scores), with letter-spacing from 0px (body) to 4px (display title). There is no decorative or serif typeface; the forge identity lives entirely in weight, spacing, and color.

### Hierarchy
- **Display** (900, 34px, normal): The game title "COMBO FORGE" and the largest score values. Only appears on the start screen and in-game score blocks.
- **Title** (900, 30px, normal): Screen titles ("PROFILE", "COLLECTION", "SHOP"). Appears once per screen below the eyebrow.
- **Headline** (900, 24px, normal): Round headers, stat values. High-impact numerical reads.
- **Body** (600, 14px, normal): Descriptive text, hints, labels. The workhorse — readable at small sizes with generous weight.
- **Label** (800, 12px, 1px spacing): Section headers, button text, badges, chip labels. All-caps by convention (encoded in component text, not in the font itself).
- **Micro** (700–800, 10–11px, 0.5–1px spacing): Badge text, lock hints, secondary labels. The smallest readable tier — always paired with high weight for legibility.

### Named Rules

**The Heavy-Label Rule.** Every label, badge, and section header is uppercase with weight ≥ 800 and letter-spacing ≥ 1px. Thin, lowercase labels do not exist in this system.

## Layout

Portrait-only, single-column, mobile-first. The entire app runs in one hand on a phone screen.

**Spatial model:** Content is padded 16px from screen edges (24px on the start screen for centering). The SafeAreaView handles the top notch; the bottom 50dp is reserved for the ad banner (hidden when ads are removed). Content fills the width between these margins.

**Density:** Moderate. Cards and panels use 12–16px internal padding. Rows of items (forgers, shop items, milestones) use 8–10px gaps. The hand of cards wraps horizontally with 4px margins between cards (62×88px each).

**Responsive behavior:** None — the app is locked to portrait orientation. No breakpoints, no tablet-specific layout. The fixed portrait frame simplifies every layout decision.

## Elevation & Depth

The system is tonal-layering-first. Three layers carry all depth:

1. **Void** (#161120) — the deepest layer, the app background
2. **Surface** (#221a30) — raised panels, cards, HUD elements, with 1px border (#3a2f4c)
3. **Content** — text, icons, interactive elements on top of surfaces

Shadows are reserved for exactly two use cases:
- **Card shadows** (`shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, elevation: 3`): Playing cards in the hand need to feel like physical objects lifted off the table. The shadow is tight and directional (downward).
- **Floating overlay shadows** (`shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6`): The break reminder banner and modals float above everything with a heavier shadow, signaling they are temporary and dismissible.

### Shadow Vocabulary
- **Card lift** (`shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: {0, 2}, elevation: 3`): Playing cards only. Creates the illusion of a hand of cards held above a surface.
- **Overlay float** (`shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: {0, 3}, elevation: 6`): Banners, modals, and floating notifications. Stronger and more diffuse than card lift.

### Named Rules

**The Flat-By-Default Rule.** All panels, rows, and containers are flat. No shadows, no gradients, no drop shadows on buttons or list items. Shadows exist only on physical-card-like elements (playing cards) and temporary floating overlays (banners, modals).

## Shapes

The form language is gently rounded — warm enough to feel approachable, tight enough to feel precise. No sharp corners exist anywhere in the system.

**Radius scale:**
- **6px (sm):** Deck grid cells, badge dots, forged effect badges — the tightest radius for the smallest elements
- **10px (md):** Nav buttons, shop item rows, milestone rows, pills, equip buttons — the default for interactive list items
- **12px (lg):** Forger cards, action buttons, stat cards, section containers, the break reminder — the dominant radius for primary containers and buttons
- **14px (xl):** Stat cards on the profile screen — the largest radius, used for wide, information-dense panels

**Borders:** 1–2px solid, always using Anvil Border (#3a2f4c) as the default. Gold borders (#e0a53e) are reserved for active/selected states (selected forger card, selected playing card, equipped shop items). The border is the primary selection indicator — no glow, no highlight color, just a border color shift.

**Clipping:** Cards use `overflow: hidden` implicitly via their fixed dimensions. Progress bars clip to their rounded track. No other clipping is used.

## Components

### Buttons
- **Primary:** Forge Gold background (#e0a53e), dark text (#241a05), 900 weight, 12–16px letter-spacing. Full-width within their container, 14–16px vertical padding, 12px border-radius. Used for "START RUN", "PLAY", "PLAY DAILY CHALLENGE", "BUY", "UNLOCK". Pressed state: Forge Gold Dark (#b9842a) with 0.8 opacity.
- **Secondary:** Surface background (#221a30), 1px Anvil Border, primary text (#f4ede1), 700–800 weight. Used for "DISCARD", "CLEAR", "BACK", "RESTORE PURCHASES". Pressed state: 0.8 opacity.
- **Ghost/Eyebrow:** No background, gold text (#e0a53e), 800 weight, 3px letter-spacing. Used for "SHOP" nav button (with gold border), section eyebrows. Not a standard button — more of a typographic element.

### Cards (Playing Cards)
- **Shape:** 62×88px, 8px border-radius, parchment cream background (#f2e9d8)
- **Shadow:** Card lift shadow (tight, downward, elevation 3)
- **Selected state:** translateY(-14px), 3px Forge Gold border — the card physically lifts off the table
- **Pressed state:** 0.85 opacity
- **Forged badge:** Small gold bar at the bottom showing applied forge effects

### Cards (Panels/Containers)
- **Shape:** 10–12px border-radius, Surface background (#221a30), 1px Anvil Border
- **No shadow** — these are flat tonal-layered surfaces
- **Padding:** 12–16px depending on content density
- **Selected/equipped variant:** Gold border replaces Anvil Border

### Chips/Pills
- **Shape:** 10px border-radius, Surface background, 1px Anvil Border
- **Layout:** Vertical — label (11px, uppercase, dim text) on top, value (18px, 800 weight) below
- **Accent variant:** Gold border and gold value text (used for Combo multiplier)

### Navigation Buttons
- **Shape:** 10px border-radius, Surface background, 1px Anvil Border
- **Typography:** 12px, 800 weight, 1px letter-spacing, dim text
- **Positioned:** Absolute top of screen, row with space-between
- **Shop variant:** Gold border and gold text (stands out as the monetization entry point)

### Section Headers
- **Typography:** 16px, 800 weight, 1px letter-spacing, primary text
- **Layout:** Row with title on left, progress count on right (gold text)
- **Divider below:** Not a visual divider — spacing (22px top margin) separates sections

### Badges (Unlocked/Locked)
- **Unlocked:** Success green background (rgba 15% opacity), 1px success border, 10px 800-weight uppercase text
- **Locked:** Void background, 1px surface border, 10px 700-weight dim text (max-width 130px, centered)

### Progress Bar
- **Track:** 8px height, 4px border-radius, Surface background
- **Fill:** 100% height, 4px border-radius, Forge Gold background
- **Width:** Percentage-based, driven by score/target ratio

## Do's and Don'ts

### Do:
- **Do** use Forge Gold only for authority (titles), action (primary buttons), and value (scores). Its restraint creates its power.
- **Do** use tonal layering (Void → Surface → Content) for all depth. The system is flat-by-default.
- **Do** use 800–900 weight for all labels, headers, and interactive text. The system is heavy by design.
- **Do** use gold borders to indicate active/selected/equipped states. The border color shift is the primary selection language.
- **Do** keep card faces as parchment cream (#f2e9d8) with ink (#221a2e). This is the one light-on-dark reversal in the system — it makes cards feel like physical objects.
- **Do** use 12–16px padding inside panels and 8–10px gaps between rows. The density is moderate — not cramped, not spacious.

### Don't:
- **Don't** add shadows to buttons, list items, or flat panels. Shadows are reserved for cards and floating overlays only.
- **Don't** use gold for secondary actions, borders on non-interactive elements, or background fills. Gold is for authority, not decoration.
- **Don't** introduce thin font weights (400, 500) for body text or labels. The minimum weight in the system is 600.
- **Don't** use pure white (#ffffff) or pure black (#000000) anywhere. The palette is warm — off-white text (#f4ede1) and deep purple-black backgrounds (#161120).
- **Don't** add gradients, glows, or decorative overlays. The atmosphere comes from color contrast alone.
- **Don't** break the portrait-only constraint. The entire layout assumes a fixed phone-width frame.
