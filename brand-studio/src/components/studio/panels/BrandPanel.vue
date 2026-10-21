<script setup>
// BrandPanel — the Brand Kit, compact: color wheel (roles + harmonies), fonts,
// logo, hero image.
// Edits go straight to the project store, so every page preview re-themes live.
import { ref, computed } from 'vue'
import { useProjectStore } from '../../../stores/project.js'
import { FONT_OPTIONS, getFont } from '../../../theme/fonts.js'
import { validateUpload } from '../../../models/brandKit.js'
import { uid } from '../../../models/ids.js'
import { IMAGERY } from '../../../assets/imagery/index.js'
import PanelGroup from './PanelGroup.vue'
import ColorWheelPicker from '../../brand-kit/ColorWheelPicker.vue'

const store = useProjectStore()
const bk = computed(() => store.brandKit)

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
    <PanelGroup title="Colors" hint="Applied to every page at once. Drag on the wheel or pick a harmony.">
      <color-wheel-picker />
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
.bp__sub { font: 400 0.75rem/1.35 var(--bs-font); color: var(--bs-ink-soft); margin: 0; }
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
