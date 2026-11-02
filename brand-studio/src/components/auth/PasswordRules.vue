<script setup>
// PasswordRules — the password requirements, ticked off live as you type.
import { PASSWORD_RULES } from '../../auth/index.js'

defineProps({ password: { type: String, default: '' } })
</script>

<template>
  <ul class="pr" aria-label="Password requirements">
    <li v-for="r in PASSWORD_RULES" :key="r.id" :class="{ 'is-ok': r.test(password) }">
      <q-icon :name="r.test(password) ? 'check_circle' : 'radio_button_unchecked'" size="16px" />
      <span>{{ r.label }}</span><span class="pr__sr">{{ r.test(password) ? ' (done)' : ' (not yet)' }}</span>
    </li>
  </ul>
</template>

<style scoped>
.pr { list-style: none; margin: 2px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 14px; }
.pr li { display: inline-flex; align-items: center; gap: 5px; font: 500 0.8125rem var(--bs-font); color: var(--bs-ink-soft); transition: color 0.15s; }
.pr li .q-icon { color: var(--bs-ink-faint); }
.pr li.is-ok { color: var(--bs-success); }
.pr li.is-ok .q-icon { color: var(--bs-success); }
.pr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
