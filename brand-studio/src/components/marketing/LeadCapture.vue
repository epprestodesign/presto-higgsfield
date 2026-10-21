<script setup>
// LeadCapture — short, qualified lead form. Validates inline, simulates the
// submit (no network in Phase 1) and emits 'lead' with a structured payload.
import { reactive, ref, computed, nextTick } from 'vue'
import { EVENT_CATEGORIES, validateEvent, validateOrganizer } from '../../models/event.js'

const props = defineProps({
  submitDelayMs: { type: Number, default: 700 },
})
const emit = defineEmits(['lead', 'start'])

const form = reactive({ name: '', email: '', eventName: '', category: null, consent: false })
const errors = ref({})
const status = ref('idle') // idle | submitting | success
const errorSummary = ref(null)

const categoryOptions = EVENT_CATEGORIES.map((c) => ({ label: c.label, value: c.value }))

function validate() {
  const e = {}
  if (!form.name.trim()) e.name = 'Add your name.'
  const email = validateOrganizer({ firstName: 'x', lastName: 'x', email: form.email }).email
  if (email) e.email = email
  const ev = validateEvent({ name: form.eventName }).name
  if (ev) e.eventName = ev
  if (!form.category) e.category = 'Pick the type of event.'
  return e
}

async function submit() {
  errors.value = validate()
  if (Object.keys(errors.value).length) {
    await nextTick()
    errorSummary.value?.focus()
    return
  }
  status.value = 'submitting'
  await new Promise((r) => setTimeout(r, props.submitDelayMs))
  emit('lead', {
    name: form.name.trim(),
    email: form.email.trim(),
    eventName: form.eventName.trim(),
    category: form.category,
    marketingConsent: form.consent,
    source: 'brand-studio-marketing',
    createdAt: new Date().toISOString(),
  })
  status.value = 'success'
}

const firstName = computed(() => form.name.trim().split(/\s+/)[0] || 'there')
const clear = (k) => { if (errors.value[k]) errors.value = { ...errors.value, [k]: undefined } }
const errorCount = computed(() => Object.values(errors.value).filter(Boolean).length)
</script>

<template>
  <section id="get-started" class="lc" aria-labelledby="lc-title">
    <div class="lc__inner">
      <div class="lc__copy">
        <p class="bs-eyebrow lc__eyebrow">Get your preview</p>
        <h2 id="lc-title" class="bs-display-2 lc__title">See your event’s booking page before your next planning call.</h2>
        <p class="bs-lead lc__lead">Tell us a little about your event. We’ll email a link to your branded preview, and an EventPipe specialist can walk you through room blocks and sponsorships.</p>
        <ul class="lc__trust">
          <li><q-icon name="schedule" /> Takes under a minute</li>
          <li><q-icon name="lock" /> We never share your details</li>
          <li><q-icon name="credit_card_off" /> No payment, no commitment</li>
        </ul>
      </div>

      <div class="lc__card bs-card bs-card--raised">
        <div v-if="status === 'success'" class="lc__success" role="status">
          <span class="lc__check"><q-icon name="check" size="28px" /></span>
          <h3 class="bs-title">Thanks, {{ firstName }}. Your preview is on its way.</h3>
          <p class="bs-body">We sent a link for <b>{{ form.eventName }}</b> to <b>{{ form.email }}</b>. Keep going now and pick up right where you left off.</p>
          <q-btn unelevated no-caps class="bs-btn bs-btn--lg bs-btn--primary" label="Start building now" icon-right="arrow_forward" @click="emit('start')" />
        </div>

        <form v-else class="lc__form" novalidate aria-describedby="lc-required" @submit.prevent="submit">
          <!-- Quasar already announces each field error (role="alert"); the summary
               just takes focus so keyboard users land at the top of the form. -->
          <div v-if="errorCount" ref="errorSummary" class="lc__summary" tabindex="-1">
            <q-icon name="error_outline" size="20px" />
            {{ errorCount === 1 ? 'Fix 1 field to continue.' : `Fix ${errorCount} fields to continue.` }}
          </div>
          <p id="lc-required" class="bs-caption">All fields are required.</p>
          <q-input
            v-model="form.name" outlined label="Your name" autocomplete="name" name="name"
            :error="!!errors.name" :error-message="errors.name" @update:model-value="clear('name')"
          />
          <q-input
            v-model="form.email" outlined type="email" label="Work email" autocomplete="email" name="email" inputmode="email"
            :error="!!errors.email" :error-message="errors.email" @update:model-value="clear('email')"
          />
          <q-input
            v-model="form.eventName" outlined label="Event name" name="eventName" placeholder="e.g. Heartland Invitational 2027"
            :error="!!errors.eventName" :error-message="errors.eventName" @update:model-value="clear('eventName')"
          />
          <q-select
            v-model="form.category" outlined label="Event type" :options="categoryOptions" emit-value map-options name="category"
            :error="!!errors.category" :error-message="errors.category" @update:model-value="clear('category')"
          />
          <q-checkbox v-model="form.consent" label="Send me occasional EventPipe product updates (optional)" class="lc__consent" />
          <q-btn
            type="submit" unelevated no-caps class="bs-btn bs-btn--lg bs-btn--primary lc__submit"
            :loading="status === 'submitting'" label="Email me my preview link"
          />
          <p class="bs-caption lc__fine">This is a design preview. It shows sample hotels and rates, and never takes bookings or payments.</p>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lc { margin-top: clamp(64px, 9vw, 120px); background: linear-gradient(180deg, var(--bs-canvas), #EEF1F8); }
.lc__inner { max-width: 1240px; margin: 0 auto; padding: clamp(64px, 8vw, 104px) 24px; display: grid; grid-template-columns: minmax(0, 1fr) 460px; gap: 56px; align-items: center; }
.lc__copy { display: grid; gap: 18px; }
.lc__trust { list-style: none; padding: 0; margin: 6px 0 0; display: grid; gap: 10px; font: 400 0.9375rem/1.3 var(--bs-font); color: var(--bs-ink); }
.lc__trust li { display: flex; align-items: center; gap: 10px; }
.lc__trust .q-icon { font-size: 20px; color: var(--bs-brand); }
.lc__card { padding: 28px; }
.lc__form { display: grid; gap: 6px; }
.lc__summary { display: flex; align-items: center; gap: 8px; padding: 10px 12px; margin-bottom: 6px; border-radius: var(--bs-radius-sm); background: var(--ds-color-background-danger); color: var(--ds-color-text-danger); font: 700 0.875rem/1.3 var(--bs-font); outline: none; }
.lc__summary:focus-visible { box-shadow: var(--bs-ring); }
.lc__consent { margin: 2px 0 8px -8px; font-size: 0.875rem; color: var(--bs-ink-soft); }
.lc__submit { width: 100%; }
.lc__fine { margin-top: 8px; text-align: center; }
.lc__success { display: grid; gap: 14px; justify-items: start; }
.lc__check { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: #DCFCE7; color: #166534; }

@media (max-width: 960px) {
  .lc__inner { grid-template-columns: 1fr; gap: 32px; }
}
@media (max-width: 640px) {
  .lc__inner { padding-inline: 16px; }
  .lc__card { padding: 20px; }
}
</style>
