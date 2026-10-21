import BrandHero from './BrandHero.vue'
import { sampleProject, SAMPLE_EVENTS } from '../../data/sampleEvents.js'
import { conceptsFor } from '../../stories/_helpers.js'
import { formatDateRange, locationLabel } from '../../models/event.js'

const propsFor = (key, conceptIndex = null, size = 'landing') => {
  const p = sampleProject(key)
  const concepts = conceptsFor(p)
  return {
    concept: conceptIndex === null ? null : concepts[conceptIndex],
    brandKit: p.brandKit,
    headline: p.event.name,
    tagline: p.pages.landing.hero.tagline,
    dates: formatDateRange(p.event.startDate, p.event.endDate),
    location: locationLabel(p.event),
    size,
  }
}

export default {
  title: 'Brand Studio/Creative Concepts/Brand Hero',
  component: BrandHero,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The branded event banner. One centered layout — the Presto hero standard (logo, event name, dates stacked over a full-bleed background, as in presto-2026) — with six background treatments (Signature: photo dim / brand field · Energy: duotone / abstract · Premium: soft focus / brand tint) for any Brand Kit, at three sizes: **landing**, **compact** (the Browse/Details band from the reference screens) and **card** (gallery thumbnails). Artwork is a background layer; logo, headline and dates are live, editable DOM. Heroes carry no call-to-action button (the booking search below is the action).',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['landing', 'compact', 'card'] },
  },
}

export const Default = { args: propsFor('heartland', 2) }

export const NoConceptYet = {
  name: 'No concept yet (Brand Kit fallback)',
  args: propsFor('heartland', null),
}

const LAYOUT_NAMES = ['Signature · Presto Banner', 'Signature · Brand Field', 'Energy · Duotone Photo', 'Energy · Abstract Brand Art', 'Premium · Soft Focus', 'Premium · Brand Tint']

export const AllLayouts = {
  name: 'All six treatments (centered)',
  render: () => ({
    components: { BrandHero },
    setup: () => ({ items: LAYOUT_NAMES.map((name, i) => ({ name, props: propsFor('heartland', i) })) }),
    template: `<div style="display:grid;gap:24px;padding:24px;background:#F6F7FA">
      <div v-for="it in items" :key="it.name">
        <p class="bs-eyebrow" style="margin-bottom:8px">{{ it.name }}</p>
        <brand-hero v-bind="it.props" />
      </div>
    </div>`,
  }),
}

export const CompactBands = {
  name: 'Compact band (Browse / Details)',
  render: () => ({
    components: { BrandHero },
    setup: () => ({ items: LAYOUT_NAMES.map((name, i) => ({ name, props: propsFor('heartland', i, 'compact') })) }),
    template: `<div style="display:grid;gap:16px;padding:24px;background:#F6F7FA">
      <brand-hero v-for="it in items" :key="it.name" v-bind="it.props" :heading-level="2" />
    </div>`,
  }),
}

export const AcrossEvents = {
  name: 'Same layout, four brand kits',
  render: () => ({
    components: { BrandHero },
    setup: () => ({ items: SAMPLE_EVENTS.map((e, i) => ({ key: e.key, props: propsFor(e.key, [2, 0, 4, 3][i]) })) }),
    template: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:20px;padding:24px;background:#F6F7FA">
      <brand-hero v-for="it in items" :key="it.key" v-bind="it.props" size="card" />
    </div>`,
  }),
}

export const Mobile = {
  args: propsFor('heartland', 3),
  globals: { viewport: { value: 'mobile' } },
}
