import { expect, userEvent, within, waitFor } from 'storybook/test'
import LabStudioApp from './LabStudioApp.vue'
import campsRaw from '../../assets/logos/uploads/camps.png'
import ref1 from '../../assets/imagery/generated/heartland-photo.jpg'
import ref2 from '../../assets/imagery/generated/heartland-photo2.jpg'

export default {
  title: 'Banner Lab/Studio concept',
  component: LabStudioApp,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'A Stitch-style concept for Banner Lab, in two experiences.',
          '',
          '**Experience 1 · Home**: the record of projects on the left (logo extractions, Presto banners, or both; mine or shared; searchable). In the middle, a composer: attach a logo and reference images, switch **Banners | Logo**, optimize the prompt, and pick a model. **Auto** is the default and says which model it would use and why.',
          '',
          '**Experience 2 · Project**: the agent on the left builds the project step by step. The canvas holds the brand kit, every banner at both Presto crops (scored against the standard), and the real Presto landing page mocked up on desktop and phone. Follow-ups go in the bottom prompt bar. **▶ Preview** opens the Presto pages (landing, hotel listings, hotel details; desktop or phone; any banner), and **Export** downloads the logo and banners from that modal.',
          '',
          'Concept data: projects are seeded from the Brand Studio examples and the agent is simulated, so no credits are spent.',
        ].join('\n'),
      },
    },
  },
}

const story = (name, args = {}) => ({ name, args, render: (a) => ({ components: { LabStudioApp }, setup: () => ({ a }), template: '<lab-studio-app v-bind="a" :key="JSON.stringify(a).length" />' }) })

// ── Experience 1 · Home ──────────────────────────────────────────────────
export const Home = story('1 · Home')
export const HomeModelMenu = story('1 · Home · Model menu (Auto + best for)', {
  homeText: 'Lakeside summer camp at golden hour, pine trees and canoes at the edges', modelMenuOpen: true,
})
export const HomeAttachments = story('1 · Home · Logo + references attached', {
  homeText: 'A floodlit soccer stadium at night in deep blue, lights from the right',
  homeLogo: { src: campsRaw, name: 'Camp Pinecrest' },
  homeReferences: [{ src: ref1, name: 'stadium-night.jpg' }, { src: ref2, name: 'stadium-dusk.jpg' }],
})
export const HomeLogoMode = story('1 · Home · Logo mode', { homeMode: 'logo', homeLogo: { src: campsRaw, name: 'Camp Pinecrest' } })

// ── Experience 2 · Project ───────────────────────────────────────────────
export const ProjectBuilding = story('2 · Project · Building', {
  buildDemo: { prompt: 'Floodlit soccer stadium at night for a youth tournament', mode: 'banner' }, stepMs: 2500,
})
export const ProjectCanvas = story('2 · Project · Canvas', { initialProjectId: 'lab-camps' })
export const ProjectSetHistory = story('2 · Project · Banner sets (history)', { initialProjectId: 'lab-heartland' })
export const ProjectLogoOnly = story('2 · Project · Logo clean-up', { initialProjectId: 'lab-commencement' })
export const ProjectLogoBlack = story('2 · Project · Logo clean-up · black logo', { initialProjectId: 'lab-construction' })
export const ProjectPreview = story('2 · Project · Presto preview', { initialProjectId: 'lab-heartland', previewOpen: true })
export const ProjectDetailsPhone = story('2 · Project · Preview · Hotel details on phone', { initialProjectId: 'lab-camps', previewOpen: true, previewPage: 'details', previewDevice: 'phone' })
export const ProjectDetailsDesktop = story('2 · Project · Preview · Hotel details on desktop', { initialProjectId: 'lab-camps', previewOpen: true, previewPage: 'details', previewDevice: 'desktop' })
export const ProjectTutorial = story('2 · Project · Quick tour (help)', { initialProjectId: 'lab-camps', tutorialOpen: true })
export const ProjectExport = story('2 · Project · Preview + export', { initialProjectId: 'lab-camps', exportOpen: true })
export const ProjectPageText = story('2 · Project · Page text (click a mockup)', { initialProjectId: 'lab-heartland', copyOpen: true })
/** Click the landing mockup → the Page text dialog → change the headline, hide the tagline → the mockups follow. */
export const ProjectPageTextFlow = {
  ...story('2 · Project · Page text · click → edit → save', { initialProjectId: 'lab-camps' }),
  play: async ({ canvasElement }) => {
    const page = within(document.body)
    const frame = await waitFor(() => {
      const el = canvasElement.querySelector('.ws__art--desktop .ws__shield')
      if (!el) throw new Error('no landing mockup yet')
      return el
    }, { timeout: 8000 })
    await userEvent.click(frame)
    const dialog = await page.findByRole('document', { name: 'Page text' }, { timeout: 3000 })
    const box = within(dialog)
    const headline = dialog.querySelector('[data-line="headline"]')
    await userEvent.clear(headline)
    await userEvent.type(headline, 'Summer Camps 2027')
    await userEvent.click(box.getByRole('switch', { name: 'Show the second subheadline' }))
    // The live preview follows the draft.
    await waitFor(() => expect(dialog.querySelector('.pc__hero .bh__headline').textContent).toBe('Summer Camps 2027'))
    await expect(dialog.querySelector('.pc__hero .bh__tagline')).toBeNull()
    await userEvent.click(box.getByRole('button', { name: 'Save' }))
    // …and so do the mockups on the canvas.
    await waitFor(() => expect(canvasElement.querySelector('.ws__art--desktop .bh__headline').textContent).toBe('Summer Camps 2027'), { timeout: 3000 })
    await expect(canvasElement.querySelector('.ws__art--desktop .bh__tagline')).toBeNull()
  },
}

// ── End to end ───────────────────────────────────────────────────────────
export const FullFlow = story('Full flow (click through, from log-in)', { requireAuth: true })
