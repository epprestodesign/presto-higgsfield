import { expect, within, waitFor } from 'storybook/test'
import ExportDialog from './ExportDialog.vue'
import { previewProject } from '../preview/previewFixtures.js'

export default {
  title: 'Brand Studio/Studio Editor/Export',
  component: ExportDialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      // Full-height sheet with a sticky footer — give each docs story its own iframe.
      story: { inline: false, height: '900px' },
      description: {
        component:
          'The Studio **Export** action (toolbar → Export). A preview sheet renders every file at its real pixel size before anything is zipped: upload-ready **Presto banner backgrounds** (homepage hero 1440×400, hotel directory + details band 1440×240, no text, since Presto renders logo and copy live), the same **banners with logo + copy** for sign-off, every **sponsor display ad** at each size it is placed (plus the 320×100 mobile fallback), and the **brand kit** (logos + `brand-kit.json`). Uncheck anything you don’t need, then **Download ZIP** (`<event>-brand-assets.zip`). Rendering is canvas-based and fully local.',
      },
    },
  },
  argTypes: { onDownloaded: { action: 'downloaded' } },
  render: (args) => ({ components: { ExportDialog }, setup: () => ({ args }), template: '<export-dialog v-bind="args" inline />' }),
}

export const Heartland = {
  args: { project: previewProject('heartland', { landing: 'rectangles', browse: 'billboards-rail', details: 'bottom-billboard' }) },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await step('Every file renders', async () => {
      await waitFor(() => expect(canvas.getByRole('button', { name: /download zip/i })).not.toBeDisabled(), { timeout: 15000 })
    })
    await step('Banners at both Presto sizes', async () => {
      await expect(canvas.getAllByText('1440×400').length).toBeGreaterThanOrEqual(2)
      await expect(canvas.getAllByText('1440×240').length).toBeGreaterThanOrEqual(2)
    })
    await step('Display ads included', async () => {
      await expect(canvas.getAllByText('970×250').length).toBeGreaterThan(0)
      await expect(canvas.getAllByText('160×600').length).toBeGreaterThan(0)
    })
  },
}

export const Fintech = { args: { project: previewProject('fintech') } }

export const NoAds = {
  name: 'No sponsor ads',
  args: { project: previewProject('wedding', { ads: false }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText(/no sponsor ads are placed yet/i)).toBeInTheDocument())
  },
}

export const Mobile = { args: { project: previewProject('lakeshore') }, globals: { viewport: { value: 'mobile' } } }
