<script setup>
// StringListEditor — edit an ordered list of strings (paragraphs, bullets,
// address lines). Emits a NEW array on every change (store-friendly).
import { nextTick, ref } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  label: { type: String, default: 'Item' },
  multiline: { type: Boolean, default: false },
  addLabel: { type: String, default: 'Add' },
  max: { type: Number, default: 12 },
})
const emit = defineEmits(['update:items'])
const root = ref(null)

const set = (i, v) => emit('update:items', props.items.map((x, j) => (j === i ? v : x)))
const remove = (i) => emit('update:items', props.items.filter((_, j) => j !== i))
async function add() {
  emit('update:items', [...props.items, ''])
  await nextTick()
  const fields = root.value?.querySelectorAll('textarea, input')
  fields?.[fields.length - 1]?.focus()
}
</script>

<template>
  <div ref="root" class="sle">
    <div v-for="(item, i) in items" :key="i" class="sle__row">
      <q-input
        :model-value="item"
        :type="multiline ? 'textarea' : 'text'"
        :autogrow="multiline"
        outlined
        dense
        :aria-label="`${label} ${i + 1}`"
        class="sle__field"
        @update:model-value="(v) => set(i, v)"
      />
      <q-btn flat round dense size="sm" icon="close" class="sle__remove" :aria-label="`Remove ${label.toLowerCase()} ${i + 1}`" @click="remove(i)" />
    </div>
    <q-btn
      v-if="items.length < max"
      flat
      no-caps
      dense
      icon="add"
      :label="addLabel"
      class="sle__add"
      @click="add"
    />
  </div>
</template>

<style scoped>
.sle { display: flex; flex-direction: column; gap: 6px; }
.sle__row { display: grid; grid-template-columns: minmax(0, 1fr) 28px; gap: 4px; align-items: start; }
.sle__field :deep(.q-field__control) { border-radius: var(--bs-radius-sm); }
.sle__field :deep(textarea) { line-height: 1.45; font-size: 0.875rem; }
.sle__remove { color: var(--bs-ink-faint); margin-top: 4px; }
.sle__remove:hover { color: var(--bs-danger); }
.sle__add { align-self: flex-start; color: var(--bs-brand); font-size: 0.8125rem; }
</style>
