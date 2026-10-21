<script setup>
// SponsorEditor — lets organizers preview sponsor branding: name, message, CTA,
// destination URL, colors, logo and optional per-size artwork, with live
// creatives at the sizes their page layout uses. Saves into the project store
// (project.upsertSponsor / removeSponsor). Visual simulation only.
import { ref, computed, watch } from 'vue'
import { useProjectStore } from '../../stores/project.js'
import { createSponsor, AD_SIZES } from '../../models/ads.js'
import { validateUpload } from '../../models/brandKit.js'
import { contrast, normalizeHex } from '../../theme/color.js'
import AdCreative from './AdCreative.vue'

const props = defineProps({
  // Sizes shown in the live preview strip.
  previewSizes: { type: Array, default: () => ['300x250', '160x600', '970x90', '320x100'] },
})
const emit = defineEmits(['saved', 'removed'])

const store = useProjectStore()
const sponsors = computed(() => store.project.ads.sponsors)

const selectedId = ref(sponsors.value[0]?.id || null)
const draft = ref(null)
const isNew = ref(false)
const saved = ref(false)

const clone = (o) => JSON.parse(JSON.stringify(o))
function load(id) {
  const s = sponsors.value.find((x) => x.id === id)
  draft.value = s ? clone(s) : null
  isNew.value = false
  saved.value = false
}
watch(selectedId, load, { immediate: true })

function addSponsor() {
  const s = createSponsor({ name: '', tagline: '', cta: 'Learn more', url: 'https://' })
  draft.value = s
  selectedId.value = null
  isNew.value = true
  saved.value = false
}

// ── Validation ─────────────────────────────────────────────────────────────
const urlError = computed(() => {
  const u = (draft.value?.url || '').trim()
  if (!u || u === 'https://') return 'Add the page this ad links to.'
  let parsed
  try { parsed = new URL(u) } catch { return 'Enter a full web address, like https://sponsor.com/offer.' }
  if (parsed.protocol !== 'https:') return 'Use a secure https:// link.'
  if (!parsed.hostname.includes('.')) return 'Enter a public website address.'
  return ''
})
const nameError = computed(() => (draft.value && !draft.value.name.trim() ? 'Sponsor name is required.' : ''))
const touched = ref({})
const showErr = (field, err) => (touched.value[field] || touched.value._all ? err : '')

const fgRatio = computed(() => (draft.value ? contrast(draft.value.colors.foreground, draft.value.colors.background) : 21))
const ctaRatio = computed(() => (draft.value ? contrast(draft.value.colors.background, draft.value.colors.accent) : 21))
const valid = computed(() => !!draft.value && !nameError.value && !urlError.value)

function setColor(role, value) {
  const hex = normalizeHex(value)
  if (hex) draft.value.colors[role] = hex
}

// ── Uploads (visitor: data URLs; Phase 2: Supabase Storage) ───────────────
const uploadError = ref('')
const artworkSize = ref('300x250')
const readFile = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file) })

async function onLogo(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  uploadError.value = validateUpload(file, 'logo')
  if (uploadError.value) return
  draft.value.logo = { id: `logo-${Date.now()}`, src: await readFile(file), alt: draft.value.name || file.name, kind: 'logo' }
}
async function onArtwork(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  uploadError.value = validateUpload(file, 'photo')
  if (uploadError.value) return
  draft.value.artwork = { ...draft.value.artwork, [artworkSize.value]: { id: `art-${Date.now()}`, src: await readFile(file), alt: `${draft.value.name || 'Sponsor'} ad`, kind: 'photo' } }
}
const removeArtwork = (size) => { const a = { ...draft.value.artwork }; delete a[size]; draft.value.artwork = a }

// ── Save / delete ─────────────────────────────────────────────────────────
function save() {
  touched.value = { _all: true }
  if (!valid.value) return
  const s = clone(draft.value)
  s.name = s.name.trim()
  s.url = s.url.trim()
  store.upsertSponsor(s)
  if (!store.project.ads.enabled) store.setAdsEnabled(true)
  selectedId.value = s.id
  isNew.value = false
  saved.value = true
  emit('saved', s)
}
function remove() {
  if (!draft.value) return
  const id = draft.value.id
  if (!isNew.value) store.removeSponsor(id)
  emit('removed', id)
  selectedId.value = sponsors.value[0]?.id || null
  if (!selectedId.value) draft.value = null
}
watch(draft, () => { saved.value = false }, { deep: true })

const sizeOptions = Object.entries(AD_SIZES).map(([value, s]) => ({ value, label: `${value.replace('x', '×')} · ${s.name}` }))
const fmtRatio = (r) => `${r.toFixed(1)}:1`
</script>

<template>
  <div class="se">
    <!-- Sponsor list -->
    <aside class="se__list bs-card" aria-label="Sponsors">
      <div class="se__list-head">
        <h3 class="bs-subtitle">Sponsors</h3>
        <q-toggle
          :model-value="store.project.ads.enabled"
          label="Show ads"
          dense
          @update:model-value="store.setAdsEnabled($event)"
        />
      </div>
      <ul class="se__items">
        <li v-for="s in sponsors" :key="s.id">
          <button
            type="button"
            class="se__item bs-focusable"
            :class="{ 'se__item--on': s.id === selectedId && !isNew }"
            :aria-current="s.id === selectedId && !isNew ? 'true' : undefined"
            @click="selectedId = s.id"
          >
            <span class="se__swatch" :style="{ background: s.colors.background }">
              <img v-if="s.logo?.src" :src="s.logo.src" alt="" />
            </span>
            <span class="se__item-name">{{ s.name || 'Untitled sponsor' }}</span>
          </button>
        </li>
        <li v-if="isNew">
          <span class="se__item se__item--on"><span class="se__swatch" :style="{ background: draft.colors.background }" /><span class="se__item-name">{{ draft.name || 'New sponsor' }}</span></span>
        </li>
      </ul>
      <p v-if="!sponsors.length && !isNew" class="bs-caption se__empty">No sponsors yet. Add one to preview ads on your pages.</p>
      <q-btn class="bs-btn bs-btn--ghost se__add" unelevated no-caps icon="add" label="Add sponsor" @click="addSponsor" />
    </aside>

    <!-- Editor -->
    <section v-if="draft" class="se__form bs-card" aria-label="Sponsor details">
      <div class="se__grid">
        <q-input v-model="draft.name" outlined label="Sponsor name *" maxlength="48" :error="!!showErr('name', nameError)" :error-message="showErr('name', nameError)" @blur="touched.name = true" />
        <q-input v-model="draft.cta" outlined label="Button label" maxlength="24" counter hint="Short and specific, e.g. “Book a team table”" />
        <q-input v-model="draft.tagline" class="se__span" outlined autogrow label="Message" maxlength="90" counter hint="One line attendees will read in a second." />
        <q-input
          v-model="draft.url"
          class="se__span"
          outlined
          type="url"
          label="Destination URL *"
          inputmode="url"
          :error="!!showErr('url', urlError)"
          :error-message="showErr('url', urlError)"
          hint="Opens in a new tab, marked as a sponsored link."
          @blur="touched.url = true"
        >
          <template #prepend><q-icon name="link" /></template>
        </q-input>
      </div>

      <fieldset class="se__fieldset">
        <legend class="bs-subtitle">Colors</legend>
        <div class="se__colors">
          <label v-for="role in ['background', 'foreground', 'accent']" :key="role" class="se__color">
            <input type="color" :value="draft.colors[role]" :aria-label="`${role} color`" @input="setColor(role, $event.target.value)" />
            <span class="se__color-text">
              <span class="bs-caption se__color-role">{{ role === 'foreground' ? 'Text' : role === 'accent' ? 'Button' : 'Background' }}</span>
              <input class="se__hex" :value="draft.colors[role]" maxlength="7" spellcheck="false" :aria-label="`${role} hex`" @change="setColor(role, $event.target.value)" />
            </span>
          </label>
        </div>
        <p class="bs-caption se__contrast" :class="{ 'se__contrast--bad': fgRatio < 4.5 || ctaRatio < 3 }" aria-live="polite">
          <q-icon :name="fgRatio >= 4.5 && ctaRatio >= 3 ? 'check_circle' : 'warning'" size="16px" />
          Text contrast {{ fmtRatio(fgRatio) }} · Button contrast {{ fmtRatio(ctaRatio) }}
          <span v-if="fgRatio < 4.5"> — text may be hard to read.</span>
        </p>
      </fieldset>

      <fieldset class="se__fieldset">
        <legend class="bs-subtitle">Logo & artwork</legend>
        <div class="se__uploads">
          <div class="se__upload">
            <span class="se__swatch se__swatch--lg" :style="{ background: draft.colors.background }">
              <img v-if="draft.logo?.src" :src="draft.logo.src" alt="" />
              <q-icon v-else name="image" size="22px" />
            </span>
            <label class="q-btn bs-btn bs-btn--ghost se__filebtn">
              <input type="file" class="bs-sr-only" accept="image/svg+xml,image/png,image/jpeg,image/webp" @change="onLogo" />
              {{ draft.logo ? 'Replace logo' : 'Upload logo' }}
            </label>
            <q-btn v-if="draft.logo" flat dense no-caps label="Remove" @click="draft.logo = null" />
          </div>
          <div class="se__upload">
            <q-select v-model="artworkSize" :options="sizeOptions" emit-value map-options outlined dense label="Artwork size" class="se__sizesel" />
            <label class="q-btn bs-btn bs-btn--ghost se__filebtn">
              <input type="file" class="bs-sr-only" accept="image/png,image/jpeg,image/webp" @change="onArtwork" />
              Upload {{ artworkSize.replace('x', '×') }} artwork
            </label>
          </div>
          <ul v-if="Object.keys(draft.artwork || {}).length" class="se__arts">
            <li v-for="(a, size) in draft.artwork" :key="size" class="bs-pill">
              {{ String(size).replace('x', '×') }} artwork
              <button type="button" class="se__x" :aria-label="`Remove ${size} artwork`" @click="removeArtwork(size)">×</button>
            </li>
          </ul>
          <p class="bs-caption">Optional. Sizes without artwork use the layout above, built from your logo, message and colors.</p>
          <p v-if="uploadError" class="se__err" role="alert">{{ uploadError }}</p>
        </div>
      </fieldset>

      <div class="se__actions">
        <q-btn class="bs-btn bs-btn--primary" unelevated no-caps :label="isNew ? 'Add sponsor' : 'Save changes'" @click="save" />
        <q-btn class="bs-btn" flat no-caps :label="isNew ? 'Cancel' : 'Remove sponsor'" :color="isNew ? undefined : 'negative'" @click="remove" />
        <span v-if="saved" class="se__saved" role="status"><q-icon name="check" size="16px" /> Saved</span>
      </div>
    </section>

    <!-- Live preview -->
    <section v-if="draft" class="se__preview" aria-label="Live ad preview">
      <p class="bs-eyebrow">Live preview</p>
      <div class="se__previews">
        <figure v-for="size in previewSizes" :key="size" class="se__fig" :data-size="size">
          <ad-creative :sponsor="draft" :size="size" :interactive="false" />
          <figcaption class="bs-caption">{{ size.replace('x', '×') }}</figcaption>
        </figure>
      </div>
    </section>
    <section v-else class="se__form se__form--empty bs-card">
      <q-icon name="campaign" size="40px" />
      <p class="bs-subtitle">Add a sponsor to see ads on your pages</p>
      <p class="bs-caption">Sponsored placements are a preview of what EventPipe can run for your partners. Nothing is served or tracked.</p>
    </section>
  </div>
</template>

<style scoped>
.se { display: grid; grid-template-columns: 260px minmax(0, 1fr); grid-template-areas: 'list form' 'list preview'; gap: 20px; align-items: start; font-family: var(--bs-font); }
.se__list { grid-area: list; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.se__list-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.se__items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.se__item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid transparent; border-radius: var(--bs-radius-sm); background: none; font: 700 0.9375rem/1.2 var(--bs-font); color: var(--bs-ink); text-align: left; cursor: pointer; }
.se__item:hover { background: var(--bs-surface-2); }
.se__item--on { background: var(--bs-accent-soft); border-color: var(--bs-accent-line); }
.se__item-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.se__swatch { flex: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #fff; }
.se__swatch img { width: 78%; height: 78%; object-fit: contain; }
.se__swatch--lg { width: 56px; height: 56px; border-radius: 12px; }
.se__empty { margin: 0; }
.se__add { align-self: flex-start; }

.se__form { grid-area: form; padding: 22px; display: flex; flex-direction: column; gap: 18px; }
.se__form--empty { align-items: center; text-align: center; gap: 8px; padding: 48px 24px; color: var(--bs-ink-soft); }
.se__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
.se__span { grid-column: 1 / -1; }
.se__fieldset { border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.se__fieldset legend { margin-bottom: 10px; }
.se__colors { display: flex; flex-wrap: wrap; gap: 12px; }
.se__color { display: flex; align-items: center; gap: 10px; padding: 8px 12px 8px 8px; border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); cursor: pointer; }
.se__color input[type='color'] { width: 36px; height: 36px; border: 0; padding: 0; border-radius: 8px; background: none; cursor: pointer; }
.se__color-text { display: flex; flex-direction: column; }
.se__color-role { line-height: 1; }
.se__hex { width: 84px; border: 0; padding: 2px 0; font: 700 0.875rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--bs-ink); background: none; text-transform: uppercase; }
.se__hex:focus-visible { outline: none; box-shadow: var(--bs-ring); border-radius: 4px; }
.se__contrast { display: flex; align-items: center; gap: 6px; color: var(--bs-success); }
.se__contrast--bad { color: #B45309; }
.se__uploads { display: flex; flex-direction: column; gap: 12px; }
.se__upload { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.se__filebtn { display: inline-flex; align-items: center; cursor: pointer; }
.se__filebtn:focus-within { box-shadow: var(--bs-ring); }
.se__sizesel { min-width: 240px; }
.se__arts { list-style: none; margin: 0; padding: 0; display: flex; gap: 8px; flex-wrap: wrap; }
.se__x { border: 0; background: none; font-size: 16px; line-height: 1; cursor: pointer; color: inherit; padding: 0 0 0 4px; }
.se__err { margin: 0; color: var(--bs-danger); font-size: 0.875rem; }
.se__actions { display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--bs-line); padding-top: 16px; }
.se__saved { display: inline-flex; align-items: center; gap: 4px; color: var(--bs-success); font-weight: 700; font-size: 0.875rem; }

.se__preview { grid-area: preview; display: flex; flex-direction: column; gap: 12px; }
.se__previews { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; padding: 20px; border-radius: var(--bs-radius-lg); background: repeating-conic-gradient(#F1F5F9 0% 25%, #FFFFFF 0% 50%) 0 0 / 20px 20px; border: 1px solid var(--bs-line); }
.se__fig { margin: 0; display: flex; flex-direction: column; gap: 6px; max-width: 100%; }

@media (max-width: 860px) {
  .se { grid-template-columns: 1fr; grid-template-areas: 'list' 'form' 'preview'; }
  .se__grid { grid-template-columns: 1fr; }
}
</style>
