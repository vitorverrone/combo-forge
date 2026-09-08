# iOS launch research: AdMob ATT/SKAdNetwork, RevenueCat IAP key, App Store Connect IAP fields

Date: 2026-09-08

Context: Combo Forge is live on Android and preparing its first iOS submission
(`react-native-google-mobile-ads` ^16.4.0, `react-native-purchases` ^10.7.0).
The app currently calls ads with `requestNonPersonalizedAdsOnly: true` and has
no `expo-tracking-transparency` / ATT prompt implemented. This note answers
four pre-submission questions against primary sources only (Google/AdMob
official docs, Apple App Store Connect Help / App Review Guidelines, and
RevenueCat's own docs). Secondary sources (blogs, Stack Overflow, forums) were
used only to locate primary sources, never cited as the fact itself.

**Tooling caveat that applies to every section below:** primary sources were
read via an automated fetch-and-summarize step, not by a human eyeballing raw
HTML. Two independent fetches of the same Apple reference table (§4)
returned different cell values on a retry, which is flagged explicitly where
it happened. Treat every quote below as accurate, but re-verify pixel-precise
table contents directly in the dashboard before treating this file as the
final word on a specific field.

---

## 1. Does ATT apply when AdMob is used for non-personalized ads only?

**Confirmed answer:** Google's own docs frame calling ATT as a *choice* tied
to wanting the IDFA / personalized ads — not a hard SDK requirement for
non-personalized-only integrations. Apple's guideline text, however, is
worded broadly enough ("track their activity", plus its own definition of
"tracking") that whether a non-personalized-only AdMob integration counts as
"tracking" is genuinely ambiguous and reviewer-dependent — the primary
sources do not give a clean yes/no for this specific case. Separately, on
iOS itself, `IDFA` is zeroed out by the OS whenever ATT authorization isn't
`.authorized` — with or without an ATT prompt — so AdMob cannot obtain a real
IDFA in this app's current state regardless of whether the prompt exists.

### What Apple's own guideline says (primary source)

Apple App Store Review Guidelines, §5.1.2(i) — fetched directly from
[developer.apple.com/app-store/review/guidelines/#data-use-and-sharing](https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing):

> "(i) Unless otherwise permitted by law, you may not use, transmit, or share
> someone's personal data without first obtaining their permission. [...]
> Data collected from apps may only be shared with third parties to improve
> the app or serve advertising (in compliance with the Apple Developer
> Program License Agreement). **You must receive explicit permission from
> users via the App Tracking Transparency APIs to track their activity.**
> Learn more about tracking. [...]"

Apple's definition of "tracking" — fetched directly from
[developer.apple.com/app-store/user-privacy-and-data-use/](https://developer.apple.com/app-store/user-privacy-and-data-use/):

> "Tracking refers to the act of linking user or device data collected from
> your app with user or device data collected from other companies' apps,
> websites, or offline properties for targeted advertising or advertising
> measurement purposes. Tracking also refers to sharing user or device data
> with data brokers."

Critically, one of the listed examples of what **does** count as tracking is:

> "Placing a third-party SDK in your app that combines user data from your
> app with user data from other developers' apps to target advertising or
> measure advertising efficiency, **even if you don't use the SDK for these
> purposes**."

This example matters here: it means Apple's own definition can reach an SDK's
behavior regardless of the app developer's *intent* — i.e., requesting
non-personalized ads only doesn't automatically put you outside the
definition if the SDK itself still does cross-app ad measurement.

Google's own NPA description supports that the SDK does exactly that. From
Google AdMob Help, ["Personalized and non-personalized ads"](https://support.google.com/admob/answer/7676680?hl=en):

> "Although non-personalized ads don't use cookies or mobile ad identifiers
> for ad targeting, they do still use cookies or mobile ad identifiers for
> **frequency capping and aggregated ad reporting**."

This is the crux of the ambiguity: Apple's guideline text doesn't carve out
an explicit "non-personalized ads are exempt" rule, and Google's own
description of NPA behavior includes exactly the kind of cross-request
identifier use ("frequency capping", "aggregated ad reporting") that Apple's
tracking definition could plausibly capture. Neither Google's nor Apple's
primary-source pages state a definitive rule resolving this specific
combination — it is left to reviewer interpretation, which is consistent
with the developer-community reports found while searching (both "shipped
NPA-only without ATT, passed review" and "rejected under 5.1.2 despite using
NPA" reports exist in Apple/Google's own developer forums) — those forum
threads are not cited as fact here, only as evidence the ambiguity is real
and contested, not resolved by a clear primary-source rule.

### What Google's AdMob/library docs say about when ATT is needed

Google's iOS privacy strategies doc — [developers.google.com/admob/ios/privacy/strategies](https://developers.google.com/admob/ios/privacy/strategies)
— presents ATT as something you opt into for IDFA access, not as an
unconditional requirement:

> "If you decide to include App Tracking Transparency (ATT) in your app, you
> can use the User Messaging Platform (UMP) SDK to trigger an IDFA
> explainer..."
> "...wait for the completion callback prior to loading ads so that if the
> user grants the App Tracking Transparency permission, the Google Mobile
> Ads SDK can use the IDFA in ad requests."

The IDFA integration guide — [developers.google.com/admob/ios/privacy/idfa](https://developers.google.com/admob/ios/privacy/idfa)
— confirms the fallback behavior without ATT:

> "If a user denies ATT, continue to request ads using your ad format's
> APIs. The Google Mobile Ads SDK doesn't send IDFA in the ad request."

The library actually in use, `react-native-google-mobile-ads` (Invertase),
states in its own docs (fetched from
[the package's `docs/index.mdx` on GitHub](https://github.com/invertase/react-native-google-mobile-ads/blob/main/docs/index.mdx)):

> "Apple requires apps to display the App Tracking Transparency
> authorization request for accessing the IDFA (leaving the choice to the
> user, whether to use personalized or non-personalized ads)."

This phrasing ties the requirement to "accessing the IDFA," and frames ATT
as the mechanism that determines *which* ad type the SDK is allowed to serve
— not as something orthogonal to ad personalization mode.

### Does the SDK access IDFA at all without ATT authorization?

Yes/no in the narrow technical sense: iOS itself (not just Google's SDK)
zeroes out the value returned by `ASIdentifierManager.advertisingIdentifier`
whenever ATT authorization status isn't `.authorized` — this applies whether
or not the app ever calls `requestTrackingAuthorization` at all (an app that
never asks stays at `.notDetermined`, which the OS also treats as "don't
return a real identifier"). This is standard, widely-documented iOS platform
behavior (Apple's `ASIdentifierManager`/`AppTrackingTransparency` framework
docs, referenced at
[developer.apple.com/documentation/adsupport/asidentifiermanager](https://developer.apple.com/documentation/adsupport/asidentifiermanager)).
**Caveat:** the live Apple Developer Documentation pages for
`ASIdentifierManager` are JavaScript-rendered and the fetch tool used here
could not retrieve their body text (only the page title came through on
three attempts) — so this fact is stated from well-established, consistent
secondary corroboration of that specific Apple API's documented contract,
not from a verbatim primary-source quote pulled in this session. If this
specific point needs to be airtight, open that URL in a browser directly.

### Would App Review realistically reject the app for missing the ATT prompt with AdMob NPA-only?

**Not something the primary sources answer definitively.** No Apple or
Google primary-source page states "NPA-only means you don't need ATT" or
"NPA-only still requires ATT" in so many words. What we have:

- Apple's guideline (5.1.2(i)) is unconditional in its wording ("You must
  receive explicit permission... to track their activity") and its
  definition of tracking explicitly reaches SDK behavior "even if you don't
  use the SDK for [tracking] purposes."
- Google documents that even NPA mode uses identifiers for frequency
  capping/aggregated reporting — behavior that could fall inside Apple's
  broad tracking definition.
- Google's own docs present ATT as conditional/optional ("if you decide to
  include ATT..."), which is a signal Google itself does not treat AdMob NPA
  as automatically requiring ATT.

**Flag:** this is a real compliance gray area, not a settled rule — the
combination of "AdMob, NPA-only, zero ATT prompt" is not explicitly blessed
or explicitly forbidden by any primary source found. Given Apple review is
inconsistent here in practice (per multiple non-primary developer reports
found only as corroborating context, not cited as fact), the safer
compliance posture — if certainty is wanted before submission — is to add
the ATT prompt (`expo-tracking-transparency` + `NSUserTrackingUsageDescription`)
regardless of NPA-only status, since Apple's own guideline text does not
carve out an NPA exception. This is a recommendation based on the ambiguity
found, not a claim that a primary source mandates it.

---

## 2. SKAdNetworkItems for AdMob on iOS

**Confirmed answer:** Adding Google's SKAdNetwork ID list to
`Info.plist` (via the config plugin's `skAdNetworkItems` option) is
presented by Google as something you should do to enable SKAdNetwork
conversion attribution when IDFA isn't available — it is not something
Apple's App Review Guidelines mandate by name, but it's the mechanism Google
recommends for install attribution once ATT/IDFA access is limited, and it's
required in practice for ad networks to attribute installs at all under
Apple's SKAdNetwork model. The current official list is published at
**https://developers.google.com/admob/ios/3p-skadnetworks** and lists
Google plus roughly 50 additional third-party ad-buyer networks (exact count
fluctuates as Google updates the list — see caveat below).

### Supporting detail

The library's own docs (same `docs/index.mdx` source as above) frame it as
enabling attribution, not as an App-Review-mandated checkbox:

> "The Google Mobile Ads SDK supports conversion tracking using Apple's
> SKAdNetwork, which lets Google and participating third-party buyers
> attribute an app install even when the IDFA is not available."
> "...these identifiers are subject to change and should be updated
> regularly."

Google's iOS privacy strategies page
([developers.google.com/admob/ios/privacy/strategies](https://developers.google.com/admob/ios/privacy/strategies))
carries the same guidance and points to the identifier list.

The **current official list URL** — fetched and confirmed to exist and be a
live table of network-name → `skadnetwork` identifier pairs — is:

**https://developers.google.com/admob/ios/3p-skadnetworks**

The fetch tool's count of table rows was inconsistent between two passes (51
vs. 46 distinct entries, with a note that at least one network — Meta — has
more than one identifier listed), so treat "~50 entries" as an approximate,
not exact, figure. Google's own text ("subject to change and should be
updated regularly") confirms the list is a moving target by design, so any
exact count captured today would likely already be stale by the time this
doc is read — **re-pull the live page before hardcoding the list into
`app.json`/config plugin rather than trusting a count frozen in this
document.**

### Is it required or recommended?

No primary source (Apple or Google) states that App Store *submission itself*
is blocked without `SKAdNetworkItems` populated. What the sources establish
is narrower: without these identifiers in `Info.plist`, participating ad
networks (including Google) cannot receive SKAdNetwork install-attribution
postbacks for this app on iOS — which is a monetization/measurement gap, not
a documented App Review rejection reason by itself. Practically, Google
treats it as a standard part of "prepare your iOS app for AdMob," which is
why the config plugin exposes it directly — but this is a recommendation
from the ad SDK vendor for its own attribution to work, not an App Review
Guidelines requirement found in Apple's own text.

---

## 3. RevenueCat "In-App Purchase Key" setup for a new iOS app

**Confirmed answer:** Generate a `.p8` In-App Purchase Key in App Store
Connect under **Users and Access → Integrations → In-App Purchase**
(Account Holder or Admin role required), download it once (it cannot be
downloaded again), then upload that same `.p8` file plus the **Issuer ID**
into RevenueCat's dashboard under the app's **In-app purchase key
configuration** tab, and save.

### Steps in App Store Connect (primary source: Apple's own help page)

Fetched from
[developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/generate-keys-for-in-app-purchases](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/generate-keys-for-in-app-purchases):

- **Required role:** Account Holder or Admin.
- **Navigation:** Users and Access → **Integrations** tab → sidebar
  **Keys → In-App Purchase**.
- **Generate:**
  1. Click **Generate In-App Purchase Key** (or the **+** icon if an Active
     key already exists).
  2. Enter a name for the key (reference only — cannot be edited later; to
     rename you must revoke and regenerate).
  3. Click **Generate**.
- **Download (one-time only, verbatim warning from Apple):**
  1. Under the key's **Active** section, click **Download Key**.
  2. Confirm **Download** in the dialog.
  3. "Store the key in a safe place." — "Keys can be downloaded only once";
     after downloading you cannot access it again through App Store Connect.
- **Revoke** (if needed): Edit → select key(s) → Revoke Key → confirm.
  Revoked keys cannot be reinstated, and any offers using that key must be
  updated immediately.
- **Purpose per Apple's own text:** these keys "allow Apple to authenticate
  and validate" client-to-server/server-to-server In-App Purchase requests,
  App Store Server API calls, and promotional offers for auto-renewable
  subscriptions.

The page does not specify a distinct "key type" beyond "In-App Purchase Key"
itself — there is only one kind of key under this specific menu (distinct
from the general-purpose "App Store Connect API" key used for other
integrations elsewhere in the same Integrations tab).

### Uploading to RevenueCat (primary source: RevenueCat's own docs)

Fetched from
[www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration):

1. In the RevenueCat dashboard, select the App Store app under **Apps**.
2. Open the **In-app purchase key configuration** tab.
3. Upload the `.p8` file downloaded from App Store Connect (no renaming
   needed — RevenueCat accepts the file as downloaded, e.g.
   `SubscriptionKey_xxx.p8`).
4. Copy the **Issuer ID** shown in App Store Connect on the same
   Integrations → In-App Purchase screen, and paste it into RevenueCat's
   Issuer ID field. (If no Issuer ID is visible yet, RevenueCat's docs note
   you may need to generate an App Store Connect API key first, since
   Issuer ID is shared across both key types on that account.)
5. Click **Save changes** in RevenueCat and let it validate the credentials.

RevenueCat's docs did not, per this fetch, call out a separate "Key ID" or
"Vendor Number" field as required alongside the `.p8` + Issuer ID for this
specific flow — treat that as the documented minimum, but re-check the live
dashboard screen at setup time in case the UI has since added fields.

---

## 4. App Store Connect In-App Purchase — required vs. optional fields before submission

**Confirmed answer:** For a not-yet-submitted IAP, **App Store Localization**
(Display Name + Description, in at least one language) and the **Review
Information screenshot** are required to reach "Ready to Submit." **Review
Notes** (the text part of Review Information) is optional. **App Store
Promotion** (the 1024×1024 promotional image) is conditionally required —
only if you intend to promote the IAP on the product page, set up win-back
offers, set up Contingent Pricing, or display offer codes/payment sheet —
not required for a plain first submission. **Offer Codes** are an entirely
separate, optional feature, not part of the base submission checklist at
all.

| Field | Required for base submission? | Source basis |
|---|---|---|
| Product ID / Reference Name | Required (fixed at creation for Product ID) | Apple help pages, consistent across all fetches |
| App Store Localization (Display Name + Description, ≥1 language) | **Required** | "View and edit In-App Purchase information" page |
| Review Information — screenshot | **Required** | Multiple Apple sources; see below |
| Review Information — review notes | Optional | "View and edit In-App Purchase information" page (advisory wording: "include review notes... to help") |
| App Store Promotion (1024×1024 image) | **Conditionally required** — only if promoting on product page / win-back offers / Contingent Pricing / offer codes payment sheet | Direct quote below |
| Offer Codes | Optional, separate feature | Not part of the "Ready to Submit" gating fields in any source fetched |

### Direct citations

Apple's help page, ["View and edit In-App Purchase information"](https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/view-and-edit-in-app-purchase-information/):

> "Review Information: ... include review notes and a screenshot to help
> [App Review understand your feature and test it]. This information is for
> App Review only and isn't displayed on the App Store."

> "Image: To promote your In-App Purchase on your App Store product page,
> set up win-back offers, set up Contingent Pricing, or display your offer
> codes and payment sheet, you must provide an image." (JPG/PNG, 1024×1024,
> 72 dpi, RGB, flattened, no rounded corners; subject to App Review approval
> before it can appear on the App Store.)

This is the clearest, most explicit primary-source statement found: the
promotional image is tied to specific opt-in features (product-page
promotion, win-back offers, Contingent Pricing, offer codes/payment sheet),
not to the base "submit for review" gate.

### A conflict between two Apple pages — flagged explicitly

Apple's own reference table, ["Required, localizable, and editable properties"](https://developer.apple.com/help/app-store-connect/reference/app-information/required-localizable-and-editable-properties),
lists an "Image" row and an "App Review Screenshot" row both checked under a
"Required" column for In-App Purchases. Two separate fetches of that same
page in this session returned inconsistent detail for the "Image" row's
other columns (one pass showed no "Localized" checkmark, a second pass on
retry showed one) — an artifact of the fetch tool's summarization rather
than a change in Apple's page. Taken at face value, the table's blanket
"Required" for "Image" appears to conflict with the narrative
"View-and-edit" page's explicit conditional wording quoted above.

**This is exactly the kind of thing to re-verify by eye before relying on
it**: open both
[developer.apple.com/help/app-store-connect/reference/app-information/required-localizable-and-editable-properties](https://developer.apple.com/help/app-store-connect/reference/app-information/required-localizable-and-editable-properties)
and
[developer.apple.com/help/app-store-connect/manage-in-app-purchases/view-and-edit-in-app-purchase-information/](https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/view-and-edit-in-app-purchase-information/)
directly in a browser and compare the "Image" row/section side by side.
Given the narrative page's wording is an unambiguous full sentence
("**To** [do X, Y, or Z] **you must** provide an image" — a conditional, not
a blanket, requirement) versus a bare table checkmark that rendered
inconsistently across two automated fetches, the narrative page's wording
is treated as the more trustworthy of the two in the confirmed answer above
— but this is this document's judgment call given a genuine primary-source
inconsistency, not a clean resolution.

The Apple in-app-purchase **statuses** reference page
([developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-statuses](https://www.developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-statuses))
lists the status names (Prepare for Submission, Ready for Review, Waiting
for Review, In Review, Accepted, Approved, Rejected, Developer Rejected,
Developer Removed from Sale, Removed from Sale) but did not, per this
fetch, spell out the exact field checklist for the "Ready to
Submit"/"Missing Metadata" transition in the copy actually retrieved —
that gate's exact field list is triangulated here from the two pages cited
above instead.

---

## Summary of what to actually do for Combo Forge's iOS launch

1. **ATT**: no primary source cleanly says NPA-only is exempt, and Apple's
   guideline + tracking definition are worded broadly enough to plausibly
   cover AdMob's NPA-mode frequency-capping/aggregated-reporting behavior.
   Given the app currently has zero ATT integration, this is a real
   pre-submission risk to close before relying on "we only request NPA" as
   a shield — not something this research can certify as safe on its own.
2. **SKAdNetworkItems**: pull the current list from
   `developers.google.com/admob/ios/3p-skadnetworks` at submission time
   (don't reuse a count/list frozen in this doc) and wire it through the
   config plugin's `skAdNetworkItems` option.
3. **RevenueCat IAP key**: generate the `.p8` in App Store Connect (Account
   Holder/Admin role, Users and Access → Integrations → In-App Purchase),
   download once, upload it + the Issuer ID into RevenueCat's per-app
   "In-app purchase key configuration" tab.
4. **IAP submission fields**: Display Name + Description (≥1 locale) and a
   Review Information screenshot are non-negotiable; Review Notes and the
   App Store Promotion image are not required for a first, plain
   submission — treat Offer Codes as entirely out of scope unless a
   promotional campaign is planned later.
