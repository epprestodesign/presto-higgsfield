<script setup>
// The one input. On Home it's the big box with modes; in a project it docks
// at the bottom ("Ask for changes…") and glows while the agent is working.
// On Home, while it's empty, it types out example prompts for the picked mode
// (what's possible: a website link, an upload, a mood…). Tab or "Try it" uses one.
// Once they start writing, the same row coaches: what we've picked out of the
// prompt (✓) and the details still worth adding, each one tap to add.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Icon from './Icon.vue'
import { MODES } from '../mockAgent.js'
import { PROMPT_IDEAS } from '../mockData.js'
import { coach, appendTo } from '../promptCoach.js'

const props = defineProps({
  variant: { type: String, default: 'dock' }, // 'home' | 'dock'
  working: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Ask for changes…' },
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['send', 'stop', 'update:modelValue'])

// What to make: Logo only · Banners · Ads · Full suite (see mockAgent MODES).
const mode = ref('full')
const text = ref(props.modelValue)
watch(() => props.modelValue, (v) => { text.value = v; nextTick(grow) })
watch(text, (v) => emit('update:modelValue', v))

const file = ref(null)
const picker = ref(null)
const box = ref(null)
function pick(e) {
  const f = e.target.files?.[0]
  if (f) file.value = { name: f.name, url: URL.createObjectURL(f), file: f }
  e.target.value = ''
}
function grow() {
  const el = box.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, props.variant === 'home' ? 280 : 180)}px`
}
function send() {
  const t = text.value.trim()
  if ((!t && !file.value) || props.working) return
  emit('send', t, { mode: mode.value, logo: file.value })
  text.value = ''
  file.value = null
  nextTick(grow)
}
function key(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send() }
  else if (e.key === 'Tab' && !e.shiftKey && idle.value && idea.value) { e.preventDefault(); tryIdea() }
}

// ---------- Example prompts (Home) ----------
const ideas = computed(() => (props.variant === 'home' ? PROMPT_IDEAS[mode.value] || [] : []))
const at = ref(0)
const idea = computed(() => ideas.value[at.value % (ideas.value.length || 1)])
const typed = ref('')
const idle = computed(() => !!ideas.value.length && !text.value && !file.value)
const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
let run = 0
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function cycle() {
  const me = ++run
  const live = () => me === run
  while (live()) {
    if (!idle.value) { await wait(400); continue }
    const t = idea.value?.text || ''
    if (still) typed.value = t
    else for (let i = 1; i <= t.length && live() && idle.value; i++) { typed.value = t.slice(0, i); await wait(32) }
    await wait(still ? 4200 : 2600)
    if (!live()) return
    if (!still) while (typed.value && live() && idle.value) { typed.value = typed.value.slice(0, -2); await wait(10) }
    if (live() && idle.value) { at.value++; await wait(250) }
  }
}
function next() { at.value++; cycle() }
function tryIdea() {
  const it = idea.value
  if (!it) return
  text.value = it.text
  run++ // stop typing
  nextTick(() => { grow(); const el = box.value; el?.focus(); el?.setSelectionRange(it.text.length, it.text.length) })
  if (it.attach) picker.value?.click()
}
watch(mode, () => { at.value = 0; typed.value = ''; if (ideas.value.length) cycle() })
watch(idle, (v) => { if (v) { typed.value = ''; cycle() } })
if (props.variant === 'home') cycle()
onBeforeUnmount(() => { run++ })

// ---------- Coaching while they write (Home) ----------
const tips = computed(() => coach(text.value, mode.value, !!file.value))
const menuFor = ref('')
function add(d) {
  menuFor.value = ''
  if (d.attach) { picker.value?.click(); return }
  if (d.menu) { menuFor.value = d.id; return }
  if (d.insert) put(d.insert)
}
function put(words) {
  menuFor.value = ''
  text.value = appendTo(text.value, words)
  nextTick(() => { grow(); const el = box.value; el?.focus(); el?.setSelectionRange(text.value.length, text.value.length) })
}
function menuOut(e) { if (!e.currentTarget.contains(e.relatedTarget)) menuFor.value = '' }
defineExpose({ focus: (o) => box.value?.focus(o), mode })
</script>

<template>
  <div class="comp" :class="[`comp--${variant}`, { 'is-working': working }]">
    <div class="comp__box">
      <slot name="context" />
      <div v-if="file" class="comp__file">
        <img :src="file.url" alt="" />
        <span>{{ file.name }}</span>
        <button type="button" aria-label="Remove the logo" @click="file = null"><Icon name="x" :size="16" /></button>
      </div>
      <div v-if="ideas.length && idle" class="comp__idea">
        <span class="comp__tag"><Icon :name="idea.icon" :size="14" /> {{ idea.tag }}</span>
        <span class="comp__hint">
          <button type="button" class="comp__try" :aria-label="`Try this example: ${idea.text}`" @click="tryIdea">
            Try it <kbd>Tab</kbd>
          </button>
          <button type="button" class="comp__next" aria-label="Show another example" @click="next"><Icon name="right" :size="16" /></button>
        </span>
      </div>
      <div v-else-if="ideas.length" class="comp__idea comp__coach">
        <div class="comp__tips" role="group" aria-label="Details in your prompt">
          <span v-for="f in tips.found" :key="f.id" class="comp__got" :title="f.note || undefined">
            <Icon name="check" :size="14" /> <b>{{ f.label }}</b> {{ f.value }}
          </span>
          <template v-for="m in tips.missing" :key="m.id">
            <span v-if="m.hint" class="comp__need">{{ m.hint }}</span>
            <span v-else class="comp__addwrap" @focusout="menuOut" @keydown.esc.stop="menuFor = ''">
              <button type="button" class="comp__add" :aria-expanded="m.menu ? menuFor === m.id : undefined" @click="add(m)">
                <Icon :name="m.icon" :size="14" /> {{ m.add }}
              </button>
              <template v-if="m.or"><span class="comp__or">or</span><button type="button" class="comp__add" @click="add(m.or)"><Icon :name="m.or.icon" :size="14" /> {{ m.or.add }}</button></template>
              <span v-if="menuFor === m.id" class="comp__menu" role="menu">
                <button v-for="w in m.menu" :key="w" type="button" role="menuitem" @click="put(w)">{{ w }}</button>
              </span>
            </span>
          </template>
        </div>
        <span class="comp__meter" :class="{ 'is-ready': tips.done >= tips.total }" aria-live="polite">
          <i v-for="i in tips.total" :key="i" :class="{ 'is-on': i <= tips.done }" />
          {{ tips.verdict }}
        </span>
      </div>
      <div class="comp__row">
        <button v-if="variant === 'dock'" type="button" class="comp__round" aria-label="Attach a logo or image" @click="picker.click()">
          <Icon name="clip" :size="18" />
        </button>
        <div class="comp__field">
          <textarea
            ref="box" v-model="text" rows="1" :placeholder="ideas.length ? '' : placeholder" :aria-label="placeholder"
            @input="grow" @keydown="key"
          />
          <span v-if="idle" class="comp__ghost" aria-hidden="true">{{ typed }}<i v-if="!still" /></span>
        </div>
        <button
          v-if="variant === 'dock'" type="button" class="comp__send" :class="{ 'is-stop': working }"
          :aria-label="working ? 'Stop' : 'Send'" :disabled="!working && !text.trim() && !file" @click="working ? emit('stop') : send()"
        >
          <Icon :name="working ? 'stop' : 'up'" :size="18" />
        </button>
      </div>
      <div v-if="variant === 'home'" class="comp__tools">
        <button type="button" class="comp__round" aria-label="Attach a logo" @click="picker.click()"><Icon name="clip" :size="18" /></button>
        <div class="comp__modes" role="radiogroup" aria-label="What to make">
          <button
            v-for="m in MODES" :key="m.id" type="button" class="cs-tab cs-tab--sm" :class="{ 'is-on': mode === m.id }"
            role="radio" :aria-checked="mode === m.id" @click="mode = m.id"
          >
            <Icon :name="m.icon" :size="18" /> {{ m.label }}
          </button>
        </div>
        <button type="button" class="comp__send" aria-label="Start" :disabled="!text.trim()" @click="send"><Icon name="up" :size="18" /></button>
      </div>
      <input ref="picker" type="file" accept="image/*" hidden @change="pick" />
    </div>
  </div>
</template>

<style scoped>
.comp { position: relative; border-radius: var(--r-card); padding: 1px; background: var(--line-bold); }
.comp:focus-within { background: var(--navy-900); }
.comp.is-working { background: linear-gradient(90deg, var(--navy-100), var(--navy-900), var(--navy-100)) 0 0 / 200% 100%; animation: sweep 1.6s linear infinite; }
@keyframes sweep { to { background-position: -200% 0; } }
.comp__box { display: grid; gap: 10px; border-radius: 7px; background: var(--surface); padding: 10px 10px 10px 16px; }
.comp--dock .comp__box { padding: 8px; }
.comp--dock, .comp--home { box-shadow: var(--shadow); }
.comp--dock { box-shadow: var(--shadow-overlay); }
.comp--home .comp__box { padding: 16px 14px 12px 18px; }
.comp__row { display: flex; align-items: center; gap: 8px; }
.comp__field { position: relative; flex: 1; min-width: 0; display: flex; }
.comp textarea { flex: 1; min-width: 0; resize: none; border: 0; outline: none; background: none; padding: 8px 0; font: inherit; font-size: 16px; color: var(--ink); line-height: 1.45; }
.comp--home textarea { font-size: 18px; min-height: 30px; }
.comp textarea::placeholder { color: var(--ink-3); }
.comp__ghost { position: absolute; inset: 0; padding: 8px 0; font-size: 18px; line-height: 1.45; color: var(--ink-3); pointer-events: none; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.comp__ghost i { display: inline-block; width: 2px; height: 1.1em; margin-left: 2px; vertical-align: -0.15em; background: var(--ink-3); animation: caret 1s steps(1) infinite; }
@keyframes caret { 50% { opacity: 0; } }
.comp__idea { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 26px; }
.comp__coach { align-items: flex-start; }
.comp__tips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; }
.comp__got { display: inline-flex; align-items: center; gap: 5px; max-width: 280px; padding: 0 10px; border-radius: 999px; background: var(--navy-50); color: var(--navy-900); font-size: 12px; line-height: 26px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.comp__got :deep(svg) { flex: none; color: #15803d; }
.comp__got b { font-weight: 700; }
.comp__addwrap { position: relative; display: inline-flex; align-items: center; gap: 4px; }
.comp__add { display: inline-flex; align-items: center; gap: 5px; padding: 0 10px; border: 1px dashed var(--line-bold); border-radius: 999px; background: var(--surface); color: var(--ink-2); font: inherit; font-size: 12px; font-weight: 700; line-height: 24px; cursor: pointer; }
.comp__add::before { content: '+'; font-weight: 700; }
.comp__add:hover, .comp__add[aria-expanded='true'] { border-style: solid; border-color: var(--navy-900); color: var(--ink); }
.comp__or { font-size: 12px; color: var(--ink-3); }
.comp__need { font-size: 12px; color: var(--ink-3); line-height: 26px; }
.comp__menu { position: absolute; z-index: 5; top: calc(100% + 6px); left: 0; display: grid; min-width: 240px; padding: 6px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow-overlay); }
.comp__menu button { padding: 8px 10px; border: 0; border-radius: var(--r); background: none; font: inherit; font-size: 14px; color: var(--ink); text-align: left; cursor: pointer; }
.comp__menu button:hover, .comp__menu button:focus-visible { background: var(--surface-3); }
.comp__meter { display: inline-flex; align-items: center; gap: 4px; flex: none; font-size: 12px; font-weight: 700; color: var(--ink-3); line-height: 26px; white-space: nowrap; }
.comp__meter i { width: 14px; height: 4px; border-radius: 2px; background: var(--line-bold); }
.comp__meter i.is-on { background: var(--navy-900); }
.comp__meter i:last-of-type { margin-right: 4px; }
.comp__meter.is-ready { color: #15803d; }
.comp__meter.is-ready i.is-on { background: #16a34a; }
.comp__tag { display: inline-flex; align-items: center; gap: 6px; padding: 0 10px; border-radius: 999px; background: var(--navy-50); color: var(--navy-900); font-size: 12px; font-weight: 700; line-height: 24px; }
.comp__hint { display: inline-flex; align-items: center; gap: 4px; }
.comp__try { display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border: 0; border-radius: var(--r); background: none; color: var(--ink-2); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.comp__try kbd { padding: 0 5px; border: 1px solid var(--line-bold); border-radius: 3px; background: var(--surface-2); font: 600 11px/18px var(--sans); color: var(--ink-3); }
.comp__try:hover, .comp__next:hover { background: var(--surface-3); color: var(--ink); }
@media (hover: none) { .comp__try kbd { display: none; } }
.comp__next { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: var(--r); background: none; color: var(--ink-3); cursor: pointer; }
.comp__tools { display: flex; align-items: center; gap: 8px; padding-top: 10px; border-top: 1px solid var(--line); }
.comp__modes { display: flex; gap: 6px; flex: 1; flex-wrap: wrap; }
.comp__round { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); color: var(--ink-2); cursor: pointer; }
.comp__round:hover { background: var(--surface-3); }
.comp__send { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border: 0; border-radius: var(--r); background: var(--pill); color: var(--pill-ink); cursor: pointer; }
.comp__send:disabled { background: var(--surface-3); color: var(--ink-3); cursor: default; }
.comp__send.is-stop :deep(svg) { fill: currentColor; }
.comp__file { display: inline-flex; align-items: center; gap: 8px; justify-self: start; padding: 4px 6px 4px 4px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface-2); font-size: 13px; }
.comp__file img { width: 32px; height: 32px; border-radius: 2px; object-fit: contain; background: #fff; }
.comp__file button { display: grid; place-items: center; border: 0; background: none; color: var(--ink-3); cursor: pointer; }
</style>
