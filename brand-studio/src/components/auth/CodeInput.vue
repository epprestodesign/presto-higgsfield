<script setup>
// CodeInput — six boxes for an emailed code. Typing moves along, Backspace
// moves back, arrows move between boxes, and pasting a full code fills them
// all (iOS/Android offer it from the email via autocomplete="one-time-code").
// Emits `complete` once all six digits are in.
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  length: { type: Number, default: 6 },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: true },
})
const model = defineModel({ type: String, default: '' })
const emit = defineEmits(['complete'])
const boxes = ref([])
const digits = ref(Array.from({ length: props.length }, (_, i) => model.value[i] || ''))

watch(model, (v) => { digits.value = Array.from({ length: props.length }, (_, i) => v[i] || '') })
function commit() {
  // Use the local digits: a v-model value read straight back is still the old one.
  const v = digits.value.join('')
  model.value = v
  if (v.length === props.length && digits.value.every(Boolean)) emit('complete', v)
}
const focus = (i) => nextTick(() => boxes.value[Math.max(0, Math.min(props.length - 1, i))]?.focus())

function onInput(i, e) {
  const v = e.target.value.replace(/\D/g, '')
  if (v.length > 1) return fill(v, i) // typed fast or autofill
  digits.value[i] = v
  e.target.value = v
  commit()
  if (v) focus(i + 1)
}
function fill(text, from = 0) {
  const v = text.replace(/\D/g, '').slice(0, props.length - from)
  v.split('').forEach((d, k) => { digits.value[from + k] = d })
  commit()
  focus(from + v.length)
}
function onPaste(i, e) {
  e.preventDefault()
  fill(e.clipboardData.getData('text'), i)
}
function onKey(i, e) {
  if (e.key === 'Backspace' && !digits.value[i]) { e.preventDefault(); digits.value[i - 1] = ''; commit(); focus(i - 1) }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1) }
  else if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1) }
}
onMounted(() => { if (props.autofocus) focus(digits.value.findIndex((d) => !d) === -1 ? props.length - 1 : digits.value.findIndex((d) => !d)) })
defineExpose({ clear: () => { digits.value = digits.value.map(() => ''); commit(); focus(0) } })
</script>

<template>
  <div class="ci">
    <div class="ci__boxes" role="group" aria-label="Verification code" :class="{ 'has-error': error }">
      <input
        v-for="(d, i) in digits" :key="i" :ref="(el) => (boxes[i] = el)" :value="d" class="ci__box" inputmode="numeric" maxlength="6"
        :autocomplete="i === 0 ? 'one-time-code' : 'off'" :aria-label="`Digit ${i + 1} of ${length}`" :disabled="disabled" :aria-invalid="!!error"
        @input="onInput(i, $event)" @paste="onPaste(i, $event)" @keydown="onKey(i, $event)" @focus="$event.target.select()"
      />
    </div>
    <p v-if="error" class="ci__error" role="alert"><q-icon name="error" size="16px" /> {{ error }}</p>
  </div>
</template>

<style scoped>
.ci { display: grid; gap: 10px; }
.ci__boxes { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.ci__box { width: 100%; height: 58px; padding: 0; text-align: center; border: 1px solid var(--bs-line); border-radius: 14px; background: #fff; font: 600 1.375rem var(--bs-font); color: var(--bs-ink); outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
.ci__box:focus { border-color: var(--bs-ink); box-shadow: 0 0 0 3px rgb(3 10 38 / 0.08); }
.has-error .ci__box { border-color: var(--bs-danger); }
.ci__error { margin: 0; display: flex; align-items: center; justify-content: center; gap: 6px; font: 500 0.8125rem var(--bs-font); color: var(--bs-danger); }
</style>
