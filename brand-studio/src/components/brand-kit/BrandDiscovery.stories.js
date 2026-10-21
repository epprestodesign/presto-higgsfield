import { expect, userEvent, within, waitFor, fn } from 'storybook/test'
import BrandDiscovery from './BrandDiscovery.vue'
import BrandScanPanel from './BrandScanPanel.vue'
import ColorRoleField from './ColorRoleField.vue'
import { withProject, fullscreen } from '../../stories/_helpers.js'

export default {
  title: 'Brand Studio/Onboarding/Brand Discovery',
  component: BrandDiscovery,
  parameters: {
    ...fullscreen,
    docs: {
      description: {
        component:
          'The editable Brand Kit (spec 4C). **Scan my website** runs a (mock) public-page extraction with staged progress, then asks for explicit, per-item approval before anything changes — with Undo. Below: logo (light + optional dark variant), four color roles with live WCAG AA checks, heading/body typography with specimens, reference images (hero pick, uploads, licensed library) and creative direction + mood words. The sticky preview re-themes the banner, booking UI accents and results band on every edit. Emits `next` / `back`.',
      },
    },
  },
  args: { onNext: fn(), onBack: fn() },
}

export const SampleKit = {
  name: 'Sample kit',
  decorators: [withProject({ sample: 'heartland' })],
}

export const BlankKit = {
  name: 'Blank kit',
  decorators: [withProject({ sample: null, mutate: (p) => p.updateEvent({ name: 'Riverbend Fall Classic', category: 'sports', city: 'Tulsa', region: 'OK', websiteUrl: 'riverbend-classic.org' }) })],
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement)
    await step('Scan an unknown site → review → apply colors only', async () => {
      await userEvent.click(c.getByRole('button', { name: /scan my website/i }))
      await waitFor(() => expect(c.getByRole('button', { name: /apply selected/i })).toBeInTheDocument(), { timeout: 6000 })
      await userEvent.click(c.getByRole('checkbox', { name: /logo/i }))
      await userEvent.click(c.getByRole('checkbox', { name: /fonts/i }))
      await userEvent.click(c.getByRole('button', { name: /apply selected/i }))
      await waitFor(() => expect(c.getByText(/fine-tune anything below/i)).toBeInTheDocument())
      await expect(c.getByText(/started from suggestions/i)).toBeInTheDocument()
    })
  },
  args: { scanDelayMs: 120 },
}

export const Scanning = {
  args: { autoScan: true, scanDelayMs: 60000 },
  decorators: [withProject({ sample: 'heartland' })],
}

export const SuggestionsReady = {
  name: 'Suggestions ready',
  args: { autoScan: true, scanDelayMs: 1 },
  decorators: [withProject({ sample: 'fintech', mutate: (p) => p.updateBrandKit({ logo: null, logoOnDark: null, colors: { primary: '#01113E', secondary: '#2C4380', accent: '#16A34A', ink: '#0F172A', surface: '#FFFFFF' }, typography: { heading: 'pt-sans', body: 'pt-sans' }, source: 'manual' }) })],
}

export const ScanError = {
  name: 'Scan error (unreachable site)',
  args: { autoScan: true, scanDelayMs: 1 },
  decorators: [withProject({ sample: null, mutate: (p) => p.updateEvent({ name: 'Summit Series', websiteUrl: 'https://summit.unreachable.example' }) })],
}

export const Wedding = {
  name: 'Premium kit (wedding)',
  decorators: [withProject({ sample: 'wedding' })],
}

export const Mobile = {
  decorators: [withProject({ sample: 'heartland' })],
  globals: { viewport: { value: 'mobile' } },
}

export const ColorField = {
  name: 'Color role field',
  render: () => ({
    components: { ColorRoleField },
    data: () => ({ hex: '#19C6B8' }),
    template: `<div style="padding:32px;max-width:320px"><color-role-field v-model="hex" label="Secondary" description="Accents, stripes and highlights." /><p class="bs-caption" style="margin-top:12px">Value: {{ hex }}</p></div>`,
  }),
}

export const ScanPanelOnly = {
  name: 'Scan panel',
  render: () => ({ components: { BrandScanPanel }, template: '<div style="padding:32px;max-width:760px"><brand-scan-panel initial-url="heartlandcup.example.com" /></div>' }),
  decorators: [withProject({ sample: null })],
}
