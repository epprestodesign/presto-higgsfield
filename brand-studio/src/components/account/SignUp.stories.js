import { ref } from 'vue'
import { expect, userEvent, within, waitFor, fn } from 'storybook/test'
import SignUpDialog from './SignUpDialog.vue'
import SaveGate from './SaveGate.vue'
import { withProject } from '../../stories/_helpers.js'
import { withSession } from './_storySeed.js'
import { useSessionStore } from '../../stores/session.js'

export default {
  title: 'Brand Studio/Accounts/Sign Up',
  component: SignUpDialog,
  decorators: [withProject({ sample: 'heartland', select: 2 }), withSession({ signedIn: false, projects: 'none' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Account gate shown only when a visitor does something permanent (save, publish). One screen: **Continue with Google** or email + password. The visitor’s design is shown alongside so it’s obvious nothing is lost — on success the session store claims the anonymous draft (`project.ownerId = user.id`). Mock auth in Phase 1; Supabase Auth (email/password + Google) in Phase 2 behind the same store API.',
      },
    },
  },
  argTypes: { onSuccess: { action: 'success' } },
}

const dialogStory = (extra = {}) => ({
  render: (args) => ({
    components: { SignUpDialog },
    setup: () => ({ args, open: ref(true) }),
    template: `<div style="min-height:100vh;background:#F6F7FA;display:grid;place-items:center">
      <q-btn unelevated no-caps class="bs-btn bs-btn--primary" label="Open sign up" @click="open = true" />
      <sign-up-dialog v-model="open" v-bind="args" @success="args.onSuccess" />
    </div>`,
  }),
  ...extra,
})

export const SaveYourPage = dialogStory({
  name: 'Save your booking page',
  args: { reason: 'Save your booking page', delayMs: 500 },
})

export const PublishYourDemo = dialogStory({
  name: 'Publish your demo',
  args: {
    reason: 'Publish your demo',
    detail: 'Published demos get a shareable link, so we attach them to a free account. Your design comes with you.',
    delayMs: 500,
  },
})

export const SignInMode = dialogStory({ name: 'Sign in', args: { initialMode: 'signin', delayMs: 500 } })

export const Pending = dialogStory({
  args: { delayMs: 500 },
  decorators: [
    (story) => ({
      components: { story },
      setup() { useSessionStore().pending = true },
      template: '<story />',
    }),
  ],
})

/** Validation → server error → success, end to end. */
export const ValidationAndSuccess = dialogStory({
  name: 'Validation → success (play)',
  args: { delayMs: 150, onSuccess: fn() },
  play: async ({ args }) => {
    const body = within(document.body)
    const dialog = await body.findByRole('document')
    const ui = within(dialog)

    // Empty submit → field errors, announced via the alert role on each field.
    await userEvent.clear(ui.getByLabelText('Work email'))
    await userEvent.click(ui.getByRole('button', { name: 'Create account' }))
    await expect(await ui.findByText('Enter your email address.')).toBeInTheDocument()

    // Short password → inline error, strength meter says too short.
    await userEvent.type(ui.getByLabelText('Work email'), 'dana@heartlandcup.example.com')
    await userEvent.type(ui.getByLabelText('Create a password'), 'short')
    await expect(ui.getByText('Too short')).toBeInTheDocument()
    await userEvent.click(ui.getByRole('button', { name: 'Create account' }))
    await expect(await ui.findByText('Use at least 8 characters.')).toBeInTheDocument()

    // Fix the password, then show/hide toggles the input type.
    await userEvent.clear(ui.getByLabelText('Create a password'))
    await userEvent.type(ui.getByLabelText('Create a password'), 'heartland-cup-2027!')
    await expect(ui.getByText('Strong')).toBeInTheDocument()
    await userEvent.click(ui.getByRole('button', { name: 'Show password' }))
    await expect(ui.getByLabelText('Create a password')).toHaveAttribute('type', 'text')

    // Valid → success state, draft claimed by the new account.
    await userEvent.click(ui.getByRole('button', { name: 'Create account' }))
    await expect(await ui.findByRole('status')).toHaveTextContent("You're in")
    await waitFor(() => expect(args.onSuccess).toHaveBeenCalled())
  },
})

export const Mobile = dialogStory({
  args: { delayMs: 500 },
  globals: { viewport: { value: 'mobile' } },
})

// ── Save gate ────────────────────────────────────────────────────────────
export const SaveGateVisitor = {
  name: 'Save gate · visitor',
  render: () => ({
    components: { SaveGate },
    template: `<div style="padding:40px 16px;background:#F6F7FA;min-height:100vh">
      <div style="display:grid;gap:20px;max-width:880px;margin:0 auto">
        <save-gate intent="save" :delay-ms="400" />
        <save-gate intent="publish" :delay-ms="400" :dismissible="false" />
      </div>
    </div>`,
  }),
}

export const SaveGateSignedIn = {
  name: 'Save gate · signed in',
  decorators: [withSession({ signedIn: true, projects: 'none' })],
  render: () => ({
    components: { SaveGate },
    template: `<div style="padding:40px;background:#F6F7FA;min-height:100vh"><save-gate intent="save" /></div>`,
  }),
}
