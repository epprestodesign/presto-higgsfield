<script setup>
// Always-visible brand controls at the top of a project: the logo (and how
// it's shown), the four colours (click to change), and the fonts. Changes go
// straight onto the current draft.
import { ref } from 'vue'
import Icon from './Icon.vue'
import LogoMark from './LogoMark.vue'
import { LOGO_LOOKS, toast } from '../mockAgent.js'

const props = defineProps({ project: { type: Object, required: true }, ready: { type: Boolean, default: true } })
const ROLES = ['Main', 'Accent', 'Light', 'Dark']
const picker = ref(null)
const looksOpen = ref(false)

function setColor(i, e) {
  props.project.palette[i] = e.target.value.toUpperCase()
  props.project.updated = Date.now()
}
function replaceLogo(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (f) toast('Prototype: the new logo would be cleaned up and used everywhere')
}
function reset() {
  props.project.palette.splice(0, 4, ...props.project.brand.colors)
  toast('Colours reset to the brand kit')
}
</script>

<template>
  <section class="bb" aria-label="Brand">
    <template v-if="ready">
      <div class="bb__group">
        <span class="bb__logo"><LogoMark :project="project" look="original" :size="34" /></span>
        <div class="bb__col">
          <span class="bb__label">Logo</span>
          <div class="bb__looks">
            <button type="button" class="bb__btn" :aria-expanded="looksOpen" @click="looksOpen = !looksOpen">
              {{ LOGO_LOOKS.find((l) => l.id === project.look)?.label }} <Icon name="down" :size="14" />
            </button>
            <div v-if="looksOpen" class="bb__menu" role="radiogroup" aria-label="Logo look">
              <button
                v-for="l in LOGO_LOOKS" :key="l.id" type="button" role="radio" :aria-checked="project.look === l.id"
                class="bb__look" :class="{ 'is-on': project.look === l.id }" @click="project.look = l.id; looksOpen = false"
              >
                <span class="bb__lookstage"><LogoMark :project="project" :look="l.id" :size="30" /></span>
                <span><b>{{ l.label }}</b><small>{{ l.note }}</small></span>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="bb__icon" aria-label="Replace the logo" title="Replace the logo" @click="picker.click()"><Icon name="clip" :size="18" /></button>
        <input ref="picker" type="file" accept="image/*" hidden @change="replaceLogo" />
      </div>

      <div class="bb__group">
        <div class="bb__col">
          <span class="bb__label">Colours</span>
          <div class="bb__swatches">
            <label v-for="(c, i) in project.palette" :key="i" class="bb__sw" :title="`${ROLES[i]} ${c}`">
              <span :style="{ background: c }" />
              <input type="color" :value="c" :aria-label="`${ROLES[i]} colour, ${c}`" @input="setColor(i, $event)" />
              <small>{{ ROLES[i] }}</small>
            </label>
          </div>
        </div>
        <button type="button" class="bb__icon" aria-label="Reset the colours" title="Reset the colours" @click="reset"><Icon name="refresh" :size="18" /></button>
      </div>

      <div class="bb__group bb__fonts">
        <div class="bb__col">
          <span class="bb__label">Fonts</span>
          <span class="bb__val"><b>{{ project.brand.fonts.display }}</b> · {{ project.brand.fonts.body }}</span>
        </div>
      </div>
    </template>
    <p v-else class="bb__wait"><span class="bb__dot" /> Reading the brand…</p>
  </section>
</template>

<style scoped>
.bb { display: flex; align-items: stretch; gap: 0; padding: 8px 24px; border-bottom: 1px solid var(--line); background: var(--surface); min-height: 64px; }
.bb__group { display: flex; align-items: center; gap: 10px; padding: 0 20px; border-left: 1px solid var(--line); }
.bb__group:first-child { padding-left: 0; border-left: 0; }
.bb__logo { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid var(--line); border-radius: var(--r); background: #fff; }
.bb__col { display: grid; gap: 2px; }
.bb__label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
.bb__val { font-size: 14px; color: var(--ink-2); }
.bb__val b { color: var(--ink); }
.bb__looks { position: relative; }
.bb__btn { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; background: none; font-weight: 700; font-size: 14px; cursor: pointer; }
.bb__btn:hover { text-decoration: underline; }
.bb__menu { position: absolute; top: calc(100% + 8px); left: -8px; z-index: 30; width: 260px; padding: 6px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow-overlay); display: grid; gap: 2px; }
.bb__look { display: flex; align-items: center; gap: 10px; padding: 6px; border: 0; border-radius: var(--r); background: none; text-align: left; cursor: pointer; }
.bb__look:hover { background: var(--surface-3); }
.bb__look.is-on { background: var(--selected); }
.bb__look b { display: block; font-size: 14px; }
.bb__look small { color: var(--ink-3); font-size: 12px; }
.bb__lookstage { display: grid; place-items: center; width: 52px; height: 40px; border-radius: var(--r); background: #475569 center / cover; }
.bb__icon { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); color: var(--ink-2); cursor: pointer; }
.bb__icon:hover { background: var(--surface-3); }
.bb__swatches { display: flex; gap: 6px; }
.bb__sw { position: relative; display: grid; justify-items: center; gap: 1px; cursor: pointer; }
.bb__sw span { width: 30px; height: 22px; border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.15); }
.bb__sw:hover span { box-shadow: 0 0 0 2px var(--surface), 0 0 0 3px var(--pill); }
.bb__sw input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.bb__sw input:focus-visible + small { outline: 2px solid var(--focus); }
.bb__sw small { font-size: 10px; color: var(--ink-3); }
.bb__wait { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; color: var(--ink-3); }
.bb__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--navy-200); animation: pulse 1s ease-in-out infinite alternate; }
@keyframes pulse { to { opacity: 0.3; } }
@media (max-width: 900px) { .bb__fonts { display: none; } }
@media (max-width: 640px) { .bb { padding: 8px 14px; overflow-x: auto; } .bb__group { padding: 0 12px; } }
</style>
