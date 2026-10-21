import { expect, userEvent, within, waitFor } from 'storybook/test'
import SponsorEditor from './SponsorEditor.vue'
import { withProject } from '../../stories/_helpers.js'

export default {
  title: 'Brand Studio/Advertising/Sponsor Editor',
  component: SponsorEditor,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'grey' },
    docs: {
      description: {
        component:
          'Preview sponsor branding before pitching it: name, message, button label, **https-only** destination URL, colors (with live contrast check), logo and optional per-size artwork. Creatives update live; **Save** writes to the project store (`upsertSponsor`), so every page preview picks it up.',
      },
    },
  },
  argTypes: { onSaved: { action: 'saved' }, onRemoved: { action: 'removed' } },
}

export const Default = { decorators: [withProject({ sample: 'heartland' })] }

export const Empty = {
  name: 'No sponsors yet',
  decorators: [withProject({ sample: 'fintech' })],
}

export const LiveUpdate = {
  name: 'Live update + URL validation (test)',
  decorators: [withProject({ sample: 'heartland' })],
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement)
    await step('Editing the name updates every preview creative', async () => {
      const name = c.getByLabelText(/sponsor name/i)
      await userEvent.clear(name)
      await userEvent.type(name, 'Union Station Rentals')
      await waitFor(() => {
        const creatives = canvasElement.querySelectorAll('.se__previews .adc')
        expect(creatives.length).toBeGreaterThan(0)
        creatives.forEach((el) => expect(el.getAttribute('aria-label')).toMatch(/Union Station Rentals/))
      })
    })
    await step('A non-https destination is rejected on save', async () => {
      const url = c.getByLabelText(/destination url/i)
      await userEvent.clear(url)
      await userEvent.type(url, 'http://example.com/offer')
      await userEvent.click(c.getByRole('button', { name: /save changes/i }))
      await expect(await c.findByText(/use a secure https/i)).toBeInTheDocument()
    })
    await step('Fixing it saves to the project', async () => {
      const url = c.getByLabelText(/destination url/i)
      await userEvent.clear(url)
      await userEvent.type(url, 'https://example.com/union-station')
      await userEvent.click(c.getByRole('button', { name: /save changes/i }))
      await expect(await c.findByRole('status')).toHaveTextContent(/saved/i)
      await expect(c.getAllByText('Union Station Rentals').length).toBeGreaterThan(0)
    })
  },
}
