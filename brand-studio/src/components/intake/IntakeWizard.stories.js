import { expect, userEvent, within, waitFor, fn } from 'storybook/test'
import IntakeWizard from './IntakeWizard.vue'
import AssetDropzone from './AssetDropzone.vue'
import { withProject, fullscreen } from '../../stories/_helpers.js'

export default {
  title: 'Brand Studio/Onboarding/Event Intake',
  component: IntakeWizard,
  parameters: {
    ...fullscreen,
    docs: {
      description: {
        component:
          'Guided, account-free intake (spec 4B): **Event basics → Where & when → Your brand (optional) → Contact**. Every field writes through the project store, so the live preview and the autosaved draft stay current. Fields validate on blur and on Continue; Continue with errors shows an error summary and moves focus to the first invalid field. Emits `complete` (after re-seeding starter page copy) and `cancel`.',
      },
    },
  },
  args: { onComplete: fn(), onCancel: fn() },
}

export const Blank = {
  decorators: [withProject({ sample: null })],
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement)
    await step('Continue on a blank step shows errors and focuses the first field', async () => {
      await userEvent.click(c.getByRole('button', { name: /continue/i }))
      await waitFor(() => expect(c.getByText(/things need a look/i)).toBeInTheDocument())
      await expect(c.getByLabelText(/booking page name/i)).toHaveFocus()
    })
    await step('Filling step 1 advances to Where & when', async () => {
      await userEvent.type(c.getByLabelText(/booking page name/i), 'Heartland Invitational Soccer Cup 2027')
      await userEvent.click(c.getByRole('radio', { name: /sports tournament/i }))
      await waitFor(() => expect(c.queryByText(/things need a look|one thing needs a look/i)).not.toBeInTheDocument())
      await userEvent.click(c.getByRole('button', { name: /continue/i }))
      await waitFor(() => expect(c.getByRole('heading', { name: /where and when/i })).toBeInTheDocument())
      await expect(c.getByText('Step 2 of 4')).toBeInTheDocument()
    })
  },
}

export const PrefilledSample = {
  name: 'Prefilled sample',
  decorators: [withProject({ sample: 'heartland' })],
}

export const BrandStep = {
  name: 'Brand step (optional)',
  args: { initialStep: 2 },
  decorators: [withProject({ sample: 'heartland' })],
}

export const ContactStep = {
  name: 'Contact step',
  args: { initialStep: 3 },
  decorators: [withProject({ sample: 'heartland' })],
}

export const ValidationErrors = {
  name: 'Validation errors',
  args: { initialStep: 1, showErrors: true },
  decorators: [withProject({ sample: null, mutate: (p) => p.updateEvent({ name: 'Spring Classic', category: 'sports', startDate: '2027-04-12', endDate: '2027-04-10' }) })],
}

export const Mobile = {
  decorators: [withProject({ sample: 'heartland' })],
  globals: { viewport: { value: 'mobile' } },
}

export const Dropzone = {
  name: 'Asset dropzone',
  render: () => ({
    components: { AssetDropzone },
    data:() => ({ logo: [], photos: [] }),
    template: `<div style="display:grid;gap:28px;max-width:560px;padding:32px;font-family:var(--bs-font)">
      <div><h3 class="bs-subtitle" style="margin-bottom:8px">Logo (single)</h3>
        <asset-dropzone kind="logo" label="Upload your logo" :assets="logo" @add="logo = [$event]" @remove="logo = []" /></div>
      <div><h3 class="bs-subtitle" style="margin-bottom:8px">Photos (multiple)</h3>
        <asset-dropzone kind="photo" multiple :max-files="6" label="Add photos" :assets="photos" @add="photos.push($event)" @remove="photos = photos.filter(p => p.id !== $event)" /></div>
    </div>`,
  }),
}
