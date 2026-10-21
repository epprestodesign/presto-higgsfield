<script setup>
// TeamGroupBlockCard — the "Group block details" summary that leads the cart /
// checkout rail for a group hold (Team Name Qualifiers touchpoint). Collapsed =
// team count + room estimate; expanded = the registered-team chips, the
// room-estimate rationale, and a rooms-added-so-far progress bar.
// Self-contained fork modeled on the reference booking flow.
import { ref, computed } from 'vue'

const props = defineProps({
  teams: { type: Array, default: () => ['Team 1', 'Team 2', 'Arsenal U12 Boys Select', 'another team name', 'another team name 2'] },
  blockName: { type: String, default: '' },
  roomsPerTeam: { type: Number, default: 6 }, // players + staff, ~2 per room
  roomsAdded: { type: Number, default: 2 },
  initialOpen: { type: Boolean, default: true },
})

const open = ref(props.initialOpen)
const est = computed(() => props.teams.length * props.roomsPerTeam)
const pct = computed(() => (est.value > 0 ? Math.min(100, Math.round((props.roomsAdded / est.value) * 100)) : 0))
const enough = computed(() => props.roomsAdded >= est.value)
const remaining = computed(() => Math.max(0, est.value - props.roomsAdded))
</script>

<template>
  <div class="tgb">
    <button type="button" class="tgb__head" @click="open = !open">
      <span class="tgb__headtext">
        <span class="tgb__title">Group block details</span>
        <span class="tgb__sub">{{ teams.length }} registered team{{ teams.length === 1 ? '' : 's' }} · est. {{ est }} room{{ est === 1 ? '' : 's' }} needed</span>
      </span>
      <q-icon class="tgb__chevron" :name="open ? 'expand_less' : 'expand_more'" size="24px" />
    </button>

    <div v-if="open" class="tgb__body">
      <div v-if="blockName" class="tgb__blockname">{{ blockName }}</div>

      <div class="tgb__teams">
        <span v-for="t in teams" :key="t" class="tgb__chip"><q-icon name="groups" size="15px" />{{ t }}</span>
      </div>

      <div class="tgb__estbox">
        <div class="tgb__estrow">
          <span class="tgb__estlabel"><q-icon name="hotel" size="16px" /> Estimated rooms needed</span>
          <strong>{{ est }}</strong>
        </div>
        <p class="tgb__estnote">Based on {{ teams.length }} team{{ teams.length === 1 ? '' : 's' }} at about {{ roomsPerTeam }} rooms each (players + staff, ~2 per room). Adjust as you build your block.</p>
      </div>

      <div class="tgb__progress">
        <div class="tgb__progresshead">
          <span>Rooms added so far</span>
          <span :class="{ 'tgb__met': enough }">{{ roomsAdded }} of {{ est }}</span>
        </div>
        <div class="tgb__track"><div class="tgb__fill" :class="{ 'is-met': enough }" :style="{ width: pct + '%' }" /></div>
        <p v-if="enough" class="tgb__hint tgb__hint--met"><q-icon name="check_circle" size="15px" /> You've reached the estimated room count.</p>
        <p v-else class="tgb__hint">{{ remaining }} more room{{ remaining === 1 ? '' : 's' }} to reach the estimate.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tgb { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); background: var(--ds-color-surface); overflow: hidden; max-width: 460px; }
.tgb__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 18px 20px; background: none; border: 0; cursor: pointer; text-align: left; }
.tgb__headtext { display: flex; flex-direction: column; gap: 4px; }
.tgb__title { font-size: 1.125rem; font-weight: 700; color: var(--ds-color-text); }
.tgb__sub { font-size: 0.875rem; color: var(--ds-color-text-subtle); }
.tgb__chevron { color: var(--ds-color-text-subtle); flex: none; }
.tgb__body { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 16px; }
.tgb__blockname { font-weight: 700; color: var(--ds-color-text); }
.tgb__teams { display: flex; flex-wrap: wrap; gap: 8px; }
.tgb__chip { display: inline-flex; align-items: center; gap: 6px; background: var(--ds-palette-slate-100); border-radius: var(--ds-radius-pill); padding: 6px 12px; font-size: 0.875rem; font-weight: 500; color: var(--ds-color-text); }
.tgb__estbox { background: var(--ds-color-surface-sunken); border-radius: var(--ds-radius-md); padding: 14px 16px; }
.tgb__estrow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.tgb__estlabel { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: var(--ds-color-text); }
.tgb__estrow strong { font-size: 1.375rem; font-weight: 800; color: var(--ds-color-text); }
.tgb__estnote { margin: 8px 0 0; color: var(--ds-color-text-subtle); font-size: 0.8125rem; line-height: 1.5; }
.tgb__progress { display: flex; flex-direction: column; gap: 8px; }
.tgb__progresshead { display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 0.875rem; color: var(--ds-color-text); }
.tgb__met { color: var(--ds-color-text-success); }
.tgb__track { height: 8px; border-radius: var(--ds-radius-pill); background: var(--ds-palette-slate-200); overflow: hidden; }
.tgb__fill { height: 100%; background: var(--ds-color-background-brand-bold); border-radius: var(--ds-radius-pill); transition: width var(--ds-duration-normal) var(--ds-ease-standard); }
.tgb__fill.is-met { background: var(--ds-color-text-success); }
.tgb__hint { margin: 0; font-size: 0.8125rem; color: var(--ds-color-text-subtle); }
.tgb__hint--met { display: inline-flex; align-items: center; gap: 6px; color: var(--ds-color-text-success); font-weight: 600; }
</style>
