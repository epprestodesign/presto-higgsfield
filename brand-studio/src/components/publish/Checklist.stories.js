import PublishChecklist from './PublishChecklist.vue'
import StatusChip from './StatusChip.vue'
import { withProject } from '../../stories/_helpers.js'

export default {
  title: 'Brand Studio/Publishing/Checklist',
  component: PublishChecklist,
  decorators: [
    (story) => ({ components: { story }, template: '<div style="max-width:620px;margin:32px auto;padding:0 16px"><story /></div>' }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Live view of `publishChecklist(project)`: event, contact, brand, concept, URL, desktop + mobile review, and the demo disclaimer. Failing rows link to where they can be fixed (`fix` → `{ target, item }`). Publish stays disabled until every row passes.',
      },
    },
  },
  argTypes: { onFix: { action: 'fix' } },
}

export const Incomplete = { decorators: [withProject({ sample: 'heartland', select: 2 })] }

export const BlankProject = {
  name: 'Blank project',
  decorators: [withProject({ sample: null })],
}

export const Complete = {
  decorators: [
    withProject({
      sample: 'heartland',
      select: 2,
      mutate: (p) => { p.markReviewed('desktop'); p.markReviewed('mobile'); p.acceptDisclaimer(true) },
    }),
  ],
}

export const StatusChips = {
  name: 'Status chips',
  render: () => ({
    components: { StatusChip },
    template: `<div style="display:flex;gap:12px;flex-wrap:wrap">
      <status-chip status="draft" /><status-chip status="ready" /><status-chip status="published" />
      <status-chip status="draft" size="sm" /><status-chip status="ready" size="sm" /><status-chip status="published" size="sm" />
    </div>`,
  }),
}
