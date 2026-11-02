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
  // Drag-and-drop / paste of images. Off where the parent doesn't use the
  // attachments (the canvas composer).
  droppable: { type: Boolean, default: true },
})
const text = defineModel('text', { type: String, default: '' })
const mode = defineModel('mode', { type: String, default: 'banner' })
const model = defineModel('model', { type: String, default: 'auto' })
const logo = defineModel('logo', { type: Object, default: null }) // { src, name }
const references = defineModel('references', { type: Array, default: () => [] }) // [{ src, name }]
const emit = defineEmits(['submit'])

const logoInput = ref(null)
const refInput = ref(null)
const MAX_REFS = 6
async function setLogo(f) { if (f) logo.value = { src: await readFile(f), name: f.name.replace(/\.[^.]+$/, '') } }
async function addRefs(files) {
  for (const f of files.slice(0, MAX_REFS - references.value.length)) references.value = [...references.value, { src: await readFile(f), name: f.name }]
}
async function pickLogo(e) {
  await setLogo(e.target.files?.[0])
  e.target.value = ''
}
async function pickRefs(e) {
  await addRefs([...(e.target.files || [])])
  e.target.value = ''
}

// ── Drag and drop / paste ─────────────────────────────────────────────────
// Dragging an image over the box splits it into two targets, Logo and
// Reference images, so we never have to guess which one a file is.
const isImage = (f) => /^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(f.type)
const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files')
const dragging = ref(false)
const over = ref('') // 'logo' | 'refs' | ''
const dropNote = ref('')
let depth = 0
let noteTimer = 0
function note(msg) {
  dropNote.value = msg
  clearTimeout(noteTimer)
  noteTimer = setTimeout(() => { dropNote.value = '' }, 4000)
}
function onDragEnter(e) {
  if (!props.droppable || !hasFiles(e)) return
  e.preventDefault()
  depth++
  dragging.value = true
}
function onDragOver(e) {
  if (!props.droppable || !hasFiles(e)) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}
function onDragLeave(e) {
  if (!props.droppable || !hasFiles(e)) return
  if (--depth <= 0) { depth = 0; dragging.value = false; over.value = '' }
}
async function onDrop(e, target = over.value || (mode.value === 'logo' ? 'logo' : 'refs')) {
  if (!props.droppable || !hasFiles(e)) return
  e.preventDefault()
  depth = 0
  dragging.value = false
  over.value = ''
  await take([...(e.dataTransfer.files || [])], target)
}
async function take(all, target) {
  const files = all.filter(isImage)
  if (!files.length) return note('Drop a PNG, JPG, WebP or SVG image.')
  if (target === 'logo') {
    await setLogo(files[0])
    if (files.length > 1) note('Only one logo per project, so I used the first image.')
  } else {
    const room = MAX_REFS - references.value.length
    if (room <= 0) return note(`You already have ${MAX_REFS} reference images. Remove one to add another.`)
    await addRefs(files)
    if (files.length > room) note(`Added ${room}: up to ${MAX_REFS} reference images.`)
  }
  focus()
}
/** ⌘V an image: the logo in Logo mode, otherwise a reference image. */
async function onPaste(e) {
  if (!props.droppable) return
  const files = [...(e.clipboardData?.files || [])].filter(isImage)
  if (!files.length) return // plain text pastes as usual
  e.preventDefault()
  await take(files, mode.value === 'logo' ? 'logo' : 'refs')
}

const hint = computed(() => props.placeholder || (mode.value === 'logo'
  ? 'Drop in a logo (or a screenshot with it) and tell us anything to fix…'
  : 'Describe the banner for your event, or drop in a logo or reference images…'))
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
  <div
    class="pc" :class="{ 'pc--compact': compact, 'is-dragging': dragging }"
    @dragenter="onDragEnter" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop" @paste="onPaste"
  >
    <div v-if="dragging" class="pc__drop" aria-hidden="true">
      <div class="pc__zone" :class="{ 'is-over': over === 'logo' }" @dragenter="over = 'logo'" @dragover.prevent="over = 'logo'" @drop.stop="onDrop($event, 'logo')">
        <q-icon name="auto_fix_high" size="26px" />
        <strong>Logo</strong>
        <small>Clean it up and use it on banners</small>
      </div>
      <div class="pc__zone" :class="{ 'is-over': over === 'refs' }" @dragenter="over = 'refs'" @dragover.prevent="over = 'refs'" @drop.stop="onDrop($event, 'refs')">
        <q-icon name="add_photo_alternate" size="26px" />
        <strong>Reference images</strong>
        <small>Venue, mood or past banners · up to {{ MAX_REFS }}</small>
      </div>
    </div>
    <p v-if="dropNote" class="pc__note" role="status">{{ dropNote }}</p>
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
.pc { position: relative; }
.pc.is-dragging { border-color: var(--bs-accent); }
.pc__drop { position: absolute; inset: 6px; z-index: 5; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.pc__zone { display: grid; place-content: center; justify-items: center; gap: 4px; text-align: center; padding: 10px; border-radius: 14px; border: 2px dashed var(--bs-line); background: var(--bs-surface, #fff); color: var(--bs-ink-soft); font: 500 0.8125rem var(--bs-font); transition: border-color 0.12s, background 0.12s, color 0.12s; }
.pc__zone strong { color: var(--bs-ink); font-weight: 600; font-size: 0.9375rem; }
.pc__zone.is-over { border-color: var(--bs-accent); border-style: solid; background: var(--bs-accent-soft); color: var(--bs-ink); }
.pc__zone.is-over .q-icon { color: var(--bs-accent); }
.pc__zone * { pointer-events: none; }
.pc__note { margin: 0; font: 500 0.8125rem var(--bs-font); color: var(--bs-ink-soft); }
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
