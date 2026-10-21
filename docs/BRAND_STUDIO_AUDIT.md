# Presto Brand Studio: repository audit and architecture

_Audited: `epprestodesign/presto-2026` @ `2745cb7` (main, 2026-10-21). Stack: Vue 3.5, Quasar 2, Vite 6, pnpm, Storybook 10.6.3 (upgraded from 10.4.6)._

Brand Studio is a self-service lead-generation app. Event organizers enter their event and branding, choose AI-assisted creative concepts, and customize a realistic Presto booking page. It is **not** a booking engine. Live inventory, Expedia, rates, payments and reservations are out of scope.

> **Repository decision.** `presto-higgsfield` is a separate repo, so the Presto design system is **vendored** as a snapshot (`src/`, see `UPSTREAM.md`) and Brand Studio lives in `brand-studio/`. The library is reused, not rebuilt. Changes to `src/` are additive, backward-compatible and logged so they can be upstreamed to presto-2026.

---

## 1. Reusable unchanged

| Area | What | Notes |
|---|---|---|
| Tokens & theme | `src/css/*` (palette → semantic → utilities), `quasar.variables.scss`, typography, motion, radius, elevation | Every component reads `--ds-color-*` + `--q-*`, so the Brand theme engine re-skins them without edits. |
| Primitives | `DsCard`, `DsModal`, `DsSidePanel`, `DsAccordion`, `DsChoiceChips`, `DsRange`, `DsRating`, `DsEmptyState`, `QuantityStepper`, Quasar form controls (themed globally) | Used directly inside Studio panels and previews. |
| Booking UI | `BookingWidget`, `GlobalNav`, `PageFrame`, `HotelCardGroup` / `HotelCardReserve` / `HotelCardHorizontal`, `FilterRail`, `ResultsToolbar`, `SortDropdown`, `SearchSummaryBar`, `GalleryHero`, `DetailTabs`, `HotelSummaryHeader`, `RoomsCarousel`, room cards, `AboutProperty`, `AmenitiesSection`, `PoliciesSection` | Rendered as-is inside `BrandThemeProvider`. |
| Simulated end of funnel | `CheckoutPage`, `ConfirmationPage` | Shown only as an opt-in "simulated" page, with payment neutralised. |
| Data & libs | `lib/amenities.js`, `lib/imagery.js` (+ hosted imagery repo), `lib/paymentLogos.js`, prototype `hotels.js` (60 hotels) + `fixtures.js` | Copied to `brand-studio/src/data/upstream/`. |
| Maps | `HotelMap` | Renders a placeholder without `VITE_GOOGLE_MAPS_API_KEY`. |

## 2. Needs a wrapper or extension

| Component | Gap | Approach |
|---|---|---|
| `LandingPage.vue` | Hero is hard-wired to the default photo + EventPipe logo; fixed section order; always 3 placeholder ads | Additive `hero` / `ads` slots + optional section order/visibility props; `BrandedLanding` fills them from the project. |
| `browse/HotelListPage.vue` | Event name, dates, search location and hero are constants; only one right-rail ad (`adSize`) | Optional `eventName` / `eventDates` / `searchLocation` props; `hero`, `results-top`, `results-bottom`, `rail` slots. |
| `details/HotelDetailPage.vue` | No ad placements | `after-rooms`, `bottom`, `rail` slots (sticky rail beside About / Amenities / Policies, per reference screens). |
| `GlobalNav.vue` | Text-only brand | Optional logo support. |
| `BookingWidget.vue` | Dates always default to today + 7 | Optional injected default range so event pages open on the event's dates. |
| `DisplayAd.vue` | Dashed placeholder only | Kept for placeholders; real sponsor rendering is `ads/AdCreative.vue` (artwork or HTML creative, always labelled "Sponsored"). |
| Quasar portals | `QDialog` / `QMenu` teleport to `<body>`, outside the scoped brand theme | Previews run in an iframe whose document root receives the brand vars; inline previews accept the limitation (dialogs fall back to Presto navy). |
| Responsive previews | Presto switches layouts via `@media` + `$q.screen` (window width) | Studio preview renders in an `<iframe>` (Preview Host) so mobile is a real 390px window. |

_The exact list of applied patches is maintained in `UPSTREAM.md`._

## 3. Architecture and folder structure

```
presto-higgsfield/
├─ src/                      Presto design system (vendored snapshot, additive patches only)
├─ brand-studio/
│  └─ src/
│     ├─ models/             project, event, brandKit, pageConfig, ads, content, ids — plain JSON + validation
│     ├─ theme/              brandTheme (kit → CSS vars), color (WCAG math), fonts, BrandThemeProvider.vue
│     ├─ providers/ai/       provider contract, mock provider, remote adapter (Higgsfield / Recraft / Ideogram via backend)
│     ├─ stores/             Pinia: project, generation (jobs + usage), session (auth), persistence adapters
│     ├─ preview/            iframe live-preview bridge (postMessage)
│     ├─ data/               sample events, sponsors, upstream mock hotels
│     ├─ assets/             Unsplash-licensed imagery (+ credits), fictional event & sponsor logos
│     ├─ styles/studio.scss  Studio chrome tokens (--bs-*) built on Presto tokens
│     ├─ components/
│     │  ├─ brand/           BrandHero (6 concept layouts × 3 sizes)
│     │  ├─ marketing/       marketing landing page + sections
│     │  ├─ intake/          guided event intake wizard, AssetDropzone
│     │  ├─ brand-kit/       brand discovery / brand kit editor, mock website extractor
│     │  ├─ concepts/        directions, concept gallery, compare, preview
│     │  ├─ studio/          editor shell, toolbar, panels, DevicePreview
│     │  ├─ preview/         Branded{Landing,Browse,Details,Checkout,Confirmation}, BrandedSite, PreviewHost
│     │  ├─ ads/             AdCreative, AdSlot, SponsorEditor
│     │  ├─ account/         SignUpDialog, SaveGate, ProjectDashboard
│     │  └─ publish/         PublishFlow, PublishChecklist, PublishedDemoPage, DemoBanner
│     ├─ flows/              FlowApp (end-to-end journey) + demo tap-to-fill
│     ├─ foundations/        Theme engine demo, Typeface Tester
│     ├─ docs/               Storybook MDX
│     └─ tests/              Vitest unit tests (models, theme, provider, stores)
│  └─ app/                   Standalone mobile prototype (Vite): FlowApp + ?bsPreview=1 preview host
├─ docs/                     this audit
└─ .storybook/               Storybook 10.6.3 (Brand Studio first, then Presto)
```

Principles:

- **Branding is separate from page config.** `project.brandKit` defines how the pages look. `project.pages` and `project.ads` define what they say and show. One Brand Kit edit re-themes every page at once.
- **The AI only makes artwork.** Logos, headlines and dates are live DOM layered over generated backgrounds (heroes have no CTA button; the booking search below is the action) (`BrandHero`, `AdCreative`). Prompts always say "no text, no logos".
- **No secrets in the browser.** Remote AI providers call an EventPipe backend (`VITE_AI_API_BASE`), which holds vendor keys, enforces quotas and stores jobs.
- **Everything is serializable.** A project is one versioned JSON document (`schemaVersion`), ready for a Supabase `jsonb` column.

## 4. Routes, screens and key components (app shell, Phase 1 → 2)

| Route | Screen | Key components | Auth |
|---|---|---|---|
| `/` | Marketing landing | `MarketingLanding` + sections, `LeadCapture` | — |
| `/start` | Event intake | `IntakeWizard`, `AssetDropzone` | visitor |
| `/brand` | Brand discovery | `BrandDiscovery`, `mockBrandExtractor` | visitor |
| `/concepts` | Creative concepts | `ConceptStudio`, `ConceptCard`, `ConceptCompare`, `ConceptPreviewDialog` | visitor (usage-limited) |
| `/studio/:projectId?` | Page customization studio | `StudioEditor`, `StudioToolbar`, `StudioSidebar` panels, `DevicePreview` | visitor; save requires account |
| `/publish/:projectId` | Publishing | `PublishFlow`, `PublishChecklist`, `SignUpDialog` | account |
| `/dashboard` | My booking pages | `ProjectDashboard`, `ProjectCard` | account |
| `/login` | Sign in / sign up | `SignUpDialog` (page variant) | — |
| `/p/:slug` | Published demo | `PublishedDemoPage`, `DemoBanner`, `BrandedSite` | public, `noindex` |
| `/preview` | Iframe preview host | `PreviewHost`, `BrandedSite` | same-origin only |

In Storybook every screen is a story under **Brand Studio/…**, and **Brand Studio/Flows** stitches them together.

## 5. State and data models

**Client (Pinia).**

- `useProjectStore`: the project document and every edit action. It autosaves visitor drafts to `localStorage` and derives the publishing checklist and status.
- `useGenerationStore`: the active job, history and usage meter. It runs jobs through the provider contract.
- `useSessionStore`: mock auth. Sign-up claims the anonymous draft, so no progress is lost.

**Project document** (`models/project.js`): `event`, `organizer`, `brandKit` (logo, colors, typography, imagery, hero, direction, keywords), `concepts` (items, selected, favorites, compare), `pages` (landing hero + ordered sections, browse, details, checkout, confirmation), `ads` (sponsors, per-page presets + placements), `publishing` (slug, reviewed, disclaimer, published URL), `status` (draft → ready → published).

**Proposed Supabase schema (Phase 2).**

| Table | Key columns | RLS |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), name, organization | owner read/write |
| `projects` | `id`, `owner_id`, `status`, `slug` (unique), `doc` jsonb, `schema_version`, timestamps, `published_at` | owner CRUD; public read of `published` rows only through a `published_demos` view keyed by slug |
| `brand_assets` | `id`, `project_id`, `kind`, `storage_path`, `mime`, `bytes`, `credit` | via project ownership; Storage bucket `brand-assets/{owner_id}/{project_id}/…` with matching policies, type/size limits |
| `generation_jobs` | `id`, `project_id`, `owner_id`, `provider`, `model`, `kind`, `status`, `request` jsonb, `results` jsonb, `cost`, `error`, timestamps | owner read; inserts only via the backend (service role) |
| `usage_counters` | `owner_id` or anonymous fingerprint, `period`, `count`, `limit` | backend only |
| `leads` | `email`, `name`, `event_name`, `category`, `source`, `consent`, `utm` jsonb, `created_at` | anonymous insert-only; staff read |

## 6. Implementation sequence and technical risks

**Sequence.**

1. Foundation: models, theme engine, provider contract, stores, sample data. ✅
2. Screen GUIs in Storybook: marketing → intake → brand → concepts → studio → ads → accounts → publishing. ✅ (this branch)
3. End-to-end flow (Storybook + standalone mobile prototype), tests. ✅
4. Production app shell: swap the prototype's hash routing for Vue Router, add the real `/p/:slug` and `/preview` routes.
5. Supabase auth, persistence adapter, storage, dashboard data (Phase 2).
6. Backend for AI jobs + website brand extraction, quotas, history (Phase 3).
7. Published demos, slugs, analytics, lead tracking (Phase 4).

**Risks and mitigations.**

| Risk | Mitigation |
|---|---|
| Vendored design system drifts from presto-2026 | Additive patches only, logged in `UPSTREAM.md`; upstream them or re-apply on re-sync. |
| Quasar portals escape the scoped theme | Iframe previews; documented fallback for inline use. |
| Presto pages contain hard-coded copy/data (e.g. Kansas City hotels) | Sample events chosen to match the mock hotel data; additive props for event name/location. |
| Light or low-contrast brand colors | `ensureContrast` keeps brand text ≥ 4.5:1; Brand Kit shows live WCAG checks. |
| Website brand extraction = SSRF / scraping risk | Server-side only, https + public hosts only (raw IPs, localhost and non-http schemes rejected client and server side), explicit user approval before applying anything. |
| AI cost abuse | Server-side quotas per account / anonymous fingerprint, visitor limit before sign-up, cancelable jobs, cost recorded per job. |
| Generated art containing text, logos or likenesses | Background-only prompts, negative prompts, human selection; artwork stays separate from editable text. |
| Asset licensing | Sample imagery is Unsplash-licensed with credits; organizer uploads require a rights confirmation (Phase 2); fictional sample brands only. |
| Demos mistaken for live booking | Persistent demo banner, simulated checkout with payment disabled, checklist disclaimer, `noindex` on published demos. |
| Media-query layouts in previews | Iframe preview host gives a real viewport. |
| Google Maps key | Map degrades to a placeholder without a key; never committed. |
