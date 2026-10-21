import AdCreative from './AdCreative.vue'
import { AD_SIZES } from '../../models/ads.js'
import { SAMPLE_SPONSORS } from '../../data/sponsors.js'
import { getImage } from '../../assets/imagery/index.js'

const SIZES = Object.keys(AD_SIZES)

export default {
  title: 'Brand Studio/Advertising/Ad Creative',
  component: AdCreative,
  parameters: {
    docs: {
      description: {
        component:
          'A sponsor display unit at any IAB size. Uses the sponsor’s uploaded artwork for that size when present, otherwise an HTML creative laid out for the unit’s aspect (skyscraper · rectangle · billboard · leaderboard · mobile banner). Always labelled **Sponsored**; links open in a new tab with `rel="sponsored noopener noreferrer"`. With no sponsor it falls back to the Presto **DisplayAd** placeholder. Visual simulation only — no ad server.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: SIZES },
    sponsor: { control: false },
  },
}

export const Default = { args: { sponsor: SAMPLE_SPONSORS[0], size: '300x250', interactive: true } }

export const AllSizes = {
  name: 'All sizes × sponsors',
  render: () => ({
    components: { AdCreative },
    setup: () => ({ sponsors: SAMPLE_SPONSORS, sizes: SIZES, AD_SIZES }),
    template: `
      <div style="display:grid;gap:40px;padding:8px">
        <section v-for="s in sponsors" :key="s.id">
          <p class="bs-eyebrow" style="margin:0 0 12px">{{ s.name }}</p>
          <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start">
            <figure v-for="size in sizes" :key="size" style="margin:0">
              <ad-creative :sponsor="s" :size="size" :interactive="false" />
              <figcaption class="bs-caption" style="margin-top:6px">{{ size }} · {{ AD_SIZES[size].name }}</figcaption>
            </figure>
          </div>
        </section>
      </div>`,
  }),
}

export const Placeholders = {
  name: 'Empty slots (placeholder)',
  render: () => ({
    components: { AdCreative },
    setup: () => ({ sizes: SIZES }),
    template: `<div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;padding:8px">
      <ad-creative v-for="size in sizes" :key="size" :sponsor="null" :size="size" />
    </div>`,
  }),
}

const photo = getImage('soccer-stadium-lights')
const withArtwork = {
  ...SAMPLE_SPONSORS[1],
  artwork: {
    '300x250': { id: 'art-velo-mrec', src: photo.src, alt: 'Velo Hydration — stay hydrated under the lights' },
    '160x600': { id: 'art-velo-sky', src: photo.src, alt: 'Velo Hydration — stay hydrated under the lights' },
  },
}

export const UploadedArtwork = {
  name: 'Uploaded artwork (per size)',
  render: () => ({
    components: { AdCreative },
    setup: () => ({ s: withArtwork }),
    template: `<div style="display:flex;gap:20px;align-items:flex-start;padding:8px">
      <ad-creative :sponsor="s" size="300x250" />
      <ad-creative :sponsor="s" size="160x600" />
      <ad-creative :sponsor="s" size="970x90" />
    </div>`,
  }),
  parameters: { docs: { description: { story: 'Sizes with uploaded artwork show the image; sizes without fall back to the HTML creative (970×90 here).' } } },
}

export const NonInteractive = {
  name: 'Non-interactive (Studio preview)',
  args: { sponsor: SAMPLE_SPONSORS[2], size: '970x250', interactive: false },
}
