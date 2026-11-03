<script setup>
// Account chip at the foot of the rail; opens upward: Quick tour, Give
// feedback, Log out. (Light mode only; the prototype map is still at #/map.)
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
import { toast } from '../mockAgent.js'

const open = ref(false)
const root = ref(null)

const LINKS = [
  { label: 'Quick tour', icon: 'help' },
  { label: 'Give feedback', icon: 'feedback' },
]

function outside(e) { if (open.value && root.value && !root.value.contains(e.target)) open.value = false }
function esc(e) { if (e.key === 'Escape') open.value = false }
onMounted(() => { document.addEventListener('pointerdown', outside); document.addEventListener('keydown', esc) })
onBeforeUnmount(() => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', esc) })
function soon(label) { open.value = false; toast(`${label}: not part of this prototype yet`) }
</script>

<template>
  <div ref="root" class="acct">
    <div v-if="open" class="acct__menu" role="menu" aria-label="Account">
      <button v-for="l in LINKS" :key="l.label" type="button" class="acct__item" role="menuitem" @click="soon(l.label)">
        <Icon :name="l.icon" /> {{ l.label }}
      </button>
      <hr />
      <button type="button" class="acct__item" role="menuitem" @click="soon('Log out')"><Icon name="logout" /> Log out</button>
    </div>
    <button type="button" class="acct__chip" :aria-expanded="open" aria-haspopup="menu" @click="open = !open">
      <span class="acct__avatar" aria-hidden="true">JG</span>
      <span class="acct__who">Justin Girard</span>
      <span class="acct__team">TEAM</span>
    </button>
  </div>
</template>

<style scoped>
.acct { position: relative; }
.acct__chip { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 52px; padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); cursor: pointer; }
.acct__chip:hover { background: var(--surface-3); }
.acct__avatar { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--navy-900); color: #fff; font-size: 13px; font-weight: 700; }
.acct__who { flex: 1; text-align: left; font-weight: 700; }
.acct__team { padding: 1px 8px; border-radius: 999px; background: var(--navy-50); color: var(--navy-900); font: 700 11px/1.6 var(--sans); letter-spacing: 0.06em; }
.acct__menu { position: absolute; left: 0; right: 0; bottom: calc(100% + 6px); z-index: 20; padding: 8px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow-overlay); }
.acct__menu hr { border: 0; border-top: 1px solid var(--line); margin: 8px 0; }
.acct__item { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 40px; padding: 8px 10px; border: 0; border-radius: var(--r); background: none; text-align: left; cursor: pointer; }
.acct__item:hover { background: var(--surface-3); }
</style>
