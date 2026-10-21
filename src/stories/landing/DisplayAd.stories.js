// COMPONENTS / Media & Visuals / Display Ad — advertising slot placeholders
// (dotted brand boxes labeled with their dimensions). Sizes are placement-
// specific: 340×215 on the Landing Page; 160×600 / 160×320 / 120×600 in the
// Browse Hotels right-hand rail.
import DisplayAd from '../../components/DisplayAd.vue'

export default {
  title: 'Components/Media & Visuals/Display Ad',
  component: DisplayAd,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'number' },
    height: { control: 'number' },
    label: { control: 'text' },
  },
  parameters: { docs: { description: { component: `
## Overview
An **advertising slot placeholder** — a dotted box in the brand (primary) color
that labels its own dimensions. Sizes are **placement-specific**:

| Size | Used on |
| --- | --- |
| **340×215** | Landing Page (ad row) |
| **160×600** | Browse Hotels — right rail (wide skyscraper) |
| **160×320** | Browse Hotels — right rail (half skyscraper) |
| **120×600** | Browse Hotels — right rail (skyscraper) |

Override \`width\` / \`height\` (the label follows automatically) or set a custom \`label\`.
` } } },
}

const one = (w, h) => () => ({ components: { DisplayAd }, setup: () => ({ w, h }), template: '<display-ad :width="w" :height="h" />' })

/** 340×215 — the Landing Page ad. */
export const Landing = { name: '340×215 (Landing Page)', render: one(340, 215) }

/** 160×600 — Browse Hotels right rail (wide skyscraper). */
export const WideSkyscraper = { name: '160×600', render: one(160, 600) }

/** 160×320 — Browse Hotels right rail (half skyscraper). */
export const HalfSkyscraper = { name: '160×320', render: one(160, 320) }

/** 120×600 — Browse Hotels right rail (skyscraper). */
export const Skyscraper = { name: '120×600', render: one(120, 600) }

/** The Browse Hotels right-rail stack (160×600 · 160×320 · 120×600). */
export const BrowseRail = {
  name: 'Browse Hotels Rail',
  render: () => ({
    components: { DisplayAd },
    template: `<div style="display:flex;flex-direction:column;gap:20px;align-items:center;width:200px">
      <display-ad :width="160" :height="600" />
      <display-ad :width="160" :height="320" />
      <display-ad :width="120" :height="600" />
    </div>`,
  }),
}

/** All ad sizes side by side. */
export const AllSizes = {
  render: () => ({
    components: { DisplayAd },
    template: `<div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
      <display-ad :width="340" :height="215" />
      <display-ad :width="160" :height="600" />
      <display-ad :width="160" :height="320" />
      <display-ad :width="120" :height="600" />
    </div>`,
  }),
}
