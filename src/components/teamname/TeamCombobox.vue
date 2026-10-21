<script setup>
// TeamCombobox — the shared Team name dropdown for both team flows
// (Book Reservation + Group Block), so they can't drift apart (DES-470).
// The field itself is the search box: type in "Search or select your team..."
// and the list filters right under it — no second search bar (DES-471/477).
// Plain list with a ✓ on the chosen team (no radio buttons). The flow-specific
// actions ("My team isn't listed", "I'm not with a team") go in the footer slot.
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Search or select your team...' },
  error: { type: [Boolean, String], default: false },
  // Storybook: start open.
  initialOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'close'])

const root = ref(null)
const input = ref(null)
const open = ref(props.initialOpen)
const query = ref('')
const active = ref(-1)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.options.filter((t) => t.toLowerCase().includes(q))
})
// Closed → the field shows the chosen team; open → it's the search box.
const inputValue = computed(() => (open.value ? query.value : props.modelValue))
const inputPlaceholder = computed(() => (open.value && props.modelValue ? props.modelValue : props.placeholder))

function openMenu () { if (!open.value) { open.value = true; query.value = ''; active.value = -1 } }
function close () {
  if (!open.value) return
  open.value = false; query.value = ''; active.value = -1
  emit('close')
}
function toggle () {
  if (open.value) close()
  else { openMenu(); nextTick(() => input.value?.focus()) }
}
function onInput (e) { openMenu(); query.value = e.target.value; active.value = filtered.value.length ? 0 : -1 }
function pick (name) { emit('update:modelValue', name); close(); input.value?.blur() }
function onKeydown (e) {
  if (e.key === 'Escape') { close(); return }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault(); openMenu()
    const n = filtered.value.length
    if (!n) return
    active.value = e.key === 'ArrowDown' ? (active.value + 1) % n : (active.value - 1 + n) % n
    return
  }
  if (e.key === 'Enter' && open.value && filtered.value[active.value]) { e.preventDefault(); pick(filtered.value[active.value]) }
}

function onDocClick (e) { if (open.value && root.value && !root.value.contains(e.target)) close() }
watch(open, (v) => {
  if (v) document.addEventListener('mousedown', onDocClick)
  else document.removeEventListener('mousedown', onDocClick)
}, { immediate: true })
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))

defineExpose({ close, focus: () => input.value?.focus() })
</script>

<template>
  <div ref="root" class="tcb" :class="{ 'is-open': open }">
    <div class="tcb__field" :class="{ 'is-open': open, 'is-error': error && !open, 'has-value': modelValue && !open }">
      <input
        ref="input" class="tcb__input" type="text" role="combobox" autocomplete="off"
        aria-label="Team name" aria-autocomplete="list" :aria-expanded="open"
        :value="inputValue" :placeholder="inputPlaceholder"
        @focus="openMenu" @click="openMenu" @input="onInput" @keydown="onKeydown"
      />
      <button type="button" class="tcb__caret" :aria-label="open ? 'Close team list' : 'Open team list'" tabindex="-1" @mousedown.prevent @click="toggle">
        <q-icon :name="open ? 'expand_less' : 'expand_more'" size="20px" />
      </button>
    </div>

    <div v-if="open" class="tcb__menu">
      <div class="tcb__list" role="listbox">
        <button
          v-for="(t, i) in filtered" :key="t" type="button" role="option"
          class="tcb__opt" :class="{ 'is-on': t === modelValue, 'is-active': i === active }" :aria-selected="t === modelValue"
          @mousedown.prevent @click="pick(t)"
        >
          {{ t }}<q-icon v-if="t === modelValue" name="check" size="18px" />
        </button>
        <p v-if="!filtered.length" class="tcb__empty">No teams match “{{ query }}”.</p>
      </div>
      <div v-if="$slots.footer" class="tcb__foot">
        <slot name="footer" :close="close" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tcb { position: relative; }
.tcb__field { display: flex; align-items: center; height: 46px; border: 1px solid var(--ds-color-border-bold); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); }
.tcb__field.is-open { border-color: var(--ds-color-border-focused); box-shadow: 0 0 0 1px var(--ds-color-border-focused); }
.tcb__field.is-error { border-color: var(--ds-color-text-danger); }
.tcb__input { flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: none; padding: 0 0 0 14px; font-family: inherit; font-size: 0.9375rem; color: var(--ds-color-text); }
.tcb__field.has-value .tcb__input { font-weight: 700; }
.tcb__input::placeholder { color: var(--ds-color-text-subtlest); font-weight: 400; }
.tcb__caret { width: 40px; height: 100%; flex: none; border: 0; background: none; color: var(--ds-color-text-subtle); cursor: pointer; display: flex; align-items: center; justify-content: center; }

.tcb__menu { position: absolute; z-index: 60; top: calc(100% + 6px); left: 0; right: 0; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); box-shadow: var(--ds-shadow-raised, 0 4px 14px rgba(15, 23, 42, 0.1)); padding: 8px; }
.tcb__list { max-height: 260px; overflow-y: auto; }
.tcb__opt { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 10px 8px; border: 0; border-radius: var(--ds-radius-sm); background: none; color: var(--ds-color-text); font-family: inherit; font-size: 0.9375rem; text-align: left; cursor: pointer; }
.tcb__opt:hover, .tcb__opt.is-active { background: var(--ds-palette-slate-100); }
.tcb__opt.is-on { color: var(--ds-color-text-brand); font-weight: 600; }
.tcb__empty { color: var(--ds-color-text-subtle); font-size: 0.875rem; padding: 10px 8px; margin: 0; }
.tcb__foot { margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--ds-color-border); }
/* Footer actions — same look in both flows. */
.tcb__foot :slotted(.tcb__action) { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 8px; border: 0; background: none; color: var(--ds-color-text); font-family: inherit; font-weight: 700; font-size: 0.9375rem; text-align: left; cursor: pointer; }
.tcb__foot :slotted(.tcb__action:hover) { text-decoration: underline; }
.tcb__foot :slotted(.tcb__subaction) { display: block; width: 100%; padding: 6px 8px 8px; border: 0; background: none; color: var(--ds-color-text-subtle); font-family: inherit; font-size: 0.875rem; text-align: left; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.tcb__foot :slotted(.tcb__subaction:hover) { color: var(--ds-color-text); }
</style>
