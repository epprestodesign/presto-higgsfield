<script setup>
// BrandPanel — the Brand Kit, compact: color roles, fonts, logo, hero image.
// Edits go straight to the project store, so every page preview re-themes live.
import { ref, computed } from 'vue'
import { useProjectStore } from '../../../stores/project.js'
import { FONT_OPTIONS, getFont } from '../../../theme/fonts.js'
import { normalizeHex } from '../../../theme/color.js'
import { paletteChecks } from '../../../theme/brandTheme.js'
import { validateUpload } from '../../../models/brandKit.js'
import { uid } from '../../../models/ids.js'
import { IMAGERY } from '../../../assets/imagery/index.js'
import PanelGroup from './PanelGroup.vue'

const store = useProjectStore()
const bk = computed(() => store.brandKit)

const ROLES = [
  { id: 'primary', label: 'Primary', hint: 'Buttons, hero, links' },
  { id: 'secondary', label: 'Secondary', hint: 'Supporting color' },
  { id: 'accent', label: 'Accent', hint: 'Highlights & CTAs' },
  { id: 'ink', label: 'Text', hint: 'Body copy' },
]

// Hex fields keep a local draft so half-typed values never hit the store.
const drafts = ref({})
const hexDraft = (role) => drafts.value[role] ?? bk.value.colors[role]
const hexError = ref({})
function onHexInput(role, v) {
  drafts.value = { ...drafts.value, [role]: v }
  const hex = normalizeHex(v)
  hexError.value = { ...hexError.value, [role]: !hex && v.length >= 4 }
  if (hex) store.setColor(role, hex)
}
function onHexBlur(role) {
  const { [role]: _, ...rest } = drafts.value
  drafts.value = rest
  hexError.value = { ...hexError.value, [role]: false }
}

const failing = computed(() => paletteChecks(bk.value.colors).filter((c) => !c.pass && !c.label.includes('(raw)')))

const fontOptions = FONT_OPTIONS.map((f) => ({ label: f.label, value: f.id, family: f.family, note: f.note }))

// Logo upload (visitor: data URL; Phase 2: Supabase Storage).
const fileInput = ref(null)
const logoError = ref('')
function pickLogo() { fileInput.value?.click() }
function onLogoFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  logoError.value = validateUpload(file, 'logo')
  if (logoError.value) return
  const reader = new FileReader()
  reader.onload = () => store.setLogo({ id: uid('asset'), src: reader.result, alt: `${store.event.name || 'Event'} logo`, kind: 'logo' })
  reader.onerror = () => (logoError.value = 'That file could not be read. Try another.')
  reader.readAsDataURL(file)
}

// Hero image choices: the organizer's own imagery first, then the library.
const heroChoices = computed(() => {
  const own = (bk.value.imagery || []).filter((a) => a.kind !== 'logo')
  const ids = new Set(own.map((a) => a.id))
  return [...own.map((a) => ({ ...a, own: true })), ...IMAGERY.filter((i) => !ids.has(i.id))]
})
function onHeroKey(e, i) {
  const n = heroChoices.value.length
  const delta = { ArrowRight: 1, ArrowDown: 3, ArrowLeft: -1, ArrowUp: -3 }[e.key]
  if (delta === undefined) return
  e.preventDefault()
  const next = heroChoices.value[(i + delta + n) % n]
  store.setHeroImage(next.id)
  e.currentTarget.parentElement.children[(i + delta + n) % n]?.focus()
}
</script>

<template>
  <div class="bp">
    <PanelGroup title="Colors" hint="Applied to every page at once.">
      <div v-for="r in ROLES" :key="r.id" class="bp__color">
        <button type="button" class="bp__swatch bs-focusable" :style="{ background: bk.colors[r.id] }" :aria-label="`Pick ${r.label} color, currently ${bk.colors[r.id]}`">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-color
              :model-value="bk.colors[r.id]"
              format-model="hex"
              no-header-tabs
              default-view="spectrum"
              class="bp__picker"
              @update:model-value="(v) => store.setColor(r.id, normalizeHex(v) || v)"
            />
          </q-popup-proxy>
        </button>
        <div class="bp__color-meta">
          <label :for="`hex-${r.id}`" class="bp__label">{{ r.label }}</label>
          <span class="bp__sub">{{ r.hint }}</span>
        </div>
        <input
          :id="`hex-${r.id}`"
          class="bp__hex bs-focusable"
          :class="{ 'is-error': hexError[r.id] }"
          :value="hexDraft(r.id)"
          spellcheck="false"
          maxlength="7"
          :aria-invalid="!!hexError[r.id]"
          @input="onHexInput(r.id, $event.target.value)"
          @blur="onHexBlur(r.id)"
        />
      </div>
      <div v-if="failing.length" class="bp__warn" role="status">
        <q-icon name="contrast" size="16px" />
        <span>{{ failing[0].label }} is {{ failing[0].ratio }}:1 — below the 4.5:1 AA minimum. Try a darker or lighter shade.</span>
      </div>
      <p v-else class="bp__ok"><q-icon name="check_circle" size="16px" /> Text contrast passes WCAG AA</p>
    </PanelGroup>

    <PanelGroup title="Typography">
      <q-select
        v-for="role in ['heading', 'body']"
        :key="role"
        :model-value="bk.typography[role]"
        :options="fontOptions"
        emit-value
        map-options
        outlined
        dense
        options-dense
        :label="role === 'heading' ? 'Headings' : 'Body text'"
        class="bp__font"
        @update:model-value="(v) => store.setFont(role, v)"
      >
        <template #selected>
          <span :style="{ fontFamily: getFont(bk.typography[role]).family }">{{ getFont(bk.typography[role]).label }}</span>
        </template>
        <template #option="{ itemProps, opt, selected }">
          <q-item v-bind="itemProps" :active="selected">
            <q-item-section>
              <q-item-label :style="{ fontFamily: opt.family, fontSize: '1rem' }">{{ opt.label }}</q-item-label>
              <q-item-label v-if="opt.note" caption>{{ opt.note }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </PanelGroup>

    <PanelGroup title="Logo">
      <div class="bp__logo">
        <div class="bp__logo-box" :class="{ 'is-empty': !bk.logo }">
          <img v-if="bk.logo" :src="bk.logo.src" :alt="bk.logo.alt" />
          <q-icon v-else name="image" size="22px" />
        </div>
        <div class="bp__logo-actions">
          <q-btn unelevated no-caps class="bs-btn bs-btn--ghost bp__small-btn" :label="bk.logo ? 'Replace' : 'Upload logo'" icon="upload" @click="pickLogo" />
          <q-btn v-if="bk.logo" flat no-caps dense class="bp__link" label="Remove" @click="store.setLogo(null)" />
        </div>
        <input ref="fileInput" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" class="bs-sr-only" tabindex="-1" aria-hidden="true" @change="onLogoFile" />
      </div>
      <p v-if="logoError" class="bp__error" role="alert">{{ logoError }}</p>
      <p v-else class="bp__sub">SVG or transparent PNG works best · up to 2 MB</p>
    </PanelGroup>

    <PanelGroup title="Hero image" hint="Used by photographic concepts on the landing banner.">
      <div class="bp__heroes" role="radiogroup" aria-label="Hero image">
        <button
          v-for="(img, i) in heroChoices"
          :key="img.id"
          type="button"
          role="radio"
          class="bp__hero bs-focusable"
          :class="{ 'is-selected': bk.heroImageId === img.id }"
          :aria-checked="bk.heroImageId === img.id"
          :tabindex="bk.heroImageId === img.id || (!bk.heroImageId && i === 0) ? 0 : -1"
          :aria-label="img.alt"
          @click="store.setHeroImage(img.id)"
          @keydown="onHeroKey($event, i)"
        >
          <img :src="img.src" alt="" loading="lazy" />
          <span v-if="img.own" class="bp__hero-tag">Yours</span>
          <q-icon v-if="bk.heroImageId === img.id" name="check_circle" class="bp__hero-check" size="18px" />
          <q-tooltip v-if="img.credit" :delay="400">{{ img.credit }}</q-tooltip>
        </button>
      </div>
    </PanelGroup>
  </div>
</template>

<style scoped>
.bp { font-family: var(--bs-font); }
.bp__color { display: grid; grid-template-columns: 36px minmax(0, 1fr) 92px; align-items: center; gap: 10px; }
.bp__swatch { width: 36px; height: 36px; border-radius: var(--bs-radius-sm); border: 1px solid rgb(0 0 0 / 0.12); box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.5); cursor: pointer; padding: 0; }
.bp__color-meta { display: flex; flex-direction: column; min-width: 0; }
.bp__label { font: 700 0.875rem/1.2 var(--bs-font); color: var(--bs-ink); }
.bp__sub { font: 400 0.75rem/1.35 var(--bs-font); color: var(--bs-ink-soft); margin: 0; }
.bp__hex { width: 100%; height: 34px; padding: 0 8px; border: 1px solid var(--bs-line-strong); border-radius: var(--bs-radius-sm); font: 400 0.8125rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; color: var(--bs-ink); background: var(--bs-surface); }
.bp__hex:focus { border-color: var(--bs-accent); }
.bp__hex.is-error { border-color: var(--bs-danger); }
.bp__picker { max-width: 260px; }
.bp__warn { display: flex; gap: 8px; align-items: flex-start; padding: 8px 10px; border-radius: var(--bs-radius-sm); background: #FFFBEB; color: #92400E; font: 400 0.8125rem/1.4 var(--bs-font); }
.bp__warn .q-icon { margin-top: 1px; }
.bp__ok { display: flex; align-items: center; gap: 6px; margin: 0; font: 400 0.8125rem/1.3 var(--bs-font); color: #166534; }
.bp__font :deep(.q-field__control) { border-radius: var(--bs-radius-sm); }
.bp__logo { display: flex; align-items: center; gap: 12px; }
.bp__logo-box { width: 72px; height: 72px; flex: none; display: grid; place-items: center; border-radius: var(--bs-radius-md); border: 1px solid var(--bs-line); background: repeating-conic-gradient(#F1F5F9 0 25%, #fff 0 50%) 0 0 / 14px 14px; overflow: hidden; }
.bp__logo-box img { max-width: 84%; max-height: 84%; object-fit: contain; }
.bp__logo-box.is-empty { background: var(--bs-surface-2); color: var(--bs-ink-faint); border-style: dashed; }
.bp__logo-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.q-btn.bp__small-btn { min-height: 34px; padding: 0 12px; font-size: 0.8125rem; }
.bp__link { color: var(--bs-ink-soft); font-size: 0.8125rem; }
.bp__error { margin: 0; color: var(--bs-danger); font: 400 0.8125rem/1.4 var(--bs-font); }
.bp__heroes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.bp__hero { position: relative; aspect-ratio: 4 / 3; padding: 0; border: 0; border-radius: var(--bs-radius-sm); overflow: hidden; cursor: pointer; background: var(--bs-surface-2); box-shadow: 0 0 0 1px var(--bs-line); }
.bp__hero img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform var(--ds-duration-base) var(--ds-ease-standard); }
.bp__hero:hover img { transform: scale(1.04); }
.bp__hero.is-selected { box-shadow: 0 0 0 2px var(--bs-brand), 0 0 0 4px #fff inset; }
.bp__hero-check { position: absolute; top: 4px; right: 4px; color: #fff; background: var(--bs-brand); border-radius: 50%; }
.bp__hero-tag { position: absolute; left: 4px; bottom: 4px; padding: 1px 6px; border-radius: 999px; background: rgb(3 10 38 / 0.72); color: #fff; font: 700 0.625rem/1.5 var(--bs-font); letter-spacing: 0.04em; text-transform: uppercase; }
</style>
