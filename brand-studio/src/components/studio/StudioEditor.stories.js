import { expect, userEvent, within, waitFor } from 'storybook/test'
import StudioEditor from './StudioEditor.vue'
import { withProject } from '../../stories/_helpers.js'
import { useProjectStore } from '../../stores/project.js'

export default {
  title: 'Brand Studio/Studio Editor/Editor',
  component: StudioEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The page customization studio. Left: tabbed editing panels (Brand, Content, Pages, Ads, Concept). Centre: the live branded booking page, rendered in an iframe at a real device width (1280 / 768 / 390) and scaled to fit. Top: page switcher, device toggle, undo/redo (⌘Z / ⇧⌘Z), save (⌘S, plus autosave), full-screen preview and Publish. Every edit is a project-store action, so the preview updates immediately. Under 900px the panels become a bottom sheet.',
      },
    },
  },
  argTypes: {
    initialPage: { control: 'inline-radio', options: ['landing', 'browse', 'details'] },
    initialDevice: { control: 'inline-radio', options: ['', 'desktop', 'tablet', 'mobile'] },
    initialTab: { control: 'inline-radio', options: ['brand', 'content', 'pages', 'ads', 'concept'] },
    onPublish: { action: 'publish' },
    onBack: { action: 'back' },
    onChangeConcept: { action: 'change-concept' },
    onEditSponsors: { action: 'edit-sponsors' },
  },
  decorators: [withProject({ select: 2 })],
}

export const Default = {
  name: 'Editor',
  args: { initialTab: 'brand' },
}

export const ContentEditing = {
  name: 'Content editing (interaction test)',
  args: { initialTab: 'content', autosave: false },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const store = useProjectStore()

    await step('Hide the "Booking benefits" section', async () => {
      const toggle = await canvas.findByRole('switch', { name: 'Show Booking benefits' })
      await userEvent.click(toggle)
      await expect(store.project.pages.landing.sections.benefits.visible).toBe(false)
      await new Promise((r) => setTimeout(r, 650)) // let history settle into its own step
    })

    const headline = 'Kickoff Weekend in Overland Park'
    await step('Edit the hero headline', async () => {
      const input = canvas.getByRole('textbox', { name: 'Headline' })
      await userEvent.type(input, headline)
      await expect(store.project.pages.landing.hero.headline).toBe(headline)
    })

    await step('Undo restores the previous headline', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Undo' }))
      await waitFor(() => expect(store.project.pages.landing.hero.headline).toBe(''))
      await expect(store.project.pages.landing.sections.benefits.visible).toBe(false)
    })

    await step('Redo re-applies it', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Redo' }))
      await waitFor(() => expect(store.project.pages.landing.hero.headline).toBe(headline))
    })
  },
}

export const BrowsePage = {
  name: 'Browse page · Ads tab',
  args: { initialPage: 'browse', initialTab: 'ads' },
}

export const MobileDrawer = {
  name: 'Editor · mobile (bottom sheet)',
  args: { initialTab: 'brand' },
  globals: { viewport: { value: 'mobile' } },
}

export const MobileSheetOpen = {
  name: 'Editor · mobile (sheet open)',
  args: { initialTab: 'content', initialSheetOpen: true },
  globals: { viewport: { value: 'mobile' } },
}

export const NoConceptYet = {
  name: 'No concept selected',
  args: { initialTab: 'concept' },
  decorators: [withProject({ sample: 'wedding' })],
}
