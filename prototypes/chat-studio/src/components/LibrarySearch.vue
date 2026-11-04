<script setup>
// Library search, after the Mobbin reference: one big search box; under it the
// libraries as chips (left) and what you've filtered by (right). Focusing the
// box opens a browse panel: categories on the left, their options grouped on
// the right with counts. Typing narrows the options. Keyboard: Tab / Shift+Tab
// switch category, arrows move, Enter picks, Esc closes.
import { computed, nextTick, ref, watch } from 'vue'
import Icon from './Icon.vue'
import { FACET_LABEL } from '../libraryFacets.js'

const props = defineProps({
  kind: { type: String, required: true },
  kinds: { type: Array, required: true }, // [{ id, label, icon }]
  categories: { type: Array, required: true },
  tags: { type: Array, required: true }, // picked option keys
  q: { type: String, default: '' },
  placeholder: { type: String, default: 'Search' },
})
const emit = defineEmits(['update:q', 'toggle', 'clear', 'kind'])

const open = ref(false)
const root = ref(null)
const input = ref(null)
const cat = ref(0)
const active = ref(-1)
const text = ref(props.q)
watch(() => props.q, (v) => { text.value = v })
watch(() => props.kind, () => { cat.value = 0; active.value = -1; text.value = '' })

const words = computed(() => text.value.trim().toLowerCase())
// Typing searches every category's options; otherwise show the chosen category.
const shownGroups = computed(() => {
  if (words.value) {
    const all = props.categories.flatMap((c) => c.groups.flatMap((g) => g.options.map((o) => ({ ...o, where: c.label }))))
    const hits = all.filter((o) => o.label.toLowerCase().includes(words.value) || o.value.toLowerCase().includes(words.value))
    return [{ label: hits.length ? 'Filters that match' : 'No filters match', options: hits }]
  }
  return props.categories[cat.value]?.groups || []
})
const flat = computed(() => shownGroups.value.flatMap((g) => g.options))
const picked = (o) => props.tags.includes(o.key)
const optionId = (i) => `ls-opt-${i}`
const allLabels = computed(() => Object.fromEntries(props.categories.flatMap((c) => c.groups.flatMap((g) => g.options.map((o) => [o.key, o.label])))))
const chipLabel = (key) => { const f = key.split(':')[0]; return `${FACET_LABEL[f] || f}: ${allLabels.value[key] || key.split(':').slice(1).join(':')}` }

function show() { open.value = true }
function close() { open.value = false; active.value = -1 }
function pick(o) { emit('toggle', o.key); if (words.value) { text.value = ''; emit('update:q', '') } close() }
function search() { emit('update:q', text.value.trim()); close() }
function onFocusOut(e) { if (!root.value?.contains(e.relatedTarget)) close() }
function cols() { return window.matchMedia('(max-width: 900px)').matches ? 2 : 3 }
function key(e) {
  if (e.key === 'Escape') { if (open.value) { e.preventDefault(); close() } return }
  if (!open.value && ['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); show(); return }
  if (!open.value) { if (e.key === 'Enter') search(); return }
  const n = flat.value.length
  if (e.key === 'Tab' && !words.value && props.categories.length > 1) {
    e.preventDefault()
    cat.value = (cat.value + (e.shiftKey ? -1 : 1) + props.categories.length) % props.categories.length
    active.value = -1
  } else if (e.key === 'ArrowRight' && n) { e.preventDefault(); active.value = Math.min(n - 1, active.value + 1) }
  else if (e.key === 'ArrowLeft' && n) { e.preventDefault(); active.value = Math.max(0, active.value - 1) }
  else if (e.key === 'ArrowDown' && n) { e.preventDefault(); active.value = active.value < 0 ? 0 : Math.min(n - 1, active.value + cols()) }
  else if (e.key === 'ArrowUp' && n) { e.preventDefault(); active.value = Math.max(0, active.value - cols()) }
  else if (e.key === 'Enter') { e.preventDefault(); if (active.value >= 0 && flat.value[active.value]) pick(flat.value[active.value]); else search() }
}
watch(active, (i) => nextTick(() => document.getElementById(optionId(i))?.scrollIntoView({ block: 'nearest' })))
watch(text, () => { active.value = -1 })
function clearText() { text.value = ''; emit('update:q', ''); input.value?.focus() }
const index = (o) => flat.value.indexOf(o)
defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div ref="root" class="ls" :class="{ 'is-open': open }" @focusout="onFocusOut">
    <div class="ls__field">
      <Icon name="search" :size="20" />
      <input
        ref="input" v-model="text" type="search" class="ls__input" :placeholder="placeholder" :aria-label="placeholder"
        role="combobox" :aria-expanded="open" aria-controls="ls-panel" aria-autocomplete="list"
        :aria-activedescendant="active >= 0 ? optionId(active) : undefined"
        @focus="show" @click="show" @keydown="key"
      />
      <button v-if="text" type="button" class="ls__clear" aria-label="Clear the search" @click="clearText"><Icon name="x" :size="18" /></button>
    </div>

    <!-- Browse panel -->
    <div v-if="open" id="ls-panel" class="ls__panel">
      <div class="ls__body">
        <nav class="ls__rail" aria-label="Browse by">
          <button
            v-for="(c, i) in categories" :key="c.id" type="button" class="ls__cat" :class="{ 'is-on': !words && cat === i }"
            :aria-current="!words && cat === i ? 'true' : undefined" @mousedown.prevent @click="cat = i; text = ''; active = -1"
          >
            <span class="ls__tile" :class="`is-${c.tone}`"><Icon :name="c.icon" :size="18" /></span>
            <span class="ls__catname">{{ c.label }}</span>
            <Icon name="right" :size="18" />
          </button>
        </nav>
        <div class="ls__groups" role="listbox" :aria-label="words ? 'Matching filters' : categories[cat]?.label">
          <section v-for="g in shownGroups" :key="g.label" class="ls__group" role="group" :aria-label="g.label">
            <h3 class="ls__gtitle">{{ g.label }}</h3>
            <div class="ls__opts">
              <button
                v-for="o in g.options" :id="optionId(index(o))" :key="o.key" type="button" role="option" tabindex="-1"
                class="ls__opt" :class="{ 'is-active': index(o) === active, 'is-picked': picked(o) }" :aria-selected="picked(o)"
                @mousedown.prevent @click="pick(o)" @mousemove="active = index(o)"
              >
                <Icon v-if="picked(o)" name="check" :size="16" />
                <span class="ls__olabel">{{ o.label }}</span>
                <small v-if="o.hint">{{ o.hint }}</small>
                <small v-else-if="o.where">{{ o.where }}</small>
                <span class="ls__count">{{ o.count }}</span>
              </button>
            </div>
          </section>
          <button v-if="words" type="button" class="ls__searchfor" @mousedown.prevent @click="search">
            <Icon name="search" :size="18" /> Search for “{{ text.trim() }}”
          </button>
        </div>
      </div>
      <footer class="ls__keys" aria-hidden="true">
        <span><kbd>Tab</kbd><kbd>Shift + Tab</kbd> Switch category</span>
        <span><kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> Navigate</span>
        <span><kbd>Enter</kbd> Select</span>
        <span><kbd>Esc</kbd> Close</span>
      </footer>
    </div>

    <!-- Libraries (left) · what you've filtered by (right) -->
    <div class="ls__bar">
      <div class="cs-tabs" role="radiogroup" aria-label="Library">
        <button
          v-for="k in kinds" :key="k.id" type="button" role="radio" class="cs-tab" :class="{ 'is-on': kind === k.id }"
          :aria-checked="kind === k.id" @click="emit('kind', k.id)"
        ><Icon :name="k.icon" :size="18" /> {{ k.label }}</button>
      </div>
      <div v-if="tags.length || q" class="ls__picked cs-tabs" aria-label="Filtered by">
        <button v-if="q" type="button" class="cs-tab cs-tab--sm is-on" :aria-label="`Remove search ${q}`" @click="emit('update:q', '')">“{{ q }}” <Icon name="x" :size="14" /></button>
        <button v-for="t in tags" :key="t" type="button" class="cs-tab cs-tab--sm is-on" :aria-label="`Remove ${chipLabel(t)}`" @click="emit('toggle', t)">{{ chipLabel(t) }} <Icon name="x" :size="14" /></button>
        <button type="button" class="ls__clearall" @click="text = ''; emit('clear')">Clear all</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ls { position: relative; display: grid; gap: 14px; }
.ls__field { position: relative; z-index: 21; display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 0 16px 0 22px; border: 1px solid var(--line-bold); border-radius: 999px; background: var(--surface); color: var(--ink-3); box-shadow: var(--shadow); }
.ls__field:focus-within { border-color: var(--navy-900); box-shadow: 0 0 0 1px var(--navy-900), var(--shadow); }
.ls.is-open .ls__field { border-radius: var(--r-card) var(--r-card) 0 0; box-shadow: none; }
.ls__input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font: inherit; font-size: 19px; color: var(--ink); }
.ls__input::placeholder { color: var(--ink-3); }
.ls__input::-webkit-search-cancel-button { display: none; }
.ls__clear { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 50%; background: none; color: var(--ink-3); cursor: pointer; }
.ls__clear:hover { background: var(--surface-3); color: var(--ink); }

.ls__panel { position: absolute; z-index: 20; top: 63px; left: 0; right: 0; display: grid; grid-template-rows: minmax(0, 1fr) auto; max-height: min(640px, 72vh); border: 1px solid var(--navy-900); border-top-color: var(--line); border-radius: 0 0 var(--r-card) var(--r-card); background: var(--surface); box-shadow: var(--shadow-overlay); overflow: hidden; }
.ls__body { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 0; }
.ls__rail { display: grid; align-content: start; gap: 4px; padding: 14px; border-right: 1px solid var(--line); background: var(--surface-2); overflow-y: auto; }
.ls__cat { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 10px; border: 0; border-radius: var(--r-card); background: none; color: var(--ink); font: inherit; font-size: 16px; text-align: left; cursor: pointer; }
.ls__cat > :last-child { margin-left: auto; color: var(--ink-3); }
.ls__cat:hover { background: var(--surface-3); }
.ls__cat.is-on { background: var(--surface); box-shadow: 0 0 0 1px var(--line), var(--shadow); font-weight: 700; }
.ls__catname { flex: 1; }
.ls__tile { display: grid; place-items: center; width: 34px; height: 34px; flex: none; border-radius: var(--r); }
.ls__tile.is-amber { background: #fef3c7; color: #b45309; }
.ls__tile.is-navy { background: var(--navy-50); color: var(--navy-900); }
.ls__tile.is-rose { background: #ffe4e6; color: #be123c; }
.ls__tile.is-sky { background: #e0f2fe; color: #0369a1; }
.ls__tile.is-violet { background: #ede9fe; color: #6d28d9; }

.ls__groups { padding: 22px 26px 26px; overflow-y: auto; }
.ls__group + .ls__group { margin-top: 26px; }
.ls__gtitle { margin: 0 0 10px; font-size: 18px; color: var(--ink); }
.ls__opts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px 18px; }
.ls__opt { display: flex; align-items: baseline; gap: 8px; min-width: 0; min-height: 44px; padding: 10px 10px; border: 0; border-radius: var(--r); background: none; color: var(--ink); font: inherit; font-size: 16px; text-align: left; cursor: pointer; }
.ls__opt :deep(svg) { align-self: center; color: var(--navy-900); flex: none; }
.ls__olabel { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ls__opt small { color: var(--ink-3); font-size: 12px; white-space: nowrap; }
.ls__count { color: var(--ink-3); font-size: 15px; }
.ls__opt.is-active { background: var(--surface-3); }
.ls__opt.is-picked { font-weight: 700; }
.ls__searchfor { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 48px; margin-top: 18px; padding: 10px 12px; border: 1px dashed var(--line-bold); border-radius: var(--r); background: none; color: var(--ink-2); font: inherit; font-size: 15px; cursor: pointer; }
.ls__searchfor:hover { background: var(--surface-3); color: var(--ink); }
.ls__keys { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px 28px; padding: 10px 16px; border-top: 1px solid var(--line); background: var(--surface-2); color: var(--ink-3); font-size: 13px; }
.ls__keys span { display: inline-flex; align-items: center; gap: 4px; }
.ls__keys kbd { padding: 0 6px; border-radius: 3px; background: var(--surface-3); font: 600 12px/20px var(--sans); color: var(--ink-2); }
.ls__keys kbd:last-of-type { margin-right: 4px; }

.ls__bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.ls__picked { justify-content: flex-end; }
.ls__picked .cs-tab :deep(svg) { margin-left: 2px; }
.ls__clearall { border: 0; background: none; padding: 4px 6px; color: var(--ink-2); font: inherit; font-size: 14px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.ls__clearall:hover { color: var(--ink); }

@media (max-width: 900px) { .ls__opts { grid-template-columns: repeat(2, minmax(0, 1fr)); } .ls__body { grid-template-columns: 210px minmax(0, 1fr); } }
@media (max-width: 640px) {
  .ls__field { min-height: 54px; }
  .ls__body { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); }
  .ls__rail { display: flex; gap: 6px; padding: 10px; border-right: 0; border-bottom: 1px solid var(--line); overflow-x: auto; }
  .ls__cat { flex: none; min-height: 40px; font-size: 14px; }
  .ls__cat > :last-child { display: none; }
  .ls__tile { width: 26px; height: 26px; }
  .ls__opts { grid-template-columns: 1fr; }
  .ls__keys { display: none; }
}
</style>
