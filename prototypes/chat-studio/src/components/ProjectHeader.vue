<script setup>
// Project header, after the reference: the original prompt in a large rounded
// bar (with the step progress and a close button), then a row of chips —
// brand on the left (logo look, colours, heading font), and on the right
// Chat / Concepts, which are chips that switch the view.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
import LogoMark from './LogoMark.vue'
import { LOGO_LOOKS, toast } from '../mockAgent.js'

const props = defineProps({
  project: { type: Object, required: true },
  tab: { type: String, default: 'chat' },
  stages: { type: Array, default: () => [] },
  brandReady: { type: Boolean, default: true },
})
const emit = defineEmits(['update:tab', 'jump', 'close'])

const ROLES = ['Main', 'Accent', 'Light', 'Dark']
// Heading fonts the Presto pages support (plus the brand kit's own first).
const FONTS = ['Oswald', 'Barlow Condensed', 'Montserrat', 'Playfair Display', 'PT Sans']
const fonts = computed(() => [props.project.brand.fonts.display, ...FONTS.filter((f) => f !== props.project.brand.fonts.display)])
const font = computed(() => props.project.font || props.project.brand.fonts.display)
const look = computed(() => LOGO_LOOKS.find((l) => l.id === props.project.look))
const current = computed(() => props.stages.findIndex((s) => s.state === 'current'))
const stepLabel = computed(() => {
  const i = current.value
  if (i < 0) return props.stages.length ? 'All steps done' : ''
  return `Step ${i + 1} of ${props.stages.length} · ${props.stages[i].label}`
})

// One popover at a time.
const open = ref('')
const root = ref(null)
const toggle = (id) => { open.value = open.value === id ? '' : id }
function outside(e) { if (open.value && root.value && !root.value.contains(e.target)) open.value = '' }
function esc(e) { if (e.key === 'Escape') open.value = '' }
onMounted(() => { document.addEventListener('pointerdown', outside); document.addEventListener('keydown', esc) })
onBeforeUnmount(() => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', esc) })

function setLook(id) { props.project.look = id; open.value = '' }
function setFont(f) { props.project.font = f; props.project.updated = Date.now(); open.value = '' }
function setColor(i, e) { props.project.palette[i] = e.target.value.toUpperCase(); props.project.updated = Date.now() }
function resetColors() { props.project.palette.splice(0, 4, ...props.project.brand.colors); toast('Colours reset to the brand kit') }
const picker = ref(null)
function replaceLogo(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  open.value = ''
  if (f) toast('Prototype: the new logo would be cleaned up and used everywhere')
}
</script>

<template>
  <header ref="root" class="ph">
    <div class="ph__prompt">
      <p class="ph__text" :title="project.prompt">{{ project.prompt }}</p>
      <div v-if="stages.length" class="ph__progress" role="group" :aria-label="stepLabel">
        <span class="ph__steplabel">{{ stepLabel }}</span>
        <span class="ph__dots">
          <button
            v-for="(st, i) in stages" :key="st.id" type="button" class="ph__dot" :class="`is-${st.state}`"
            :disabled="st.state === 'next'" :aria-label="`${i + 1}. ${st.label}`" :title="st.label" @click="emit('jump', st)"
          />
        </span>
      </div>
      <button type="button" class="ph__close" aria-label="Close this project" @click="emit('close')"><Icon name="x" :size="20" /></button>
    </div>

    <div class="ph__chips">
      <div class="ph__group" aria-label="Brand">
        <template v-if="brandReady">
          <!-- Logo -->
          <div class="ph__pop">
            <button type="button" class="ph__chip" :class="{ 'is-open': open === 'logo' }" :aria-expanded="open === 'logo'" @click="toggle('logo')">
              <span class="ph__logo"><LogoMark :project="project" look="original" :size="26" /></span>
              {{ look?.label }} <Icon name="down" :size="16" />
            </button>
            <div v-if="open === 'logo'" class="ph__menu" role="radiogroup" aria-label="Logo look">
              <button
                v-for="l in LOGO_LOOKS" :key="l.id" type="button" role="radio" :aria-checked="project.look === l.id"
                class="ph__opt" :class="{ 'is-on': project.look === l.id }" @click="setLook(l.id)"
              >
                <span class="ph__stage"><LogoMark :project="project" :look="l.id" :size="30" /></span>
                <span><b>{{ l.label }}</b><small>{{ l.note }}</small></span>
              </button>
              <hr />
              <button type="button" class="ph__opt" @click="picker.click()"><Icon name="clip" /> <b>Replace the logo</b></button>
              <input ref="picker" type="file" accept="image/*" hidden @change="replaceLogo" />
            </div>
          </div>

          <!-- Colours -->
          <div class="ph__pop">
            <button type="button" class="ph__chip" :class="{ 'is-open': open === 'colours' }" :aria-expanded="open === 'colours'" @click="toggle('colours')">
              <span class="ph__swatches"><i v-for="(c, i) in project.palette" :key="i" :style="{ background: c }" /></span>
              Colours <Icon name="down" :size="16" />
            </button>
            <div v-if="open === 'colours'" class="ph__menu ph__menu--colours">
              <label v-for="(c, i) in project.palette" :key="i" class="ph__colour">
                <span :style="{ background: c }" /><b>{{ ROLES[i] }}</b><small>{{ c }}</small>
                <input type="color" :value="c" :aria-label="`${ROLES[i]} colour, ${c}`" @input="setColor(i, $event)" />
              </label>
              <hr />
              <button type="button" class="ph__opt" @click="resetColors"><Icon name="refresh" /> <b>Reset to the brand kit</b></button>
            </div>
          </div>

          <!-- Font -->
          <div class="ph__pop">
            <button type="button" class="ph__chip" :class="{ 'is-open': open === 'font' }" :aria-expanded="open === 'font'" @click="toggle('font')">
              <span class="ph__aa" :style="{ fontFamily: `'${font}', 'PT Sans', sans-serif` }">Aa</span>
              {{ font }} <Icon name="down" :size="16" />
            </button>
            <div v-if="open === 'font'" class="ph__menu" role="radiogroup" aria-label="Heading font">
              <button
                v-for="(f, i) in fonts" :key="f" type="button" role="radio" :aria-checked="font === f"
                class="ph__opt" :class="{ 'is-on': font === f }" @click="setFont(f)"
              >
                <span class="ph__fontname" :style="{ fontFamily: `'${f}', 'PT Sans', sans-serif` }">{{ project.brand.short }}</span>
                <span><b>{{ f }}</b><small>{{ i === 0 ? 'From the brand kit' : f === 'PT Sans' ? 'Presto default' : 'Headline font' }}</small></span>
              </button>
            </div>
          </div>
        </template>
        <span v-else class="ph__chip is-wait"><span class="ph__pulse" /> Reading the brand…</span>
      </div>

      <div class="ph__group" role="tablist" aria-label="Project views">
        <button type="button" role="tab" class="ph__chip" :class="{ 'is-on': tab === 'chat' }" :aria-selected="tab === 'chat'" @click="emit('update:tab', 'chat')">
          <Icon name="chat" :size="20" /> Chat
        </button>
        <button type="button" role="tab" class="ph__chip" :class="{ 'is-on': tab === 'concepts' }" :aria-selected="tab === 'concepts'" @click="emit('update:tab', 'concepts')">
          <Icon name="layers" :size="20" /> Concepts <span class="ph__count">{{ project.drafts.length }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.ph { position: relative; z-index: 4; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; padding: 14px 24px 12px; background: var(--surface); border-bottom: 1px solid var(--line); }

/* The original prompt */
.ph__prompt { display: flex; align-items: center; gap: 16px; min-height: 64px; padding: 8px 10px 8px 26px; border: 1px solid var(--line); border-radius: 32px; background: var(--surface-2); }
.ph__text { flex: 1; min-width: 0; margin: 0; font-size: 21px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ph__progress { display: flex; align-items: center; gap: 10px; flex: none; }
.ph__steplabel { font-size: 13px; color: var(--ink-2); white-space: nowrap; }
.ph__dots { display: flex; gap: 4px; }
.ph__dot { width: 18px; height: 6px; padding: 0; border: 0; border-radius: 3px; background: var(--line-bold); cursor: pointer; }
.ph__dot.is-done { background: var(--pill); }
.ph__dot.is-current { background: var(--accent); box-shadow: 0 0 0 2px var(--navy-100); }
.ph__dot:disabled { cursor: default; }
.ph__close { display: grid; place-items: center; width: 44px; height: 44px; flex: none; border: 0; border-radius: 50%; background: var(--surface-3); color: var(--ink); cursor: pointer; }
.ph__close:hover { background: var(--line); }

/* Chips row */
.ph__chips { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.ph__group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ph__chip { display: inline-flex; align-items: center; gap: 10px; min-height: 46px; padding: 6px 18px 6px 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--ink-2); font-size: 16px; cursor: pointer; white-space: nowrap; }
.ph__chip:hover { border-color: var(--line-bold); color: var(--ink); }
.ph__chip.is-on, .ph__chip.is-open { background: var(--selected); border-color: var(--line-bold); color: var(--ink); font-weight: 700; }
.ph__chip.is-on :deep(svg) { color: var(--accent); }
.ph__chip.is-wait { cursor: default; color: var(--ink-3); }
.ph__count { min-width: 22px; padding: 0 7px; border-radius: 999px; background: var(--pill); color: var(--pill-ink); font-size: 12px; font-weight: 700; line-height: 20px; text-align: center; }
.ph__chip:not(.is-on) .ph__count { background: var(--surface-3); color: var(--ink-2); }
.ph__logo { display: grid; place-items: center; width: 32px; height: 32px; margin-left: -4px; border-radius: 50%; background: #fff; border: 1px solid var(--line); overflow: hidden; }
.ph__swatches { display: flex; }
.ph__swatches i { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--surface); box-shadow: 0 0 0 1px var(--line-bold); }
.ph__swatches i + i { margin-left: -6px; }
.ph__aa { font-size: 20px; font-weight: 700; color: var(--ink); line-height: 1; }
.ph__pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--navy-200); animation: pulse 1s ease-in-out infinite alternate; }
@keyframes pulse { to { opacity: 0.3; } }

/* Popovers */
.ph__pop { position: relative; }
.ph__menu { position: absolute; top: calc(100% + 8px); left: 0; z-index: 30; width: 280px; padding: 6px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow-overlay); display: grid; gap: 2px; }
.ph__menu hr { width: 100%; border: 0; border-top: 1px solid var(--line); margin: 4px 0; }
.ph__opt { display: flex; align-items: center; gap: 10px; padding: 8px; border: 0; border-radius: var(--r); background: none; text-align: left; cursor: pointer; }
.ph__opt:hover { background: var(--surface-3); }
.ph__opt.is-on { background: var(--selected); }
.ph__opt b { display: block; font-size: 14px; }
.ph__opt small { color: var(--ink-3); font-size: 12px; }
.ph__stage { display: grid; place-items: center; width: 52px; height: 40px; flex: none; border-radius: var(--r); background: #475569; }
.ph__fontname { width: 112px; flex: none; font-size: 18px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ph__colour { position: relative; display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 10px; padding: 8px; border-radius: var(--r); cursor: pointer; }
.ph__colour:hover { background: var(--surface-3); }
.ph__colour span { width: 28px; height: 28px; border-radius: var(--r); box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.15); }
.ph__colour b { font-size: 14px; }
.ph__colour small { font-size: 12px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.ph__colour input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

@media (max-width: 1100px) { .ph__steplabel { display: none; } }
@media (max-width: 760px) {
  .ph { padding: 12px 14px 10px; }
  .ph__prompt { min-height: 54px; padding-left: 18px; }
  .ph__text { font-size: 17px; }
  .ph__dots { display: none; }
  .ph__chip { min-height: 40px; padding: 4px 14px 4px 10px; font-size: 14px; }
  .ph__close { width: 38px; height: 38px; }
  .ph__group { gap: 6px; }
}
</style>
