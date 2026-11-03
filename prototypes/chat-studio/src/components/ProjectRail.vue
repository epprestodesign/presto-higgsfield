<script setup>
// Left rail: new project, search, and every project with its logo and the
// banners it has made (the chosen one first). The account chip sits at the foot.
import { computed, ref } from 'vue'
import Icon from './Icon.vue'
import AccountMenu from './AccountMenu.vue'
import { state, projectBanners, openProject, newChat } from '../mockAgent.js'
import epLogo from '../assets/brand/eventpipe-logo.svg'
import epLogoWhite from '../assets/brand/eventpipe-logo-fff.svg'

defineProps({ theme: { type: String, default: 'system' } })
const emit = defineEmits(['theme', 'navigate'])

const query = ref('')
const list = computed(() => {
  const q = query.value.trim().toLowerCase()
  return [...state.projects]
    .sort((a, b) => b.updated - a.updated)
    .filter((p) => !q || `${p.name} ${p.brand.name} ${p.prompt}`.toLowerCase().includes(q))
})

function strip(p) {
  const all = projectBanners(p)
  const sel = p.selected ? all.find((b) => b.key === p.selected.key) : null
  return [...(sel ? [sel] : []), ...all.filter((b) => b !== sel)].slice(0, 3)
}

function when(t) {
  const m = Math.round((Date.now() - t) / 6e4)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'Yesterday' : `${d} days ago`
}

function open(id) { openProject(id); emit('navigate') }
function fresh() { newChat(); emit('navigate') }
</script>

<template>
  <nav class="rail" aria-label="Projects">
    <div class="rail__brand">
      <img class="rail__logo is-light" :src="epLogo" alt="EventPipe" width="128" height="33" />
      <img class="rail__logo is-dark" :src="epLogoWhite" alt="EventPipe" width="128" height="33" />
      <span class="rail__app">Banner Lab</span>
    </div>

    <button type="button" class="cs-btn-dark rail__new" @click="fresh">
      <Icon name="plus" /> New project
    </button>

    <label class="rail__search">
      <Icon name="search" :size="18" />
      <span class="cs-sr">Search projects</span>
      <input v-model="query" type="search" placeholder="Search projects" />
    </label>

    <p class="rail__label">Projects</p>
    <ul class="rail__list">
      <li v-for="p in list" :key="p.id">
        <button
          type="button" class="proj" :class="{ 'is-active': p.id === state.activeId }"
          :aria-current="p.id === state.activeId ? 'page' : undefined" @click="open(p.id)"
        >
          <span class="proj__logo"><img :src="p.brand.logo" alt="" /></span>
          <span class="proj__body">
            <span class="proj__name">{{ p.name }}</span>
            <span class="proj__meta">{{ when(p.updated) }} · {{ projectBanners(p).length }} banners</span>
            <span v-if="strip(p).length" class="proj__strip">
              <img
                v-for="(b, i) in strip(p)" :key="b.key" :src="b.src" alt=""
                :class="{ 'is-sel': i === 0 && p.selected }" :style="{ filter: b.filter || undefined }"
              />
            </span>
          </span>
        </button>
      </li>
      <li v-if="!list.length" class="rail__empty">No projects match “{{ query }}”.</li>
    </ul>

    <AccountMenu :theme="theme" @theme="emit('theme', $event)" />
  </nav>
</template>

<style scoped>
.rail { display: flex; flex-direction: column; gap: 12px; height: 100%; padding: 20px 16px 16px; border-right: 1px solid var(--line); background: var(--surface); min-height: 0; }
.rail__brand { display: flex; align-items: center; gap: 12px; padding: 2px 4px 14px; border-bottom: 1px solid var(--line); margin-bottom: 4px; }
.rail__logo { width: 112px; height: auto; }
.rail__logo.is-dark { display: none; }
:global(.cs[data-theme='dark']) .rail__logo.is-light { display: none; }
:global(.cs[data-theme='dark']) .rail__logo.is-dark { display: block; }
.rail__app { padding-left: 12px; border-left: 1px solid var(--line-bold); font-weight: 700; font-size: 15px; color: var(--ink-2); }
.rail__new { width: 100%; justify-content: center; }
.rail__search { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 12px; border: 1px solid var(--line-bold); border-radius: var(--r); background: var(--surface); color: var(--ink-3); }
.rail__search:focus-within { border-color: var(--navy-900); box-shadow: 0 0 0 1px var(--navy-900); }
.rail__search input { flex: 1; min-width: 0; border: 0; background: none; outline: none; font: inherit; color: var(--ink); }
.rail__label { margin: 10px 4px 0; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
.rail__list { flex: 1; min-height: 0; overflow-y: auto; margin: 0 -6px; padding: 0 6px; list-style: none; display: grid; align-content: start; gap: 2px; }
.rail__empty { padding: 8px 6px; font-size: 14px; color: var(--ink-3); }

.proj { position: relative; display: flex; gap: 12px; width: 100%; padding: 10px; border: 0; border-radius: var(--r); background: none; text-align: left; cursor: pointer; }
.proj:hover { background: var(--surface-3); }
.proj.is-active { background: var(--selected); }
.proj.is-active::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: var(--pill); }
.proj__logo { display: grid; place-items: center; width: 44px; height: 44px; flex: none; border-radius: var(--r); background: #fff; border: 1px solid var(--line); overflow: hidden; }
.proj__logo img { max-width: 34px; max-height: 34px; object-fit: contain; }
.proj__body { display: grid; gap: 1px; min-width: 0; flex: 1; }
.proj__name { font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.proj__meta { font-size: 13px; color: var(--ink-3); }
.proj__strip { display: flex; gap: 4px; margin-top: 6px; }
.proj__strip img { width: 56px; height: 22px; border-radius: 2px; object-fit: cover; opacity: 0.85; }
.proj__strip img.is-sel { opacity: 1; box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--pill); }
</style>
