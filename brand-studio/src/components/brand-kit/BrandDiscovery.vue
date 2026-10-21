<script setup>
// BrandDiscovery — the editable Brand Kit (spec 4C): website scan with
// approval, logo, color roles with live WCAG checks, typography, reference
// imagery (hero pick), creative direction + mood keywords. Every edit writes
// through the project store, so the preview on the right — and every booking
// page — re-themes instantly. Emits 'next' and 'back'.
import { ref, computed, useId } from 'vue'
import { useProjectStore } from '../../stores/project.js'
import { paletteChecks } from '../../theme/brandTheme.js'
import { FONT_OPTIONS, getFont } from '../../theme/fonts.js'
import { CREATIVE_DIRECTIONS } from '../../models/brandKit.js'
import { formatDateRange, locationLabel } from '../../models/event.js'
import { starterContent } from '../../models/content.js'
import { buildConcept } from '../../providers/ai/conceptFactory.js'
import { IMAGERY } from '../../assets/imagery/index.js'
import BrandThemeProvider from '../../theme/BrandThemeProvider.vue'
import BrandHero from '../brand/BrandHero.vue'
import AssetDropzone from '../intake/AssetDropzone.vue'
import ColorRoleField from './ColorRoleField.vue'
import BrandScanPanel from './BrandScanPanel.vue'

const props = defineProps({
  // Start the website scan on mount (stories / arriving from intake with a URL).
  autoScan: { type: Boolean, default: false },
  scanDelayMs: { type: Number, default: 650 },
})
const emit = defineEmits(['next', 'back'])

const project = useProjectStore()
const bk = computed(() => project.brandKit)
const ev = computed(() => project.event)
const uidBase = useId()

// ── Colors ────────────────────────────────────────────────────────────────
const COLOR_ROLES = [
  { role: 'primary', label: 'Primary', description: 'Buttons, banner and links.' },
  { role: 'secondary', label: 'Secondary', description: 'Accents, stripes and highlights.' },
  { role: 'accent', label: 'Accent', description: 'Calls to action on your banner.' },
  { role: 'ink', label: 'Ink', description: 'Dark text and dark surfaces.' },
]
const checks = computed(() => paletteChecks(bk.value.colors))

// ── Typography ────────────────────────────────────────────────────────────
const fontOptions = FONT_OPTIONS.map((f) => ({ ...f, value: f.id }))
const headingFont = computed(() => getFont(bk.value.typography.heading))
const bodyFont = computed(() => getFont(bk.value.typography.body))

// ── Imagery ───────────────────────────────────────────────────────────────
const photos = computed(() => (bk.value.imagery || []).filter((a) => a.kind !== 'logo'))
const libraryOpen = ref(false)
const libraryTag = ref('all')
const LIB_TAGS = [
  { value: 'all', label: 'All' }, { value: 'sports', label: 'Sports' }, { value: 'conference', label: 'Conference' },
  { value: 'wedding', label: 'Wedding' }, { value: 'running', label: 'Running' }, { value: 'city', label: 'City' },
]
const library = computed(() =>
  IMAGERY.filter((img) => !photos.value.some((p) => p.id === img.id) && (libraryTag.value === 'all' || img.tags.includes(libraryTag.value))),
)
function addPhoto(asset) {
  project.addImage(asset)
  if (!bk.value.heroImageId) project.setHeroImage(asset.id)
}
const addFromLibrary = (img) => addPhoto({ id: img.id, src: img.src, alt: img.alt, kind: 'photo', credit: img.credit })

// ── Direction + keywords ──────────────────────────────────────────────────
const SUGGESTED_KEYWORDS = {
  sports: ['competitive', 'family-friendly', 'electric', 'hometown', 'championship'],
  conference: ['innovative', 'professional', 'optimistic', 'bold', 'global'],
  wedding: ['romantic', 'elegant', 'warm', 'timeless', 'joyful'],
  festival: ['vibrant', 'loud', 'artsy', 'late-night', 'eclectic'],
  other: ['welcoming', 'modern', 'friendly', 'premium'],
}
const keywordDraft = ref('')
const keywordSuggestions = computed(() =>
  (SUGGESTED_KEYWORDS[ev.value.category] || SUGGESTED_KEYWORDS.other).filter((k) => !bk.value.keywords.includes(k)),
)
function addKeyword(word) {
  const k = String(word || '').trim().toLowerCase().slice(0, 24)
  if (!k || bk.value.keywords.includes(k) || bk.value.keywords.length >= 8) return
  project.updateBrandKit({ keywords: [...bk.value.keywords, k] })
  keywordDraft.value = ''
}
const removeKeyword = (k) => project.updateBrandKit({ keywords: bk.value.keywords.filter((x) => x !== k) })

// ── Live preview ──────────────────────────────────────────────────────────
const layoutVariant = ref(0)
const heroAsset = computed(() => photos.value.find((p) => p.id === bk.value.heroImageId) || null)
const previewConcept = computed(() => {
  const c = buildConcept({ direction: bk.value.direction, templateIndex: layoutVariant.value, brandKit: bk.value, event: ev.value })
  if (c.treatment.imageSrc && heroAsset.value) c.treatment.imageSrc = heroAsset.value.src
  return c
})
const heroProps = computed(() => ({
  brandKit: bk.value,
  headline: ev.value.name || 'Your event name',
  tagline: project.pages.landing.hero.tagline || starterContent(ev.value).tagline,
  dates: formatDateRange(ev.value.startDate, ev.value.endDate),
  location: locationLabel(ev.value),
}))
const directionName = computed(() => CREATIVE_DIRECTIONS.find((d) => d.id === bk.value.direction)?.name)
</script>

<template>
  <div class="bd">
    <header class="bd__head">
      <div>
        <p class="bs-eyebrow">Brand discovery</p>
        <h1 class="bs-display-2 bd__title">Your brand kit</h1>
        <p class="bs-lead bd__lead">One kit themes every page of your booking site — landing, hotel results and hotel details — at once. Edit anything; changes preview instantly.</p>
      </div>
      <span class="bd__source bs-pill" :class="{ 'bs-pill--ai': bk.source === 'suggested' }">
        <q-icon :name="bk.source === 'suggested' ? 'auto_awesome' : 'edit'" size="14px" />
        {{ bk.source === 'suggested' ? 'Started from suggestions' : 'Set up by hand' }}
      </span>
    </header>

    <div class="bd__grid">
      <div class="bd__main">
        <brand-scan-panel :auto-scan="autoScan" :delay-ms="scanDelayMs" />

        <!-- Logo -->
        <section class="bd__card bs-card" :aria-labelledby="`${uidBase}-logo`">
          <div class="bd__card-head">
            <h2 :id="`${uidBase}-logo`" class="bs-subtitle">Logo</h2>
            <p class="bs-caption">Use SVG or a transparent PNG. Add a light version if your logo disappears on dark banners.</p>
          </div>
          <div class="bd__logos">
            <div class="bd__logo-slot">
              <p class="bd__slot-label">On light backgrounds</p>
              <asset-dropzone kind="logo" compact label="Upload logo" :assets="bk.logo ? [bk.logo] : []" @add="project.setLogo($event)" @remove="project.setLogo(null)" />
            </div>
            <div class="bd__logo-slot bd__logo-slot--dark">
              <p class="bd__slot-label">On dark backgrounds <span>(optional)</span></p>
              <asset-dropzone kind="logo" compact label="Upload light logo" :assets="bk.logoOnDark ? [bk.logoOnDark] : []" @add="project.updateBrandKit({ logoOnDark: $event })" @remove="project.updateBrandKit({ logoOnDark: null })" />
            </div>
          </div>
          <p v-if="bk.logo?.placeholder" class="bd__warn"><q-icon name="info" size="16px" /> This is a placeholder monogram from the website scan. Upload your real logo for best results.</p>
        </section>

        <!-- Colors -->
        <section class="bd__card bs-card" :aria-labelledby="`${uidBase}-colors`">
          <div class="bd__card-head">
            <h2 :id="`${uidBase}-colors`" class="bs-subtitle">Colors</h2>
            <p class="bs-caption">Four roles cover the whole booking site. Paste a hex code or pick visually.</p>
          </div>
          <div class="bd__colors">
            <color-role-field
              v-for="c in COLOR_ROLES"
              :key="c.role"
              :label="c.label"
              :description="c.description"
              :model-value="bk.colors[c.role]"
              @update:model-value="project.setColor(c.role, $event)"
            />
          </div>
          <div class="bd__checks" :aria-labelledby="`${uidBase}-a11y`">
            <h3 :id="`${uidBase}-a11y`" class="bd__checks-title"><q-icon name="accessibility_new" size="18px" /> Readability (WCAG AA)</h3>
            <ul>
              <li v-for="r in checks" :key="r.label" class="bd__check">
                <span class="bd__aa" :style="{ color: r.fg, background: r.bg }" aria-hidden="true">Aa</span>
                <span class="bd__check-label">{{ r.label }}</span>
                <span class="bd__ratio">{{ r.ratio.toFixed(1) }}:1</span>
                <span class="bd__verdict" :class="r.pass ? 'is-pass' : 'is-fail'">
                  <q-icon :name="r.pass ? 'check' : 'warning'" size="14px" /> {{ r.pass ? 'Passes' : 'Low contrast' }}
                </span>
              </li>
            </ul>
            <p class="bs-caption">Brand-colored text is darkened automatically where needed, so links and labels always stay readable.</p>
          </div>
        </section>

        <!-- Typography -->
        <section class="bd__card bs-card" :aria-labelledby="`${uidBase}-type`">
          <div class="bd__card-head">
            <h2 :id="`${uidBase}-type`" class="bs-subtitle">Typography</h2>
            <p class="bs-caption">Pick a heading face with personality and a body face that’s easy to read.</p>
          </div>
          <div class="bd__fonts">
            <q-select
              v-for="role in ['heading', 'body']"
              :key="role"
              outlined
              :label="role === 'heading' ? 'Heading font' : 'Body font'"
              :model-value="bk.typography[role]"
              :options="fontOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              @update:model-value="project.setFont(role, $event)"
            >
              <template #selected-item="scope">
                <span :style="{ fontFamily: scope.opt.family }">{{ scope.opt.label }}</span>
              </template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label :style="{ fontFamily: scope.opt.family, fontSize: '1.0625rem' }">{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.note || scope.opt.category }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
          <div class="bd__specimen" aria-label="Type specimen">
            <p class="bd__spec-h" :style="{ fontFamily: headingFont.family }">{{ ev.name || 'Your event name' }}</p>
            <p class="bd__spec-b" :style="{ fontFamily: bodyFont.family }">Book early for the best selection — rooms near the venue sell out first. Exclusive event rates, instant confirmation and free cancellation on most rooms.</p>
            <p class="bd__spec-meta">{{ headingFont.label }} / {{ bodyFont.label }}</p>
          </div>
        </section>

        <!-- Imagery -->
        <section class="bd__card bs-card" :aria-labelledby="`${uidBase}-img`">
          <div class="bd__card-head">
            <h2 :id="`${uidBase}-img`" class="bs-subtitle">Reference images</h2>
            <p class="bs-caption">Choose a hero photo for your banner. Concepts use these as inspiration and backdrop.</p>
          </div>
          <ul v-if="photos.length" class="bd__photos">
            <li v-for="p in photos" :key="p.id" class="bd__photo" :class="{ 'is-hero': p.id === bk.heroImageId }">
              <img :src="p.src" :alt="p.alt" />
              <span v-if="p.id === bk.heroImageId" class="bd__hero-badge"><q-icon name="star" size="14px" /> Hero</span>
              <div class="bd__photo-actions">
                <button type="button" class="bd__photo-btn bs-focusable" :aria-pressed="p.id === bk.heroImageId" :aria-label="`Use ${p.alt} as hero image`" @click="project.setHeroImage(p.id)">
                  <q-icon :name="p.id === bk.heroImageId ? 'star' : 'star_outline'" size="18px" />
                </button>
                <button type="button" class="bd__photo-btn bs-focusable" :aria-label="`Remove ${p.alt}`" @click="project.removeImage(p.id)">
                  <q-icon name="delete_outline" size="18px" />
                </button>
              </div>
              <span v-if="p.credit" class="bd__credit">{{ p.credit }}</span>
            </li>
          </ul>
          <p v-else class="bd__empty"><q-icon name="image" size="20px" /> No images yet — upload your own or pick from our licensed library.</p>
          <div class="bd__img-add">
            <asset-dropzone kind="photo" multiple compact :max-files="12" label="Upload photos" :assets="[]" @add="addPhoto" />
            <q-btn no-caps unelevated class="bs-btn bs-btn--ghost" :icon="libraryOpen ? 'expand_less' : 'photo_library'" :label="libraryOpen ? 'Hide photo library' : 'Browse photo library'" :aria-expanded="libraryOpen" @click="libraryOpen = !libraryOpen" />
          </div>
          <div v-if="libraryOpen" class="bd__library">
            <div class="bd__lib-tags" role="group" aria-label="Filter library">
              <button
                v-for="t in LIB_TAGS" :key="t.value" type="button" class="bd__tag bs-focusable"
                :class="{ 'is-on': libraryTag === t.value }" :aria-pressed="libraryTag === t.value" @click="libraryTag = t.value"
              >{{ t.label }}</button>
            </div>
            <ul class="bd__lib-grid">
              <li v-for="img in library" :key="img.id">
                <button type="button" class="bd__lib-item bs-focusable" :aria-label="`Add ${img.alt}`" @click="addFromLibrary(img)">
                  <img :src="img.src" :alt="''" />
                  <span class="bd__lib-add"><q-icon name="add" size="18px" /></span>
                </button>
                <span class="bd__credit bd__credit--static">{{ img.credit }}</span>
              </li>
            </ul>
            <p v-if="!library.length" class="bs-caption">You’ve added every photo in this category.</p>
            <p class="bs-caption">Library photos are licensed via Unsplash for commercial use.</p>
          </div>
        </section>

        <!-- Direction -->
        <section class="bd__card bs-card" :aria-labelledby="`${uidBase}-dir`">
          <div class="bd__card-head">
            <h2 :id="`${uidBase}-dir`" class="bs-subtitle">Creative direction</h2>
            <p class="bs-caption">Sets the starting point for your AI concepts. You’ll see all three directions next.</p>
          </div>
          <div class="bd__dirs" role="radiogroup" :aria-labelledby="`${uidBase}-dir`">
            <label v-for="d in CREATIVE_DIRECTIONS" :key="d.id" class="bd__dir" :class="{ 'is-on': bk.direction === d.id }">
              <input type="radio" class="bd__dir-input" :name="`${uidBase}-direction`" :value="d.id" :checked="bk.direction === d.id" @change="project.setDirection(d.id)" />
              <span class="bd__dir-icon"><q-icon :name="d.icon" size="22px" /></span>
              <span class="bd__dir-name">{{ d.name }}</span>
              <span class="bd__dir-sum">{{ d.summary }}</span>
              <span class="bd__dir-desc">{{ d.description }}</span>
            </label>
          </div>
          <div class="bd__kw">
            <p class="bd__slot-label" :id="`${uidBase}-kw`">Mood words <span>({{ bk.keywords.length }}/8)</span></p>
            <div class="bd__chips">
              <span v-for="k in bk.keywords" :key="k" class="bd__chip">
                {{ k }}
                <button type="button" class="bd__chip-x bs-focusable" :aria-label="`Remove ${k}`" @click="removeKeyword(k)"><q-icon name="close" size="14px" /></button>
              </span>
              <q-input
                v-model="keywordDraft"
                dense
                borderless
                class="bd__kw-input"
                placeholder="Add a word…"
                :aria-labelledby="`${uidBase}-kw`"
                maxlength="24"
                @keydown.enter.prevent="addKeyword(keywordDraft)"
                @keydown.,.prevent="addKeyword(keywordDraft)"
              />
            </div>
            <div v-if="keywordSuggestions.length" class="bd__kw-sugg">
              <span class="bs-caption">Try:</span>
              <button v-for="k in keywordSuggestions" :key="k" type="button" class="bd__tag bs-focusable" @click="addKeyword(k)">+ {{ k }}</button>
            </div>
          </div>
        </section>

        <div class="bd__actions">
          <q-btn no-caps unelevated class="bs-btn bs-btn--ghost" icon="arrow_back" label="Back" @click="emit('back')" />
          <q-btn no-caps unelevated class="bs-btn bs-btn--lg bs-btn--primary" icon-right="arrow_forward" label="Continue to concepts" @click="emit('next')" />
        </div>
      </div>

      <!-- Sticky preview -->
      <aside class="bd__preview" aria-label="Brand preview">
        <div class="bd__preview-head">
          <p class="bs-eyebrow">Live preview</p>
          <div class="bd__seg" role="group" aria-label="Preview layout">
            <button v-for="i in [0, 1]" :key="i" type="button" class="bs-focusable" :aria-pressed="layoutVariant === i" :class="{ 'is-on': layoutVariant === i }" @click="layoutVariant = i">Layout {{ i === 0 ? 'A' : 'B' }}</button>
          </div>
        </div>
        <div class="bd__frame">
          <brand-hero v-bind="heroProps" :concept="previewConcept" size="card" :heading-level="2" />
        </div>
        <p class="bd__frame-cap">{{ directionName }} · {{ previewConcept.title }}</p>

        <brand-theme-provider :brand-kit="bk" class="bd__ui">
          <p class="bd__ui-label">Booking UI accents</p>
          <div class="bd__ui-card">
            <div class="bd__ui-row">
              <strong>Hilton Garden Inn Downtown</strong>
              <span class="bd__ui-badge">Preferred</span>
            </div>
            <span class="bd__ui-meta">0.4 mi from venue · Free breakfast</span>
            <div class="bd__ui-row">
              <a href="#" class="bd__ui-link" @click.prevent>View details</a>
              <q-btn unelevated no-caps color="primary" label="Choose your room" size="md" tabindex="-1" />
            </div>
          </div>
        </brand-theme-provider>

        <brand-hero v-bind="heroProps" :concept="previewConcept" size="compact" :heading-level="2" class="bd__band" />
        <p class="bd__frame-cap">Hotel results banner</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.bd { background: var(--bs-canvas); min-height: 100%; padding: 32px clamp(16px, 4vw, 48px) 56px; font-family: var(--bs-font); color: var(--bs-ink); }
.bd__head { max-width: 1240px; margin: 0 auto 24px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.bd__title { margin-top: 8px; }
.bd__lead { margin-top: 10px; max-width: 60ch; font-size: 1.0625rem; }
.bd__grid { max-width: 1240px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) 440px; gap: 32px; align-items: start; }
.bd__main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.bd__card { padding: clamp(18px, 2.6vw, 28px); display: flex; flex-direction: column; gap: 16px; }
.bd__card-head { display: flex; flex-direction: column; gap: 4px; }
.bd__slot-label { margin: 0 0 6px; font: 700 0.8125rem var(--bs-font); color: var(--bs-ink); }
.bd__slot-label span { font-weight: 400; color: var(--bs-ink-soft); }
.bd__warn { margin: 0; display: flex; gap: 6px; align-items: center; font-size: 0.8125rem; color: var(--ds-color-text-warning); }

/* Logos */
.bd__logos { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.bd__logo-slot--dark :deep(.adz__previews--logo .adz__preview) { background: var(--brand-ink, #0F172A); background: v-bind('bk.colors.ink'); }

/* Colors */
.bd__colors { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; }
.bd__checks { padding: 14px 16px; border-radius: var(--bs-radius-md); background: var(--bs-surface-2); border: 1px solid var(--bs-line); }
.bd__checks-title { margin: 0 0 8px; display: flex; gap: 6px; align-items: center; font: 700 0.875rem var(--bs-font); color: var(--bs-ink); }
.bd__checks ul { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.bd__check { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto auto; gap: 10px; align-items: center; font-size: 0.8125rem; }
.bd__aa { width: 40px; height: 28px; border-radius: 6px; display: grid; place-items: center; font-weight: 700; border: 1px solid rgb(3 10 38 / 0.08); }
.bd__check-label { color: var(--bs-ink); }
.bd__ratio { font-variant-numeric: tabular-nums; color: var(--bs-ink-soft); }
.bd__verdict { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.75rem; }
.bd__verdict.is-pass { background: var(--ds-color-background-success); color: var(--ds-color-text-success); }
.bd__verdict.is-fail { background: var(--ds-color-background-warning); color: var(--ds-color-text-warning); }

/* Typography */
.bd__fonts { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.bd__specimen { padding: 18px 20px; border-radius: var(--bs-radius-md); border: 1px dashed var(--bs-line-strong); }
.bd__spec-h { margin: 0 0 8px; font-size: 1.75rem; font-weight: 700; line-height: 1.1; color: var(--bs-ink); }
.bd__spec-b { margin: 0; font-size: 0.9375rem; line-height: 1.55; color: var(--bs-ink-soft); }
.bd__spec-meta { margin: 10px 0 0; font: 700 0.6875rem var(--bs-font); letter-spacing: 0.1em; text-transform: uppercase; color: var(--bs-ink-faint); }

/* Imagery */
.bd__photos { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.bd__photo { position: relative; border-radius: var(--bs-radius-md); overflow: hidden; aspect-ratio: 4 / 3; background: var(--bs-surface-2); outline: 3px solid transparent; outline-offset: 2px; transition: outline-color var(--ds-duration-fast); }
.bd__photo.is-hero { outline-color: var(--bs-brand); }
.bd__photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.bd__hero-badge { position: absolute; top: 8px; left: 8px; display: inline-flex; align-items: center; gap: 3px; padding: 3px 8px; border-radius: 999px; background: var(--bs-brand); color: #fff; font: 700 0.6875rem var(--bs-font); }
.bd__photo-actions { position: absolute; top: 6px; right: 6px; display: flex; gap: 4px; }
.bd__photo-btn { width: 32px; height: 32px; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgb(3 10 38 / 0.7); color: #fff; cursor: pointer; }
.bd__photo-btn:hover { background: var(--bs-brand); }
.bd__credit { position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 8px 5px; font-size: 0.625rem; color: #fff; background: linear-gradient(transparent, rgb(0 0 0 / 0.65)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bd__credit--static { position: static; padding: 4px 0 0; background: none; color: var(--bs-ink-soft); display: block; }
.bd__empty { margin: 0; display: flex; gap: 8px; align-items: center; color: var(--bs-ink-soft); font-size: 0.875rem; }
.bd__img-add { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: start; }
.bd__library { display: flex; flex-direction: column; gap: 12px; padding-top: 4px; }
.bd__lib-tags, .bd__kw-sugg { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.bd__tag { min-height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--bs-line-strong); background: #fff; font: 700 0.8125rem var(--bs-font); color: var(--bs-ink-soft); cursor: pointer; }
.bd__tag:hover { color: var(--bs-ink); border-color: var(--bs-ink-faint); }
.bd__tag.is-on { background: var(--bs-brand); border-color: var(--bs-brand); color: #fff; }
.bd__lib-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
.bd__lib-item { position: relative; display: block; width: 100%; aspect-ratio: 4 / 3; padding: 0; border: 0; border-radius: var(--bs-radius-sm); overflow: hidden; cursor: pointer; background: var(--bs-surface-2); }
.bd__lib-item img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform var(--ds-duration-base) var(--ds-ease-standard); }
.bd__lib-item:hover img { transform: scale(1.05); }
.bd__lib-add { position: absolute; right: 6px; bottom: 6px; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: #fff; color: var(--bs-brand); box-shadow: var(--bs-shadow-2); }
.bd__lib-grid .bd__credit--static { font-size: 0.6875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Direction */
.bd__dirs { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
.bd__dir { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 16px; border: 1.5px solid var(--bs-line); border-radius: var(--bs-radius-md); background: #fff; cursor: pointer; transition: border-color var(--ds-duration-fast), box-shadow var(--ds-duration-fast); }
.bd__dir:hover { border-color: var(--bs-line-strong); box-shadow: var(--bs-shadow-1); }
.bd__dir.is-on { border-color: var(--bs-brand); background: var(--ds-palette-navy-50); }
.bd__dir:has(.bd__dir-input:focus-visible) { box-shadow: var(--bs-ring); }
.bd__dir-input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.bd__dir-icon { width: 36px; height: 36px; border-radius: var(--bs-radius-sm); display: grid; place-items: center; background: var(--bs-surface-2); color: var(--bs-brand); margin-bottom: 6px; }
.bd__dir.is-on .bd__dir-icon { background: var(--bs-brand); color: #fff; }
.bd__dir-name { font: 700 0.9375rem var(--bs-font); color: var(--bs-ink); }
.bd__dir-sum { font: 700 0.8125rem/1.35 var(--bs-font); color: var(--bs-ink-soft); }
.bd__dir-desc { font-size: 0.8125rem; line-height: 1.45; color: var(--bs-ink-soft); }
.bd__kw { display: flex; flex-direction: column; gap: 8px; }
.bd__chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 6px 8px; min-height: 46px; border: 1px solid var(--bs-line-strong); border-radius: var(--bs-radius-sm); background: #fff; }
.bd__chip { display: inline-flex; align-items: center; gap: 2px; padding: 4px 4px 4px 10px; border-radius: 999px; background: var(--bs-surface-2); border: 1px solid var(--bs-line); font: 700 0.8125rem var(--bs-font); color: var(--bs-ink); }
.bd__chip-x { width: 24px; height: 24px; display: grid; place-items: center; border: 0; border-radius: 50%; background: transparent; color: var(--bs-ink-soft); cursor: pointer; }
.bd__chip-x:hover { background: var(--bs-line); color: var(--bs-ink); }
.bd__kw-input { flex: 1 1 120px; min-width: 120px; }

.bd__actions { display: flex; justify-content: space-between; gap: 12px; padding-top: 8px; flex-wrap: wrap; }

/* Preview */
.bd__preview { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 10px; }
.bd__preview-head { display: flex; justify-content: space-between; align-items: center; }
.bd__seg { display: inline-flex; padding: 3px; border-radius: 999px; background: var(--bs-surface); border: 1px solid var(--bs-line); }
.bd__seg button { min-height: 28px; padding: 0 12px; border: 0; border-radius: 999px; background: transparent; font: 700 0.75rem var(--bs-font); color: var(--bs-ink-soft); cursor: pointer; }
.bd__seg button.is-on { background: var(--bs-brand); color: #fff; }
.bd__frame { border-radius: var(--bs-radius-lg); overflow: hidden; box-shadow: var(--bs-shadow-3); }
.bd__frame-cap { margin: 0 0 8px; font-size: 0.75rem; color: var(--bs-ink-soft); }
.bd__band { border-radius: var(--bs-radius-md); overflow: hidden; box-shadow: var(--bs-shadow-2); }
.bd__ui { padding: 14px; border-radius: var(--bs-radius-lg); background: var(--bs-surface); border: 1px solid var(--bs-line); }
.bd__ui-label { margin: 0 0 10px; font: 700 0.6875rem var(--bs-font); letter-spacing: 0.1em; text-transform: uppercase; color: var(--bs-ink-soft); font-family: var(--bs-font); }
.bd__ui-card { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--ds-color-border); border-radius: 4px; }
.bd__ui-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.bd__ui-row strong { font-family: var(--brand-font-heading); color: var(--ds-color-text); font-size: 1rem; }
.bd__ui-badge { padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; background: var(--ds-color-background-brand-subtlest); color: var(--ds-color-text-brand); }
.bd__ui-meta { font-size: 0.8125rem; color: var(--ds-color-text-subtle); }
.bd__ui-link { color: var(--ds-color-link); font-weight: 700; font-size: 0.875rem; }

@media (max-width: 1100px) {
  .bd__grid { grid-template-columns: minmax(0, 1fr); }
  .bd__preview { position: static; order: -1; }
  .bd__band, .bd__band + .bd__frame-cap, .bd__ui { display: none; }
}
@media (max-width: 600px) {
  .bd { padding: 20px 12px 40px; }
  .bd__img-add { grid-template-columns: 1fr; }
  .bd__check { grid-template-columns: 40px minmax(0, 1fr) auto; }
  .bd__ratio { display: none; }
  .bd__actions { flex-direction: column-reverse; }
  .bd__actions .q-btn { width: 100%; }
}
</style>
