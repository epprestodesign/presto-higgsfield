import { expect, userEvent, within } from 'storybook/test'
import ProjectDashboard from './ProjectDashboard.vue'
import ProjectCard from './ProjectCard.vue'
import { withProject } from '../../stories/_helpers.js'
import { withSession, withConcepts } from './_storySeed.js'
import { sampleProject } from '../../data/sampleEvents.js'

export default {
  title: 'Brand Studio/Accounts/Dashboard',
  component: ProjectDashboard,
  decorators: [withProject({ sample: 'heartland' }), withSession()],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Authenticated home: **My booking pages**. Each project leads with its branded hero thumbnail; tabs filter by lifecycle (Draft · Ready to publish · Published demo). Actions: continue editing, open preview, duplicate, copy share link (published only). Phase 2 backs this with the Supabase `projects` table under row-level security (`owner_id = auth.uid()`).',
      },
    },
  },
  argTypes: {
    onOpen: { action: 'open' },
    onNew: { action: 'new' },
    onPreview: { action: 'preview' },
  },
}

export const Default = {
  play: async ({ canvasElement }) => {
    const ui = within(canvasElement)
    // Filtering by tab narrows the grid to published demos only.
    await userEvent.click(ui.getByRole('tab', { name: /Published demos/ }))
    await expect(ui.getAllByRole('article')).toHaveLength(1)
    await expect(ui.getByRole('heading', { name: 'The Alvarez & Chen Wedding' })).toBeInTheDocument()
    await userEvent.click(ui.getByRole('tab', { name: /^All/ }))
    await expect(ui.getAllByRole('article')).toHaveLength(3)
  },
}

export const DraftsTab = { name: 'Drafts tab', args: { initialTab: 'draft' } }

export const EmptyPublished = { name: 'Empty · no published demos', args: { initialTab: 'published' }, decorators: [withSession({ projects: 'none' })] }

export const FirstRun = { name: 'Empty · first run', decorators: [withSession({ projects: 'none' })] }

export const Loading = { args: { loading: true } }

export const Mobile = { globals: { viewport: { value: 'mobile' } } }

export const Card = {
  name: 'Project card',
  render: () => ({
    components: { ProjectCard },
    setup() {
      const draft = withConcepts(sampleProject('lakeshore'), 3)
      draft.updatedAt = new Date(Date.now() - 3 * 3600e3).toISOString()
      const published = withConcepts(sampleProject('wedding'), 5)
      published.status = 'published'
      published.publishing.publishedUrl = `https://demo.eventpipe.com/${published.publishing.slug}`
      published.updatedAt = new Date(Date.now() - 5 * 86400e3).toISOString()
      return { draft, published }
    },
    template: `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,340px));gap:22px;padding:32px;background:#F6F7FA;min-height:100vh;align-content:start">
      <project-card :project="draft" />
      <project-card :project="published" />
    </div>`,
  }),
}
