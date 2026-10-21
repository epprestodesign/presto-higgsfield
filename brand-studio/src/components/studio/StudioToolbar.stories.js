import StudioToolbar from './StudioToolbar.vue'

export default {
  title: 'Brand Studio/Studio Editor/Toolbar',
  component: StudioToolbar,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    page: { control: 'inline-radio', options: ['landing', 'browse', 'details', 'checkout', 'confirmation'] },
    device: { control: 'inline-radio', options: ['desktop', 'tablet', 'mobile'] },
    status: { control: 'inline-radio', options: ['draft', 'ready', 'published'] },
    onBack: { action: 'back' },
    onRename: { action: 'rename' },
    onUndo: { action: 'undo' },
    onRedo: { action: 'redo' },
    onSave: { action: 'save' },
    onPreview: { action: 'preview' },
    onPublish: { action: 'publish' },
  },
  args: {
    name: 'Heartland Invitational Soccer Cup 2027',
    pages: ['landing', 'browse', 'details'],
    page: 'landing',
    device: 'desktop',
    status: 'draft',
    canUndo: true,
    canRedo: false,
    saving: false,
    lastSavedAt: new Date().toISOString(),
    dirty: false,
  },
  render: (args, { updateArgs }) => ({
    components: { StudioToolbar },
    setup: () => ({ args, updateArgs }),
    template: `<studio-toolbar v-bind="args"
      @update:page="(v) => updateArgs({ page: v })"
      @update:device="(v) => updateArgs({ device: v })"
      @rename="(v) => updateArgs({ name: v })" />`,
  }),
}

export const Default = {}

export const WithSimulatedPages = {
  name: 'With checkout + confirmation enabled',
  args: { pages: ['landing', 'browse', 'details', 'checkout', 'confirmation'], page: 'details' },
}

export const Saving = { args: { saving: true } }
export const UnsavedChanges = { args: { dirty: true, lastSavedAt: new Date(Date.now() - 5 * 60e3).toISOString() } }
export const ReadyToPublish = { args: { status: 'ready', canRedo: true } }
export const Published = { args: { status: 'published' } }

export const Compact = {
  name: 'Compact (narrow screens)',
  args: { compact: true },
  globals: { viewport: { value: 'mobile' } },
}
