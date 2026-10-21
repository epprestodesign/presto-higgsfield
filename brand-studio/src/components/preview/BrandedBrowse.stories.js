import BrandedBrowse from './BrandedBrowse.vue'
import { previewProject } from './previewFixtures.js'

export default {
  title: 'Brand Studio/Branded Preview/Browse Hotels',
  component: BrandedBrowse,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The real Presto **HotelListPage** (filters, sort, map, result states) in the organizer’s branding, under the compact BrandHero band, with the Browse ad slots (`browse.top`, `browse.rail`, `browse.bottom`).',
      },
    },
  },
}

export const Heartland = { name: 'Sports · Heartland Cup', args: { project: previewProject('heartland') } }
export const Fintech = { name: 'Conference · Fintech Forward', args: { project: previewProject('fintech', { browse: 'leaderboards-rail' }) } }
export const Wedding = { name: 'Wedding · no ads', args: { project: previewProject('wedding', { ads: false }) } }
export const CustomCta = {
  name: 'Custom card CTA',
  args: { project: previewProject('lakeshore', { mutate: (p) => { p.pages.browse.cardCta = 'See race-week rates' } }) },
}
export const Loading = {
  name: 'Results loading',
  args: { project: previewProject('heartland', { mutate: (p) => { p.pages.browse.resultsState = 'loading' } }) },
}
export const Mobile = {
  args: { project: previewProject('heartland', { browse: 'billboards-rail' }) },
  globals: { viewport: { value: 'mobile' } },
}
