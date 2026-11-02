<script setup>
// ModelMenu — the composer's model picker, like Stitch's: the selected model on
// a pill; a menu listing each model with what it's best at. "Auto" is the
// default and shows which model it would pick right now, and why.
import { computed, ref } from 'vue'
import { MODELS, getModel, pickModel } from '../../banner-lab/studioModels.js'

const props = defineProps({
  modelValue: { type: String, default: 'auto' },
  mode: { type: String, default: 'banner' },
  context: { type: Object, default: () => ({}) }, // { prompt, references, hasLogo }
  startOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const open = ref(props.startOpen)

const auto = computed(() => pickModel({ mode: props.mode, ...props.context }))
const options = computed(() => MODELS.filter((m) => m.id === 'auto' || (m.modes || []).includes(props.mode)))
const selected = computed(() => getModel(props.modelValue))
const label = computed(() => (props.modelValue === 'auto' ? `Auto · ${short(getModel(auto.value.id).name)}` : short(selected.value.name)))
const short = (name) => name.replace('Marketing Studio 2.5 ', '').replace('Higgsfield ', '').replace('Logo cleanup + vector', 'Logo tools')
</script>

<template>
  <q-btn flat no-caps dense class="mm__btn" :aria-label="`Model: ${label}`">
    <q-icon :name="modelValue === 'auto' ? 'rocket_launch' : selected.icon" size="16px" />
    <span>{{ label }}</span>
    <q-icon name="expand_more" size="16px" />
    <q-menu v-model="open" anchor="bottom right" self="top right" :offset="[0, 8]" class="mm__menu" max-height="460px">
      <q-list style="width: 340px">
        <q-item
          v-for="m in options" :key="m.id" v-close-popup clickable :active="m.id === modelValue" active-class="mm__active"
          @click="emit('update:modelValue', m.id)"
        >
          <q-item-section avatar class="mm__avatar"><q-icon :name="m.icon" size="20px" /></q-item-section>
          <q-item-section>
            <q-item-label class="mm__name">{{ m.name }} <span v-if="m.badge" class="mm__badge">{{ m.badge }}</span></q-item-label>
            <q-item-label v-if="m.id === 'auto'" caption class="mm__why">
              Right now: <strong>{{ getModel(auto.id).name }}</strong>. {{ auto.reason }}
            </q-item-label>
            <q-item-label v-else caption>{{ m.summary }}</q-item-label>
            <q-item-label caption class="mm__best"><q-icon name="star" size="12px" /> Best for: {{ m.bestFor }}</q-item-label>
            <q-item-label v-if="m.warning" caption class="mm__warn"><q-icon name="warning" size="12px" /> {{ m.warning }}</q-item-label>
            <q-item-label v-if="m.speed" caption class="mm__meta">{{ m.speed }} · {{ m.cost }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="m.id === modelValue" side><q-icon name="check" size="18px" /></q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<style scoped>
.mm__btn { white-space: nowrap; border-radius: 999px; padding: 4px 10px; font: 600 0.8125rem var(--bs-font); color: var(--bs-ink); gap: 4px; }
.mm__btn :deep(.q-btn__content) { gap: 6px; flex-wrap: nowrap; }
</style>
<style>
.mm__menu { border-radius: 14px !important; box-shadow: var(--bs-shadow-3) !important; }
.mm__menu .q-item { padding: 10px 14px; border-radius: 10px; margin: 4px; align-items: flex-start; font-family: var(--bs-font); }
.mm__menu .mm__avatar { min-width: 32px; padding-top: 2px; color: var(--bs-ink); }
.mm__menu .mm__name { font-weight: 600; font-size: 0.875rem; color: var(--bs-ink); }
.mm__menu .mm__badge { margin-left: 6px; padding: 1px 7px; border-radius: 999px; background: var(--bs-accent-soft); color: var(--bs-accent); font-size: 0.6875rem; font-weight: 700; }
.mm__menu .mm__why strong { color: var(--bs-ink); }
.mm__menu .mm__best { margin-top: 4px; color: var(--bs-ink); }
.mm__menu .mm__warn { color: #b45309; }
.mm__menu .mm__meta { color: var(--bs-ink-faint); }
.mm__menu .mm__active { background: var(--bs-surface-2); color: inherit; }
</style>
