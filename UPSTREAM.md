# Upstream: Presto design system

`src/`, `background-img/`, `creditCards/`, `.storybook/` and `scripts/` are a snapshot of
[`epprestodesign/presto-2026`](https://github.com/epprestodesign/presto-2026).

| | |
|---|---|
| Upstream commit | `2745cb797178dce80b9eb86ef9207c151c4b3676` (main, PR #43) |
| Snapshot date | 2026-10-21 |
| Mock data copied | `prototype/src/hotels.js`, `prototype/src/fixtures.js` → `brand-studio/src/data/upstream/` |

Not copied: the prototypes (`prototype*/`), Netlify config, GitHub workflows, docs, references,
the design doc, and `.env` (secrets stay out of this repo).

## Rules

- Brand Studio code lives in `brand-studio/` and imports the library through the `@lib` alias.
- Changes to `src/` must be **additive and backward-compatible** (new optional props / slots),
  so every upstream story still renders unchanged. Each one is listed below so it can be
  upstreamed to presto-2026 or re-applied after a re-sync.

## Local patches to `src/`

| File | Change | Why |
|---|---|---|
| `src/components/GlobalNav.vue` | Optional `logo` prop (image URL; `brand` becomes its alt text). | Show the organizer's logo in the booking-site nav. |
| `src/components/PageFrame.vue` | Optional `logo` prop, passed to GlobalNav. | Same, for Browse / Details / Checkout / Confirmation. |
| `src/components/LandingPage.vue` | Optional `logo`, `sectionOrder`, `hiddenSections` props; `hero` and `ads` slots. Default order reproduces the original DOM exactly. | Studio section visibility / reordering; branded hero; sponsor ads. |
| `src/components/browse/HotelListPage.vue` | Optional `eventName`, `eventDates`, `searchLocation`, `searchDates`, `cardCtaLabel`, `railWidth` props; `hero`, `results-top`, `results-bottom`, `rail` slots (existing `adSize` still works). | Branded hero, editable card CTA, billboard / leaderboard / multi-skyscraper ad layouts (references/102126 Screen–Screen-3). |
| `src/components/BookingWidget.vue` | Optional injected default date range (`inject('presto:defaultDateRange')`, `{ from, to }` in YYYY/MM/DD). Without a provider it keeps today + 7 → + 10. | Branded event pages open the search on the event's own dates. |
| `src/components/details/HotelDetailPage.vue` | Optional `railWidth` prop; `after-rooms`, `bottom`, `rail` slots. Amenities + Policies sit in a wrapper that is `display: contents` unless a rail is passed (pixel-identical default). | Details ad layouts (references/102126 Screen-4 – Screen-7). |
| `src/stories/Introduction.mdx` | Docs only: a Brand Studio callout linking the desktop + mobile prototypes. | Point visitors of the Presto intro at Brand Studio. |

Verified 2026-10-21: DOM snapshots of 13 existing Presto stories (Landing, Browse, Details, Page Frame, Global Nav,
desktop + mobile) are byte-identical before/after, except HotelDetailPage's two `display: contents` wrappers, whose
screenshots are pixel-identical.
