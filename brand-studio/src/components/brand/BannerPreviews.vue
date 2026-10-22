<script setup>
// BannerPreviews — how the Presto banner renders where it's actually used:
//   landing   Homepage hero          1440 × 400
//   browse    Hotel directory banner 1440 × 240
//   details   Hotel details banner   1440 × 240
// Each inside a realistic Chrome window. One layout only — the Presto banner
// standard (system-safe background, logo + copy centered); no alternates.
// Background: the kit's banner/hero image, else `fallbackImage` (e.g. the
// industry vertical's Higgsfield example), else the solid brand field.
import { computed } from 'vue'
import BrandHero from './BrandHero.vue'
import ChromeWindow from '../devices/ChromeWindow.vue'
import { prestoBannerConcept } from '../../providers/ai/conceptFactory.js'
import { getImage } from '../../assets/imagery/index.js'

const props = defineProps({
  brandKit: { type: Object, required: true },
  headline: { type: String, default: 'Your event name' },
  tagline: { type: String, default: '' },
  dates: { type: String, default: '' },
  location: { type: String, default: '' },
  slug: { type: String, default: 'your-event' },
  fallbackImage: { type: Object, default: null }, // { id, src, kind? }
  pages: { type: Array, default: () => ['landing', 'browse', 'details'] },
  // Booking-search strip under the homepage hero (gives the hero scale).
  showSearch: { type: Boolean, default: true },
})

const PAGES = {
  landing: { label: 'Homepage hero', size: '1440 × 400', w: 1440, h: 400, path: '', heroSize: 'landing' },
  browse: { label: 'Hotel directory banner', size: '1440 × 240', w: 1440, h: 240, path: '/hotels', heroSize: 'compact' },
  details: { label: 'Hotel details banner', size: '1440 × 240', w: 1440, h: 240, path: '/hotels/courtyard-downtown', heroSize: 'compact' },
}

const image = computed(() => {
  const bk = props.brandKit
  const id = bk.bannerImageId || bk.heroImageId
  return getImage(id) || (bk.imagery || []).find((a) => a.id === id && a.kind !== 'logo') || props.fallbackImage || null
})
const concept = computed(() => prestoBannerConcept(props.brandKit, image.value))
const usingExample = computed(() => !!props.fallbackImage && image.value === props.fallbackImage)
const list = computed(() => props.pages.filter((p) => PAGES[p]).map((id) => ({ id, ...PAGES[id] })))
const copy = computed(() => ({ brandKit: props.brandKit, headline: props.headline, tagline: props.tagline, dates: props.dates, location: props.location }))
</script>

<template>
  <div class="bp">
    <figure v-for="p in list" :key="p.id" class="bp__item">
      <chrome-window
        :url="`book.eventpipe.com/${slug}${p.path}`" :title="headline" :favicon="brandKit.logo?.src || ''"
        :favicon-color="brandKit.colors?.primary" :design-width="1000" :label="`${p.label} preview`"
      >
        <div class="bp__frame" :style="{ aspectRatio: `${p.w} / ${p.h}` }">
          <brand-hero v-bind="copy" :concept="concept" :size="p.heroSize" :heading-level="3" />
        </div>
        <div v-if="p.id === 'landing' && showSearch" class="bp__search" aria-hidden="true">
          <span><q-icon name="place" size="14px" /> {{ location || 'Location' }}</span>
          <span><q-icon name="event" size="14px" /> {{ dates || 'Dates' }}</span>
          <span class="bp__btn" :style="{ background: brandKit.colors?.primary }">Search</span>
        </div>
      </chrome-window>
      <figcaption class="bp__cap">
        <strong>{{ p.label }}</strong> · {{ p.size }}
        <span v-if="usingExample && p.id === list[0].id" class="bs-pill bs-pill--ai bp__ex">Example image</span>
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.bp { display: grid; gap: 14px; }
.bp__item { margin: 0; display: grid; gap: 6px; }
.bp__frame { width: 100%; overflow: hidden; display: flex; }
.bp__frame :deep(.bh) { width: 100%; height: 100%; min-height: 0; }
.bp__search { display: grid; grid-template-columns: 1fr 1fr auto; gap: 6px; padding: 8px; background: #fff; border-top: 1px solid var(--ds-color-border, #E2E8F0); }
.bp__search span { display: flex; align-items: center; gap: 4px; min-height: 26px; padding: 0 8px; border: 1px solid var(--ds-color-border, #E2E8F0); border-radius: 4px; font: 400 0.6875rem var(--bs-font); color: var(--bs-ink-soft); white-space: nowrap; overflow: hidden; }
.bp__search .bp__btn { justify-content: center; border: 0; color: #fff; font-weight: 700; padding: 0 12px; }
.bp__cap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 0.75rem; color: var(--bs-ink-soft); }
.bp__cap strong { color: var(--bs-ink); }
.bp__ex { margin-left: auto; }
</style>
