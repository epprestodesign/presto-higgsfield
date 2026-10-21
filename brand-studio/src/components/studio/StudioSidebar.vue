<script setup>
// StudioSidebar — tabbed editing panels.
//   layout="rail"  (desktop) — vertical icon rail + 300px panel, Webflow-style
//   layout="sheet" (< 900px) — bottom tab bar; the panel opens as a bottom sheet
import { computed, ref, nextTick } from 'vue'
import BrandPanel from './panels/BrandPanel.vue'
import ContentPanel from './panels/ContentPanel.vue'
import PagesPanel from './panels/PagesPanel.vue'
import AdsPanel from './panels/AdsPanel.vue'
import ConceptPanel from './panels/ConceptPanel.vue'

const props = defineProps({
  tab: { type: String, default: 'brand' },
  layout: { type: String, default: 'rail' }, // 'rail' | 'sheet'
  open: { type: Boolean, default: false }, // sheet open (sheet layout only)
})
const emit = defineEmits(['update:tab', 'update:open', 'change-concept', 'edit-sponsors', 'focus-page'])

const TABS = [
  { id: 'brand', label: 'Brand', icon: 'palette', component: BrandPanel },
  { id: 'content', label: 'Content', icon: 'notes', component: ContentPanel },
  { id: 'pages', label: 'Pages', icon: 'web', component: PagesPanel },
  { id: 'ads', label: 'Ads', icon: 'campaign', component: AdsPanel },
  { id: 'concept', label: 'Concept', icon: 'auto_awesome', component: ConceptPanel },
]

const active = computed(() => TABS.find((t) => t.id === props.tab) || TABS[0])
const tabEls = ref([])
const isSheet = computed(() => props.layout === 'sheet')

function select(id) {
  if (isSheet.value) {
    emit('update:open', !(props.open && props.tab === id))
  }
  emit('update:tab', id)
}
async function onTabKey(e, i) {
  const prev = isSheet.value ? 'ArrowLeft' : 'ArrowUp'
  const next = isSheet.value ? 'ArrowRight' : 'ArrowDown'
  let j = null
  if (e.key === prev) j = (i - 1 + TABS.length) % TABS.length
  if (e.key === next) j = (i + 1) % TABS.length
  if (e.key === 'Home') j = 0
  if (e.key === 'End') j = TABS.length - 1
  if (j === null) return
  e.preventDefault()
  emit('update:tab', TABS[j].id)
  await nextTick()
  tabEls.value[j]?.focus()
}
function onGotoTab(id) { emit('update:tab', id) }
</script>

<template>
  <aside class="ssb" :class="`ssb--${layout}`" aria-label="Editing panels">
    <!-- Panel -->
    <section
      v-show="!isSheet || open"
      :id="`ssb-panel-${active.id}`"
      class="ssb__panel"
      role="tabpanel"
      :aria-labelledby="`ssb-tab-${active.id}`"
      @keydown.esc="isSheet && emit('update:open', false)"
    >
      <header class="ssb__panel-head">
        <span v-if="isSheet" class="ssb__grabber" aria-hidden="true" />
        <h2 class="ssb__panel-title">{{ active.label }}</h2>
        <q-btn v-if="isSheet" flat round dense icon="close" aria-label="Close panel" class="ssb__close" @click="emit('update:open', false)" />
      </header>
      <div class="ssb__panel-body">
        <component
          :is="active.component"
          @change-concept="emit('change-concept')"
          @edit-sponsors="emit('edit-sponsors')"
          @focus-page="(p) => emit('focus-page', p)"
          @goto-tab="onGotoTab"
        />
      </div>
    </section>

    <!-- Tabs -->
    <div class="ssb__tabs" role="tablist" :aria-orientation="isSheet ? 'horizontal' : 'vertical'" aria-label="Editor sections">
      <button
        v-for="(t, i) in TABS"
        :id="`ssb-tab-${t.id}`"
        :key="t.id"
        :ref="(el) => (tabEls[i] = el)"
        type="button"
        role="tab"
        class="ssb__tab bs-focusable"
        :class="{ 'is-active': t.id === active.id, 'ssb__tab--ai': t.id === 'concept' }"
        :aria-selected="t.id === active.id"
        :aria-controls="`ssb-panel-${t.id}`"
        :tabindex="t.id === active.id ? 0 : -1"
        @click="select(t.id)"
        @keydown="onTabKey($event, i)"
      >
        <q-icon :name="t.icon" size="20px" />
        <span class="ssb__tab-label">{{ t.label }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.ssb { font-family: var(--bs-font); background: var(--bs-surface); }

/* ── Rail (desktop) ─────────────────────────────────────────────── */
.ssb--rail { display: grid; grid-template-columns: 64px minmax(0, 1fr); grid-template-areas: 'tabs panel'; height: 100%; min-height: 0; border-right: 1px solid var(--bs-line); }
.ssb--rail .ssb__tabs { grid-area: tabs; display: flex; flex-direction: column; gap: 4px; padding: 10px 8px; border-right: 1px solid var(--bs-line); background: var(--bs-surface-2); }
.ssb--rail .ssb__panel { grid-area: panel; display: flex; flex-direction: column; min-height: 0; }

.ssb__tab { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; min-height: 52px; padding: 6px 2px; border: 0; border-radius: var(--bs-radius-md); background: transparent; color: var(--bs-ink-soft); cursor: pointer; transition: background var(--ds-duration-fast), color var(--ds-duration-fast); }
.ssb__tab:hover { color: var(--bs-ink); background: rgb(3 10 38 / 0.04); }
.ssb__tab.is-active { background: var(--bs-surface); color: var(--bs-brand); box-shadow: var(--bs-shadow-1), 0 0 0 1px var(--bs-line); }
.ssb__tab--ai.is-active { color: var(--bs-accent); }
.ssb__tab-label { font: 700 0.6875rem/1 var(--bs-font); letter-spacing: 0.01em; }

.ssb__panel-head { display: flex; align-items: center; gap: 8px; height: 52px; padding: 0 16px; border-bottom: 1px solid var(--bs-line); flex: none; }
.ssb__panel-title { margin: 0; flex: 1; font: 700 1rem/1 var(--bs-font); color: var(--bs-ink); }
.ssb__panel-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }

/* ── Sheet (narrow) ─────────────────────────────────────────────── */
.ssb--sheet { position: absolute; inset: auto 0 0 0; z-index: 20; display: flex; flex-direction: column; pointer-events: none; }
.ssb--sheet > * { pointer-events: auto; }
.ssb--sheet .ssb__panel { max-height: min(64vh, 560px); display: flex; flex-direction: column; background: var(--bs-surface); border-radius: var(--bs-radius-lg) var(--bs-radius-lg) 0 0; box-shadow: var(--bs-shadow-3); animation: ssb-up var(--ds-duration-base) var(--ds-ease-decelerate); }
.ssb--sheet .ssb__panel-head { position: relative; padding-top: 10px; height: 56px; }
.ssb__grabber { position: absolute; top: 6px; left: 50%; width: 36px; height: 4px; margin-left: -18px; border-radius: 4px; background: var(--bs-line-strong); }
.ssb__close { color: var(--bs-ink-soft); }
.ssb--sheet .ssb__tabs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; padding: 6px 8px calc(6px + env(safe-area-inset-bottom)); background: var(--bs-surface); border-top: 1px solid var(--bs-line); }
.ssb--sheet .ssb__tab { min-height: 48px; }
@keyframes ssb-up { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .ssb--sheet .ssb__panel { animation: none; } }
</style>
