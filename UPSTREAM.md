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
| _(none yet)_ | | |
