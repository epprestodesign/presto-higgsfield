<script setup>
// PublishChecklist — every item from publishChecklist(project) as a pass/fail
// row with a "Fix" link, plus the demo disclaimer the organizer must accept.
// Publish stays disabled until all rows pass.
import { computed } from 'vue'
import { useProjectStore } from '../../stores/project.js'

const props = defineProps({
  // Hide the disclaimer checkbox row (e.g. when the parent renders it separately).
  showDisclaimer: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['fix'])
const project = useProjectStore()

const checklist = computed(() => project.checklist)
const rows = computed(() => checklist.value.items.filter((i) => i.id !== 'disclaimer'))
const pct = computed(() => Math.round((checklist.value.done / checklist.value.total) * 100))

const FIX_LABEL = { intake: 'Edit event', brand: 'Open brand kit', concepts: 'Choose concept', publish: 'Fix' }
const accepted = computed({
  get: () => project.project.publishing.disclaimerAccepted,
  set: (v) => project.acceptDisclaimer(v),
})
</script>

<template>
  <section class="pcl" :class="{ 'pcl--compact': compact }" aria-labelledby="pcl-title">
    <header class="pcl__head">
      <div>
        <h3 id="pcl-title" class="bs-subtitle">Publishing checklist</h3>
        <p class="bs-caption" aria-live="polite">{{ checklist.done }} of {{ checklist.total }} complete</p>
      </div>
      <div
        class="pcl__ring"
        role="progressbar"
        :aria-valuenow="checklist.done"
        aria-valuemin="0"
        :aria-valuemax="checklist.total"
        aria-label="Checklist progress"
        :style="{ '--pct': pct }"
      >
        <span>{{ pct }}%</span>
      </div>
    </header>

    <ul class="pcl__list">
      <li v-for="item in rows" :key="item.id" class="pcl__row" :class="item.pass ? 'pcl__row--pass' : 'pcl__row--todo'">
        <span class="pcl__mark" aria-hidden="true">
          <q-icon :name="item.pass ? 'check' : 'radio_button_unchecked'" size="16px" />
        </span>
        <span class="pcl__label">
          {{ item.label }}
          <span class="bs-sr-only">{{ item.pass ? '— done' : '— to do' }}</span>
          <span v-if="!item.pass && item.detail" class="pcl__detail">{{ item.detail }}</span>
        </span>
        <button
          v-if="!item.pass"
          type="button"
          class="pcl__fix bs-focusable"
          :aria-label="`${FIX_LABEL[item.fix] || 'Fix'}: ${item.label}`"
          @click="emit('fix', { target: item.fix, item: item.id })"
        >
          {{ FIX_LABEL[item.fix] || 'Fix' }} <q-icon name="arrow_forward" size="14px" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <div v-if="showDisclaimer" class="pcl__disclaimer" :class="{ 'pcl__disclaimer--on': accepted }">
      <q-checkbox v-model="accepted" class="pcl__check" dense>
        <span class="pcl__disc-text">
          <strong>I understand this is a demo.</strong>
          Hotel rates and availability shown are illustrative, and booking and payment are disabled.
          Nothing on the published page can reserve a room or charge a card.
        </span>
      </q-checkbox>
    </div>
  </section>
</template>

<style scoped>
.pcl { background: var(--bs-surface); border: 1px solid var(--bs-line); border-radius: var(--bs-radius-lg); padding: 20px; font-family: var(--bs-font); }
.pcl__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.pcl__head .bs-caption { margin-top: 2px; }
.pcl__ring {
  --size: 52px;
  width: var(--size); height: var(--size); border-radius: 50%; flex: none;
  background: conic-gradient(var(--bs-success) calc(var(--pct) * 1%), var(--ds-palette-slate-100) 0);
  display: grid; place-items: center;
}
.pcl__ring span { width: calc(var(--size) - 12px); height: calc(var(--size) - 12px); border-radius: 50%; background: var(--bs-surface); display: grid; place-items: center; font-size: 0.75rem; font-weight: 700; color: var(--bs-ink); }
.pcl__list { list-style: none; margin: 0; padding: 0; display: grid; }
.pcl__row { display: grid; grid-template-columns: 24px 1fr auto; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid var(--bs-line); min-height: 48px; }
.pcl__mark { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; }
.pcl__row--pass .pcl__mark { background: var(--bs-success); color: #fff; }
.pcl__row--todo .pcl__mark { color: var(--bs-ink-faint); }
.pcl__label { font-size: 0.9375rem; color: var(--bs-ink); line-height: 1.35; }
.pcl__row--pass .pcl__label { color: var(--bs-ink-soft); }
.pcl__detail { display: block; font-size: 0.8125rem; color: var(--ds-color-text-danger); margin-top: 2px; }
.pcl__fix { display: inline-flex; align-items: center; gap: 4px; min-height: 32px; padding: 4px 10px; border-radius: var(--bs-radius-sm); border: 1px solid var(--bs-line-strong); background: var(--bs-surface); font: 700 0.8125rem/1 var(--bs-font); color: var(--bs-brand); cursor: pointer; white-space: nowrap; }
.pcl__fix:hover { background: var(--bs-surface-2); }
.pcl__disclaimer { margin-top: 12px; padding: 14px; border-radius: var(--bs-radius-md); background: #FFF7E6; border: 1px solid #FDE1A8; }
.pcl__disclaimer--on { background: #ECFDF3; border-color: #BBF0CF; }
.pcl__check { align-items: flex-start; }
.pcl__check :deep(.q-checkbox__inner) { margin-top: 1px; }
.pcl__disc-text { font-size: 0.875rem; line-height: 1.5; color: var(--bs-ink); padding-left: 6px; display: block; }
.pcl--compact { padding: 16px; }
.pcl--compact .pcl__row { min-height: 40px; padding: 7px 0; }
</style>
