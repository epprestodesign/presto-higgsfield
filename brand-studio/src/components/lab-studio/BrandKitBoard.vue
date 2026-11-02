<script setup>
// Canvas board · Brand kit: the extracted logo on light and dark, the colours,
// the type, and the exact size the logo gets in each Presto placement.
import { computed, ref, watch } from 'vue'
import { PLACEMENTS, fitInBox, SYSTEM_DARK } from '../../banner-lab/standards.js'
import { sampleProject } from '../../data/sampleEvents.js'
import { getFont } from '../../theme/fonts.js'

const props = defineProps({ project: { type: Object, required: true } })

const kit = computed(() => sampleProject(props.project.key).brandKit)
const colors = computed(() => Object.entries(props.project.colors || {}).filter(([k]) => k !== 'surface'))
const fonts = computed(() => [['Headline', kit.value.typography?.heading], ['Body', kit.value.typography?.body]].map(([role, id]) => ({ role, family: getFont(id).family, label: getFont(id).label || id })))

const aspect = ref(1)
watch(() => props.project.logo?.src, (src) => {
  if (!src) return
  const img = new Image()
  img.onload = () => { aspect.value = (img.naturalWidth || 1) / (img.naturalHeight || 1) }
  img.src = src
}, { immediate: true })
const sizes = computed(() => PLACEMENTS.map((p) => ({ ...p, size: p.square ? { w: p.box.w, h: p.box.h } : fitInBox(aspect.value, p.box) })))
</script>

<template>
  <div class="bk">
    <div class="bk__logos">
      <div class="bk__logo bk__logo--light"><img v-if="project.logo" :src="project.logo.src" :alt="`${project.name} logo`" /></div>
      <div class="bk__logo" :style="{ background: SYSTEM_DARK }"><img v-if="project.logo" :src="project.logo.onDarkSrc || project.logo.src" alt="Logo on a dark banner" /></div>
    </div>
    <div class="bk__row">
      <span class="bk__tag"><q-icon name="layers_clear" size="14px" /> Transparent</span>
      <span class="bk__tag"><q-icon name="polyline" size="14px" /> SVG traced</span>
      <span class="bk__tag"><q-icon name="crop_square" size="14px" /> 200 × 200</span>
    </div>

    <p class="bk__h">Colours</p>
    <div class="bk__colors">
      <div v-for="[name, hex] in colors" :key="name" class="bk__color">
        <span :style="{ background: hex }" />
        <strong>{{ name }}</strong>
        <code>{{ hex }}</code>
      </div>
    </div>

    <p class="bk__h">Type</p>
    <div class="bk__type">
      <div v-for="f in fonts" :key="f.role">
        <span class="bk__aa" :style="{ fontFamily: f.family }">Aa</span>
        <small>{{ f.role }} · {{ f.label }}</small>
      </div>
    </div>

    <p class="bk__h">Logo sizes in Presto</p>
    <table class="bk__sizes">
      <tbody>
        <tr v-for="p in sizes" :key="p.id"><th>{{ p.label }}</th><td>{{ p.size.w }} × {{ p.size.h }}</td></tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.bk { display: grid; gap: 14px; padding: 20px; font-family: var(--bs-font); }
.bk__logos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bk__logo { height: 150px; border-radius: 12px; display: grid; place-items: center; }
.bk__logo--light { background: repeating-conic-gradient(#eef0f4 0% 25%, #fff 0% 50%) 50% / 14px 14px; border: 1px solid var(--bs-line); }
.bk__logo img { max-width: 70%; max-height: 70%; object-fit: contain; }
.bk__row { display: flex; gap: 6px; flex-wrap: wrap; }
.bk__tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; background: var(--bs-surface-2); font-size: 0.75rem; font-weight: 600; color: var(--bs-ink-soft); }
.bk__h { margin: 6px 0 0; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--bs-ink-faint); }
.bk__colors { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.bk__color { display: grid; gap: 4px; }
.bk__color span { height: 54px; border-radius: 10px; border: 1px solid rgb(0 0 0 / 0.06); }
.bk__color strong { font-size: 0.75rem; text-transform: capitalize; color: var(--bs-ink); }
.bk__color code { font-size: 0.6875rem; color: var(--bs-ink-soft); }
.bk__type { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.bk__type > div { padding: 10px 12px; border-radius: 10px; background: var(--bs-surface-2); }
.bk__aa { display: block; font-size: 2.75rem; line-height: 1; color: var(--bs-ink); }
.bk__type small { font-size: 0.75rem; color: var(--bs-ink-soft); }
.bk__sizes { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
.bk__sizes th { text-align: left; font-weight: 500; color: var(--bs-ink-soft); padding: 4px 0; }
.bk__sizes td { text-align: right; font-weight: 700; color: var(--bs-ink); }
.bk__sizes tr + tr { border-top: 1px solid var(--bs-line); }
</style>
