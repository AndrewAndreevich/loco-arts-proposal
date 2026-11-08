# Design notes: loco-park.ge → LOCO Arts proposal

Source: https://loco-park.ge and https://loco-park.ge/ka (Framer). Rendered in headless Chrome via
Playwright (`tools/inspect_ref.py`) at 1440×900 and 390×844, computed styles read from the DOM
(November 2026).

## What the reference does

| Property | Desktop 1440 | Mobile 390 |
|---|---|---|
| Background | `#000` everywhere, no panels or cards | same |
| Typeface | **Graphik Ge Regular** (one file, Latin + Georgian Mkhedruli), self-hosted by Framer | same |
| Weights | 400 only — no bold anywhere | same |
| Headline | 36px / 1.2 (43.2px), letter-spacing −0.02em (−0.72px), colour `#FF54A6` | 32px (28px for some blocks) |
| Body / links | 16px / 1.2 (19.2px), letter-spacing +0.14px | 16px |
| Text colour | Never white body text: every block is set entirely in one bright colour | same |
| Grid | 4 equal columns, 40px outer margin, columns start at x = 40 / 380 / 720 / 1060 | 2 columns, 12px margin |
| Radius | 20px on the language switch pill; brand shapes are full “stadium” capsules | same |
| Header | Not sticky. Logo centred at the top, language switch as a vertical pill at top-right (dark pill, active item = orange circle) | Logo left, switch top-right |
| Links | No underline, same colour as their block, no visible hover change | same |
| Motion | (1) headline split into words, each word fades in from `opacity 0, translateY(10px)` with a stagger, ≈0.6s per word; (2) three rows of giant colour capsules scroll horizontally as a marquee, alternate rows in opposite directions, ≈150px/s | same |
| /ka | Identical layout and type scale; Georgian set in the same Graphik Ge face; the active language circle moves to “ქა” | same |

### Palette (computed `color` values, by frequency)

| Token | Hex | Contrast on #000 | Use here |
|---|---|---|---|
| pink | `#FF54A6` | 7.6 | headlines, accent, Flagship price |
| orange | `#FD4B1C` | 6.5 | Flagship tier, CTA button |
| green | `#00923B` | 5.4 | text blocks |
| lime | `#B3ED6A` | 15.2 | Essential tier |
| sky | `#95BEFF` | 11.0 | Signature tier |
| yellow | `#FFD600` | 15.0 | focus ring, accents |
| blue | `#065DE7` | 3.9 | **large text / shapes only** (fails AA at 16px) |
| olive | `#817016` | 4.3 | **large text / shapes only** |
| brown | `#7E2D00` (capsules) | 1.9 | shapes only |

## Decisions for the proposal page

- **Font substitute.** Graphik is a commercial typeface (Commercial Type), not on Google Fonts, so it
  can't be linked. Closest free match is **Hanken Grotesk** (Google Fonts): it has the same
  neo-grotesk proportions, a double-storey `a`, flat terminals and a similar x-height. Loaded at 400 (the
  reference's only weight) plus 500 for `<b>` and the wordmark, so table emphasis stays readable.
  Inter, Schibsted Grotesk and Figtree were the runners-up: Inter is wider and more technical.
- **Type scale.** 16px body and 36px headlines (32px on mobile), same as the reference. Two additions
  the long document needs: the hero wordmark and the tier names (Essential / Signature / Flagship) go
  larger (clamp up to 200px / 112px) so the page still has entry points.
- **Line height.** 1.2 for headings like the reference; long lists and tables use 1.4, because 1.2 is
  cramped for multi-line paragraphs.
- **Colour.** Black background, text blocks coloured by column (green / orange / yellow / sky, as in
  their contact footer), tier colours lime / sky / orange, pink for headlines. Blue and olive are used only
  for shapes and large type because they fail WCAG AA at 16px.
- **Header.** The reference has no navigation: it is a single screen. This page is long, so the
  section links sit in a **floating dark pill** (their language-switch style: `rgba(255,255,255,.12)`,
  20px radius, active item filled), which sticks to the top. The wordmark stays a text “LOCO ARTS”
  (no logo artwork, as requested).
- **Brand shapes.** The reference marquee is their logo lettering. It is **not** copied. Instead the
  hero has plain coloured capsules (no counters or letterforms) scrolling in alternating rows, which
  carries the same rhythm without reproducing the logo.
- **Buttons.** Capsule, 999px radius, orange fill with black text (white on orange is only 3.4:1).
- **Motion.** Word-by-word reveal on the hero line and section headings; blocks fade up 10px on
  entering the viewport (IntersectionObserver). `prefers-reduced-motion: reduce` disables the
  marquee and all reveals, and content is visible without JavaScript.
- **Focus.** 2px yellow `#FFD600` outline with 3px offset on every interactive element, plus a
  skip link.

## Update: tier builder + exact LOCO visuals (Nov 2026)

- **Logo**: the LOCO Park SVG is taken as-is from the loco-park.ge DOM (`assets/loco-park-logo.svg`,
  254×68 viewBox, shown at 155px wide, centred, like the original).
- **LOCO marquee**: the three row images are the original Framer assets
  (`framerusercontent.com/images/…png`, 5862×205, ~13 KB each), saved as `assets/loco-row-1..3.png`
  and looped with CSS at 120px row height; the middle row runs in the opposite direction, as on the site.
- **Tier switch**: vertical dark pill top-right with an orange active circle, the same component as
  their En / ქა switch, used for tiers 1 / 2 / 3. No top navigation, no extra header.
- **Font**: still Hanken Grotesk. Graphik Ge is a commercial font licensed for loco-park.ge; it is
  not copied or hot-linked here.
- **Builder data** lives in `data/tiers.js`: rate $30/h, groups with screens, transitions, options per
  tier, hours and monthly services. Tier defaults add up to 400 / 600 / 800 h = $12k / $18k / $24k
  and 49 / 51 / 54 screens. Hours per group are our estimate; the 3D-scene CDN cost ($5–20/mo) is an
  estimate not listed in the original proposal.
