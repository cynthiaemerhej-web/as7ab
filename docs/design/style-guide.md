# As7ab visual style guide

A short reference so anyone touching the site keeps the same look. The live
site uses these exact values (see `app/globals.css`).

## Personality

Warm, neighbourly, trustworthy. Think a friendly local noticeboard, not a
corporate marketplace. Big photos, clear buttons, no clutter. Mobile first:
most people arrive from a WhatsApp link on a phone.

## Colour

| Token | Hex | Use |
|-------|-----|-----|
| Primary (terracotta) | `#D96C47` | Main buttons, "Goods" badge, logo mark, highlights |
| Primary dark | `#B8532F` | Button hover, error text |
| Accent (deep teal) | `#1F6F78` | Secondary buttons, links, "Service" badge, category icons, logo mark |
| Accent dark | `#16555C` | Accent hover |
| Surface (warm off‑white) | `#FAF7F2` | Page background |
| Card | `#FFFFFF` | Cards, inputs, top bar |
| Ink | `#1E1E1E` | Body text |
| Muted | `#6B6560` | Secondary text, labels |
| Line | `#E8E1D8` | Borders, dividers |
| WhatsApp green | `#25D366` | The WhatsApp button only |
| Success / Warning / Danger | Tailwind emerald‑100/800, amber‑100/800, rose‑100/800 | Status badges |

Contrast: primary and accent on white both pass WCAG AA for normal text.
Never put text in primary on the teal accent or vice versa.

## Type

Font: **Plus Jakarta Sans** (Google Fonts), system‑ui fallback.

| Role | Size / line | Weight |
|------|-------------|--------|
| Display (home headline) | 32–40 px / 1.1 | 800 |
| H1 | 28 px / 1.2 | 700 |
| H2 | 22 px / 1.3 | 700 |
| Body | 16 px / 1.6 | 400 |
| Small / meta | 14 px | 400–500 |
| Badge | 12 px, uppercase optional | 600 |

Sentence case everywhere ("Post a listing", not "Post A Listing").

## Spacing, shape, elevation

- 4‑pt grid. Common gaps: 8, 12, 16, 24, 32, 40 px.
- Corner radius 12 px on cards, inputs and buttons (`--radius-card`). Pills
  (badges, tiny buttons) are fully rounded.
- Shadow: `0 1px 2px rgba(30,30,30,.04), 0 6px 20px rgba(30,30,30,.06)` plus a
  1 px hairline ring in Line colour. Cards lift 2 px on hover.
- Page gutter 16 px on phones; content max width 1152 px.

## Buttons

| Variant | Style | Used for |
|---------|-------|----------|
| Primary | Terracotta fill, white text | Post a listing, Save, Search |
| Accent | Teal fill, white text | Email, admin confirmations |
| Secondary | White fill, Line border | Cancel, filters, Edit |
| WhatsApp | WhatsApp green fill | WhatsApp only |
| Danger | Rose text on white, rose hover | Delete, Reject |

Minimum height 44 px (thumb‑friendly), 48 px for the main form submit.

## Listing card anatomy

Square photo (or a soft placeholder with a picture icon) with the type badge
in the top‑left corner, then: category in accent (12 px), title (16 px, max
two lines), area with a pin icon (12 px, muted). 2 columns on phones, 3 on
tablets, 4 on desktop.

## Ad slots

| Slot | Where | Size |
|------|-------|------|
| Home banner | Under the home search | 970×250 desktop · 360×120 mobile |
| Sidebar | Right column (desktop), between sections (mobile) | 300×250 |
| In results | Card after every 8th listing | 600×600 square |
| Under listing | Below contact buttons | 728×90 desktop · 360×120 mobile |

Every ad carries a small "Ad" label. Empty slots show a dashed
"Advertise here" box that links to `/advertise`.

## Logo

Wordmark "As7ab" in Plus Jakarta Sans 800 with the mark: two overlapping
circles (terracotta and teal, two friends) and a small surface‑coloured dot
where they meet. Files: `public/logo.svg`, `public/favicon.svg`. Keep clear
space equal to the mark's radius; don't recolour or stretch.

## Do / don't

- Do keep one primary button per view.
- Do show only the contact methods a member filled in.
- Don't use pure black or pure grey backgrounds; keep the warm surface.
- Don't add stock photography; real member photos carry the site.
- Don't introduce a third brand colour.
