# Presto Brand Studio

A self-service lead-generation tool for **EventPipe**. Event organizers enter their event and branding, get AI-assisted creative concepts, and customize a realistic, branded **Presto** hotel booking page. They can then publish it as a shareable demo.

> Brand Studio is a **demo and sales tool, not a booking engine.** Live hotel inventory (Expedia), real rates, payments and reservations are out of scope. Hotel data is mock data from the Presto prototype.

Built with **Vue 3 + Quasar 2 + Vite + Pinia**, documented in **Storybook 10.6.3**. It reuses the Presto design system from [`epprestodesign/presto-2026`](https://github.com/epprestodesign/presto-2026), copied into this repo as a snapshot (see [`UPSTREAM.md`](UPSTREAM.md)).

## Links

| | Live (GitHub Pages) | Local |
|---|---|---|
| Storybook | https://epprestodesign.github.io/presto-higgsfield/ | http://localhost:6006 (`pnpm storybook`) |
| Mobile prototype | https://epprestodesign.github.io/presto-higgsfield/prototype/ | http://localhost:6210 (`pnpm prototype`) |

The **prototype** is the whole journey as a phone-first app: marketing → event intake → brand discovery → AI concepts → studio editor → publish → published demo. Tap-to-fill (top bar) fills any empty field with sample data, and Skip jumps a step, so you can walk it without typing.

## Run it locally

```bash
pnpm install
pnpm storybook        # http://localhost:6006
pnpm prototype        # http://localhost:6210 (also reachable from your phone on the same Wi-Fi)
pnpm test             # Vitest unit tests (models, theme engine, AI provider, stores)
pnpm test-stories     # renders every Brand Studio story + runs play functions (Storybook must be running)
```

`node scripts/run-stories.mjs '*'` runs every story in the repo, including the Presto library. `pnpm test-storybook` (the official test runner) is currently broken under Node 25 and Jest 30, so `test-stories` is the stand-in.

Optional `.env` (gitignored; see `.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_IMAGERY_URL` | Hosted Presto hotel imagery (public). Unset → local fallback set. |
| `VITE_GOOGLE_MAPS_API_KEY` | Hotel map. Unset → map placeholder. |
| `VITE_AI_PROVIDER` / `VITE_AI_API_BASE` | Phase 3: real AI generation through the EventPipe backend. Unset → demo generator. **Never put vendor API keys here.** |

## What's where

```
brand-studio/src/     Brand Studio: models, theme engine, AI providers, stores, screens (see docs/BRAND_STUDIO_AUDIT.md)
src/                  Presto design system snapshot (additive patches only, logged in UPSTREAM.md)
docs/                 Repository audit, architecture, data model, Supabase plan, risks
.storybook/           Storybook config: "Brand Studio" first, then the full Presto library
```

In Storybook:

- **Brand Studio / Overview** explains the product, the journey and the status of each screen.
- **Brand Studio / Architecture & Audit** covers reuse, wrappers, structure, routes, data models and risks.
- **Brand Studio / Flows** walks through the end-to-end journey.
- Everything below Brand Studio is the unchanged Presto design system.

## Phases

1. **Architecture + functional prototype** (this branch): GUI for every screen in Storybook, the mobile prototype, mock AI, mock auth, local drafts.
2. Accounts + persistence: Supabase Auth (email/password + Google), projects table + RLS, Storage uploads, dashboard data.
3. AI integration: server-side website brand discovery, Higgsfield / Recraft / Ideogram through a secure backend, async jobs, history, quotas.
4. Publishing: hosted demos at `/p/:slug`, slug management, analytics and lead tracking.
