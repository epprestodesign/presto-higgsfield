import BrandedLanding from './BrandedLanding.vue'
import { previewProject } from './previewFixtures.js'

export default {
  title: 'Brand Studio/Branded Preview/Landing',
  component: BrandedLanding,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The real Presto **LandingPage**, re-skinned by the Brand Kit (BrandThemeProvider), with the selected concept as a **BrandHero**, the Studio’s section order / visibility / copy, and sponsor ads in the `landing.afterContent` slot. One Brand Kit → every page.',
      },
    },
  },
}

export const Heartland = { name: 'Sports · Heartland Cup', args: { project: previewProject('heartland') } }
export const Fintech = { name: 'Conference · Fintech Forward', args: { project: previewProject('fintech', { landing: 'billboard' }) } }
export const Wedding = { name: 'Wedding · Alvarez & Chen', args: { project: previewProject('wedding', { ads: false }) } }
export const Lakeshore = { name: 'Race · Lakeshore Half', args: { project: previewProject('lakeshore') } }

export const NoConcept = {
  name: 'No concept selected (Brand Kit fallback)',
  args: { project: previewProject('heartland', { concept: null }) },
}

export const SectionsReordered = {
  name: 'Sections hidden + reordered',
  args: {
    project: previewProject('fintech', {
      mutate: (p) => {
        const l = p.pages.landing
        l.sectionOrder = ['widget', 'eventInfo', 'intro', 'ads', 'benefits', 'attending', 'closing']
        l.sections.attending.visible = false
        l.sections.closing.visible = false
        l.hero.tagline = 'Three days of fintech, one block of hotels.'
        l.hero.ctaLabel = 'Reserve your room'
      },
    }),
  },
}

export const Mobile = {
  args: { project: previewProject('heartland') },
  globals: { viewport: { value: 'mobile' } },
}
