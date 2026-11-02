<script setup>
// Experience 1 · Home — like Stitch's welcome: the record of projects on the
// left (logo extractions and Presto banners, searchable and filterable), and a
// big composer in the middle to start a new one.
import { computed, nextTick, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { studio, KIND_LABEL, KIND_ICON, relativeDate } from '../../banner-lab/studioProjects.js'
import PromptComposer from './PromptComposer.vue'
import { useHScroll } from './useHScroll.js'

const props = defineProps({
  modelMenuOpen: { type: Boolean, default: false },
  initialText: { type: String, default: '' },
  initialMode: { type: String, default: 'banner' },
  initialLogo: { type: Object, default: null },
  initialReferences: { type: Array, default: () => [] },
  showAnnouncement: { type: Boolean, default: true },
  // While the app fetches a logo from a website, and anything it needs to say
  // about it ("Getting the logo from espn.com…", or why it couldn't).
  busy: { type: Boolean, default: false },
  notice: { type: String, default: '' },
})
const emit = defineEmits(['open', 'create', 'rename', 'delete'])

// ⋯ menu on each project: Rename, Delete (with a confirm step).
const $q = useQuasar()
function rename(p) {
  $q.dialog({
    title: 'Rename project',
    prompt: { model: p.name, type: 'text', isValid: (v) => !!v.trim(), attrs: { maxlength: 80, 'aria-label': 'Project name' } },
    cancel: { flat: true, noCaps: true, label: 'Cancel' },
    ok: { unelevated: true, noCaps: true, label: 'Rename', color: 'dark' },
  }).onOk((name) => emit('rename', p.id, name))
}
function remove(p) {
  $q.dialog({
    title: `Delete “${p.name}”?`,
    message: 'This removes its banners, banner sets, chat and saved images for everyone on the team. It can’t be undone.',
    cancel: { flat: true, noCaps: true, label: 'Cancel' },
    ok: { unelevated: true, noCaps: true, label: 'Delete project', color: 'negative' },
    focus: 'cancel',
  }).onOk(() => emit('delete', p.id))
}

const query = ref('')
const kindFilter = ref('all')
const list = computed(() => studio.projects
  .filter((p) => kindFilter.value === 'all' || p.kind === kindFilter.value || (kindFilter.value !== 'all' && p.kind === 'kit'))
  .filter((p) => !query.value.trim() || `${p.name} ${p.prompt}`.toLowerCase().includes(query.value.trim().toLowerCase())))

const text = ref(props.initialText)
const mode = ref(props.initialMode)
const model = ref('auto')
const logo = ref(props.initialLogo)
const references = ref([...props.initialReferences])
const announce = ref(props.showAnnouncement)

const SUGGESTIONS = {
  banner: [
    'Floodlit soccer stadium at night for a youth tournament',
    'Lakeside summer camp at golden hour, pine trees at the edges',
    'Abstract navy and teal halftone waves for a fintech summit',
    'Cheering festival crowd under stage light beams',
    'Rolling golf fairway at dawn, flag on a distant green',
  ],
  logo: [
    'Clean up our crest and make a white version for dark banners',
    'Pull the logo out of this screenshot of our website',
    'Turn our PNG wordmark into an SVG',
  ],
}

function create() {
  emit('create', { prompt: text.value, mode: mode.value, modelId: model.value, logo: logo.value, references: references.value })
}
const composer = ref(null)
function useSuggestion(sg) {
  text.value = sg
  composer.value?.focus()
}
const chips = useHScroll()
watch(mode, () => nextTick(() => { if (chips.el.value) chips.el.value.scrollLeft = 0; chips.update() }))
const thumb = (p) => p.banners.find((b) => b.id === p.selectedBannerId)?.src || ''
</script>

<template>
  <div class="sh">
    <aside class="sh__side" aria-label="Projects">
      <h2 class="sh__heading"><q-icon name="grid_view" size="18px" /> Projects <span>{{ studio.projects.length }}</span></h2>
      <label class="sh__search">
        <q-icon name="search" size="18px" />
        <input v-model="query" type="search" placeholder="Search projects" aria-label="Search projects" />
      </label>
      <div class="sh__filters" role="radiogroup" aria-label="Show">
        <button v-for="f in [['all', 'All'], ['logo', 'Logos'], ['banner', 'Banners']]" :key="f[0]" type="button" role="radio" :aria-checked="kindFilter === f[0]" :class="{ 'is-on': kindFilter === f[0] }" @click="kindFilter = f[0]">{{ f[1] }}</button>
      </div>
      <p class="sh__label">Recent</p>
      <ul class="sh__list">
        <li v-for="p in list" :key="p.id" class="sh__row">
          <button type="button" class="sh__item bs-focusable" @click="emit('open', p.id)">
            <span class="sh__thumb" :class="{ 'sh__thumb--logo': !thumb(p) }">
              <img v-if="thumb(p)" :src="thumb(p)" alt="" class="sh__thumb-bg" />
              <img v-if="p.logo" :src="p.logo.onDarkSrc && thumb(p) ? p.logo.onDarkSrc : p.logo.src" alt="" class="sh__thumb-logo" />
            </span>
            <span class="sh__meta">
              <strong>{{ p.name }}</strong>
              <small><q-icon :name="KIND_ICON[p.kind]" size="13px" /> {{ KIND_LABEL[p.kind] }}<template v-if="p.banners.length"> · {{ p.banners.length }}</template> · {{ p.status === 'building' ? 'Building…' : relativeDate(p.createdAt) }}</small>
            </span>
          </button>
          <q-btn round flat dense size="sm" icon="more_horiz" class="sh__more" :aria-label="`More actions for ${p.name}`" @click.stop>
            <q-menu anchor="bottom right" self="top right" :offset="[0, 4]">
              <q-list dense style="min-width: 168px">
                <q-item v-close-popup clickable @click="rename(p)">
                  <q-item-section avatar><q-icon name="edit" size="18px" /></q-item-section>
                  <q-item-section>Rename</q-item-section>
                </q-item>
                <q-item v-close-popup clickable class="text-negative" @click="remove(p)">
                  <q-item-section avatar><q-icon name="delete_outline" size="18px" /></q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </li>
        <li v-if="!list.length" class="sh__empty">{{ studio.projects.length ? 'No projects match.' : 'No projects yet. Start one with the prompt.' }}</li>
      </ul>
    </aside>

    <main class="sh__main">
      <div v-if="announce" class="sh__announce">
        <a href="#" @click.prevent>Meet the new Banner Lab</a>
        <q-btn round flat dense size="xs" icon="close" aria-label="Dismiss" @click="announce = false" />
      </div>
      <h1 class="sh__title">Welcome to Banner Lab..</h1>
      <div :ref="(el) => (chips.el.value = el)" class="sh__chips hs" :class="chips.classes.value" aria-label="Suggestions" @scroll="chips.onScroll" @wheel="chips.onWheel">
        <button v-for="sg in SUGGESTIONS[mode]" :key="sg" type="button" class="sh__chip" :class="{ 'is-on': text === sg }" @click="useSuggestion(sg)">{{ sg }}</button>
      </div>
      <PromptComposer
        ref="composer" v-model:text="text" v-model:mode="mode" v-model:model="model" v-model:logo="logo" v-model:references="references"
        :model-menu-open="modelMenuOpen" :busy="busy" class="sh__composer" @submit="create"
      />
      <p v-if="notice" class="sh__notice" :class="{ 'is-busy': busy }" role="status">
        <q-spinner v-if="busy" size="14px" /><q-icon v-else name="info" size="16px" />{{ notice }}
      </p>
      <p class="sh__foot">Every project keeps its logo, banners and Presto mockups. Pick up any of them on the left.</p>
    </main>
  </div>
</template>

<style scoped>
.sh__notice { margin: 10px 4px 0; display: flex; align-items: center; gap: 8px; font: 500 0.875rem var(--bs-font); color: var(--bs-ink); }
.sh__notice.is-busy { color: var(--bs-ink-soft); }
.sh__heading { margin: 2px 4px 0; display: flex; align-items: center; gap: 8px; font: 600 0.9375rem var(--bs-font); color: var(--bs-ink); }
.sh__heading span { padding: 1px 8px; border-radius: 999px; background: var(--bs-surface-2); color: var(--bs-ink-soft); font-size: 0.75rem; }
.sh { display: grid; grid-template-columns: 290px minmax(0, 1fr); gap: 16px; height: 100%; padding: 0 16px 16px; }
.sh__side { background: rgb(232 234 240 / 0.7); border: 1px solid var(--bs-line); border-radius: 18px; padding: 12px; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
.sh__search { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: rgb(255 255 255 / 0.7); color: var(--bs-ink-soft); }
.sh__search input { border: 0; background: transparent; outline: none; flex: 1; font: 400 0.875rem var(--bs-font); color: var(--bs-ink); }
.sh__filters { display: flex; gap: 6px; }
.sh__filters button { border: 1px solid var(--bs-line); background: transparent; border-radius: 999px; padding: 3px 10px; font: 600 0.75rem var(--bs-font); color: var(--bs-ink-soft); cursor: pointer; }
.sh__filters button.is-on { background: var(--bs-ink); color: #fff; border-color: var(--bs-ink); }
.sh__label { margin: 4px 4px 0; font: 600 0.8125rem var(--bs-font); color: var(--bs-ink-soft); }
.sh__list { list-style: none; margin: 0; padding: 0; overflow-y: auto; display: grid; gap: 2px; }
.sh__row { position: relative; }
.sh__more { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); color: var(--bs-ink-soft); background: var(--bs-surface); opacity: 0; transition: opacity 0.12s; }
.sh__row:hover .sh__more, .sh__row:focus-within .sh__more, .sh__more[aria-expanded="true"] { opacity: 1; }
@media (hover: none) { .sh__more { opacity: 1; } }
.sh__item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px 34px 6px 6px; border: 0; background: transparent; border-radius: 10px; text-align: left; cursor: pointer; font-family: var(--bs-font); }
.sh__item:hover { background: rgb(255 255 255 / 0.7); }
.sh__thumb { position: relative; flex: none; width: 64px; height: 40px; border-radius: 6px; overflow: hidden; background: #0b1736; display: grid; place-items: center; }
.sh__thumb--logo { background: #fff; border: 1px solid var(--bs-line); }
.sh__thumb-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.sh__thumb-logo { position: relative; max-height: 60%; max-width: 60%; object-fit: contain; }
.sh__meta { display: grid; min-width: 0; }
.sh__meta strong { font-size: 0.8125rem; font-weight: 600; color: var(--bs-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sh__meta small { display: flex; align-items: center; gap: 3px; font-size: 0.6875rem; color: var(--bs-ink-soft); }
.sh__empty { padding: 12px; font: 400 0.8125rem var(--bs-font); color: var(--bs-ink-faint); }
.sh__main { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; min-width: 0; }
.sh__announce { display: inline-flex; align-items: center; gap: 8px; padding: 6px 8px 6px 18px; border-radius: 8px; background: rgb(232 234 240 / 0.9); border: 1px solid var(--bs-line); margin-bottom: 28px; }
.sh__announce a { font: 600 0.8125rem var(--bs-font); color: var(--bs-ink); }
.sh__title { margin: 0; font: 400 clamp(2.5rem, 5vw, 4rem)/1.1 var(--bs-font); letter-spacing: -0.03em; color: var(--bs-ink); align-self: center; width: min(100%, 720px); }
.sh__chips { display: flex; gap: 8px; width: min(100%, 720px); margin: 22px 0 18px; }
.sh__chip { flex: none; border: 1px solid var(--bs-line); background: rgb(255 255 255 / 0.6); border-radius: 999px; padding: 6px 12px; font: 500 0.8125rem var(--bs-font); color: var(--bs-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.sh__chip:hover { background: #fff; }
.sh__chip { transition: background-color 0.15s, border-color 0.15s, color 0.15s; }
.sh__chip:focus-visible { outline: 2px solid var(--bs-accent); outline-offset: 2px; }
.sh__chip.is-on { background: var(--bs-accent-soft); border-color: var(--bs-accent); color: var(--bs-accent); }
.sh__composer { width: min(100%, 720px); }
.sh__foot { margin: 16px 0 0; font: 400 0.8125rem var(--bs-font); color: var(--bs-ink-faint); }
@media (max-width: 860px) { .sh { grid-template-columns: 1fr; } .sh__side { order: 2; max-height: 320px; } .sh__main { padding: 8px 0 0; justify-content: flex-start; } }
</style>
