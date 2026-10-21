<script setup>
// BannerGenerator — generate event hero banners and sponsor display ads with the
// real Higgsfield API (Marketing Studio 2.5 Flare · Recraft V4.1 · Ideogram 4.0).
//
// Flow: pick what you're making → answer a short brief → logo / references →
// pick a model → review the prompt + cost estimate → generate → see the result
// in context (BrandHero / AdCreative) → use it on the page or save it to the repo.
//
// Live calls go through the local dev proxy (key stays server-side). Without
// it (e.g. GitHub Pages) "Sample mode" walks the same flow with stock images.
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useProjectStore } from '../../stores/project.js'
import { hf, rasterizeToPng, TERMINAL } from '../../providers/higgsfield/client.js'
import { HF_MODELS, BANNER_TARGETS, getHfModel, closestAspect } from '../../providers/higgsfield/models.js'
import { BRIEF_QUESTIONS, defaultAnswers, buildBannerPrompt } from '../../providers/higgsfield/bannerBrief.js'
import { formatDateRange, locationLabel } from '../../models/event.js'
import { resolvePalette } from '../../theme/brandTheme.js'
import { shade } from '../../theme/color.js'
import { imagesTagged, IMAGERY } from '../../assets/imagery/index.js'
import { uid } from '../../models/ids.js'
import BrandHero from '../brand/BrandHero.vue'
import AdCreative from '../ads/AdCreative.vue'
import AssetDropzone from '../intake/AssetDropzone.vue'
import HiggsfieldConnection from './HiggsfieldConnection.vue'

const props = defineProps({
  initialTarget: { type: String, default: 'hero' },
  initialModel: { type: String, default: 'flare' },
  // Force sample mode (no API calls) — used by stories on static hosting.
  sampleMode: { type: Boolean, default: false },
  sampleLatencyMs: { type: Number, default: 2200 },
})

const $q = useQuasar()
const project = useProjectStore()

// ── Connection ────────────────────────────────────────────────────────────
const health = ref({ proxy: false, configured: false })
const sample = ref(props.sampleMode)
onMounted(async () => {
  if (props.sampleMode) return
  health.value = await hf.health()
  if (!health.value.configured) sample.value = true
})
const live = computed(() => !sample.value && health.value.configured)

// ── What are you making? ──────────────────────────────────────────────────
const targetId = ref(props.initialTarget)
const target = computed(() => BANNER_TARGETS.find((t) => t.id === targetId.value) || BANNER_TARGETS[0])
const isAd = computed(() => target.value.group === 'Sponsor ads')
const sponsors = computed(() => project.ads.sponsors || [])
const sponsorId = ref(sponsors.value[0]?.id || '')
const sponsor = computed(() => (isAd.value ? sponsors.value.find((s) => s.id === sponsorId.value) || null : null))
const targetGroups = computed(() => {
  const g = {}
  BANNER_TARGETS.forEach((t) => { (g[t.group] ||= []).push(t) })
  return g
})

// ── Brief ─────────────────────────────────────────────────────────────────
const answers = reactive(defaultAnswers())
const toggleMulti = (q, value) => {
  const arr = answers[q.id]
  const i = arr.indexOf(value)
  if (i !== -1) arr.splice(i, 1)
  else if (arr.length < (q.max || 99)) arr.push(value)
}
const headline = ref(project.event.name || '')

// ── References (logo first) ───────────────────────────────────────────────
const uploads = ref([])
const logoRef = computed(() => {
  const logo = sponsor.value ? sponsor.value.logo : project.brandKit.logo
  return logo?.src ? { id: `logo:${logo.src}`, src: logo.src, alt: logo.alt || 'Logo', source: 'logo' } : null
})
const references = computed(() => [logoRef.value, ...uploads.value].filter(Boolean))

// ── Model ─────────────────────────────────────────────────────────────────
const modelId = ref(props.initialModel)
const model = computed(() => getHfModel(modelId.value))
const options = reactive({})
watch(model, (m) => { Object.entries(m.options).forEach(([k, o]) => { if (!o.values.includes(options[k])) options[k] = o.default }) }, { immediate: true })
const recommended = computed(() => {
  if (answers.text === 'headline') return 'ideogram'
  if (answers.subject === 'graphic') return 'recraft'
  return 'flare'
})
// Baking a headline in only works on the typography model.
watch(() => answers.text, (t) => { if (t === 'headline') modelId.value = 'ideogram' })

const aspectRatio = computed(() => closestAspect(model.value, target.value.width, target.value.height))
const palette = computed(() => {
  if (sponsor.value) return Object.values(sponsor.value.colors || {})
  const p = resolvePalette(project.brandKit.colors)
  return [p.primary, p.secondary, p.accent]
})
const useRefs = computed(() => model.value.references > 0 && answers.logo !== 'skip')

// ── Prompt ────────────────────────────────────────────────────────────────
const builtPrompt = computed(() =>
  buildBannerPrompt(answers, { event: project.event, brandKit: project.brandKit, target: target.value, model: model.value, headline: headline.value, sponsor: sponsor.value }),
)
const promptOverride = ref(null)
const prompt = computed({ get: () => promptOverride.value ?? builtPrompt.value, set: (v) => { promptOverride.value = v } })
const promptEdited = computed(() => promptOverride.value !== null && promptOverride.value !== builtPrompt.value)
const inputFor = (referenceUrls = []) => model.value.buildInput({ prompt: prompt.value, aspectRatio: aspectRatio.value, referenceUrls, palette: palette.value, options })
const requestPreview = computed(() => JSON.stringify({ endpoint: model.value.endpoint, ...inputFor(useRefs.value ? references.value.slice(0, model.value.references).map((r) => `‹upload: ${r.alt}›`) : []) }, null, 2))

// ── Cost estimate (free; debounced) ───────────────────────────────────────
const estimate = ref(null)
const estimating = ref(false)
let estTimer = null
watch([prompt, modelId, aspectRatio, () => ({ ...options }), live], () => {
  clearTimeout(estTimer)
  if (!live.value) { estimate.value = null; return }
  estTimer = setTimeout(async () => {
    estimating.value = true
    try { estimate.value = await hf.estimate(model.value.endpoint, inputFor()) } catch (e) { estimate.value = { error: e.message } }
    estimating.value = false
  }, 700)
}, { immediate: true })
const costLabel = computed(() => {
  if (!live.value) return 'Sample: no credits'
  if (estimating.value) return 'Estimating…'
  if (estimate.value?.credits) return `~${Number(estimate.value.credits)} credits${estimate.value.usd ? ` ($${Number(estimate.value.usd).toFixed(3)})` : ''}`
  return estimate.value?.error ? 'Estimate unavailable' : ''
})

// ── Jobs ──────────────────────────────────────────────────────────────────
const jobs = ref([])
const active = computed(() => jobs.value.filter((j) => !['completed', 'failed', 'nsfw', 'canceled', 'error'].includes(j.status)).length)
const uploadCache = new Map()
const STATUS_TEXT = { preparing: 'Preparing', uploading: 'Uploading logo & references', queued: 'Queued at Higgsfield', in_progress: 'Generating', completed: 'Done', failed: 'Failed (not charged)', nsfw: 'Blocked by moderation (not charged)', canceled: 'Canceled (refunded)', error: 'Error' }

async function uploadRefs(job) {
  const urls = []
  for (const r of references.value.slice(0, model.value.references)) {
    if (!uploadCache.has(r.id)) {
      job.status = 'uploading'
      const png = r.src.startsWith('data:image/svg') || /\.svg(\?|$)/.test(r.src) || !r.src.startsWith('data:') ? await rasterizeToPng(r.src) : r.src
      uploadCache.set(r.id, await hf.uploadDataUrl(png))
    }
    urls.push(uploadCache.get(r.id))
  }
  return urls
}

function sampleImage() {
  const tag = { venue: 'sports', action: 'sports', crowd: 'sports', city: 'city', hotel: 'city', graphic: 'sports' }[answers.subject] || 'sports'
  const list = imagesTagged(project.event.category === 'sports' ? tag : project.event.category || tag)
  const pool = list.length ? list : IMAGERY
  return pool[Math.floor(Math.random() * pool.length)].src
}

async function generate() {
  const job = reactive({
    id: uid('gen'), model: model.value, target: target.value, sponsorId: sponsor.value?.id || null,
    prompt: prompt.value, aspectRatio: aspectRatio.value, baked: answers.text === 'headline' && model.value.typography,
    status: 'preparing', error: '', images: [], requestId: null, sample: !live.value, savedPath: '', createdAt: new Date(),
  })
  jobs.value.unshift(job)
  try {
    if (!live.value) {
      for (const s of ['queued', 'in_progress']) { job.status = s; await new Promise((r) => setTimeout(r, props.sampleLatencyMs / 2)) }
      job.images = [{ url: sampleImage() }]
      job.status = 'completed'
      return
    }
    const refs = useRefs.value ? await uploadRefs(job) : []
    const submitted = await hf.submit(model.value.endpoint, inputFor(refs))
    job.requestId = submitted.request_id
    job.status = submitted.status || 'queued'
    const done = await hf.waitFor(job.requestId, { onUpdate: (s) => { job.status = s.status } })
    job.status = done.status
    job.images = done.images || []
    if (done.status !== 'completed') job.error = done.error || STATUS_TEXT[done.status]
  } catch (e) {
    job.status = 'error'
    job.error = e.code === 'concurrency' ? 'Higgsfield allows 4 requests at once. Wait for one to finish, then try again.' : e.message
  }
}

async function cancel(job) {
  try { await hf.cancel(job.requestId); job.status = 'canceled' } catch (e) { $q.notify({ message: e.message, color: 'dark' }) }
}

// ── Results → page ────────────────────────────────────────────────────────
function heroConcept(job, url) {
  const p = resolvePalette(project.brandKit.colors)
  return {
    layout: answers.space === 'right' ? 'framed' : 'editorial',
    headingFont: project.brandKit.typography?.heading,
    treatment: { background: shade(p.primary, 0.3), foreground: '#FFFFFF', accent: p.secondary, highlight: p.accent, imageSrc: url, imageAlt: '', overlay: job.baked ? 'none' : 'scrim', pattern: 'none' },
  }
}
const heroCopy = computed(() => ({
  brandKit: project.brandKit,
  headline: project.pages.landing.hero.headline || project.event.name,
  tagline: project.pages.landing.hero.tagline,
  dates: formatDateRange(project.event.startDate, project.event.endDate),
  location: locationLabel(project.event),
}))
const adSponsor = (job, url) => {
  const base = sponsors.value.find((s) => s.id === job.sponsorId) || { id: 'preview', name: project.event.name, colors: {}, logo: project.brandKit.logo }
  return { ...base, artwork: { ...(base.artwork || {}), [job.target.id]: { src: url, alt: `${base.name} ad` } } }
}

function useOnPage(job, url) {
  const asset = { id: uid('img'), src: url, alt: `${job.target.label} generated with ${job.model.label}`, kind: 'photo', credit: `Generated with Higgsfield · ${job.model.label}` }
  if (job.target.group === 'Sponsor ads' && job.sponsorId) {
    const s = sponsors.value.find((x) => x.id === job.sponsorId)
    project.upsertSponsor({ ...s, artwork: { ...(s.artwork || {}), [job.target.id]: asset } })
    $q.notify({ message: `Set as ${s.name}’s ${job.target.label} artwork`, icon: 'check', color: 'dark' })
  } else {
    project.addImage(asset)
    project.setHeroImage(asset.id)
    $q.notify({ message: 'Set as the event hero image', icon: 'check', color: 'dark' })
  }
  if (!job.sample && !job.savedPath) $q.notify({ message: 'Higgsfield keeps outputs for 7 days. Use “Save to repo” to keep it.', color: 'dark', timeout: 3500 })
}

async function saveToRepo(job, url) {
  try {
    const r = await hf.save(url, `${project.publishing.slug}-${job.target.id}`, { model: job.model.endpoint, prompt: job.prompt, requestId: job.requestId, target: job.target.id })
    job.savedPath = r.path
    $q.notify({ message: `Saved to ${r.path}`, icon: 'save', color: 'dark', timeout: 3000 })
  } catch (e) {
    $q.notify({ message: e.message, color: 'negative' })
  }
}
</script>

<template>
  <div class="bg">
    <!-- ── Brief column ──────────────────────────────────────────────── -->
    <section class="bg__brief" aria-label="Banner brief">
      <header class="bg__head">
        <p class="bs-eyebrow">Higgsfield · Banner generator</p>
        <h1 class="bs-title">Generate banners & ads</h1>
        <p class="bs-caption">Answer a few questions, add your logo, pick a model. We write the prompt; you approve the cost.</p>
      </header>

      <higgsfield-connection v-if="!sampleMode" compact @ready="health = { ...health, configured: true }" />
      <div class="bg__mode" role="group" aria-label="Generation mode">
        <q-toggle v-model="sample" :disable="!health.configured && !sampleMode" color="primary" label="Sample mode (stock images, no credits)" />
      </div>

      <!-- 1. Target -->
      <fieldset class="bg__step">
        <legend class="bg__legend"><span class="bg__num">1</span> What are you making?</legend>
        <div v-for="(list, group) in targetGroups" :key="group" class="bg__group">
          <p class="bg__glabel">{{ group }}</p>
          <div class="bg__chips" role="radiogroup" :aria-label="group">
            <button v-for="t in list" :key="t.id" type="button" role="radio" class="bg__chip bs-focusable" :aria-checked="targetId === t.id" @click="targetId = t.id">{{ t.label }}</button>
          </div>
        </div>
        <q-select v-if="isAd" v-model="sponsorId" :options="sponsors" option-value="id" option-label="name" emit-value map-options outlined dense label="Sponsor" class="q-mt-sm" />
      </fieldset>

      <!-- 2. Brief questions -->
      <fieldset class="bg__step">
        <legend class="bg__legend"><span class="bg__num">2</span> Tell us about the look</legend>
        <div v-for="q in BRIEF_QUESTIONS" :key="q.id" class="bg__q">
          <p class="bg__qlabel">{{ q.label }}</p>
          <div class="bg__chips" :role="q.type === 'multi' ? 'group' : 'radiogroup'" :aria-label="q.label">
            <button
              v-for="o in q.options" :key="o.value" type="button" class="bg__chip bs-focusable"
              :role="q.type === 'multi' ? undefined : 'radio'"
              :aria-pressed="q.type === 'multi' ? answers[q.id].includes(o.value) : undefined"
              :aria-checked="q.type === 'multi' ? undefined : answers[q.id] === o.value"
              @click="q.type === 'multi' ? toggleMulti(q, o.value) : (answers[q.id] = o.value)"
            >{{ o.label }}</button>
          </div>
        </div>
        <q-input v-if="answers.text === 'headline'" v-model="headline" outlined dense label="Headline to render" maxlength="80" class="q-mt-sm" />
      </fieldset>

      <!-- 3. Logo & references -->
      <fieldset class="bg__step">
        <legend class="bg__legend"><span class="bg__num">3</span> Logo & reference images</legend>
        <p class="bs-caption">
          {{ model.references ? `${model.label} accepts ${model.references === 1 ? 'one reference image' : `up to ${model.references} reference images`}. The logo goes first.` : `${model.label} doesn't take reference images; it uses your brand palette instead.` }}
        </p>
        <div v-if="logoRef" class="bg__logo">
          <img :src="logoRef.src" :alt="logoRef.alt" />
          <div><p class="bg__qlabel">{{ sponsor ? sponsor.name : 'Event' }} logo</p><p class="bs-caption">{{ answers.logo === 'skip' ? 'Not used' : answers.logo === 'place' ? 'Placed in the artwork' : 'Style & color reference' }}</p></div>
        </div>
        <asset-dropzone
          kind="photo" multiple compact :max-files="model.references > 1 ? 15 : 1"
          label="Add reference images" hint="Photos, past banners, sponsor products (PNG, JPG or WebP)"
          :assets="uploads" @add="uploads.push($event)" @remove="uploads = uploads.filter((u) => u.id !== $event)"
        />
        <div class="bg__palette" aria-label="Palette sent to the model">
          <span v-for="c in palette" :key="c" class="bg__swatch" :style="{ background: c }" :title="c" />
          <span class="bs-caption">{{ model.palette ? 'Enforced by Recraft' : 'Described in the prompt' }}</span>
        </div>
      </fieldset>

      <!-- 4. Model -->
      <fieldset class="bg__step">
        <legend class="bg__legend"><span class="bg__num">4</span> Choose a model</legend>
        <div class="bg__models" role="radiogroup" aria-label="Model">
          <button v-for="m in HF_MODELS" :key="m.id" type="button" role="radio" class="bg__model bs-focusable" :aria-checked="modelId === m.id" @click="modelId = m.id">
            <span class="bg__mname">{{ m.label }}</span>
            <span class="bg__mbadges">
              <span v-if="recommended === m.id" class="bs-pill bs-pill--ai">Recommended</span>
              <span class="bs-pill">{{ m.badge }}</span>
            </span>
            <span class="bs-caption">{{ m.summary }}</span>
          </button>
        </div>
        <div class="bg__opts">
          <q-select v-for="(o, k) in model.options" :key="k" v-model="options[k]" :options="o.values" outlined dense :label="o.label" class="bg__opt" />
          <div class="bg__aspect"><span class="bs-caption">Aspect ratio</span><strong>{{ aspectRatio }}</strong><span class="bs-caption">cropped to {{ target.width }}×{{ target.height }}</span></div>
        </div>
      </fieldset>

      <!-- 5. Prompt -->
      <fieldset class="bg__step">
        <legend class="bg__legend"><span class="bg__num">5</span> Review the prompt</legend>
        <q-input v-model="prompt" type="textarea" outlined autogrow label="Prompt (edit freely)" :maxlength="model.id === 'ideogram' ? 2048 : 5000" counter />
        <div class="bg__prow">
          <q-btn v-if="promptEdited" flat dense no-caps icon="restart_alt" label="Reset to brief" class="bs-btn" @click="promptOverride = null" />
          <q-expansion-item dense dense-toggle label="Request JSON" header-class="bg__json-h" class="bg__json">
            <pre>{{ requestPreview }}</pre>
          </q-expansion-item>
        </div>
      </fieldset>

      <div class="bg__go">
        <q-btn
          unelevated no-caps class="bs-btn bs-btn--ai bs-btn--lg full-width" icon="auto_awesome"
          :label="`Generate · ${costLabel || model.label}`" :disable="active >= 4" @click="generate"
        />
        <p class="bs-caption bg__note">{{ live ? 'Charged only on success. Failed and moderated requests are refunded.' : health.configured ? 'Sample mode: switch it off to generate for real.' : 'Sample mode: add your Higgsfield key (see Setup Guide) to generate for real.' }}</p>
      </div>
    </section>

    <!-- ── Results column ────────────────────────────────────────────── -->
    <section class="bg__results" aria-label="Results" aria-live="polite">
      <div v-if="!jobs.length" class="bg__empty">
        <q-icon name="auto_awesome" size="40px" />
        <h2 class="bs-subtitle">Your banners appear here</h2>
        <p class="bs-caption">Each result is shown in place on the real event hero or ad unit.</p>
      </div>

      <article v-for="job in jobs" :key="job.id" class="bg__job bs-card">
        <header class="bg__jhead">
          <div>
            <p class="bg__jtitle">{{ job.target.label }} · {{ job.model.label }}</p>
            <p class="bs-caption">{{ job.aspectRatio }} · {{ job.createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }}<template v-if="job.sample"> · sample</template></p>
          </div>
          <span class="bs-pill" :class="{ 'bs-pill--ai': !TERMINAL.includes(job.status) && job.status !== 'error' }">
            <q-spinner-dots v-if="!TERMINAL.includes(job.status) && job.status !== 'error'" size="14px" />
            {{ STATUS_TEXT[job.status] || job.status }}
          </span>
        </header>

        <div v-if="!job.images.length && !job.error" class="bg__pending">
          <q-skeleton :style="{ aspectRatio: `${job.target.width} / ${job.target.height}`, maxHeight: '320px', width: job.target.width < job.target.height ? '160px' : '100%' }" animation="wave" />
          <q-btn v-if="job.status === 'queued' && job.requestId" flat dense no-caps label="Cancel" class="bs-btn" @click="cancel(job)" />
        </div>
        <p v-if="job.error" class="bg__error"><q-icon name="error_outline" /> {{ job.error }}</p>

        <div v-for="img in job.images" :key="img.url" class="bg__result">
          <div class="bg__context">
            <template v-if="job.target.group === 'Event page'">
              <img v-if="job.baked" :src="img.url" alt="Generated banner with headline" class="bg__raw" />
              <brand-hero v-else v-bind="heroCopy" :concept="heroConcept(job, img.url)" size="landing" :heading-level="3" :class="{ 'bg__hero-m': job.target.id === 'hero-mobile' }" />
            </template>
            <ad-creative v-else :sponsor="adSponsor(job, img.url)" :size="job.target.id" :interactive="false" />
          </div>
          <div class="bg__actions">
            <q-btn unelevated no-caps class="bs-btn bs-btn--primary" icon="check" label="Use on my page" @click="useOnPage(job, img.url)" />
            <q-btn v-if="!job.sample" unelevated no-caps class="bs-btn bs-btn--ghost" :icon="job.savedPath ? 'check' : 'save'" :label="job.savedPath ? 'Saved' : 'Save to repo'" :disable="!!job.savedPath" @click="saveToRepo(job, img.url)" />
            <q-btn flat no-caps class="bs-btn" icon="open_in_new" label="Full size" :href="img.url" target="_blank" rel="noopener" />
          </div>
          <p v-if="job.savedPath" class="bs-caption"><code>{{ job.savedPath }}</code></p>
        </div>

        <q-expansion-item dense label="Prompt" class="bg__jprompt"><p class="bs-caption">{{ job.prompt }}</p></q-expansion-item>
      </article>
    </section>
  </div>
</template>

<style scoped>
.bg { display: grid; grid-template-columns: minmax(340px, 440px) minmax(0, 1fr); min-height: 100vh; background: var(--bs-canvas); font-family: var(--bs-font); }
.bg__brief { padding: 24px; border-right: 1px solid var(--bs-line); background: var(--bs-surface); display: grid; gap: 18px; align-content: start; }
.bg__head .bs-title { margin-top: 8px; }
.bg__head .bs-caption { margin-top: 6px; }
.bg__mode { margin-top: -6px; }
.bg__step { border: 0; padding: 0; margin: 0; display: grid; gap: 10px; min-width: 0; }
.bg__legend { display: flex; align-items: center; gap: 10px; font: 700 1rem var(--bs-font); color: var(--bs-ink); padding: 0; margin-bottom: 4px; }
.bg__num { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--bs-ink); color: #fff; font-size: 0.75rem; }
.bg__group, .bg__q { display: grid; gap: 6px; }
.bg__glabel, .bg__qlabel { margin: 0; font: 700 0.8125rem var(--bs-font); color: var(--bs-ink-soft); }
.bg__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.bg__chip { min-height: 34px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--bs-line); background: var(--bs-surface); font: 700 0.8125rem var(--bs-font); color: var(--bs-ink); cursor: pointer; }
.bg__chip[aria-checked='true'], .bg__chip[aria-pressed='true'] { background: var(--bs-ink); color: #fff; border-color: var(--bs-ink); }
.bg__logo { display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); background: repeating-conic-gradient(#F1F5F9 0% 25%, #fff 0% 50%) 0 0 / 14px 14px; }
.bg__logo img { width: 56px; height: 56px; object-fit: contain; }
.bg__logo div { background: rgb(255 255 255 / 0.9); padding: 4px 8px; border-radius: 6px; }
.bg__palette { display: flex; align-items: center; gap: 6px; }
.bg__swatch { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--bs-line); }
.bg__models { display: grid; gap: 8px; }
.bg__model { display: grid; gap: 4px; text-align: left; padding: 12px 14px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); background: var(--bs-surface); cursor: pointer; color: var(--bs-ink); }
.bg__model[aria-checked='true'] { border-color: var(--bs-accent); box-shadow: inset 0 0 0 1px var(--bs-accent); background: var(--bs-accent-soft); }
.bg__mname { font: 700 0.9375rem var(--bs-font); }
.bg__mbadges { display: flex; flex-wrap: wrap; gap: 6px; }
.bg__opts { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.bg__opt { min-width: 120px; flex: 1; }
.bg__aspect { display: grid; line-height: 1.2; padding: 4px 8px; }
.bg__prow { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 8px; }
.bg__json { flex: 1; min-width: 200px; }
.bg__json pre { margin: 0; padding: 10px; border-radius: 8px; background: var(--bs-ink); color: #E2E8F0; font: 0.75rem/1.5 ui-monospace, Menlo, monospace; white-space: pre-wrap; word-break: break-word; }
.bg__go { position: sticky; bottom: 0; padding: 12px 0 4px; background: linear-gradient(transparent, var(--bs-surface) 30%); }
.bg__note { margin-top: 6px; text-align: center; }

.bg__results { padding: 24px; display: grid; gap: 18px; align-content: start; min-width: 0; }
.bg__empty { display: grid; place-items: center; text-align: center; gap: 8px; min-height: 360px; border: 2px dashed var(--bs-line-strong); border-radius: var(--bs-radius-lg); color: var(--bs-ink-soft); }
.bg__job { padding: 16px; display: grid; gap: 12px; min-width: 0; }
.bg__jhead { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.bg__jtitle { margin: 0; font: 700 0.9375rem var(--bs-font); color: var(--bs-ink); }
.bg__pending { display: grid; gap: 8px; justify-items: start; }
.bg__error { margin: 0; color: var(--bs-danger); font-size: 0.875rem; display: flex; gap: 6px; align-items: center; }
.bg__result { display: grid; gap: 10px; min-width: 0; }
.bg__context { border-radius: var(--bs-radius-md); overflow: hidden; background: var(--bs-surface-2); display: grid; place-items: center; padding: 0; min-width: 0; }
.bg__raw { width: 100%; display: block; }
/* BrandHero sizes itself with container queries, so it needs an explicit width. */
.bg__context :deep(.bh) { width: 100%; }
.bg__context :deep(.bh.bg__hero-m) { width: 390px; max-width: 100%; }
.bg__actions { display: flex; flex-wrap: wrap; gap: 8px; }

@media (max-width: 900px) {
  .bg { grid-template-columns: 1fr; }
  .bg__brief { border-right: 0; border-bottom: 1px solid var(--bs-line); padding: 18px 16px; }
  .bg__results { padding: 18px 16px; }
}
</style>
