<script setup>
// Canvas board · Brand kit: the extracted logo on light and dark, the colours
// and type (both editable; they flow into the banners, pages and export), and
// the exact size the logo gets in each Presto placement.
import { computed, ref, watch } from 'vue'
import { PLACEMENTS, fitInBox, SYSTEM_DARK } from '../../banner-lab/standards.js'
import { sampleProject } from '../../data/sampleEvents.js'
import { FONT_OPTIONS, getFont } from '../../theme/fonts.js'
import { paletteToColors } from '../../banner-lab/studioProjects.js'

const props = defineProps({ project: { type: Object, required: true } })

const kit = computed(() => sampleProject(props.project.key).brandKit)
const ROLES = ['primary', 'secondary', 'accent', 'ink']
const colors = computed(() => ROLES.map((role) => [role, props.project.colors?.[role] || '#000000']))
const HEX = /^#?[0-9a-f]{6}$/i
function setColor(role, value) {
  const v = String(value).trim()
  if (!HEX.test(v)) return
  props.project.colors = { ...props.project.colors, [role]: (v.startsWith('#') ? v : `#${v}`).toUpperCase() }
}
const canUseLogoColors = computed(() => props.project.logoPalette?.length)
function useLogoColors() { props.project.colors = paletteToColors(props.project.logoPalette, props.project.colors) }

const typeOf = (role) => props.project.typography?.[role] || kit.value.typography?.[role]
const fonts = computed(() => [['heading', 'Headline'], ['body', 'Body']].map(([role, label]) => ({ role, label, id: typeOf(role), family: getFont(typeOf(role)).family })))
function setFont(role, id) { props.project.typography = { ...(props.project.typography || {}), [role]: id } }

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

    <div class="bk__hrow">
      <p class="bk__h">Colours</p>
      <button v-if="canUseLogoColors" type="button" class="bk__link" @pointerdown.stop @dblclick.stop @click="useLogoColors">Use logo colours</button>
    </div>
    <div class="bk__colors" @pointerdown.stop @dblclick.stop>
      <div v-for="[name, hex] in colors" :key="name" class="bk__color">
        <label class="bk__swatch" :style="{ background: hex }" :title="`Change the ${name} colour`">
          <input type="color" :value="hex" :aria-label="`${name} colour`" @input="setColor(name, $event.target.value)" />
          <q-icon name="edit" size="14px" class="bk__swatch-edit" />
        </label>
        <strong>{{ name }}</strong>
        <input class="bk__hex" :value="hex" maxlength="7" spellcheck="false" :aria-label="`${name} hex`" @change="setColor(name, $event.target.value)" @keydown.enter="$event.target.blur()" />
      </div>
    </div>

    <p class="bk__h">Type</p>
    <div class="bk__type" @pointerdown.stop @dblclick.stop>
      <label v-for="f in fonts" :key="f.role" class="bk__font">
        <span class="bk__aa" :style="{ fontFamily: f.family }">Aa</span>
        <small>{{ f.label }}</small>
        <select :value="f.id" :aria-label="`${f.label} font`" :style="{ fontFamily: f.family }" @change="setFont(f.role, $event.target.value)">
          <option v-for="o in FONT_OPTIONS" :key="o.id" :value="o.id">{{ o.label }}</option>
        </select>
      </label>
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
.bk__hrow { display: flex; align-items: baseline; justify-content: space-between; }
.bk__link { border: 0; background: none; padding: 0; font: 600 0.75rem var(--bs-font); color: var(--bs-accent); cursor: pointer; }
.bk__swatch { position: relative; display: block; height: 54px; border-radius: 10px; border: 1px solid rgb(0 0 0 / 0.06); cursor: pointer; overflow: hidden; }
.bk__swatch input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.bk__swatch-edit { position: absolute; right: 6px; bottom: 6px; padding: 3px; border-radius: 6px; background: rgb(255 255 255 / 0.85); color: var(--bs-ink); opacity: 0; transition: opacity 0.15s; pointer-events: none; }
.bk__swatch:hover .bk__swatch-edit, .bk__swatch:focus-within .bk__swatch-edit { opacity: 1; }
.bk__swatch:focus-within { outline: 2px solid var(--bs-accent); outline-offset: 2px; }
.bk__hex { width: 100%; border: 1px solid transparent; border-radius: 6px; padding: 1px 4px; margin-left: -4px; background: transparent; font: 500 0.6875rem ui-monospace, monospace; color: var(--bs-ink-soft); text-transform: uppercase; }
.bk__hex:hover { border-color: var(--bs-line); }
.bk__hex:focus { outline: none; border-color: var(--bs-ink); background: #fff; color: var(--bs-ink); }
.bk__color strong { font-size: 0.75rem; text-transform: capitalize; color: var(--bs-ink); }
.bk__type { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.bk__font { display: grid; gap: 4px; padding: 10px 12px; border-radius: 10px; background: var(--bs-surface-2); cursor: pointer; }
.bk__font select { margin-top: 2px; width: 100%; padding: 5px 8px; border: 1px solid var(--bs-line); border-radius: 8px; background: #fff; font-size: 0.8125rem; color: var(--bs-ink); cursor: pointer; }
.bk__aa { display: block; font-size: 2.75rem; line-height: 1; color: var(--bs-ink); }
.bk__type small { font-size: 0.75rem; color: var(--bs-ink-soft); }
.bk__sizes { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
.bk__sizes th { text-align: left; font-weight: 500; color: var(--bs-ink-soft); padding: 4px 0; }
.bk__sizes td { text-align: right; font-weight: 700; color: var(--bs-ink); }
.bk__sizes tr + tr { border-top: 1px solid var(--bs-line); }
</style>
