<script setup>
// What the agent is doing. While it works: a spinning mark and the current
// step, shimmering. When it's done: "Worked for 6s", which opens the steps.
import { ref } from 'vue'
import Icon from './Icon.vue'

defineProps({ message: { type: Object, required: true } })
const open = ref(false)
</script>

<template>
  <div class="st" aria-live="polite">
    <template v-if="message.status === 'working'">
      <span class="st__mark" aria-hidden="true" />
      <span class="st__now">{{ message.steps[message.step]?.label }}…</span>
    </template>
    <template v-else>
      <button type="button" class="st__done" :aria-expanded="open" @click="open = !open">
        <Icon :name="message.status === 'stopped' ? 'stop' : 'check'" :size="16" />
        {{ message.status === 'stopped' ? 'Stopped' : `Worked for ${message.seconds}s` }}
        <Icon name="down" :size="16" class="st__chev" :class="{ 'is-open': open }" />
      </button>
      <ol v-if="open" class="st__steps">
        <li v-for="s in message.steps" :key="s.label" :class="{ 'is-done': s.done }">
          <Icon :name="s.done ? 'check' : 'x'" :size="14" /> {{ s.label }}
        </li>
      </ol>
    </template>
  </div>
</template>

<style scoped>
.st { display: grid; gap: 6px; justify-items: start; }
.st__mark { width: 22px; height: 22px; flex: none; margin-right: 12px; border-radius: 50%; border: 2.5px solid var(--navy-100); border-top-color: var(--pill); animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.st:has(.st__mark) { display: flex; align-items: center; }
.st__now {
  font-size: 17px;
  background: linear-gradient(90deg, var(--ink-3) 0%, var(--ink-3) 40%, var(--ink) 50%, var(--ink-3) 60%, var(--ink-3) 100%) 0 0 / 300% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: shimmer 1.8s linear infinite;
}
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
.st__done { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 6px; margin-left: -6px; border: 0; border-radius: var(--r); background: none; color: var(--ink-3); font-size: 13px; cursor: pointer; }
.st__done:hover { background: var(--surface-2); color: var(--ink-2); }
.st__chev { transition: transform 0.15s; }
.st__chev.is-open { transform: rotate(180deg); }
.st__steps { margin: 0; padding: 0 0 0 4px; list-style: none; display: grid; gap: 4px; font-size: 13px; color: var(--ink-3); }
.st__steps li { display: flex; align-items: center; gap: 8px; }
.st__steps li.is-done :deep(svg) { color: var(--ok); }
</style>
