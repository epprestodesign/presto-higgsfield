<script setup>
// TeamQualifierSummary — the "Team" summary card in the cart / review-order rail
// for a reservation. Collapsed shows the team name (+ qualifiers); expanded shows
// the team chip and a "Team qualifiers" row (age division · gender). Mirrors the
// collapsible Group block details experience for the single-team flow.
import { ref, computed } from 'vue'

const props = defineProps({
  teamName: { type: String, default: 'Arsenal U12 Boys Select' },
  ageDivision: { type: String, default: 'U12' },
  gender: { type: String, default: 'Boys' },
  initialOpen: { type: Boolean, default: true },
})
const open = ref(props.initialOpen)
const meta = computed(() => [props.ageDivision, props.gender].filter(Boolean).join(' · '))
</script>

<template>
  <div class="tqs">
    <button type="button" class="tqs__head" @click="open = !open">
      <span class="tqs__headtext">
        <span class="tqs__title">Team</span>
        <span class="tqs__sub">{{ teamName }}<template v-if="meta && !open"> · {{ meta }}</template></span>
      </span>
      <q-icon class="tqs__chevron" :name="open ? 'expand_less' : 'expand_more'" size="24px" />
    </button>

    <div v-if="open" class="tqs__body">
      <div class="tqs__teams"><span class="tqs__chip"><q-icon name="groups" size="15px" />{{ teamName }}</span></div>
      <div v-if="meta" class="tqs__estbox">
        <span class="tqs__estlabel"><q-icon name="badge" size="16px" /> Team qualifiers</span>
        <strong>{{ meta }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tqs { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); background: var(--ds-color-surface); overflow: hidden; max-width: 460px; }
.tqs__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 18px 20px; background: none; border: 0; cursor: pointer; text-align: left; }
.tqs__headtext { display: flex; flex-direction: column; gap: 4px; }
.tqs__title { font-size: 1.125rem; font-weight: 700; color: var(--ds-color-text); }
.tqs__sub { font-size: 0.875rem; color: var(--ds-color-text-subtle); }
.tqs__chevron { color: var(--ds-color-text-subtle); flex: none; }
.tqs__body { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 14px; }
.tqs__teams { display: flex; flex-wrap: wrap; gap: 8px; }
.tqs__chip { display: inline-flex; align-items: center; gap: 6px; background: var(--ds-palette-slate-100); border-radius: var(--ds-radius-pill); padding: 6px 12px; font-size: 0.875rem; font-weight: 500; color: var(--ds-color-text); }
.tqs__estbox { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--ds-color-surface-sunken); border-radius: var(--ds-radius-md); padding: 14px 16px; }
.tqs__estlabel { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: var(--ds-color-text); }
.tqs__estbox strong { font-weight: 800; color: var(--ds-color-text); }
</style>
