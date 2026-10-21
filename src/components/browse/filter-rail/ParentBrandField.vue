<script setup>
// ParentBrandField — title + parent-brand checkboxes + apply button.
// `v-model` is an array of selected brand labels.
import { ref, computed, watch } from 'vue'

const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue'])

// DES-457: selections are staged locally and only committed to the parent
// (which filters results) when "Apply Brand Filter" is pressed.
const brandSel = ref([...props.modelValue])
watch(() => props.modelValue, (v) => { brandSel.value = [...v] })
const applied = computed(() => JSON.stringify([...brandSel.value].sort()) === JSON.stringify([...props.modelValue].sort()))
const apply = () => emit('update:modelValue', [...brandSel.value])

const PARENT_BRANDS = ['Marriott International', 'Hilton Worldwide', 'Hyatt Hotels', 'IHG Hotels & Resorts']
</script>

<template>
  <div>
    <h3 class="fr__title">Parent Brand</h3>
    <q-checkbox v-for="b in PARENT_BRANDS" :key="b" v-model="brandSel" :val="b" :label="b" color="primary" dense class="fr__check" />
    <button type="button" class="fr__apply" :class="{ 'fr__apply--done': applied }" @click="apply">Apply Brand Filter</button>
  </div>
</template>

<style scoped>
.fr__title {
  margin: 0 0 2px;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  color: var(--ds-color-text-brand);
}

/* Checkboxes */
.fr__check { display: flex; margin: 2px 0; }

/* Apply / clear buttons */
.fr__apply {
  width: 100%; height: 44px; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;
  border: 0; border-radius: var(--ds-radius-button); cursor: pointer;
  background: var(--ds-color-background-brand-bold); color: #fff; font-weight: 700; font-size: 0.9375rem;
}
.fr__apply:hover { background: var(--ds-palette-navy-800, #0a1f4d); }
/* Muted once applied (no pending changes); solid navy invites you to apply. */
.fr__apply--done, .fr__apply--done:hover { background: var(--ds-palette-slate-200); color: var(--ds-color-text-subtle); }
</style>
