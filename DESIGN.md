---
version: alpha
name: Airbnb-design-analysis
description: A warm, generous consumer marketplace anchored on a clean white canvas and Midnight Indigo (#301e67), the single brand voltage that carries every primary CTA, search-button orb, and rating dot. Type runs Airbnb Cereal VF at modest weights — display sits at 22–28px in weight 500/600 rather than the heavy 700+ that fintech and enterprise systems use; the brand trusts photography and generous whitespace over typographic muscle. Three product entries (Homes, Experiences, Services) sit in the top nav with hand-illustrated 32-icon glyphs and "NEW" badges, signaling a marketplace expansion rather than a feature dump. Pill-shaped search bars (`{rounded.full}`), softly rounded property cards (`{rounded.lg}` ~14px), and 32px button radii read as friendly and human — there is no hard corner anywhere except the body grid.

colors:
  primary: "#301e67"
  primary-active: "#1f1248"
  primary-disabled: "#cbc7d9"
  primary-error-text: "#c13515"
  primary-error-text-hover: "#b32505"
  secondary: "#5b8fb9"
  accent: "#b6eada"
  ink: "#03001c"
  body: "#3f3f3f"
  muted: "#6a6a6a"
  muted-soft: "#929292"
  hairline: "#dddddd"
  hairline-soft: "#ebebeb"
  border-strong: "#c1c1c1"
  canvas: "#ffffff"
  surface-soft: "#f7f7f7"
  surface-card: "#ffffff"
  surface-strong: "#f2f2f2"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  legal-link: "#5b8fb9"
  star-rating: "#03001c"
  scrim: "#03001c"

typography:
  display-xl:
    fontFamily: "'Airbnb Cereal VF', Circular, -apple-system, system-ui, Roboto, 'Helvetica Neue', sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.43
    letterSpacing: 0
  display-lg:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.18
    letterSpacing: -0.44px
  display-md:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 21px
    fontWeight: 700
    lineHeight: 1.43
    letterSpacing: 0
  display-sm:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: -0.18px
  title-md:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  title-sm:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0
  rating-display:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1px
  body-md:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  caption:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.29
    letterSpacing: 0
  caption-sm:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.23
    letterSpacing: 0
  badge:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: 0
  micro-label:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: 0
  uppercase-tag:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 8px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0.32px
    textTransform: uppercase
  button-md:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0
  button-sm:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.29
    letterSpacing: 0
  link:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  nav-link:
    fontFamily: "'Airbnb Cereal VF', Circular, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 14px
  lg: 20px
  xl: 32px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 14px 24px
    height: 48px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 13px 23px
    height: 48px
  button-tertiary-text:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
  button-pill-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.full}"
    padding: 10px 20px
  search-orb:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    height: 48px
  icon-button-circle:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: 32px
  icon-button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: 40px
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 80px
  product-tab-active:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.none}"
  product-tab-inactive:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.nav-link}"
  search-bar-pill:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: 14px 24px
    height: 64px
  search-field-segment:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    padding: 8px 24px
  category-strip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted}"
    typography: "{typography.button-sm}"
  category-tab-active:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.none}"
  property-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
  property-card-photo:
    rounded: "{rounded.md}"
  experience-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.md}"
  city-link-block:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
  rating-display-card:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.rating-display}"
  guest-favorite-badge:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  new-tag:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    typography: "{typography.uppercase-tag}"
    rounded: "{rounded.full}"
    padding: 2px 6px
  amenity-row:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    padding: 12px 0
  reviews-card:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
  host-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 24px
  reservation-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 24px
  date-picker-day:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
  date-picker-day-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.full}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 14px 12px
    height: 56px
  footer-light:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: 48px 80px
  footer-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
  legal-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted}"
    typography: "{typography.caption-sm}"
---

## Overview

Airbnb is the canonical example of a generous, photography-led consumer marketplace. The base canvas is **pure white** (`{colors.canvas}` — #ffffff) with deep near-black ink (`{colors.ink}` — #03001c) for headlines and body, and a single voltage of **Indigo** (`{colors.primary}` — #301e67) carrying every primary CTA, the search-button orb, the heart save state, and inline brand links. Two supporting colors sit beside it: **Steel Blue** (`{colors.secondary}` — #5b8fb9) for secondary emphasis and **Mint** (`{colors.accent}` — #b6eada) for badges and highlights.

Type runs **Airbnb Cereal VF** (a custom variable font Airbnb licenses), with **Circular** as the historic in-house fallback and a system stack underneath. Cereal sits at modest weights — display headlines render at 22–28px in weight 500–600, not the heavy 700+ weights that financial or enterprise systems lean on. The hero h1 ("Inspiration for future getaways") on the homepage is just 28px / 700, which would feel small on a typical SaaS page; here it works because the layout leans on photography (city collage, property cards) for visual weight rather than typographic muscle.

The shape language is **soft**. Buttons are 8px radius (`{rounded.sm}`), property cards are ~14px (`{rounded.md}`), the search bar is fully pill-shaped (`{rounded.full}`), wishlist hearts and search orbs are circles (`{rounded.full}`), and category strip rounded corners run at 32px (`{rounded.xl}`). There is essentially no hard corner anywhere except the body grid itself — every interactive element is rounded.

**Key Characteristics:**
- Single accent color: `{colors.primary}` (#301e67 — "Indigo") carries every primary CTA, the search orb, the heart save state, and the brand wordmark. Used scarcely — most pages are 90% white + ink with one or two Indigo moments.
- Custom variable type: `Airbnb Cereal VF`. Display weights sit at 500–700, body at 400. Modest weight is intentional — the system trusts photography for visual heft.
- Three-product top nav: Homes, Experiences, Services — each with a hand-illustrated 32px icon and "NEW" badges (`{component.new-tag}`) on the two newer products. Active tab uses an underline rule (`{component.product-tab-active}`).
- Pill-shaped global search bar: white surface, fully rounded (`{rounded.full}`), divided by 1px hairlines into Where / When / Who segments, terminated by a circular Indigo search orb (`{component.search-orb}`).
- Property cards are photo-first: aspect-ratio rectangles with `{rounded.md}` corner clipping, swipeable image carousel, "Guest favorite" floating badge top-left, heart icon top-right, then 4–5 lines of meta beneath.
- Editorial dropdowns (footer, language picker) are clean text columns over the white canvas — no card surface, no shadow.
- The design system caps elevation at one shadow tier (`box-shadow: rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px`) — used on hover-floated cards and search/account dropdowns.
- 8px base spacing system, with major sections at `{spacing.section}` (64px) — generous but not airy enough to feel editorial-magazine; the marketplace density wants more cards per scroll.

## Colors

### Brand & Accent
- **Indigo** (`{colors.primary}` — #301e67): The single brand color. Used for primary CTA backgrounds (Reserve, Continue), the search orb, the heart save state on property cards, and inline brand links. The most recognizable color in consumer travel.
- **Indigo Active** (`{colors.primary-active}` — #1f1248): The press / pointer-down variant — slightly deeper. Used on `{component.button-primary-active}`.
- **Indigo Disabled** (`{colors.primary-disabled}` — #cbc7d9): A pale tint used on disabled CTAs.
- **Steel Blue** (`{colors.secondary}` — #5b8fb9): Secondary emphasis — icon accents and inline links.
- **Mint** (`{colors.accent}` — #b6eada): Highlight fill for the "Guest favorite" and "NEW" badges. Always paired with ink text.

### Surface
- **Canvas** (`{colors.canvas}` — #ffffff): The default page floor for every public page. Airbnb does not have a dark mode on the public web.
- **Surface Soft** (`{colors.surface-soft}` — #f7f7f7): The lightest fill — used on disabled fields, sub-nav hover backgrounds, and the inline search filter band.
- **Surface Strong** (`{colors.surface-strong}` — #f2f2f2): Slightly heavier fill — circular icon-button surface (e.g., the breadcrumb back-arrow and listing toolbar buttons).

### Hairlines & Borders
- **Hairline** (`{colors.hairline}` — #dddddd): The default 1px border tone — search bar dividers, table separators, footer column splitters, card 1px borders.
- **Hairline Soft** (`{colors.hairline-soft}` — #ebebeb): A lighter divider used on long-scrolling editorial body separators.
- **Border Strong** (`{colors.border-strong}` — #c1c1c1): A heavier stroke used on disabled outline buttons and form input outlines after focus.

### Text
- **Ink** (`{colors.ink}` — #03001c): The dominant text color on light surfaces. Display headlines, body paragraphs, primary nav links, and most inline link text. Never pure black.
- **Body** (`{colors.body}` — #3f3f3f): A secondary running-text color used inside long-form review and amenity copy where ink would feel too heavy.
- **Muted** (`{colors.muted}` — #6a6a6a): Sub-titles inside city link blocks ("Cottage rentals", "Villa rentals"), inactive product-tab labels, footer category sub-labels, "View all" links.
- **Muted Soft** (`{colors.muted-soft}` — #929292): Disabled link text. Used very sparingly.
- **Star Rating** (`{colors.star-rating}` — #03001c): The same ink token — Airbnb's star icon and "4.81" rating numbers all render in ink rather than a yellow/gold color, which is a deliberate brand choice (yellow stars feel cheap in travel context).
- **On Primary** (`{colors.on-primary}` — #ffffff): White text on Indigo CTAs.

### Semantic
- **Error** (`{colors.primary-error-text}` — #c13515): Inline error text for form validation. Distinct from Indigo — slightly darker, more saturated red.
- **Error Hover** (`{colors.primary-error-text-hover}` — #b32505): Darkens on link hover.
- **Legal Link Blue** (`{colors.legal-link}` — #5b8fb9): Inline links inside legal copy (Privacy, Terms). Only used inside the legal sub-band.

### Scrim
- **Scrim** (`{colors.scrim}` — #03001c at 50% opacity): The global modal backdrop tone — date picker, login dialog, language picker. Stored as the base hex; opacity is applied at render time.

## Typography

### Font Family
The system runs **Airbnb Cereal VF** for everything — display, body, navigation, captions, microcopy. Fallbacks walk `Circular, -apple-system, system-ui, Roboto, "Helvetica Neue", sans-serif`. **Circular** is the historic in-house typeface still kept as the first non-variable fallback; system stacks back it up.

There is no separate display family. The variable font carries the entire scale.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.rating-display}` | 64px | 700 | 1.1 | -1px | Listing detail rating display ("4.81") |
| `{typography.display-xl}` | 28px | 700 | 1.43 | 0 | Homepage h1 ("Inspiration for future getaways") |
| `{typography.display-lg}` | 22px | 500 | 1.18 | -0.44px | Listing detail h1 ("Close to Fethiye Aliyah Bali Beach…") |
| `{typography.display-md}` | 21px | 700 | 1.43 | 0 | Section heads inside listing detail ("What this place offers") |
| `{typography.display-sm}` | 20px | 600 | 1.20 | -0.18px | Sub-section titles ("Things to know") |
| `{typography.title-md}` | 16px | 600 | 1.25 | 0 | City link block titles ("Wilmington", "Athens") |
| `{typography.title-sm}` | 16px | 500 | 1.25 | 0 | Footer column heads ("Support", "Hosting", "Airbnb") |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default running-text inside listing copy |
| `{typography.body-sm}` | 14px | 400 | 1.43 | 0 | Card meta lines, dates, prices, distance text |
| `{typography.caption}` | 14px | 500 | 1.29 | 0 | Search field segment labels ("Where", "When", "Who") |
| `{typography.caption-sm}` | 13px | 400 | 1.23 | 0 | Footer legal line ("© 2026 Airbnb, Inc.") |
| `{typography.badge}` | 11px | 600 | 1.18 | 0 | "Guest favorite" floating badge text |
| `{typography.micro-label}` | 12px | 700 | 1.33 | 0 | Card amenity micro-labels ("Inline 6") |
| `{typography.uppercase-tag}` | 8px | 700 | 1.25 | 0.32px (uppercase) | "NEW" badge on product nav tabs |
| `{typography.button-md}` | 16px | 500 | 1.25 | 0 | Primary CTA button labels |
| `{typography.button-sm}` | 14px | 500 | 1.29 | 0 | Pill button labels (category strip) |
| `{typography.link}` | 14px | 400 | 1.43 | 0 | Inline body links |
| `{typography.nav-link}` | 16px | 600 | 1.25 | 0 | Top product-nav labels (Homes, Experiences, Services) |

### Principles
Display weights stay modest. The homepage h1 at 28px / 700 is deliberately small — it tucks under the search bar so photography and the city-link grid carry visual hierarchy. The listing-detail h1 at 22px / 500 is even quieter; the listing photo banner does the work above it.

The single typographically loud moment in the entire system is the **rating display** (`{typography.rating-display}` — 64px / 700) on listing pages. That is the only place the system trusts type alone to carry hierarchy — rating numbers are a peak trust signal, so they get the loudest treatment.

### Note on Font Substitutes
If Airbnb Cereal VF and Circular are unavailable, **Inter** is the closest open-source substitute. Adjust display headlines down by ~2% in line-height to match Cereal's slightly tighter cap height; otherwise the proportions transfer cleanly.

## Layout

### Spacing System
- **Base unit:** 4px (with 2px micro-step).
- **Tokens:** `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.base}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 64px.
- **Section padding (vertical):** `{spacing.section}` (64px) for major page bands; tighter than typical SaaS marketing (80–96px) because marketplace pages need higher card density per scroll.
- **Card internal padding:** `{spacing.lg}` (24px) for `{component.host-card}` and `{component.reservation-card}`; `{spacing.base}` (16px) for property-card meta block; `{spacing.sm}` (8px) for caption / date-row gutters.
- **Gutters:** `{spacing.base}` (16px) between cards in the homepage city grid; `{spacing.lg}` (24px) inside footer column gutters; `{spacing.xs}` (4px) on dense category-strip dividers.

### Grid & Container
- **Max content width:** ~1280px centered on the homepage and editorial pages. Listing detail pages cap closer to 1080px to keep the photo banner and reservation rail readable.
- **City link grid (homepage footer):** 6-column grid at desktop with each cell housing a city name in `{typography.title-md}` and a category sub-label in `{typography.body-sm}` muted.
- **Listing detail:** 2-column with photo / amenity body on the left (~64% width) and a sticky reservation card (`{component.reservation-card}`) on the right (~32%).
- **Footer:** 3-column link list (Support / Hosting / Airbnb) at desktop, collapsing to 1-column on mobile.

### Whitespace Philosophy
The system gives editorial bands 64px of vertical breathing room but compresses card grids — property and city-link cards sit just 16px apart. The contrast is intentional: the page reads as "open hero, dense marketplace below," reinforcing the marketplace nature without overwhelming the visitor at the fold.

## Elevation

The system has essentially **one shadow tier** plus the flat baseline.

- **Flat (no shadow):** Body, hero, footer, all editorial bands — 95% of surfaces.
- **Card hover float:** `box-shadow: rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0` — applied to property cards on pointer hover, the search bar at rest, and the dropdown menus (account menu, language picker, date picker). This is the single shadow definition in the entire system.
- **Modal scrim:** `{colors.scrim}` rendered at 50% opacity — the global modal backdrop. Used on date pickers, login dialogs, language picker.

There are no progressive elevation tiers — the system either has the one shadow or none. Depth comes from photography, the white-on-white surface separation, and rounded-corner clipping rather than from layered shadows.

## Components

### Buttons

**`button-primary`** — Indigo fill, white text, 8px radius, 14×24px padding, 48px height, weight 500. The most common CTA across the system: "Reserve", "Continue", "Search", account-flow primaries.

**`button-primary-active`** — The press state. Background flips to `{colors.primary-active}`. No transform, no shadow change.

**`button-primary-disabled`** — Pale Indigo tint at #cbc7d9 with white text. Cursor not-allowed.

**`button-secondary`** — White fill with ink text and a 1px ink outline. 8px radius. Used for "Save", "Cancel", and inverse CTAs over Indigo surfaces.

**`button-tertiary-text`** — Plain ink text, no surface, no border. Underlined on hover. Used for "Show more" type links and modal close labels.

**`button-pill-primary`** — A pill-shaped Indigo CTA used on featured cells (e.g., "Become a host" sub-CTA) — 9999px radius, 10×20px padding, 14px label.

### Search Surface

**`search-bar-pill`** — The signature global search bar. White fill, 9999px radius, 64px height, 1px hairline 1px-shadow border. Internally divided by vertical hairline rules into `{component.search-field-segment}` cells (Where / When / Who). Each segment holds an uppercase caption label above a placeholder line in `{typography.caption}`.

**`search-orb`** — The circular Indigo orb terminating the right edge of the search bar. 48×48px, fully rounded, white magnifying-glass icon centered. The hottest single color moment on the homepage.

### Top Navigation

**`top-nav`** — White surface, 80px height, 1px bottom hairline. The Airbnb wordmark sits flush left, the three product tabs (Homes / Experiences / Services) sit in the dead center, and account utilities (host link, language globe, account menu) sit flush right.

**`product-tab-active`** — Ink label in `{typography.nav-link}`, 32px hand-illustrated icon, 2px ink underline rule beneath the icon-label pair.

**`product-tab-inactive`** — Muted label, illustrated icon, no underline. Becomes active on click.

**`new-tag`** — A tiny mint rounded-pill badge (`{rounded.full}`) anchored top-right of an icon, carrying the uppercase "NEW" label in `{typography.uppercase-tag}` (8px / 700 with 0.32px tracking, uppercase). Used on Experiences and Services to signal recency.

### Listing Cards

**`property-card`** — A photo-first card. 1:1 aspect-ratio image with `{rounded.md}` corner clipping, image carousel dots overlay, "Guest favorite" floating badge top-left (`{component.guest-favorite-badge}`), and a heart icon top-right (`{component.icon-button-circle}` in default outlined state, Indigo-filled when saved). Beneath the image: 4–5 lines of meta — title (`{typography.title-md}`), distance / dates (`{typography.body-sm}` muted), and price ("$X night") right-aligned.

**`property-card-photo`** — The photo plate itself, separated as a token because some surfaces (wishlist, search results) reuse just the photo without the meta block.

**`experience-card`** — A taller-aspect card (4:5) for experience listings. Same `{rounded.md}` clipping, floating "NEW" badge top-left, heart top-right, and a single-line title beneath.

**`guest-favorite-badge`** — Mint rounded pill (`{rounded.full}`) at 11px / 600 weight. Sits over the photo with the system's only shadow tier applied for elevation.

### Listing Detail

**`rating-display-card`** — The signature listing-detail moment. A 64px / 700 rating number ("4.81") flanked left and right by tiny laurel-wreath SVG ornaments. Beneath the rating: "Guest favorite" tagline and a row of ink stat columns. The largest typographic weight in the whole system.

**`amenity-row`** — A 1-column list of amenity icons + ink labels in `{typography.body-md}`. 12px row padding, no border between rows; section is closed by a 1px hairline divider above and below.

**`reviews-card`** — A 2-column grid of review excerpts. Each column holds an author row (avatar, name, date) above a 3-line excerpt with "Show more" tertiary link.

**`host-card`** — A white card with `{rounded.md}` rounding and 24px padding holding a host avatar, name, "Superhost" badge, response-rate stat, and a "Contact host" `{component.button-secondary}`.

**`reservation-card`** — The sticky right-rail card on listing detail pages. White surface, `{rounded.md}` rounding, 1px hairline border, 1px shadow tier elevation, 24px padding. Contains: nightly price (`{typography.display-md}` ink), date-range selector, guest-count stepper, "Reserve" primary CTA full-width, and a fee breakdown stack beneath in `{typography.body-sm}`.

### Date Picker

**`date-picker-day`** — A 40×40px circular cell carrying the day number in `{typography.body-sm}`. Default state is transparent fill, ink text.

**`date-picker-day-selected`** — Ink fill, white text, full circle (`{rounded.full}`). Range states between two selected days carry a `{colors.surface-soft}` lozenge background that connects them.

### Forms

**`text-input`** — White surface, 1px hairline outline, `{rounded.sm}` 8px radius, 56px height, 14×12px padding. Stacked label above (in `{typography.caption}` muted), placeholder text in `{typography.body-md}` muted. On focus, the border thickens to 2px ink and the border color flips to `{colors.ink}` — no glow, no ring.

### Footer

**`footer-light`** — White surface (matches the page canvas — Airbnb has no contrast footer), 48×80px padding. Three columns of link blocks (Support / Hosting / Airbnb), separated by generous 24px gutters. Each column heads with a `{typography.title-sm}` ink label and stacks `{component.footer-link}` rows in `{typography.body-sm}` ink.

**`legal-band`** — A bottom strip beneath the footer columns carrying the copyright line, language picker (globe icon + "English (US)" link), currency picker, and social icons (Facebook, X, Instagram). All text in muted `{colors.muted}` at `{typography.caption-sm}`.

## Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 744px | Top nav collapses to logo + hamburger; product tabs hide behind a sheet; search bar collapses to a single tappable pill; property cards stack 1-up; city grid 1-column; listing detail collapses reservation card to a sticky bottom bar. |
| Tablet | 744–1128px | Top nav keeps product tabs but search bar narrows; property cards 2-up; city grid 2–3 column; reservation card stays sticky right-rail at narrower width. |
| Desktop | 1128–1440px | Full top nav with three product tabs centered; search bar at full pill width with all 3 segments visible; property cards 4-up; city grid 6-column; listing detail 2-column with reservation rail. |
| Wide | > 1440px | Content width caps at 1440px on listing/search pages and ~1280px on editorial; gutters absorb the rest. |

### Touch Targets
- Primary CTAs at minimum 48×48px (above WCAG AAA).
- Search orb is 48×48px circular — the most-tapped element on the page.
- Heart save button is 32×32px circular — borderline for AAA but compensated by a generous 12px padding inside the photo card.
- Date-picker day cells are 40×40px circular.

### Collapsing Strategy
- Top product tabs collapse into a hamburger sheet below 744px.
- Search bar's 3 segments collapse into a single-tap entry that opens a full-screen search overlay on mobile.
- Property and city-link grids drop column counts cleanly at each breakpoint — never reflow rows; always reduce columns.
- Reservation card on listing detail switches from sticky right-rail to a sticky bottom bar on mobile, carrying just the "Reserve" CTA + nightly price summary.

## Known Gaps

- **Hover state colors:** intentionally not documented per the global no-hover policy — Airbnb's actual `:hover` styling for property cards is a subtle elevation lift, but precise extraction is unreliable.
- **Loading states / skeleton screens:** not visible on the extracted surfaces.
- **Map view styling:** the search-results map uses Mapbox-tinted tiles with custom Indigo markers; not captured here.
- **Form input error states:** error text color (`{colors.primary-error-text}`) is documented, but the full input outline + helper-text combination on validation failure was not visible in the captured surfaces.
## 플랜잇 화면 구현 규칙

> 위쪽의 Airbnb 분석 내용은 초기 참고 자료다. 실제 화면은 아래 규칙을 따른다. 제품 맥락은 `PRODUCT.md`, 방향 계약은 `.impeccable/briefs/app.md`에 있다.

### 컨셉: 탑승권 + 여행지 풍경 그림

여행방은 탑승권이다. 에어비앤비·트리플처럼 여행지 이미지가 화면의 주인공이 되도록, 사진 대신 색을 칠한 지역 풍경 그림을 탑승권 위에 크게 둔다.

### 색

사용자가 정한 팔레트(크림 #FCECD8, 올리브 #597928, 세이지 #91AC67, 브라운 #6E3511)에서 초록은 노란 기운을 뺀 숲 초록(#3f6b4a, 옅은 #86a98c)으로 바꾸고 브라운은 그대로 쓰며, 바탕과 면은 초록 기운 없는 따뜻한 중간색을 쓴다(바탕까지 옅은 숲 초록를 깔면 초록이 너무 많아서). 흰색·살구색 면은 쓰지 않는다. 색마다 맡는 곳을 정한다(impeccable colorize: 강한 색은 작은 점으로 흩지 않고 역할을 맡는다).

| 색 | 토큰 | 맡는 곳 |
|---|---|---|
| 밝은 그레이 `#f6f5f1` + 숲빛 `#e9efe9` | `--color-canvas`, `--color-canvas-glow`, `--background-canvas` | 화면 바탕 전체. 위쪽 22rem만 옅은 숲빛에서 바탕색으로 이어지는 그러데이션, 그 아래는 단색 |
| 오프화이트 `#fdfdfb` | `--color-ticket`, `--color-background` | 탑승권, 카드, 시트, 입력 칸 같은 떠 있는 면 |
| 숲 초록 `#3f6b4a` | `--color-primary`, `--color-point` | 주 버튼(흰 글자 6.2:1), "여행 중" 글자, 지금 탭 선, 선택 테두리 |
| 브라운 `#6E3511` | `--color-accent-brown` | D-day 숫자(아이보리 위 9.2:1), 방장 배지(크림 글자 8.3:1), 여행 완료 도장 |
| 옅은 숲 초록 `#86a98c` | `--color-progress` | 진행 단계 바, 참여 멤버 제출 바 |

- 제목·본문 글자는 소프트 차콜 `--color-text`(#2a2f2c, 바탕 위 11.8:1), 보조 글자는 `--color-text-muted`(#646862, 바탕 위 4.9:1). 큰 제목도 차콜로 쓰고 브라운은 D-day·방장·도장에만 쓴다.
- 테두리와 옅은 면은 따뜻한 회베이지 계열(`--color-border` #ddd8ce, `--color-surface-strong` #e6e2da). 그림자는 브라운 기운을 띤다.
- 옅은 강조 면: `--color-point-soft`(#e3eee5) 위 글자는 `--color-point-text`(#33583c, 6.8:1), `--color-accent-brown-soft`(#f5e4d6) 위 글자는 브라운.
- 방장이 아닌 멤버 배지는 옅은 회베이지 면 + 브라운 글자.
- 카카오 로그인 버튼만 카카오 공식 노랑. 그 밖에 노랑·블루·보라·검정 면은 쓰지 않는다.

### 글자

- Pretendard 하나만 쓴다. 날짜·D-day·인원 숫자는 `font-variant-numeric: tabular-nums`로 자리를 맞춘다. 고정폭 글꼴은 쓰지 않는다(기계적으로 보여서).
- 굵기는 700이 최대, 자간은 -0.04em까지.

### 부품

- **버튼:** shadcn `Button`, 모서리 `--radius-md`. 주 버튼은 숲 초록, 비활성은 `--color-surface-strong` 바탕 + `--color-text-muted-soft` 글자.
- **메인 여행방 목록:** 같은 크기 카드를 쌓지 않는다(딱딱해 보여서). 끝나지 않은 여행을 출발일 순으로 맞춘 뒤 첫 여행은 "다가오는 여행" 큰 카드(`FeaturedTripCard`), 나머지 끝나지 않은 여행은 그 바로 아래 제목 없이 한 줄 목록(`TripRow`), 끝난 여행은 "완료한 여행" 묶음으로 따로 보여준다. 백엔드도 같은 순서로 보내지만 목록을 나눠 받으므로 불러온 범위 안에서 한 번 더 정렬한다.
- **다가오는 여행 큰 카드(`FeaturedTripCard`):** 아이보리 면, `--radius-xl`. 위에 높이 96px 지역 풍경 띠, 가운데 줄에 이름(18px/700)과 오른쪽 큰 브라운 D-day, 얇은 선 아래 왼쪽에 "10월 12일 토요일 출발"과 상태 알약("설문 모으는 중 3/4", "일정이 완성됐어요"; 출발 당일은 알약 없음), 오른쪽에 참여자 얼굴(첫 멤버가 방장). 목록 API에 지역·설문 현황이 없어 이 카드 하나만 상세 API와 설문 현황 API를 더 부른다. 실패하면 기본 풍경과 제출 수 없이 보여준다. 나가기 아이콘은 풍경 띠 오른쪽 위.
- **한 줄 목록(`TripRow`):** 아이보리 면 하나 안에서 줄로 나눈다. 왼쪽 46px 네모 칸에 D-day(옅은 브라운 면 + 브라운 글자), 여행 중은 옅은 숲 초록 면 + 숲 초록, 완료는 회색 면. 가운데 이름(16px/700), 그 아래 왼쪽에 "10월 24일 · 설문 중", 오른쪽 끝에 작은 참여자 얼굴(22px, 첫 멤버가 브라운 방장, 최대 4명 + "+N"). 맨 오른쪽은 나가기 아이콘(나갈 수 없는 방은 자리를 비우지 않고 얼굴이 카드 오른쪽 끝에 붙는다). 화살표는 두지 않는다. 지난 여행은 이름도 한 톤 낮춘다.
- **진행 단계 바(`TripProgress`, 여행방 상세 상단):** `설문 → 일정 생성 → 여행` 3칸. 지금 단계까지 옅은 숲 초록로 채우고, 지금 단계 이름만 굵은 숲 초록, 남은 단계는 옅은 크림.
- **D-day 칸(`TicketStub`, 여행방 상세 상단):** 백엔드 여행 상태를 그대로 따른다. 칸은 칠하지 않고 탑승권 면 그대로 두며 글자만 칠한다. 출발 전은 브라운 `D-12`(당일 `D-DAY`), 여행 중(백엔드 기준 출발 당일)은 숲 초록 "여행 중", 여행 완료는 비스듬한 브라운 "여행 완료" 도장. 절취선은 `--color-border-strong` 점선. 여행방 상세는 상태가 따로 오지 않아 백엔드와 같은 규칙으로 계산한다.
- **지역 풍경 그림(`RegionIllustration`):** 서울(빌딩 숲·남산타워), 경주(노을·고분·첨성대), 부산(바다·광안대교), 전주(나무·한옥), 제주(한라산·유채꽃·돌하르방). 200×110 틀 전체가 상자 높이에 맞게 줄어 잘리지 않고(`xMidYMax meet`), 남는 양옆·위는 하늘과 땅을 틀 밖까지 이어 그려 채운다. 선은 `--scene-roof` 1.5px. 얼굴·표정은 넣지 않는다.
- **여행방 상세:** 머리글은 뒤로 가기와 "취향 설문 결과". 높이 96px 풍경 띠 아래에 탑승권(여행방 이름 22px/700 옆에 작은 인원 `3명`, "제주 · 10월 24일 토요일 출발", 진행 단계 바, 오른쪽 D-day 칸). 설문 결과가 나와도 참여 멤버 카드(제출 바 + 멤버 목록)는 함께 보여준다. 아래 버튼은 화면에 고정하지 않고 내용 뒤에 이어 둔다(목록을 가리지 않게). 도착일과 `1/2` 같은 분수 표기는 쓰지 않는다.
- **여행지 고르기:** 2열 카드, 위에 높이 64px 풍경 띠(잘리지 않음), 아래 굵은 지역 이름. 고르면 숲 초록 2px 테두리 + 옅은 숲 초록 바탕 + 숲 초록 이름.
- **메인 상단:** 로고와 프로필, 차콜 큰 인사 제목("OO님, 어디로 떠나볼까요?"), 숲 초록 "새 여행 만들기" 버튼(동그라미 + 아이콘, 오른쪽 ↗).
- **로그인:** 스플래시로 시작한다. 배경 없는 로고(96px 칸)와 "플랜잇"이 가운데 떠오르고(0~0.45초), 설명 "취향을 모으면, 여행이 완성돼요"가 잠깐 보인 뒤(0.45초~), 1.3초부터 걷히며 로그인 화면이 아래에서 올라온다. 로그인 화면은 왼쪽 위 로고 + "PlanIt"(h1), 가운데 정렬 기능 소개 슬라이드 4장(여행지 탑승권 그림 + 두 줄 문구, 강조 단어만 숲 초록 + 한 줄 설명: 여행 계획 / 친구 초대 / AI 일정 / 오픈 채팅), 아래 점 표시(지금 장은 숲 초록 긴 알약), 맨 아래 완전히 둥근 카카오 버튼. 슬라이드는 스플래시 뒤 2초마다 옆으로 넘어가 마지막 장에서 멈춘다. 옆으로 밀거나(40px 이상) 점을 눌러 직접 넘길 수 있고, 그러면 자동 넘김을 멈춘다. 움직임 줄이기 설정이면 스플래시와 자동 넘김을 끈다.
- **하단 탭:** 화면 아래에 붙은 흰 막대 + 위쪽 1px 선. 선택된 탭은 짙은 글자 + 위쪽에 숲 초록 3px 선.
- **상태 안내(`StatusMessage`):** 옅은 옅은 숲 초록 둥근 상자 + 숲 초록 아이콘 + 굵은 제목 + 보조 설명.
- **멤버 목록:** 한 장의 카드 안에서 줄로 나눈다. 이름과 방장 표시는 세로 가운데로 맞춘다. 제출 상태는 알약(완료 `--color-success-soft`, 대기 `--color-surface-strong`).
- **로고 글자:** 로고 옆 서비스 이름은 영어 "PlanIt"으로 쓴다(메인, 로그인, 스플래시, 초대 화면). 문장 속 서비스 이름은 그대로 둔다.
- **로고(`planit-symbol.svg`, `favicon.svg`):** 핀은 숲 초록 그러데이션(#52875e → #2c4f35), 고리는 옅은 세이지 #a9c49a, 비행기는 차콜 #2a2f2c. 남색은 쓰지 않는다. 로고 뒤에 원·칸 배경을 깔지 않는다.
- **머리글 뒤로 가기(`PageHeader`):** 배경·그림자 없이 아이콘만. 누르는 영역 40px, 아이콘이 본문 왼쪽 끝과 맞게 8px 당기고, 누를 때만 옅은 원이 보인다.
- **오픈 채팅:** 목록은 숲빛 배경, "내 여행 지역"과 "다른 지역" 묶음. 한 장의 카드 안에서 줄로 나누고, 왼쪽 48px 둥근 풍경 썸네일, 방 이름과 "N명 대화 중 · N명 참여"(앞에 옅은 숲 초록 점), 참여 중이면 옅은 숲 초록 "참여 중" 알약. 참여 팝업은 위에 지역 풍경 띠, 운영 원칙 동의 상자, 둥근 취소·입장 버튼. 채팅방은 오프화이트 머리글(뒤로 가기, 36px 풍경 썸네일, 방 이름과 대화 중 인원, 오른쪽 나가기 아이콘)과 입력창, 상대 말풍선은 오프화이트, 내 말풍선은 숲 초록, 날짜는 알약, 첨부 버튼은 회색 원.
- **초대 받기:** 숲빛 배경, 왼쪽 위 로고 + "PlanIt", 가운데 초대한 사람 얼굴(브라운)과 "OO님이 여행에 초대했어요", 큰 질문 "여행방 이름에 함께할까요?", 아래 탑승권(풍경 띠, 여행지 + 출발일, 오른쪽 D-day 칸, 아래 참여자 얼굴과 "N명 참여 중 · 최대 N명"), 옅은 숲 초록 안내 상자, 둥근 참여 버튼.
- **여행방 만들기 완료:** 숲 초록 원 안 체크(톡 튀어나옴), 제목, 만든 여행방 탑승권(풍경 띠, 여행지·이름·"출발일 · 최대 N명", 오른쪽 D-day 칸), 아래 둥근 버튼 둘.
- **준비 중·없는 페이지:** 숲빛 배경 가운데 둥근 풍경 그림 카드, 굵은 제목, 짧은 설명, 둥근 숲 초록 버튼.
- **안내·확인 팝업:** `AlertDialog`, `ConfirmDialog`. **바텀시트:** `BottomSheet`. **토스트:** sonner. **로딩:** shadcn `Skeleton`, 전체 화면은 `LoadingScreen`.
- **여행 날짜 고르기:** 여행방 만들기 화면에 달력을 처음부터 펼쳐 둔다(누르는 칸·드롭다운 없음). "여행 날짜" 이름 오른쪽에 고른 날("10월 24일 토요일 출발", 숲 초록 굵게). 오늘과 그 이전은 고를 수 없다. 설문 마감일은 날짜를 고르기 전에도 모든 선택지를 고를 수 있고, 날짜를 고른 뒤 맞지 않으면 여행 전날로 되돌린다(백엔드는 만들 때 오늘 ≤ 마감일 < 출발일만 확인).
- **취향 설문:** 지금 분야는 옅은 숲 초록 알약, "이전"은 흰 면 + 테두리 알약 버튼, "다음·제출하기"는 숲 초록 알약 버튼.
- **입력 칸:** 흰 바탕 + 1px `--color-border`, `--radius-md`, 높이 `--height-button-md`. 오류는 `--color-danger`.
- **달력:** `CalendarMonth`. 선택한 날은 `--color-primary` 원.
- **아이콘:** lucide-react.
- **프로필 글자:** 사진이 없거나 기본 이미지면 이름의 첫 글자. 한국 이름은 성을 뺀 첫 글자(김채령 → 채), 영어 이름은 첫 글자 대문자.

### 품질 기준

- 제목 위 작은 라벨(eyebrow)을 쓰지 않는다.
- 글자 대비 4.5:1 이상. 가장 옅은 글자도 `--color-text-muted-soft`(#72747b)까지.
- 글자 선택 색(옅은 옅은 숲 초록), 입력 커서·체크박스, 스크롤바 색을 `global.css`에서 디자인 색으로 맞춘다.
- 움직임은 누름 반응(`scale 0.98~0.99`)뿐이다. `prefers-reduced-motion`이면 끈다.
- 여행방 목록 정렬은 백엔드가 한다(오늘 이후 여행 먼저 출발일 순, 지난 여행은 아래). 프론트에서 다시 정렬하지 않는다(커서 페이지와 어긋나지 않게).
- 여행 시작일은 내일부터 고를 수 있다(백엔드 `feat/block-trip-schedule-creation-today` 규칙). 당일 여행용 설문 마감 안내는 없다.
