import BrandedBrowse from '../preview/BrandedBrowse.vue'
import { previewProject } from '../preview/previewFixtures.js'

// Recreates references/102126 Screen.png → Screen-3.png on the real Browse page.
export default {
  title: 'Brand Studio/Advertising/Browse Layouts',
  component: BrandedBrowse,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Browse Hotels ad presets (`AD_LAYOUT_PRESETS.browse`) on the real Presto HotelListPage. Empty slots render the dimension-labelled placeholder; filled slots rotate the project’s sponsors. The rail hides below 1200px and billboards swap to a 320×100 unit on phones, so ads never crowd results.',
      },
    },
  },
}

export const Rail160 = {
  name: 'Right rail 160×600 ×2 (Screen)',
  args: { project: previewProject('heartland', { browse: 'rail-160', filled: false }) },
}
export const Rail120 = {
  name: 'Right rail 120×600 ×2 (Screen-1)',
  args: { project: previewProject('heartland', { browse: 'rail-120', filled: false }) },
}
export const BillboardsRail = {
  name: 'Billboards 970×250 + rail ×3 (Screen-2)',
  args: { project: previewProject('heartland', { browse: 'billboards-rail' }) },
}
export const LeaderboardsRail = {
  name: 'Leaderboards 970×90 + rail ×3 (Screen-3)',
  args: { project: previewProject('heartland', { browse: 'leaderboards-rail' }) },
}
export const Mobile = {
  name: 'Mobile (billboards → 320×100, rail hidden)',
  args: { project: previewProject('heartland', { browse: 'billboards-rail' }) },
  globals: { viewport: { value: 'mobile' } },
}
