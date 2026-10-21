<script setup>
// ColorRoleField — one brand color role: a swatch button that opens a picker,
// plus a typable hex field. Only valid 3/6-digit hex values are committed.
import { ref, watch, useId } from 'vue'
import { normalizeHex } from '../../theme/color.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  dense: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const id = useId()
const draft = ref(props.modelValue || '')
const invalid = ref(false)
watch(() => props.modelValue, (v) => { if (normalizeHex(draft.value) !== normalizeHex(v)) draft.value = v || '' })

function commit(v) {
  draft.value = v
  const hex = normalizeHex(v)
  invalid.value = !!v && !hex
  if (hex) emit('update:modelValue', hex)
}
const onPick = (v) => commit(String(v || '').toUpperCase())
</script>

<template>
  <div class="crf" :class="{ 'crf--dense': dense }">
    <button
      type="button"
      class="crf__swatch bs-focusable"
      :style="{ background: normalizeHex(modelValue) || 'transparent' }"
      :aria-label="`Pick ${label} color, currently ${modelValue || 'not set'}`"
    >
      <q-icon v-if="!modelValue" name="colorize" size="18px" />
      <q-popup-proxy cover :breakpoint="600" transition-show="scale" transition-hide="scale">
        <q-color
          :model-value="normalizeHex(modelValue) || '#01113E'"
          format-model="hex"
          no-header-tabs
          default-view="spectrum"
          :aria-label="`${label} color picker`"
          @update:model-value="onPick"
        />
      </q-popup-proxy>
    </button>
    <div class="crf__body">
      <label :for="`${id}-hex`" class="crf__label">{{ label }}</label>
      <p v-if="description && !dense" :id="`${id}-desc`" class="crf__desc">{{ description }}</p>
      <div class="crf__hexwrap">
        <span class="crf__hash" aria-hidden="true">#</span>
        <input
          :id="`${id}-hex`"
          class="crf__hex bs-focusable"
          :value="(draft || '').replace(/^#/, '')"
          maxlength="7"
          spellcheck="false"
          autocomplete="off"
          :aria-invalid="invalid"
          :aria-describedby="[description && !dense ? `${id}-desc` : '', invalid ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined"
          @input="commit('#' + $event.target.value.replace(/^#/, ''))"
          @blur="invalid && (draft = modelValue, invalid = false)"
        />
      </div>
      <p v-if="invalid" :id="`${id}-err`" class="crf__err" role="alert">Use a hex color like 0E1B2C.</p>
    </div>
  </div>
</template>

<style scoped>
.crf { display: flex; gap: 12px; align-items: flex-start; }
.crf__swatch {
  flex: none; width: 48px; height: 48px; border-radius: var(--bs-radius-md);
  border: 1px solid rgb(3 10 38 / 0.14); box-shadow: inset 0 0 0 3px #fff; cursor: pointer;
  display: grid; place-items: center; color: var(--bs-ink-soft);
  background-image: repeating-conic-gradient(#F1F5F9 0% 25%, #fff 0% 50%);
  background-size: 12px 12px;
}
.crf--dense .crf__swatch { width: 40px; height: 40px; }
.crf__body { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
.crf__label { font: 700 0.875rem/1.3 var(--bs-font); color: var(--bs-ink); }
.crf__desc { margin: 0; font-size: 0.8125rem; line-height: 1.35; color: var(--bs-ink-soft); }
.crf__hexwrap { position: relative; margin-top: 4px; max-width: 132px; }
.crf__hash { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--bs-ink-soft); font: 400 0.875rem var(--bs-font); }
.crf__hex {
  width: 100%; height: 34px; padding: 0 10px 0 22px; border: 1px solid var(--bs-line-strong); border-radius: var(--bs-radius-sm);
  font: 400 0.875rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; color: var(--bs-ink); background: #fff;
}
.crf__hex[aria-invalid='true'] { border-color: var(--bs-danger); }
.crf__err { margin: 2px 0 0; font-size: 0.75rem; color: var(--ds-color-text-danger); }
</style>
