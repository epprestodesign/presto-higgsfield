<script setup>
// Left rail: New project, links to everything you've made (Banners, Logos,
// Pages), then your History — project titles, newest first. The account chip
// sits at the foot.
import { computed } from 'vue'
import Icon from './Icon.vue'
import AccountMenu from './AccountMenu.vue'
import { state, openProject, newChat, openLibrary } from '../mockAgent.js'
import { route, go } from '../router.js'
import epLogo from '../assets/brand/eventpipe-logo.svg'
import epLogoWhite from '../assets/brand/eventpipe-logo-fff.svg'

defineProps({ theme: { type: String, default: 'system' } })
const emit = defineEmits(['theme', 'navigate'])

const LINKS = [
  { id: 'banners', label: 'Banners', icon: 'image' },
  { id: 'logos', label: 'Logos', icon: 'spark' },
  { id: 'pages', label: 'Pages', icon: 'layers' },
]
const history = computed(() => [...state.projects].sort((a, b) => b.updated - a.updated))

function open(id) { openProject(id); emit('navigate') }
function library(id) { openLibrary(id); emit('navigate') }
function fresh() { newChat(); emit('navigate') }
</script>

<template>
  <nav class="rail" aria-label="Banner Lab">
    <div class="rail__brand">
      <img class="rail__logo is-light" :src="epLogo" alt="EventPipe" width="128" height="33" />
      <img class="rail__logo is-dark" :src="epLogoWhite" alt="EventPipe" width="128" height="33" />
      <span class="rail__app">Banner Lab</span>
    </div>

    <button type="button" class="cs-btn-dark rail__new" @click="fresh">
      <Icon name="plus" /> New project
    </button>

    <ul class="rail__links">
      <li v-for="l in LINKS" :key="l.id">
        <button
          type="button" class="rail__link" :class="{ 'is-active': state.library === l.id }"
          :aria-current="state.library === l.id ? 'page' : undefined" @click="library(l.id)"
        >
          <Icon :name="l.icon" :size="22" /> {{ l.label }}
        </button>
      </li>
    </ul>

    <p class="rail__label">History</p>
    <ul class="rail__history">
      <li v-for="p in history" :key="p.id">
        <button
          type="button" class="rail__item" :class="{ 'is-active': p.id === state.activeId }"
          :aria-current="p.id === state.activeId ? 'page' : undefined" :title="p.brand.name" @click="open(p.id)"
        >{{ p.brand.name }}</button>
      </li>
    </ul>

    <button type="button" class="rail__map" :class="{ 'is-active': route.view === 'map' }" @click="go({ view: 'map' }); emit('navigate')">
      <Icon name="map" :size="18" /> Prototype map · links
    </button>
    <AccountMenu :theme="theme" @theme="emit('theme', $event)" />
  </nav>
</template>

<style scoped>
.rail { display: flex; flex-direction: column; gap: 6px; height: 100%; padding: 20px 16px 16px; border-right: 1px solid var(--line); background: var(--surface); min-height: 0; }
.rail__brand { display: flex; align-items: center; gap: 12px; padding: 2px 4px 16px; }
.rail__logo { width: 112px; height: auto; }
.rail__logo.is-dark { display: none; }
:global(.cs[data-theme='dark']) .rail__logo.is-light { display: none; }
:global(.cs[data-theme='dark']) .rail__logo.is-dark { display: block; }
.rail__app { padding-left: 12px; border-left: 1px solid var(--line-bold); font-weight: 700; font-size: 15px; color: var(--ink-2); }
.rail__new { width: 100%; justify-content: flex-start; margin-bottom: 6px; font-size: 16px; }

.rail__links, .rail__history { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.rail__link { display: flex; align-items: center; gap: 14px; width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid transparent; border-radius: var(--r); background: none; font-size: 16px; text-align: left; cursor: pointer; }
.rail__link :deep(svg) { color: var(--ink-2); }
.rail__link:hover { background: var(--surface-3); }
.rail__link.is-active { background: var(--selected); border-color: var(--line); font-weight: 700; }

.rail__label { margin: 22px 12px 4px; font-size: 13px; color: var(--ink-3); }
.rail__history { flex: 1; min-height: 0; overflow-y: auto; align-content: start; }
.rail__item { display: block; width: 100%; min-height: 40px; padding: 8px 12px; border: 1px solid transparent; border-radius: var(--r); background: none; font-size: 15px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.rail__item:hover { background: var(--surface-3); }
.rail__item.is-active { background: var(--selected); border-color: var(--line); font-weight: 700; }
.rail__map { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 6px 12px; border: 1px dashed var(--line-bold); border-radius: var(--r); background: none; color: var(--ink-2); font-size: 13px; cursor: pointer; }
.rail__map:hover, .rail__map.is-active { background: var(--selected); color: var(--ink); }
</style>
