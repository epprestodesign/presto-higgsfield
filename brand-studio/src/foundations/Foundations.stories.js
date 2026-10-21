import { expect, userEvent, within } from 'storybook/test'
import ThemeEngineDemo from './ThemeEngineDemo.vue'
import TypefaceTesterView from './TypefaceTester.vue'
import { IMAGERY } from '../assets/imagery/index.js'
import { SAMPLE_EVENTS } from '../data/sampleEvents.js'
import { SAMPLE_SPONSORS } from '../data/sponsors.js'
import { FONT_OPTIONS } from '../theme/fonts.js'

export default {
  title: 'Brand Studio/Foundations',
  parameters: { layout: 'fullscreen' },
}

const COLORS = [
  ['--bs-ink', 'Ink — primary text, dark surfaces'],
  ['--bs-ink-soft', 'Ink soft — secondary text'],
  ['--bs-brand', 'EventPipe navy — primary actions'],
  ['--bs-accent', 'Creative violet — AI moments only'],
  ['--bs-accent-soft', 'Accent soft — AI surfaces'],
  ['--bs-canvas', 'Canvas — app background'],
  ['--bs-surface', 'Surface — cards, panels'],
  ['--bs-line', 'Line — borders, dividers'],
  ['--bs-success', 'Success'],
  ['--bs-warning', 'Warning'],
  ['--bs-danger', 'Danger'],
]

export const StudioTokens = {
  name: 'Studio Tokens',
  render: () => ({
    setup: () => ({ COLORS, radii: ['sm', 'md', 'lg', 'xl'], shadows: [1, 2, 3] }),
    template: `
      <div style="padding:40px;background:var(--bs-canvas);min-height:100vh;display:grid;gap:40px">
        <header style="max-width:70ch">
          <p class="bs-eyebrow">Foundations</p>
          <h1 class="bs-display-2" style="margin-top:10px">Studio tokens</h1>
          <p class="bs-lead" style="margin-top:12px">Brand Studio's chrome is built on the Presto palette, spacing, type and motion tokens, then tuned for a creation tool. It uses softer radii, layered elevation, and a violet accent kept for AI moments. Customer branding never touches these tokens. It lives in <code>BrandThemeProvider</code>.</p>
        </header>
        <section>
          <h2 class="bs-title">Color</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-top:14px">
            <div v-for="[v, label] in COLORS" :key="v" class="bs-card" style="overflow:hidden">
              <div :style="{ background: 'var(' + v + ')', height: '72px', borderBottom: '1px solid var(--bs-line)' }" />
              <div style="padding:12px"><code style="font-size:12px">{{ v }}</code><p class="bs-caption" style="margin-top:4px">{{ label }}</p></div>
            </div>
          </div>
        </section>
        <section>
          <h2 class="bs-title">Type ramp · PT Sans</h2>
          <div class="bs-card" style="padding:28px;margin-top:14px;display:grid;gap:18px">
            <div><code class="bs-caption">.bs-display-1</code><p class="bs-display-1">Create your booking page</p></div>
            <div><code class="bs-caption">.bs-display-2</code><p class="bs-display-2">Branded hotel booking in minutes</p></div>
            <div><code class="bs-caption">.bs-title</code><p class="bs-title">Choose a creative direction</p></div>
            <div><code class="bs-caption">.bs-subtitle</code><p class="bs-subtitle">Event Energy</p></div>
            <div><code class="bs-caption">.bs-lead</code><p class="bs-lead">Tell us about your event and we'll design a booking page your attendees will trust.</p></div>
            <div><code class="bs-caption">.bs-body</code><p class="bs-body">Body copy for panels, helper text and descriptions.</p></div>
            <div><code class="bs-caption">.bs-eyebrow</code><p class="bs-eyebrow">AI-assisted</p></div>
          </div>
        </section>
        <section style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          <div>
            <h2 class="bs-title">Radius</h2>
            <div style="display:flex;gap:14px;margin-top:14px">
              <div v-for="r in radii" :key="r" :style="{ width:'84px',height:'84px',background:'var(--bs-surface)',border:'1px solid var(--bs-line-strong)',borderRadius:'var(--bs-radius-' + r + ')',display:'grid',placeItems:'center' }"><code>{{ r }}</code></div>
            </div>
          </div>
          <div>
            <h2 class="bs-title">Elevation</h2>
            <div style="display:flex;gap:18px;margin-top:14px">
              <div v-for="s in shadows" :key="s" :style="{ width:'110px',height:'84px',background:'var(--bs-surface)',borderRadius:'var(--bs-radius-md)',boxShadow:'var(--bs-shadow-' + s + ')',display:'grid',placeItems:'center' }"><code>shadow-{{ s }}</code></div>
            </div>
          </div>
        </section>
        <section>
          <h2 class="bs-title">Buttons</h2>
          <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:14px">
            <q-btn unelevated no-caps class="bs-btn bs-btn--primary bs-btn--lg" label="Create your booking page" />
            <q-btn unelevated no-caps class="bs-btn bs-btn--ai" icon="auto_awesome" label="Generate concepts" />
            <q-btn unelevated no-caps class="bs-btn bs-btn--ghost" label="See a sample" />
            <span class="bs-pill">Draft</span><span class="bs-pill bs-pill--ai">AI-assisted</span>
          </div>
        </section>
      </div>`,
  }),
}

export const BrandThemeEngine = {
  name: 'Brand Theme Engine',
  args: { sample: 'lakeshore' },
  argTypes: { sample: { control: 'inline-radio', options: SAMPLE_EVENTS.map((e) => e.key) } },
  parameters: {
    docs: { description: { story: 'A Brand Kit becomes scoped CSS variables (`--ds-color-*`, `--q-*`, `--brand-*`). Real, **unmodified** Presto components then render in the customer’s colors and fonts. Brand text is nudged until it passes WCAG AA, even for light brand colors.' } },
  },
  render: (args) => ({ components: { ThemeEngineDemo }, setup: () => ({ args }), template: '<theme-engine-demo v-bind="args" />' }),
}

export const ImageryAndLogos = {
  name: 'Imagery & Logos',
  render: () => ({
    setup: () => ({ IMAGERY, SAMPLE_EVENTS, SAMPLE_SPONSORS, FONT_OPTIONS }),
    template: `
      <div style="padding:40px;background:var(--bs-canvas);min-height:100vh;display:grid;gap:36px">
        <header style="max-width:72ch">
          <p class="bs-eyebrow">Foundations</p>
          <h1 class="bs-display-2" style="margin-top:10px">Imagery, logos & fonts</h1>
          <p class="bs-lead" style="margin-top:12px">All sample photography is used under the <a href="https://unsplash.com/license" target="_blank" rel="noopener">Unsplash License</a>, and each download is registered with the Unsplash API. Event and sponsor brands are fictional, and sponsor links point to example.com. Every font is SIL Open Font License.</p>
        </header>
        <section>
          <h2 class="bs-title">Sample event brand kits</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-top:14px">
            <div v-for="e in SAMPLE_EVENTS" :key="e.key" class="bs-card" style="padding:18px;display:grid;gap:12px">
              <div style="height:96px;display:grid;place-items:center;background:var(--bs-surface-2);border-radius:var(--bs-radius-md)"><img :src="e.brandKit.logo.src" :alt="e.brandKit.logo.alt" style="max-height:80px;max-width:85%" /></div>
              <p class="bs-subtitle">{{ e.event.name }}</p>
              <div style="display:flex;gap:6px"><span v-for="(hex, role) in e.brandKit.colors" :key="role" :title="role + ' ' + hex" :style="{ width:'28px',height:'28px',borderRadius:'50%',background:hex,border:'1px solid var(--bs-line)' }" /></div>
              <p class="bs-caption">{{ e.brandKit.typography.heading }} / {{ e.brandKit.typography.body }} · {{ e.brandKit.direction }}</p>
            </div>
          </div>
        </section>
        <section>
          <h2 class="bs-title">Sponsors (fictional)</h2>
          <div style="display:flex;gap:16px;margin-top:14px;flex-wrap:wrap">
            <div v-for="s in SAMPLE_SPONSORS" :key="s.id" class="bs-card" style="padding:14px;display:flex;gap:12px;align-items:center;min-width:280px">
              <img :src="s.logo.src" :alt="s.logo.alt" style="width:56px;height:56px" /><div><p class="bs-subtitle">{{ s.name }}</p><p class="bs-caption">{{ s.url }}</p></div>
            </div>
          </div>
        </section>
        <section>
          <h2 class="bs-title">Photography</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:14px">
            <figure v-for="img in IMAGERY" :key="img.id" class="bs-card" style="margin:0;overflow:hidden">
              <img :src="img.src" :alt="img.alt" style="width:100%;aspect-ratio:3/2;object-fit:cover;display:block" />
              <figcaption style="padding:10px 12px"><p class="bs-caption" style="color:var(--bs-ink)">{{ img.alt }}</p><a :href="img.creditUrl" target="_blank" rel="noopener" class="bs-caption">{{ img.credit }}</a></figcaption>
            </figure>
          </div>
        </section>
        <section>
          <h2 class="bs-title">Brand typography options</h2>
          <div class="bs-card" style="padding:8px 20px;margin-top:14px">
            <div v-for="f in FONT_OPTIONS" :key="f.id" style="display:grid;grid-template-columns:200px 1fr;align-items:baseline;gap:16px;padding:12px 0;border-bottom:1px solid var(--bs-line)">
              <span class="bs-caption">{{ f.label }}<template v-if="f.note"> · {{ f.note }}</template></span>
              <span :style="{ fontFamily: f.family, fontSize: '26px', fontWeight: 700, color: 'var(--bs-ink)' }">Heartland Invitational Cup 2027</span>
            </div>
          </div>
        </section>
      </div>`,
  }),
}

export const TypefaceTester = {
  name: 'Typeface Tester',
  args: { initialFont: 'barlow-condensed', initialBody: 'inter' },
  argTypes: {
    initialFont: { control: 'select', options: FONT_OPTIONS.map((f) => f.id) },
    initialBody: { control: 'select', options: FONT_OPTIONS.map((f) => f.id) },
    onApply: { action: 'apply' },
  },
  parameters: {
    docs: { description: { story: 'A working type specimen for every font a Brand Kit can use. Controls cover family, size, weight (only loaded weights), line height, letter spacing, case and italic. Views show a waterfall, every weight, glyphs, a heading + body pairing, and copyable CSS.' } },
  },
  render: (args) => ({ components: { TypefaceTesterView }, setup: () => ({ args }), template: '<typeface-tester-view v-bind="args" @apply="args.onApply" />' }),
  play: async ({ canvasElement }) => {
    const ui = within(canvasElement)
    await userEvent.click(ui.getByRole('radio', { name: /Playfair Display/ }))
    await userEvent.click(ui.getByRole('radio', { name: 'Uppercase' }))
    await expect(ui.getByText(/font-family: 'Playfair Display'/)).toBeInTheDocument()
    await expect(ui.getByText(/text-transform: uppercase/)).toBeInTheDocument()
  },
}

export const TypefaceTesterMobile = { ...TypefaceTester, name: 'Typeface Tester · Mobile', play: undefined, globals: { viewport: { value: 'mobile' } } }
