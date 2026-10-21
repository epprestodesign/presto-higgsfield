import { expect, userEvent, within, waitFor } from 'storybook/test'
import PublishFlow from './PublishFlow.vue'
import { withProject } from '../../stories/_helpers.js'
import { withSession } from '../account/_storySeed.js'

const readyToPublish = (project) => {
  project.markReviewed('desktop')
  project.markReviewed('mobile')
  project.acceptDisclaimer(true)
}

export default {
  title: 'Brand Studio/Publishing/Publish Flow',
  component: PublishFlow,
  decorators: [withProject({ sample: 'heartland', select: 2 }), withSession({ signedIn: false, projects: 'none' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Name & URL → Review (desktop + phone, live via the Preview Host iframe) → Checklist → Publish → Success. Status moves Draft → Ready to publish → Published demo. Publishing needs an account: signed-out visitors get the Sign Up dialog and the draft is claimed, then published. Every step is explicit that a demo has **no live availability, no real rates and no bookings or payments**. Emits `done`, `back`, `fix(target)`, `open-demo(url)`.',
      },
    },
  },
  args: { latencyMs: 350 },
  argTypes: {
    initialStep: { control: 'inline-radio', options: ['name', 'review', 'checklist', 'publish', 'success'] },
    onDone: { action: 'done' },
    onBack: { action: 'back' },
    onFix: { action: 'fix' },
    'onOpen-demo': { action: 'open-demo' },
  },
}

export const NameAndUrl = { name: '1 · Name & URL' }

export const SlugTaken = {
  name: '1 · URL already taken',
  decorators: [withProject({ sample: 'heartland', select: 2, mutate: (p) => p.setSlug('heartland-cup') })],
}

export const Review = { name: '2 · Review', args: { initialStep: 'review' } }

export const Checklist = { name: '3 · Checklist (incomplete)', args: { initialStep: 'checklist' } }

export const PublishBlocked = { name: '4 · Publish (blocked)', args: { initialStep: 'publish' } }

export const ReadySignedOut = {
  name: '4 · Ready, signed out',
  args: { initialStep: 'publish' },
  decorators: [withProject({ sample: 'heartland', select: 2, mutate: readyToPublish })],
}

export const Published = {
  name: '5 · Published',
  args: { initialStep: 'success' },
  decorators: [
    withProject({
      sample: 'heartland',
      select: 2,
      mutate: (p) => { readyToPublish(p); p.publish() },
    }),
    withSession({ signedIn: true, projects: 'none' }),
  ],
}

export const Mobile = { args: { initialStep: 'name' }, globals: { viewport: { value: 'mobile' } } }

export const MobileSuccess = {
  name: 'Mobile · Published',
  args: { initialStep: 'success' },
  globals: { viewport: { value: 'mobile' } },
  decorators: Published.decorators,
}

/** The checklist gates Publish; a signed-out publish opens the account dialog. */
export const ChecklistGatesPublish = {
  name: 'Checklist gates publish (play)',
  args: { initialStep: 'publish' },
  play: async ({ canvasElement }) => {
    const ui = within(canvasElement)
    const publishBtn = () => ui.getByRole('button', { name: /publish demo/i })

    // Incomplete: reviews + disclaimer missing → disabled.
    await expect(publishBtn()).toBeDisabled()
    await expect(ui.getByText(/Finish the checklist to publish \(3 left\)/)).toBeInTheDocument()

    // Review both devices.
    await userEvent.click(ui.getByRole('button', { name: 'Review' }))
    await userEvent.click(await ui.findByRole('button', { name: 'Desktop looks good' }))
    await userEvent.click(ui.getByRole('button', { name: 'Phone looks good' }))
    await expect(ui.getByText('Phone reviewed')).toBeInTheDocument()

    // Accept the demo disclaimer.
    await userEvent.click(ui.getByRole('button', { name: /^Checklist/ }))
    await userEvent.click(await ui.findByRole('checkbox'))

    // Publish is now enabled; signed out → Sign Up dialog.
    await userEvent.click(ui.getByRole('button', { name: /^Publish/ }))
    await waitFor(() => expect(publishBtn()).toBeEnabled())
    await userEvent.click(publishBtn())
    const dialog = await within(document.body).findByRole('document')
    await expect(within(dialog).getByRole('heading', { name: 'Publish your demo' })).toBeInTheDocument()
  },
}
