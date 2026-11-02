<script setup>
// AgentPanel — the floating conversation on the left of the canvas (Stitch's
// agent card): the prompt, the build steps while it works, and its summary.
// The status chip + Agent log sit underneath.
import { computed, ref } from 'vue'
import { getModel } from '../../banner-lab/studioModels.js'

const props = defineProps({ project: { type: Object, required: true } })
const emit = defineEmits(['action'])
const showLog = ref(false)
const building = computed(() => props.project.status === 'building')
const current = computed(() => props.project.steps.find((s) => s.status === 'active')?.label || 'Working')
const promptOpen = ref(false)
</script>

<template>
  <div class="ap">
    <section class="ap__card" :class="{ 'is-building': building }" aria-live="polite">
      <span class="ap__dots" aria-hidden="true"><i /><i /></span>
      <button type="button" class="ap__prompt" :aria-expanded="promptOpen" @click="promptOpen = !promptOpen">
        <q-icon name="person" size="14px" />
        <span :class="{ 'is-open': promptOpen }">{{ project.prompt }}</span>
        <q-icon :name="promptOpen ? 'expand_less' : 'expand_more'" size="16px" />
      </button>

      <div class="ap__body">
        <template v-for="(m, i) in project.messages.slice(1)" :key="i">
          <p v-if="m.role === 'user'" class="ap__user">{{ m.text }}</p>
          <div v-else class="ap__msg" :class="{ 'is-muted': m.muted }">
            <p>{{ m.text }}</p>
            <ul v-if="m.items"><li v-for="it in m.items" :key="it">{{ it }}</li></ul>
            <q-btn
              v-if="m.action && !building && project.kind === 'logo'" unelevated no-caps dense class="ap__action" :icon="m.action.icon" :label="m.action.label"
              @click="emit('action', m.action)"
            />
          </div>
        </template>

        <ol v-if="building" class="ap__steps">
          <li v-for="s in project.steps" :key="s.label" :class="`is-${s.status}`">
            <q-spinner v-if="s.status === 'active'" size="14px" />
            <q-icon v-else :name="s.status === 'done' ? 'check_circle' : 'radio_button_unchecked'" size="16px" />
            {{ s.label }}
          </li>
        </ol>
      </div>
    </section>

    <section class="ap__status">
      <p class="ap__chip">
        <q-spinner v-if="building" size="14px" />
        <q-icon v-else name="check_circle" size="16px" />
        <span :title="building ? current : project.name">{{ building ? current : project.name }}</span>
      </p>
      <button type="button" class="ap__log" :aria-expanded="showLog" @click="showLog = !showLog">
        <q-icon name="rocket_launch" size="16px" /> Agent log
        <q-icon :name="showLog ? 'expand_more' : 'expand_less'" size="18px" class="ap__log-x" />
      </button>
      <ul v-if="showLog" class="ap__logs">
        <li>Model: {{ getModel(project.modelId).name }}</li>
        <li v-if="project.autoReason">Auto: {{ project.autoReason }}</li>
        <li v-for="s in project.steps" :key="s.label">{{ s.status === 'done' ? '✓' : '…' }} {{ s.label }}</li>
        <li>{{ project.banners.length }} banner{{ project.banners.length === 1 ? '' : 's' }} on the canvas</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.ap { position: absolute; left: 14px; top: 64px; bottom: 14px; width: 300px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; pointer-events: none; font-family: var(--bs-font); }
.ap > * { pointer-events: auto; }
.ap__card { max-height: calc(100% - 150px); overflow-y: auto; background: rgb(255 255 255 / 0.86); backdrop-filter: blur(12px); border: 1px solid var(--bs-line); border-radius: 18px; box-shadow: var(--bs-shadow-2); padding: 14px; display: grid; gap: 10px; }
.ap__card.is-building { box-shadow: 0 0 0 2px rgb(124 58 237 / 0.35), var(--bs-shadow-2); }
.ap__dots { display: inline-flex; gap: 4px; padding: 6px 9px; border-radius: 999px; background: #111; width: max-content; }
.ap__dots i { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
.ap__prompt { display: flex; align-items: flex-start; gap: 6px; text-align: left; border: 1px solid var(--bs-line); background: var(--bs-surface-2); border-radius: 10px; padding: 8px 10px; font: 400 0.8125rem/1.4 var(--bs-font); color: var(--bs-ink-soft); cursor: pointer; }
.ap__prompt span { flex: 1; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
.ap__prompt span.is-open { -webkit-line-clamp: unset; }
.ap__body { display: grid; gap: 10px; font-size: 0.8125rem; line-height: 1.5; color: var(--bs-ink); }
.ap__user { margin: 0; justify-self: end; max-width: 90%; padding: 7px 11px; border-radius: 12px 12px 4px 12px; background: var(--bs-ink); color: #fff; }
.ap__msg p { margin: 0; }
.ap__msg ul { margin: 6px 0 0; padding-left: 18px; display: grid; gap: 3px; }
.ap__action { margin-top: 10px; padding: 4px 12px; border-radius: 999px; background: var(--bs-ink); color: #fff; font: 600 0.8125rem var(--bs-font); }
.ap__msg.is-muted { color: var(--bs-ink-soft); font-size: 0.75rem; }
.ap__steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.ap__steps li { display: flex; align-items: center; gap: 8px; color: var(--bs-ink-faint); }
.ap__steps li.is-active { color: var(--bs-accent); font-weight: 600; }
.ap__steps li.is-done { color: var(--bs-ink); }
.ap__steps li.is-done .q-icon { color: var(--bs-success); }
.ap__status { background: rgb(255 255 255 / 0.86); backdrop-filter: blur(12px); border: 1px solid var(--bs-line); border-radius: 16px; box-shadow: var(--bs-shadow-1); padding: 8px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px; }
.ap__chip { min-width: 0; margin: 0; display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 10px; border: 1px solid var(--bs-line); font-size: 0.8125rem; font-weight: 500; color: var(--bs-ink); }
.ap__chip span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap__chip .q-icon { flex: none; color: var(--bs-success); }
.ap__log { display: flex; align-items: center; gap: 8px; border: 0; background: transparent; padding: 6px 8px; font: 500 0.8125rem var(--bs-font); color: var(--bs-ink); cursor: pointer; }
.ap__log-x { margin-left: auto; }
.ap__logs { margin: 0; padding: 4px 10px 6px 26px; display: grid; gap: 3px; font-size: 0.75rem; color: var(--bs-ink-soft); }
</style>
