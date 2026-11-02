<script setup>
// Canvas board · Banners: every variant at both Presto crops (1440×400 landing,
// 1440×240 listings) with the logo on top, scored against the banner standard
// (dark, calm center). The selected one drives the page mockups. With `set`,
// it shows one set (one prompt's results) and its prompt, model and time.
import { computed, reactive, watch } from 'vue'
import { loadImage, renderBanner, checkBanner } from '../../banner-lab/canvas.js'
import { BANNER_SPECS } from '../../banner-lab/standards.js'
import { getModel } from '../../banner-lab/studioModels.js'
import { setBanners } from '../../banner-lab/studioProjects.js'

const props = defineProps({
  project: { type: Object, required: true },
  set: { type: Object, default: null },
})
const list = computed(() => (props.set ? setBanners(props.project, props.set.id) : [...props.project.banners].reverse()))
const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 6e4)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
const emit = defineEmits(['select'])

// Standards grade per banner (landing crop, no logo), computed once.
const grades = reactive({})
watch(() => list.value.map((b) => b.id), async () => {
  for (const b of list.value) {
    if (grades[b.id]) continue
    grades[b.id] = { pending: true }
    try {
      const art = await loadImage(b.src)
      const r = renderBanner(art, BANNER_SPECS[0], {}, null)
      grades[b.id] = checkBanner(r, BANNER_SPECS[0], null).grade
    } catch { grades[b.id] = null }
  }
}, { immediate: true })

const logoSrc = () => props.project.logo?.onDarkSrc || props.project.logo?.src || ''
</script>

<template>
  <div class="bb">
    <header v-if="set" class="bb__set">
      <p class="bb__set-prompt">“{{ set.prompt }}”</p>
      <p class="bb__set-meta">
        <span><q-icon name="auto_awesome" size="13px" /> {{ getModel(set.modelId).name }}</span>
        <span>{{ ago(set.createdAt) }}</span>
        <span v-if="list.some((b) => b.id === project.selectedBannerId)" class="bb__set-live"><q-icon name="check_circle" size="13px" /> On the pages</span>
      </p>
    </header>
    <article
      v-for="(b, i) in list" :key="b.id" class="bb__item" :class="{ 'is-on': b.id === project.selectedBannerId }"
      @click="emit('select', b.id)"
    >
      <header class="bb__head">
        <strong>Variation {{ i + 1 }}</strong>
        <span class="bb__model">{{ getModel(b.model).name }}</span>
        <span v-if="grades[b.id] && !grades[b.id].pending" class="bb__grade" :class="grades[b.id].pass ? 'is-ok' : 'is-warn'">
          <q-icon :name="grades[b.id].pass ? 'verified' : 'tune'" size="14px" />
          {{ grades[b.id].pass ? `Meets standard · ${grades[b.id].whiteContrast}:1` : 'Needs darkening' }}
        </span>
        <span v-if="b.id === project.selectedBannerId" class="bb__sel"><q-icon name="check_circle" size="14px" /> On the pages</span>
      </header>
      <div class="bb__crop bb__crop--landing">
        <img :src="b.src" :alt="b.alt" />
        <img v-if="logoSrc()" :src="logoSrc()" alt="" class="bb__logo" />
        <span class="bb__dim">1440 × 400</span>
      </div>
      <div class="bb__crop bb__crop--listings">
        <img :src="b.src" alt="" />
        <img v-if="logoSrc()" :src="logoSrc()" alt="" class="bb__logo" />
        <span class="bb__dim">1440 × 240</span>
      </div>
      <p v-if="!set" class="bb__prompt">“{{ b.prompt }}”</p>
    </article>
  </div>
</template>

<style scoped>
.bb { display: grid; gap: 18px; padding: 18px; font-family: var(--bs-font); }
.bb__set { display: grid; gap: 6px; padding: 2px 4px 4px; border-bottom: 1px solid var(--bs-line); padding-bottom: 14px; }
.bb__set-prompt { margin: 0; font-size: 0.875rem; line-height: 1.45; color: var(--bs-ink); font-style: italic; }
.bb__set-meta { margin: 0; display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 0.75rem; color: var(--bs-ink-soft); }
.bb__set-meta span { display: inline-flex; align-items: center; gap: 4px; }
.bb__set-live { color: var(--bs-accent); font-weight: 600; }
.bb__item { display: grid; gap: 8px; padding: 10px; border-radius: 14px; border: 2px solid transparent; cursor: pointer; }
.bb__item:hover { background: var(--bs-surface-2); }
.bb__item.is-on { border-color: var(--bs-accent); background: var(--bs-accent-soft); }
.bb__head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.8125rem; }
.bb__head strong { color: var(--bs-ink); }
.bb__model { color: var(--bs-ink-soft); }
.bb__grade, .bb__sel { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 999px; font-size: 0.6875rem; font-weight: 700; }
.bb__grade.is-ok { background: #dcfce7; color: #166534; }
.bb__grade.is-warn { background: #fef3c7; color: #92400e; }
.bb__sel { margin-left: auto; color: var(--bs-accent); }
.bb__crop { position: relative; overflow: hidden; border-radius: 6px; background: #0b1736; }
.bb__crop--landing { aspect-ratio: 1440 / 400; }
.bb__crop--listings { aspect-ratio: 1440 / 240; }
.bb__crop > img:first-child { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
/* Absolutely centered so the % height is of the crop (a grid/flex item's % height can let a tall logo stretch the row and drop out of frame) */
.bb__logo { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: auto; object-fit: contain; }
.bb__crop--landing .bb__logo { height: 30%; max-width: 49%; }
.bb__crop--listings .bb__logo { height: 23%; max-width: 12.5%; }
.bb__dim { position: absolute; right: 6px; bottom: 5px; padding: 1px 6px; border-radius: 4px; background: rgb(0 0 0 / 0.5); color: #fff; font-size: 0.625rem; font-weight: 600; }
.bb__prompt { margin: 0; font-size: 0.75rem; color: var(--bs-ink-soft); font-style: italic; }
</style>
