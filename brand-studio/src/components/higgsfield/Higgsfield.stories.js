import HiggsfieldConnection from './HiggsfieldConnection.vue'
import BannerGenerator from './BannerGenerator.vue'
import { withProject } from '../../stories/_helpers.js'

export default {
  title: 'Brand Studio/Higgsfield',
  parameters: { layout: 'fullscreen' },
}

// ── Connection ────────────────────────────────────────────────────────────
const connection = (simulate = '') => ({
  render: () => ({
    components: { HiggsfieldConnection },
    setup: () => ({ simulate }),
    template: '<div style="padding:24px;background:var(--bs-canvas);min-height:100vh"><div style="max-width:640px"><higgsfield-connection :simulate="simulate" /></div></div>',
  }),
})

/** Live check against your local dev server + .env key. */
export const Connection = { ...connection(), name: 'Connection' }
export const ConnectionNoKey = { ...connection('no-key'), name: 'Connection · No key yet' }
export const ConnectionVerified = { ...connection('verified'), name: 'Connection · Verified' }
export const ConnectionStatic = { ...connection('static'), name: 'Connection · Static hosting' }

// ── Banner generator ──────────────────────────────────────────────────────
const generator = (args = {}, project = {}) => ({
  decorators: [withProject({ sample: 'heartland', select: 2, ...project })],
  args,
  render: (a) => ({ components: { BannerGenerator }, setup: () => ({ a }), template: '<banner-generator v-bind="a" />' }),
})

/** Real generation when your key is set up; falls back to sample mode otherwise. */
export const BannerGeneratorLive = { ...generator(), name: 'Banner Generator' }
export const BannerGeneratorSponsorAd = { ...generator({ initialTarget: '160x600' }), name: 'Banner Generator · Sponsor skyscraper' }
export const BannerGeneratorTypography = { ...generator({ initialTarget: '970x250', initialModel: 'ideogram' }), name: 'Banner Generator · Type-led billboard' }
export const BannerGeneratorSample = { ...generator({ sampleMode: true, sampleLatencyMs: 900 }), name: 'Banner Generator · Sample mode (no credits)' }
export const BannerGeneratorWedding = { ...generator({ sampleMode: true }, { sample: 'wedding', select: 4 }), name: 'Banner Generator · Wedding (sample)' }
export const BannerGeneratorMobile = { ...generator({ sampleMode: true }), name: 'Banner Generator · Mobile', globals: { viewport: { value: 'mobile' } } }
