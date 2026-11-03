<script setup>
// Home, further down: the page drafts the rest of the team has been making,
// grouped by theme. Click one to see its Presto pages (desktop, then mobile).
import { computed, nextTick, ref, watch } from 'vue'
import Icon from './Icon.vue'
import DraftStack from './presto/DraftStack.vue'
import DraftViewer from './DraftViewer.vue'
import { BRANDS } from '../mockData.js'
import { route } from '../router.js'

const THEMES = {
  Sports: ['heartland', 'lakeshore', 'golf', 'esports'],
  Business: ['fintech', 'corporate'],
  Celebrations: ['wedding'],
  Festivals: ['music-festival'],
}
const PEOPLE = [
  { name: 'Maya Ruiz', initials: 'MR', hue: '#2c4380' },
  { name: 'Devin Kerr', initials: 'DK', hue: '#16a34a' },
  { name: 'Priya Shah', initials: 'PS', hue: '#b45309' },
  { name: 'Marcus Tate', initials: 'MT', hue: '#7c3aed' },
  { name: 'Lena Ortiz', initials: 'LO', hue: '#0e7490' },
]
const LOOKS = ['badge', 'original', 'badge', 'dark']
const themeOf = (id) => Object.keys(THEMES).find((t) => THEMES[t].includes(id))
const MOODS = ['', 'brightness(.75) saturate(1.15)', 'sepia(.25) saturate(1.2)']
function look(b, img, logoLook, filter = '') {
  return {
    brand: b,
    look: logoLook,
    palette: [...b.colors],
    selected: { key: img.id, src: img.src, filter },
    copy: { headline: b.name, meta: `${b.dates}  ·  ${b.place}`, tagline: b.tagline, show: { headline: true, meta: true, tagline: true } },
  }
}

// Two pieces of work per brand, by different people, at different times.
const items = Object.values(BRANDS).flatMap((b, bi) => [0, 1].map((k) => {
  const img = b.images[(bi + k) % b.images.length]
  return {
    id: `${b.id}-${k}`,
    theme: themeOf(b.id),
    person: PEOPLE[(bi * 2 + k) % PEOPLE.length],
    ago: (bi * 2 + k) * 47 + 12,
    isNew: bi * 2 + k < 3,
    view: look(b, img, LOOKS[(bi + k) % LOOKS.length]),
    // Earlier drafts of the same project: the other banners, other logo looks.
    history: [0, 1, 2].map((h) => look(b, b.images[(bi + k + h) % b.images.length], LOOKS[(bi + k + h) % LOOKS.length], MOODS[h])),
  }
})).sort((a, b) => a.ago - b.ago)

// Theme and the open item live in the route (deep links).
const theme = computed({ get: () => route.theme, set: (v) => { route.theme = v } })
const shown = ref(9)
const list = computed(() => items.filter((i) => theme.value === 'All' || i.theme === theme.value))
const visible = computed(() => list.value.slice(0, shown.value))
function pick(t) { theme.value = t; shown.value = 9 }
function when(m) { return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago` }

// Open one in the same viewer the Concepts tab uses (read-only).
const open = computed({
  get: () => items.find((i) => i.id === route.open) || null,
  set: (it) => { route.open = it?.id || ''; if (!it) { route.device = 'desktop'; route.screen = 'landing' } },
})
// #/home/team scrolls down to this section.
const root = ref(null)
watch(() => route.at === 'team' || !!route.open, (go) => { if (go) nextTick(() => root.value?.scrollIntoView({ block: 'start' })) }, { immediate: true })
const openProject = computed(() => open.value && ({ name: open.value.view.brand.short, drafts: [openDraft.value] }))
const openDraft = computed(() => open.value && ({ id: open.value.id, n: 1, label: `${open.value.view.brand.name} · by ${open.value.person.name}`, at: 0, snap: open.value.view }))
</script>

<template>
  <section ref="root" class="tf" aria-labelledby="tf-title">
    <header class="tf__head">
      <div>
        <h2 id="tf-title" class="tf__title"><Icon name="users" :size="26" /> From your team</h2>
        <p class="tf__sub">Page drafts your teammates made recently, by theme.</p>
      </div>
    </header>

    <div class="tf__themes cs-tabs" role="group" aria-label="Theme">
      <button
        v-for="t in ['All', ...Object.keys(THEMES)]" :key="t" type="button" class="cs-tab" :class="{ 'is-on': theme === t }"
        :aria-pressed="theme === t" @click="pick(t)"
      >{{ t }}</button>
    </div>

    <ul class="tf__grid">
      <li v-for="it in visible" :key="it.id">
        <button type="button" class="tf__card ds-hover" :aria-label="`${it.view.brand.name} by ${it.person.name}`" @click="open = it">
          <span class="tf__stack"><DraftStack :views="it.history" /></span>
        </button>
        <div class="tf__meta">
          <span class="tf__mark"><img :src="it.view.brand.logo" alt="" /></span>
          <span class="tf__who">
            <b>{{ it.view.brand.short }} <em v-if="it.isNew">New</em></b>
            <small><i class="tf__av" :style="{ background: it.person.hue }">{{ it.person.initials }}</i> {{ it.person.name }} · {{ when(it.ago) }}</small>
          </span>
        </div>
      </li>
    </ul>

    <button v-if="shown < list.length" type="button" class="tf__more" @click="shown += 6">
      More <b>{{ theme === 'All' ? 'team' : theme.toLowerCase() }}</b> pages <Icon name="down" :size="18" />
    </button>

    <DraftViewer v-if="open" :project="openProject" :draft="openDraft" readonly @close="open = null" />
  </section>
</template>

<style scoped>
.tf { width: min(1180px, 100%); margin: 0 auto; padding: 32px 28px 80px; border-top: 1px solid var(--line); }
.tf__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.tf__title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 28px; }
.tf__sub { margin: 4px 0 0; color: var(--ink-2); }
.tf__themes { margin: 20px 0 24px; }

.tf__grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 24px; }
.tf__card { position: relative; display: block; width: 100%; padding: 0; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface-3); overflow: hidden; cursor: pointer; text-align: left; }
.tf__card:hover { box-shadow: var(--shadow-overlay); border-color: var(--line-bold); }
.tf__stack { display: block; padding: 6% 4% 0; }
.tf__meta { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.tf__mark { display: grid; place-items: center; width: 36px; height: 36px; flex: none; border: 1px solid var(--line); border-radius: var(--r); background: #fff; }
.tf__mark img { max-width: 26px; max-height: 26px; object-fit: contain; }
.tf__who { display: grid; min-width: 0; }
.tf__who b { font-size: 16px; display: flex; align-items: center; gap: 8px; }
.tf__who em { padding: 0 8px; border-radius: 999px; background: #dcfce7; color: #15803d; font-style: normal; font-size: 12px; line-height: 20px; }
.tf__who small { display: flex; align-items: center; gap: 6px; color: var(--ink-3); font-size: 13px; }
.tf__av { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; color: #fff; font-style: normal; font-size: 9px; font-weight: 700; }
.tf__more { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; min-height: 72px; margin-top: 32px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); font-size: 18px; color: var(--ink-2); cursor: pointer; }
.tf__more b { color: var(--ink); }
.tf__more:hover { background: var(--surface-3); }
@media (max-width: 640px) { .tf { padding: 24px 16px 64px; } .tf__grid { grid-template-columns: 1fr; } }
</style>
