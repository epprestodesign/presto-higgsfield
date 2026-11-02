<script setup>
// AuthField — a labelled input for the auth screens: big, rounded, with an
// inline error and (for passwords) a show/hide eye. `#aside` sits at the right
// of the label row (e.g. "Forgot password?").
import { computed, onMounted, ref, useId } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: 'off' },
  placeholder: { type: String, default: '' },
  inputmode: { type: String, default: undefined },
  error: { type: String, default: '' },
  autofocus: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
const model = defineModel({ type: String, default: '' })
const id = useId()
const show = ref(false)
const isPassword = computed(() => props.type === 'password')
const input = ref(null)
onMounted(() => { if (props.autofocus) input.value?.focus() })
defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="af" :class="{ 'has-error': error }">
    <div class="af__row">
      <label :for="id" class="af__label">{{ label }}</label>
      <slot name="aside" />
    </div>
    <div class="af__box">
      <input
        :id="id" ref="input" v-model="model" class="af__input" :type="isPassword && show ? 'text' : type" :autocomplete="autocomplete"
        :placeholder="placeholder" :inputmode="inputmode" :disabled="disabled" :aria-invalid="!!error" :aria-describedby="error ? `${id}-err` : undefined"
        spellcheck="false" autocapitalize="off"
      />
      <button
        v-if="isPassword" type="button" class="af__eye" :aria-label="show ? 'Hide password' : 'Show password'" :aria-pressed="show"
        @click="show = !show"
      ><q-icon :name="show ? 'visibility_off' : 'visibility'" size="20px" /></button>
    </div>
    <p v-if="error" :id="`${id}-err`" class="af__error" role="alert"><q-icon name="error" size="16px" /> {{ error }}</p>
    <slot />
  </div>
</template>

<style scoped>
.af { display: grid; gap: 7px; }
.af__row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.af__label { font: 600 0.875rem var(--bs-font); color: var(--bs-ink); }
.af__box { position: relative; }
.af__input { width: 100%; height: 50px; padding: 0 16px; border: 1px solid var(--bs-line); border-radius: 14px; background: #fff; font: 400 1rem var(--bs-font); color: var(--bs-ink); outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
.af__input::placeholder { color: var(--bs-ink-faint); }
.af__input:hover { border-color: var(--bs-ink-faint); }
.af__input:focus { border-color: var(--bs-ink); box-shadow: 0 0 0 3px rgb(3 10 38 / 0.08); }
.af__input:disabled { background: var(--bs-surface-2); color: var(--bs-ink-soft); }
.af__box:has(.af__eye) .af__input { padding-right: 52px; }
.af__eye { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 10px; background: transparent; color: var(--bs-ink); cursor: pointer; }
.af__eye:hover { background: var(--bs-surface-2); }
.has-error .af__input { border-color: var(--bs-danger); }
.has-error .af__input:focus { box-shadow: 0 0 0 3px rgb(220 38 38 / 0.12); }
.af__error { margin: 0; display: flex; align-items: flex-start; gap: 6px; font: 500 0.8125rem/1.4 var(--bs-font); color: var(--bs-danger); }
.af__error .q-icon { margin-top: 1px; flex: none; }
</style>
