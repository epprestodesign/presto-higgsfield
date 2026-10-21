import { expect, userEvent, within, waitFor, fn } from 'storybook/test'
import LeadCapture from './LeadCapture.vue'

export default {
  title: 'Brand Studio/Marketing Site/Sections/Lead Capture',
  component: LeadCapture,
  parameters: { layout: 'fullscreen' },
  args: { onLead: fn(), onStart: fn(), submitDelayMs: 300 },
  decorators: [() => ({ template: '<div style="display:flow-root;background:var(--bs-canvas)"><story /></div>' })],
}

export const Default = {}

/** Key flow: empty submit shows errors; a valid submit emits `lead` and shows success. */
export const ValidateAndSubmit = {
  name: 'Validate → submit (play)',
  play: async ({ canvasElement, args, step }) => {
    const c = within(canvasElement)
    await step('Empty submit shows field errors', async () => {
      await userEvent.click(c.getByRole('button', { name: /email me my preview link/i }))
      await expect(await c.findByText(/fix 4 fields to continue/i)).toHaveFocus()
      await expect(c.getByText('Add your name.')).toBeInTheDocument()
      await expect(c.getByText(/add an email/i)).toBeInTheDocument()
      await expect(c.getByText('Give your booking page a name.')).toBeInTheDocument()
      await expect(c.getByText('Pick the type of event.')).toBeInTheDocument()
      await expect(args.onLead).not.toHaveBeenCalled()
    })
    await step('Invalid email is caught', async () => {
      await userEvent.type(c.getByLabelText('Work email'), 'dana@')
      await userEvent.click(c.getByRole('button', { name: /email me my preview link/i }))
      await expect(await c.findByText('Enter a valid email address.')).toBeInTheDocument()
    })
    await step('Fill the form and submit', async () => {
      await userEvent.type(c.getByLabelText('Your name'), 'Dana Whitaker')
      await userEvent.clear(c.getByLabelText('Work email'))
      await userEvent.type(c.getByLabelText('Work email'), 'dana@heartlandcup.example.com')
      await userEvent.type(c.getByLabelText('Event name'), 'Heartland Invitational Soccer Cup 2027')
      await userEvent.click(c.getByLabelText('Event type'))
      await userEvent.click(await within(document.body).findByText('Sports tournament'))
      await userEvent.click(c.getByRole('button', { name: /email me my preview link/i }))
      await waitFor(() => expect(args.onLead).toHaveBeenCalledTimes(1))
      await expect(args.onLead.mock.calls[0][0]).toMatchObject({ name: 'Dana Whitaker', email: 'dana@heartlandcup.example.com', category: 'sports' })
      await expect(await c.findByRole('status')).toHaveTextContent(/thanks, dana/i)
    })
  },
}

export const Mobile = { globals: { viewport: { value: 'mobile' } } }
