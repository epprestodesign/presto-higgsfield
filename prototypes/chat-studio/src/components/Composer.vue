<script setup>
// The one input. On Home it's the big box with modes; in a project it docks
// at the bottom ("Ask for changes…") and glows while the agent is working.
import { nextTick, ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  variant: { type: String, default: 'dock' }, // 'home' | 'dock'
  working: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Ask for changes…' },
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['send', 'stop', 'update:modelValue'])

const MODES = [
  { id: 'full', label: 'Logo + banners', icon: 'spark' },
  { id: 'banners', label: 'Banners only', icon: 'image' },
]
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
  el.style.height = `${Math.min(el.scrollHeight, 180)}px`
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
}
defineExpose({ focus: () => box.value?.focus() })
</script>

<template>
  <div class="comp" :class="[`comp--${variant}`, { 'is-working': working }]">
    <div class="comp__box">
      <div v-if="file" class="comp__file">
        <img :src="file.url" alt="" />
        <span>{{ file.name }}</span>
        <button type="button" aria-label="Remove the logo" @click="file = null"><Icon name="x" :size="16" /></button>
      </div>
      <div class="comp__row">
        <button v-if="variant === 'dock'" type="button" class="comp__round" aria-label="Attach a logo or image" @click="picker.click()">
          <Icon name="clip" :size="18" />
        </button>
        <textarea
          ref="box" v-model="text" rows="1" :placeholder="placeholder" :aria-label="placeholder"
          @input="grow" @keydown="key"
        />
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
.comp textarea { flex: 1; min-width: 0; resize: none; border: 0; outline: none; background: none; padding: 8px 0; font: inherit; font-size: 16px; color: var(--ink); line-height: 1.45; }
.comp--home textarea { font-size: 18px; min-height: 30px; }
.comp textarea::placeholder { color: var(--ink-3); }
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
