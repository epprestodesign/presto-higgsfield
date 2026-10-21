<script setup>
// ContentPanel — landing-page copy and section structure.
//   Hero: headline / tagline / CTA label / logo + dates toggles
//   Sections: visibility switch, keyboard-operable reorder, inline editors
import { ref, computed, nextTick } from 'vue'
import { useProjectStore } from '../../../stores/project.js'
import { LANDING_SECTIONS } from '../../../models/pageConfig.js'
import PanelGroup from './PanelGroup.vue'
import StringListEditor from './StringListEditor.vue'

const emit = defineEmits(['goto-tab'])
const store = useProjectStore()
const landing = computed(() => store.pages.landing)
const hero = computed(() => landing.value.hero)
const sections = computed(() => landing.value.sections)
const meta = Object.fromEntries(LANDING_SECTIONS.map((s) => [s.id, s]))
const order = computed(() => landing.value.sectionOrder.filter((id) => meta[id]))

const open = ref(null)
const toggleOpen = (id) => (open.value = open.value === id ? null : id)

const listRef = ref(null)
async function move(id, delta) {
  store.moveSection(id, delta)
  await nextTick()
  // Keep focus on the moved row's matching button so repeated presses work.
  listRef.value?.querySelector(`[data-move="${id}:${delta}"]`)?.focus()
}
function onRowKey(e, id) {
  if (!e.altKey) return
  if (e.key === 'ArrowUp') { e.preventDefault(); move(id, -1) }
  if (e.key === 'ArrowDown') { e.preventDefault(); move(id, 1) }
}

const update = (id, patch) => store.updateSection(id, patch)
const setAttending = (i, key, v) => update('attending', { items: sections.value.attending.items.map((a, j) => (j === i ? { ...a, [key]: v } : a)) })
const addAttending = () => update('attending', { items: [...sections.value.attending.items, { title: '', text: '' }] })
const removeAttending = (i) => update('attending', { items: sections.value.attending.items.filter((_, j) => j !== i) })
</script>

<template>
  <div class="cp">
    <PanelGroup title="Hero banner">
      <q-input
        :model-value="hero.headline"
        outlined
        dense
        label="Headline"
        :placeholder="store.event.name"
        stack-label
        hint="Leave blank to use the event name"
        @update:model-value="(v) => store.updateHero({ headline: v })"
      />
      <q-input :model-value="hero.tagline" outlined dense type="textarea" autogrow label="Tagline" @update:model-value="(v) => store.updateHero({ tagline: v })" />
      <q-input :model-value="hero.ctaLabel" outlined dense label="Button label" maxlength="32" @update:model-value="(v) => store.updateHero({ ctaLabel: v })" />
      <div class="cp__switches">
        <q-toggle :model-value="hero.showLogo" label="Show logo" dense @update:model-value="(v) => store.updateHero({ showLogo: v })" />
        <q-toggle :model-value="hero.showDates" label="Show dates" dense @update:model-value="(v) => store.updateHero({ showDates: v })" />
      </div>
    </PanelGroup>

    <PanelGroup title="Page sections" hint="Show, hide and reorder. Alt + ↑/↓ moves the focused section.">
      <ol ref="listRef" class="cp__sections" aria-label="Landing page sections">
        <li
          v-for="(id, i) in order"
          :key="id"
          class="cp__sec"
          :class="{ 'is-hidden': !sections[id]?.visible, 'is-open': open === id }"
          @keydown="onRowKey($event, id)"
        >
          <div class="cp__sec-row">
            <q-icon name="drag_indicator" size="18px" class="cp__grip" aria-hidden="true" />
            <button
              type="button"
              class="cp__sec-name bs-focusable"
              :aria-expanded="open === id"
              :aria-controls="`sec-edit-${id}`"
              @click="toggleOpen(id)"
            >
              <span>{{ meta[id].label }}</span>
              <q-icon :name="open === id ? 'expand_less' : 'expand_more'" size="18px" />
            </button>
            <div class="cp__sec-tools">
              <q-btn flat round dense size="sm" icon="arrow_upward" :data-move="`${id}:-1`" :disable="i === 0" :aria-label="`Move ${meta[id].label} up`" @click="move(id, -1)" />
              <q-btn flat round dense size="sm" icon="arrow_downward" :data-move="`${id}:1`" :disable="i === order.length - 1" :aria-label="`Move ${meta[id].label} down`" @click="move(id, 1)" />
              <q-icon v-if="meta[id].lockable" name="lock" size="16px" class="cp__lock" :aria-label="`${meta[id].label} is always shown`">
                <q-tooltip>Hotel search is always shown</q-tooltip>
              </q-icon>
              <q-toggle
                v-else
                :model-value="sections[id].visible"
                dense
                size="sm"
                :aria-label="`Show ${meta[id].label}`"
                @update:model-value="store.toggleSection(id)"
              />
            </div>
          </div>

          <div v-if="open === id" :id="`sec-edit-${id}`" class="cp__sec-edit">
            <template v-if="id === 'widget'">
              <q-toggle :model-value="sections.widget.showTeams" label="Ask for team name when searching" dense @update:model-value="(v) => update('widget', { showTeams: v })" />
            </template>
            <template v-else-if="id === 'intro'">
              <StringListEditor :items="sections.intro.paragraphs" label="Paragraph" multiline add-label="Add paragraph" @update:items="(v) => update('intro', { paragraphs: v })" />
            </template>
            <template v-else-if="id === 'benefits'">
              <StringListEditor :items="sections.benefits.items" label="Benefit" add-label="Add benefit" @update:items="(v) => update('benefits', { items: v })" />
            </template>
            <template v-else-if="id === 'attending'">
              <q-input :model-value="sections.attending.title" outlined dense label="Section title" @update:model-value="(v) => update('attending', { title: v })" />
              <div v-for="(a, ai) in sections.attending.items" :key="ai" class="cp__card">
                <div class="cp__card-head">
                  <span class="cp__card-n">Group {{ ai + 1 }}</span>
                  <q-btn flat round dense size="sm" icon="close" :aria-label="`Remove group ${ai + 1}`" @click="removeAttending(ai)" />
                </div>
                <q-input :model-value="a.title" outlined dense label="Who" @update:model-value="(v) => setAttending(ai, 'title', v)" />
                <q-input :model-value="a.text" outlined dense type="textarea" autogrow label="Description" @update:model-value="(v) => setAttending(ai, 'text', v)" />
              </div>
              <q-btn flat no-caps dense icon="add" label="Add group" class="cp__add" @click="addAttending" />
            </template>
            <template v-else-if="id === 'eventInfo'">
              <q-input :model-value="sections.eventInfo.title" outlined dense label="Section title" @update:model-value="(v) => update('eventInfo', { title: v })" />
              <q-input :model-value="sections.eventInfo.dates" outlined dense label="Dates" @update:model-value="(v) => update('eventInfo', { dates: v })" />
              <StringListEditor :items="sections.eventInfo.lines" label="Line" add-label="Add line" @update:items="(v) => update('eventInfo', { lines: v })" />
            </template>
            <template v-else-if="id === 'closing'">
              <StringListEditor :items="sections.closing.paragraphs" label="Paragraph" multiline add-label="Add paragraph" @update:items="(v) => update('closing', { paragraphs: v })" />
            </template>
            <template v-else-if="id === 'ads'">
              <p class="cp__note">Sponsors and ad sizes are set in the Ads tab.</p>
              <q-btn unelevated no-caps class="bs-btn bs-btn--ghost cp__goto" label="Open Ads settings" icon-right="arrow_forward" @click="emit('goto-tab', 'ads')" />
            </template>
          </div>
        </li>
      </ol>
    </PanelGroup>
  </div>
</template>

<style scoped>
.cp { font-family: var(--bs-font); }
.cp :deep(.q-field--outlined .q-field__control) { border-radius: var(--bs-radius-sm); }
.cp :deep(input::placeholder), .cp :deep(textarea::placeholder) { color: var(--bs-ink-faint); opacity: 1; }
.cp__switches { display: flex; gap: 20px; flex-wrap: wrap; }
.cp__sections { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.cp__sec { border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); background: var(--bs-surface); transition: box-shadow var(--ds-duration-fast), border-color var(--ds-duration-fast); }
.cp__sec:focus-within { border-color: var(--bs-line-strong); }
.cp__sec.is-open { box-shadow: var(--bs-shadow-2); border-color: transparent; }
.cp__sec-row { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; align-items: center; gap: 6px; padding: 4px 6px 4px 8px; min-height: 44px; }
.cp__grip { color: var(--bs-ink-faint); }
.cp__sec-name { display: flex; align-items: center; justify-content: space-between; gap: 6px; min-width: 0; padding: 6px 4px; border: 0; border-radius: var(--bs-radius-sm); background: none; font: 700 0.875rem/1.2 var(--bs-font); color: var(--bs-ink); text-align: left; cursor: pointer; }
.cp__sec-name .q-icon { color: var(--bs-ink-faint); flex: none; }
.cp__sec.is-hidden .cp__sec-name span { color: var(--bs-ink-faint); text-decoration: line-through; text-decoration-thickness: 1px; }
.cp__sec-tools { display: flex; align-items: center; gap: 0; color: var(--bs-ink-soft); }
.cp__lock { color: var(--bs-ink-faint); margin: 0 10px 0 8px; }
.cp__sec-edit { padding: 4px 12px 14px; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--bs-line); padding-top: 12px; }
.cp__card { display: flex; flex-direction: column; gap: 6px; padding: 10px; border-radius: var(--bs-radius-sm); background: var(--bs-surface-2); }
.cp__card-head { display: flex; align-items: center; justify-content: space-between; }
.cp__card-n { font: 700 0.75rem/1 var(--bs-font); color: var(--bs-ink-soft); text-transform: uppercase; letter-spacing: 0.06em; }
.cp__add { align-self: flex-start; color: var(--bs-brand); font-size: 0.8125rem; }
.cp__note { margin: 0; font: 400 0.8125rem/1.4 var(--bs-font); color: var(--bs-ink-soft); }
.q-btn.cp__goto { min-height: 34px; font-size: 0.8125rem; align-self: flex-start; }
</style>
