<script setup>
// PromptComposer — the Stitch-style prompt box: attachments on top, the
// prompt, then a footer with + (attach a logo / reference images), the
// Banners | Logo mode switch, Optimize prompt, the model picker and send.
// `compact` is the one-line version at the bottom of the project canvas.
import { computed, nextTick, ref, watch } from 'vue'
import ModelMenu from './ModelMenu.vue'
import { optimizePrompt } from '../../banner-lab/optimizePrompt.js'
import { readFile } from '../../banner-lab/canvas.js'

const props = defineProps({
  compact: { type: Boolean, default: false },
  modelMenuOpen: { type: Boolean, default: false },
  showMode: { type: Boolean, default: true },
  busy: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
})
const text = defineModel('text', { type: String, default: '' })
const mode = defineModel('mode', { type: String, default: 'banner' })
const model = defineModel('model', { type: String, default: 'auto' })
const logo = defineModel('logo', { type: Object, default: null }) // { src, name }
const references = defineModel('references', { type: Array, default: () => [] }) // [{ src, name }]
const emit = defineEmits(['submit'])

const logoInput = ref(null)
const refInput = ref(null)
async function pickLogo(e) {
  const f = e.target.files?.[0]
  if (f) logo.value = { src: await readFile(f), name: f.name.replace(/\.[^.]+$/, '') }
  e.target.value = ''
}
async function pickRefs(e) {
  for (const f of [...(e.target.files || [])].slice(0, 6 - references.value.length)) references.value = [...references.value, { src: await readFile(f), name: f.name }]
  e.target.value = ''
}

const hint = computed(() => props.placeholder || (mode.value === 'logo' ? 'Attach a logo (or a screenshot with it) and tell us anything to fix…' : 'Describe the banner for your event…'))
const canSend = computed(() => !props.busy && (text.value.trim().length > 2 || !!logo.value))
function send() { if (canSend.value) emit('submit') }
function onKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
function optimize() {
  text.value = optimizePrompt({ description: text.value, references: references.value.map(() => null) }).prompt
}
const context = computed(() => ({ prompt: text.value, references: references.value.length, hasLogo: !!logo.value }))

// The box grows with its text (up to a cap), so a filled-in suggestion is
// readable in full before it's sent.
const input = ref(null)
function fit() {
  const el = input.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`
}
watch(text, () => nextTick(fit), { flush: 'post' })

/** Focus the prompt with the cursor at the end. */
function focus() {
  nextTick(() => {
    const el = input.value
    if (!el) return
    fit()
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    el.scrollTop = el.scrollHeight
  })
}
defineExpose({ focus })
</script>

<template>
  <div class="pc" :class="{ 'pc--compact': compact }">
    <div v-if="logo || references.length" class="pc__attach" aria-label="Attachments">
      <span v-if="logo" class="pc__chip">
        <img :src="logo.src" alt="" class="pc__chip-logo" />
        <span><strong>Logo</strong><small>{{ logo.name }}</small></span>
        <q-btn round dense flat size="xs" icon="close" :aria-label="`Remove logo ${logo.name}`" @click="logo = null" />
      </span>
      <span v-for="(r, i) in references" :key="i" class="pc__chip pc__chip--ref">
        <img :src="r.src" alt="" />
        <q-btn round dense flat size="xs" icon="close" class="pc__chip-x" :aria-label="`Remove ${r.name}`" @click="references = references.filter((_, j) => j !== i)" />
      </span>
    </div>

    <textarea
      ref="input" v-model="text" class="pc__input" :rows="compact ? 1 : 4" :placeholder="hint" aria-label="Prompt" @keydown="onKey"
    />

    <div class="pc__bar">
      <q-btn round flat dense icon="add" class="pc__icon" aria-label="Attach">
        <q-menu anchor="top left" self="bottom left" :offset="[0, 8]">
          <q-list style="min-width: 240px">
            <q-item v-close-popup clickable @click="logoInput.click()">
              <q-item-section avatar><q-icon name="auto_fix_high" /></q-item-section>
              <q-item-section><q-item-label>Upload a logo</q-item-label><q-item-label caption>PNG, JPG, WebP or SVG</q-item-label></q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="refInput.click()">
              <q-item-section avatar><q-icon name="add_photo_alternate" /></q-item-section>
              <q-item-section><q-item-label>Add reference images</q-item-label><q-item-label caption>Up to 6: venue, mood, past banners</q-item-label></q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <input ref="logoInput" class="bs-sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" tabindex="-1" @change="pickLogo" />
      <input ref="refInput" class="bs-sr-only" type="file" accept="image/*" multiple tabindex="-1" @change="pickRefs" />

      <div v-if="showMode" class="pc__mode" role="radiogroup" aria-label="What are you making?">
        <button type="button" role="radio" :aria-checked="mode === 'banner'" :class="{ 'is-on': mode === 'banner' }" @click="mode = 'banner'"><q-icon name="wallpaper" size="16px" /> Banners</button>
        <button type="button" role="radio" :aria-checked="mode === 'logo'" :class="{ 'is-on': mode === 'logo' }" @click="mode = 'logo'"><q-icon name="auto_fix_high" size="16px" /> Logo</button>
      </div>

      <span class="pc__spacer" />
      <q-btn v-if="mode === 'banner'" round flat dense icon="auto_awesome" class="pc__icon" :disable="!text.trim()" aria-label="Optimize prompt" @click="optimize">
        <q-tooltip>Optimize prompt for Higgsfield</q-tooltip>
      </q-btn>
      <ModelMenu v-model="model" :mode="mode" :context="context" :start-open="modelMenuOpen" />
      <q-btn round unelevated dense icon="arrow_upward" class="pc__send" :class="{ 'is-ready': canSend }" :disable="!canSend" :loading="busy" aria-label="Send" @click="send" />
    </div>
  </div>
</template>

<style scoped>
.pc { background: rgb(255 255 255 / 0.72); border: 1px solid var(--bs-line); border-radius: 20px; padding: 14px 14px 10px; box-shadow: var(--bs-shadow-2); backdrop-filter: blur(10px); display: grid; gap: 8px; }
.pc--compact { border-radius: 18px; padding: 10px 12px 8px; }
.pc__attach { display: flex; flex-wrap: wrap; gap: 8px; }
.pc__chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 6px 6px 8px; border-radius: 12px; background: var(--bs-surface-2); border: 1px solid var(--bs-line); font: 500 0.8125rem var(--bs-font); }
.pc__chip-logo { width: 34px; height: 34px; object-fit: contain; }
.pc__chip strong { display: block; color: var(--bs-ink); }
.pc__chip small { color: var(--bs-ink-soft); }
.pc__chip--ref { position: relative; padding: 0; overflow: hidden; }
.pc__chip--ref img { width: 64px; height: 46px; object-fit: cover; display: block; }
.pc__chip-x { position: absolute; top: 2px; right: 2px; background: rgb(255 255 255 / 0.9); }
.pc__input { width: 100%; border: 0; background: transparent; resize: none; outline: none; font: 400 1rem/1.55 var(--bs-font); color: var(--bs-ink); padding: 4px 4px; min-height: 28px; }
.pc--compact .pc__input { font-size: 0.9375rem; }
.pc__bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; row-gap: 8px; }
.pc__icon { color: var(--bs-ink-soft); }
.pc__mode { display: inline-flex; padding: 3px; border-radius: 999px; background: var(--bs-surface-2); }
.pc__mode button { display: inline-flex; align-items: center; gap: 4px; border: 0; background: transparent; padding: 5px 12px; border-radius: 999px; font: 600 0.8125rem var(--bs-font); color: var(--bs-ink-soft); cursor: pointer; }
.pc__mode button.is-on { background: var(--bs-surface); color: var(--bs-ink); box-shadow: var(--bs-shadow-1); }
.pc__spacer { flex: 1; }
.pc__send { background: var(--bs-line); color: #fff; width: 34px; height: 34px; }
.pc__send.is-ready { background: var(--bs-ink); }
</style>
