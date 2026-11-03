<script setup>
// The default Presto screens with today's picks, in a carousel: landing page,
// hotel browse, hotel details. Desktop / Mobile switches the frame, and the
// page text is edited right here (click any line on a banner, or "Edit text").
import { computed, ref } from 'vue'
import CardShell from './CardShell.vue'
import Icon from '../Icon.vue'
import ScreensCarousel from '../presto/ScreensCarousel.vue'

const props = defineProps({
  project: { type: Object, required: true },
  card: { type: Object, required: true },
  // The draft this card belongs to; older drafts are frozen (no editing).
  view: { type: Object, default: null },
})
const live = computed(() => !props.view || props.view === props.project)
const editing = ref(!!props.card.editing)
const device = ref('desktop')
const c = computed(() => props.project.copy)

const LINES = [
  { id: 'headline', label: 'Headline' },
  { id: 'meta', label: 'Subheadline', hint: 'Dates and place' },
  { id: 'tagline', label: 'Second subheadline', hint: 'Landing page only' },
]

</script>

<template>
  <CardShell kicker="Presto pages" :title="live ? 'Your pages, with today’s picks' : 'Your pages, as they were in this draft'">
    <template #aside>
      <div class="pg__tools">
        <div class="cs-tabs" role="radiogroup" aria-label="Device">
          <button type="button" role="radio" :aria-checked="device === 'desktop'" class="cs-tab" :class="{ 'is-on': device === 'desktop' }" @click="device = 'desktop'"><Icon name="monitor" :size="16" /> Desktop</button>
          <button type="button" role="radio" :aria-checked="device === 'mobile'" class="cs-tab" :class="{ 'is-on': device === 'mobile' }" @click="device = 'mobile'"><Icon name="phone" :size="16" /> Mobile</button>
        </div>
        <button v-if="live" type="button" class="cs-btn-ghost" :aria-expanded="editing" @click="editing = !editing">
          <Icon :name="editing ? 'check' : 'pencil'" :size="16" /> {{ editing ? 'Done' : 'Edit text' }}
        </button>
      </div>
    </template>

    <div v-if="editing && live" class="pg__edit">
      <div v-for="l in LINES" :key="l.id" class="pg__line" :class="{ 'is-off': !c.show[l.id] }">
        <label class="pg__switch">
          <input v-model="c.show[l.id]" type="checkbox" :aria-label="`Show the ${l.label.toLowerCase()}`" />
          <span />
        </label>
        <label class="pg__field">
          <span>{{ l.label }}<small v-if="l.hint"> · {{ l.hint }}</small></span>
          <input v-model="c[l.id]" type="text" :disabled="!c.show[l.id]" :maxlength="l.id === 'headline' ? 60 : 120" />
        </label>
      </div>
    </div>

    <ScreensCarousel :view="view || project" :device="device" :screen="card.screen || ''" @edit="editing = live" />
  </CardShell>
</template>

<style scoped>
.pg__tools { display: flex; align-items: center; gap: 8px; }


.pg__edit { display: grid; gap: 12px; margin: -4px 0 18px; padding: 16px; border-radius: var(--r-card); background: var(--surface-2); border: 1px solid var(--line); }
.pg__line { display: flex; align-items: center; gap: 14px; }
.pg__field { flex: 1; display: grid; gap: 4px; font-size: 13px; font-weight: 700; color: var(--ink-2); }
.pg__field small { font-weight: 400; color: var(--ink-3); }
.pg__field input { width: 100%; min-height: 40px; padding: 8px 12px; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); font: inherit; font-weight: 400; font-size: 15px; color: var(--ink); }
.pg__field input:focus { outline: none; border-color: var(--navy-900); box-shadow: 0 0 0 1px var(--navy-900); }
.pg__line.is-off .pg__field { opacity: 0.5; }
.pg__switch { position: relative; margin-top: 18px; }
.pg__switch input { position: absolute; z-index: 1; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.pg__switch span { display: block; width: 38px; height: 22px; border-radius: 999px; background: var(--line-bold); transition: background 0.15s; }
.pg__switch span::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); transition: transform 0.15s; }
.pg__switch input:checked + span { background: var(--pill); }
.pg__switch input:checked + span::after { transform: translateX(16px); }
.pg__switch input:focus-visible + span { outline: 2px solid var(--focus); outline-offset: 2px; }
@media (max-width: 640px) { .pg__tools { flex-wrap: wrap; justify-content: flex-end; } }
</style>
