import ChatStudio from './ChatStudio.vue'

// Standalone UX prototype — a chat-first Banner Lab. Mock data only; nothing
// here is wired to Clerk, Supabase or Higgsfield. Also runs on its own:
// `pnpm chat-studio` → http://localhost:6230
export default {
  title: 'Prototypes/Chat Studio',
  component: ChatStudio,
  parameters: { layout: 'fullscreen' },
  render: (args) => ({
    components: { ChatStudio },
    setup: () => ({ args }),
    template: '<ChatStudio v-bind="args" />',
  }),
  argTypes: {
    theme: { control: 'inline-radio', options: ['light', 'dark', 'system'] },
    openBrand: { control: 'select', options: ['', 'heartland', 'fintech', 'wedding', 'golf'] },
    speed: { control: { type: 'range', min: 0.2, max: 2, step: 0.2 } },
  },
  args: { theme: 'light', openBrand: '', autoPrompt: '', speed: 1 },
}

/** New project: the big composer and starter prompts. */
export const Home = {}

/** A finished project: brand kit, logo looks, two banner sets, the pages. */
export const ProjectThread = { args: { openBrand: 'heartland' } }

/** Watch the agent build a project from one message. */
export const AgentWorking = { args: { autoPrompt: 'Music festival by the river, three nights' } }

export const Dark = { args: { theme: 'dark', openBrand: 'fintech' } }
