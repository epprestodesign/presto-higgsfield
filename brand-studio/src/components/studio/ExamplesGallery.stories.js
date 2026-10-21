import ExamplesGallery from './ExamplesGallery.vue'
import BrandHero from '../brand/BrandHero.vue'
import { withProject } from '../../stories/_helpers.js'
import { VERTICAL_EXAMPLES } from '../../data/verticals/index.js'
import { sampleProject } from '../../data/sampleEvents.js'
import { formatDateRange, locationLabel } from '../../models/event.js'

export default {
  title: 'Brand Studio/Verticals',
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'One complete example booking page per industry vertical (`data/verticals/catalog.js`), with logos and banners generated through the Higgsfield API under the Presto banner rules. In the Studio, **Examples** in the toolbar opens this gallery and loads the pick.' } },
  },
  decorators: [withProject({ sample: 'heartland' })],
  argTypes: { onSelect: { action: 'select' } },
}

export const Gallery = {
  render: (args) => ({ components: { ExamplesGallery }, setup: () => ({ args }), template: '<examples-gallery inline @select="args.onSelect" />' }),
}

export const GalleryMobile = { ...Gallery, name: 'Gallery · Mobile', globals: { viewport: { value: 'mobile' } } }

// Every vertical's landing hero at full size, for reviewing the generated art.
export const AllHeroes = {
  name: 'All heroes',
  render: () => ({
    components: { BrandHero },
    setup: () => ({
      items: VERTICAL_EXAMPLES.map((v) => {
        const p = sampleProject(v.sampleKey)
        return { id: v.id, label: v.label, hero: { brandKit: p.brandKit, headline: p.event.name, tagline: p.pages.landing.hero.tagline, dates: formatDateRange(p.event.startDate, p.event.endDate), location: locationLabel(p.event) } }
      }),
    }),
    template: `<div style="display:grid;gap:28px;padding:24px;background:var(--bs-canvas)">
      <div v-for="it in items" :key="it.id"><p class="bs-eyebrow" style="margin-bottom:8px">{{ it.label }}</p><brand-hero v-bind="it.hero" :heading-level="2" /></div>
    </div>`,
  }),
}
