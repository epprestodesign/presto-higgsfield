<script setup>
// StatusChip — project lifecycle badge (Draft / Ready to publish / Published
// demo). Always icon + text, never color alone; tones pass AA on white.
import { computed } from 'vue'
import { PROJECT_STATUS } from '../../models/project.js'

const props = defineProps({
  status: { type: String, default: 'draft' }, // 'draft' | 'ready' | 'published'
  size: { type: String, default: 'md' }, // 'sm' | 'md'
})
const meta = computed(() => PROJECT_STATUS[props.status] || PROJECT_STATUS.draft)
</script>

<template>
  <span class="sc" :class="[`sc--${status}`, `sc--${size}`]">
    <q-icon :name="meta.icon" class="sc__icon" aria-hidden="true" />
    <span>{{ meta.label }}</span>
  </span>
</template>

<style scoped>
.sc {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px 4px 8px; border-radius: 999px;
  font: 700 0.75rem/1.2 var(--bs-font); white-space: nowrap;
  border: 1px solid transparent;
}
.sc--sm { padding: 2px 8px 2px 6px; font-size: 0.6875rem; }
.sc__icon { font-size: 1.05em; }
.sc--draft { background: var(--ds-palette-slate-100); color: var(--ds-palette-slate-700, #334155); border-color: var(--ds-palette-slate-200); }
.sc--ready { background: #FFF7E6; color: #8A4B00; border-color: #FDE1A8; }
.sc--published { background: #ECFDF3; color: #146C3A; border-color: #BBF0CF; }
</style>
