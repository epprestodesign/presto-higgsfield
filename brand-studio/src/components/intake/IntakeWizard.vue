<script setup>
// IntakeWizard — the guided, account-free event intake (spec 4B).
//   1 Event basics → 2 Where & when → 3 Your brand (optional) → 4 Contact
// Every keystroke writes through the project store, so the live preview on
// the right (BrandHero) and the autosaved draft are always current. Fields
// validate on blur and on Continue; Continue with errors shows an error
// summary and moves focus to the first invalid field.
import { ref, reactive, computed, nextTick, useId } from 'vue'
import { useProjectStore } from '../../stores/project.js'
import { EVENT_CATEGORIES, validateEvent, validateOrganizer, normalizeWebsiteUrl, formatDateRange, locationLabel } from '../../models/event.js'
import { starterContent } from '../../models/content.js'
import BrandHero from '../brand/BrandHero.vue'
import AssetDropzone from './AssetDropzone.vue'
import ColorRoleField from '../brand-kit/ColorRoleField.vue'

const props = defineProps({
  // Start on a given step (0-based) — handy for stories and "edit details" links.
  initialStep: { type: Number, default: 0 },
  // Show every error immediately (as if Continue had been pressed).
  showErrors: { type: Boolean, default: false },
})
const emit = defineEmits(['complete', 'cancel'])

const project = useProjectStore()
const ev = computed(() => project.event)
const org = computed(() => project.project.organizer)
const bk = computed(() => project.brandKit)
const uidBase = useId()

const STEPS = [
  { id: 'basics', short: 'Basics', title: 'Let’s start with your event', blurb: 'Name your booking page and tell us what kind of event it is. You can change all of this later.', fields: ['name', 'category'] },
  { id: 'where', short: 'Where & when', title: 'Where and when is it?', blurb: 'We use your location to surface hotels near the venue, and your dates to set the booking window.', fields: ['venue', 'city', 'region', 'startDate', 'endDate'] },
  { id: 'brand', short: 'Brand', title: 'Make it look like you', blurb: 'Optional, and you can always add it later. A logo and a couple of colors make your preview feel real right away.', fields: ['websiteUrl'], optional: true },
  { id: 'contact', short: 'Contact', title: 'Where should we send your preview?', blurb: 'We’ll email you a link to your booking page preview so you can come back to it anytime.', fields: ['firstName', 'lastName', 'email', 'phone'] },
]
const LABELS = {
  name: 'Booking page name', category: 'Event type', venue: 'Venue', city: 'City', region: 'State / region',
  startDate: 'Start date', endDate: 'End date', websiteUrl: 'Website', firstName: 'First name',
  lastName: 'Last name', email: 'Email', phone: 'Phone',
}
const ATTENDANCE = ['Under 100', '100–500', '500–1,000', '1,000–5,000', '5,000+']

const step = ref(Math.min(Math.max(props.initialStep, 0), STEPS.length - 1))
const current = computed(() => STEPS[step.value])
const touched = reactive({})
const attempted = reactive(Object.fromEntries(STEPS.map((s) => [s.id, props.showErrors])))
const form = ref(null)
const heading = ref(null)
const previewOpen = ref(false)

const allErrors = computed(() => ({ ...validateEvent(ev.value), ...validateOrganizer(org.value) }))
const errorsFor = (s) => Object.fromEntries(s.fields.filter((f) => allErrors.value[f]).map((f) => [f, allErrors.value[f]]))
const stepErrors = computed(() => errorsFor(current.value))
const showErr = (f) => (touched[f] || attempted[current.value.id]) && allErrors.value[f] ? allErrors.value[f] : ''
const summary = computed(() => (attempted[current.value.id] ? Object.entries(stepErrors.value) : []))

const blur = (f) => { touched[f] = true }
const setEvent = (patch) => project.updateEvent(patch)
const setOrg = (patch) => project.updateOrganizer(patch)

function focusField(f) {
  const el = form.value?.querySelector(`[data-field="${f}"] input, [data-field="${f}"] textarea, [data-field="${f}"] [tabindex="0"]`)
  el?.focus()
}

async function go(to) {
  step.value = to
  project.saveDraft()
  await nextTick()
  heading.value?.focus()
}

async function next() {
  if (Object.keys(stepErrors.value).length) {
    attempted[current.value.id] = true
    await nextTick()
    focusField(current.value.fields.find((f) => stepErrors.value[f]))
    return
  }
  if (step.value < STEPS.length - 1) return go(step.value + 1)
  // Final step — make sure earlier steps are still valid (e.g. edited via back).
  const bad = STEPS.findIndex((s) => Object.keys(errorsFor(s)).length)
  if (bad !== -1) {
    attempted[STEPS[bad].id] = true
    await go(bad)
    focusField(STEPS[bad].fields.find((f) => allErrors.value[f]))
    return
  }
  project.regeneratePageCopy()
  await project.saveDraft()
  emit('complete')
}

function back() { if (step.value > 0) go(step.value - 1); else emit('cancel') }

function skipBrand() {
  if (ev.value.websiteUrl && normalizeWebsiteUrl(ev.value.websiteUrl) === null) setEvent({ websiteUrl: '' })
  go(step.value + 1)
}

function normalizeWebsite() {
  blur('websiteUrl')
  const n = normalizeWebsiteUrl(ev.value.websiteUrl)
  if (n) setEvent({ websiteUrl: n })
}

// Date range — typable native inputs + a calendar popup (q-date range).
const range = computed(() => (ev.value.startDate ? { from: ev.value.startDate, to: ev.value.endDate || ev.value.startDate } : null))
function onRange(v) {
  if (!v) return
  if (typeof v === 'string') setEvent({ startDate: v, endDate: v })
  else setEvent({ startDate: v.from, endDate: v.to })
  touched.startDate = touched.endDate = true
}

// Brand step uploads
const logoAssets = computed(() => (bk.value.logo ? [bk.value.logo] : []))
const photoAssets = computed(() => (bk.value.imagery || []).filter((a) => a.kind !== 'logo'))
function addPhoto(a) {
  project.addImage(a)
  if (!bk.value.heroImageId) project.setHeroImage(a.id)
}

// Live preview
const starter = computed(() => starterContent(ev.value))
const hero = computed(() => ({
  brandKit: bk.value,
  headline: ev.value.name?.trim() || 'Your event name',
  tagline: ev.value.category ? starter.value.tagline : 'Official hotels for your attendees.',
  dates: formatDateRange(ev.value.startDate, ev.value.endDate),
  location: locationLabel(ev.value),
}))
const savedLabel = computed(() => (project.lastSavedAt ? 'Progress saved on this device' : 'No account needed'))
</script>

<template>
  <div class="iw bs-animate">
    <!-- Header + stepper -->
    <header class="iw__head">
      <div class="iw__head-row">
        <p class="bs-eyebrow">Create your booking page</p>
        <button type="button" class="iw__exit bs-focusable" @click="emit('cancel')">
          <q-icon name="close" size="18px" /> Exit
        </button>
      </div>
      <nav :aria-label="`Intake progress, step ${step + 1} of ${STEPS.length}`">
        <ol class="iw__steps">
          <li
            v-for="(s, i) in STEPS"
            :key="s.id"
            class="iw__step"
            :class="{ 'is-current': i === step, 'is-done': i < step }"
            :aria-current="i === step ? 'step' : undefined"
          >
            <button v-if="i < step" type="button" class="iw__step-btn bs-focusable" @click="go(i)">
              <span class="iw__step-dot"><q-icon name="check" size="14px" /></span>
              <span class="iw__step-label">{{ s.short }}<span class="bs-sr-only"> (completed, edit)</span></span>
            </button>
            <span v-else class="iw__step-btn">
              <span class="iw__step-dot">{{ i + 1 }}</span>
              <span class="iw__step-label">{{ s.short }}<span v-if="s.optional" class="iw__opt"> · optional</span></span>
            </span>
          </li>
        </ol>
      </nav>
    </header>

    <div class="iw__grid">
      <!-- Form -->
      <form ref="form" class="iw__form bs-card bs-card--raised" novalidate @submit.prevent="next">
        <div class="iw__form-head">
          <p class="iw__count">Step {{ step + 1 }} of {{ STEPS.length }}</p>
          <h2 ref="heading" tabindex="-1" class="bs-display-2 iw__title">{{ current.title }}</h2>
          <p class="bs-body iw__blurb">{{ current.blurb }}</p>
        </div>

        <!-- Error summary -->
        <div v-if="summary.length" class="iw__summary" role="alert" :aria-labelledby="`${uidBase}-sum`">
          <p :id="`${uidBase}-sum`" class="iw__summary-title">
            <q-icon name="error_outline" size="20px" /> {{ summary.length === 1 ? 'One thing needs a look' : `${summary.length} things need a look` }}
          </p>
          <ul>
            <li v-for="[f, msg] in summary" :key="f">
              <a :href="`#${uidBase}-${f}`" @click.prevent="focusField(f)">{{ LABELS[f] }}: {{ msg }}</a>
            </li>
          </ul>
        </div>

        <Transition name="iw-step" mode="out-in">
          <!-- STEP 1 · Basics -->
          <div v-if="current.id === 'basics'" key="basics" class="iw__fields">
            <div data-field="name">
              <q-input
                :id="`${uidBase}-name`"
                outlined
                :model-value="ev.name"
                label="Booking page name"
                hint="Usually your event name. Attendees see it at the top of every page."
                placeholder="e.g. Heartland Invitational Soccer Cup 2027"
                maxlength="90"
                autocomplete="off"
                :error="!!showErr('name')"
                :error-message="showErr('name')"
                :aria-invalid="!!showErr('name')"
                @update:model-value="setEvent({ name: $event })"
                @blur="blur('name')"
              />
            </div>

            <fieldset class="iw__fieldset" data-field="category" :aria-describedby="showErr('category') ? `${uidBase}-cat-err` : undefined">
              <legend class="iw__legend">What kind of event is it?</legend>
              <p class="iw__help">We’ll tailor the starter copy and creative directions to fit.</p>
              <div class="iw__cats">
                <label
                  v-for="c in EVENT_CATEGORIES"
                  :key="c.value"
                  class="iw__cat"
                  :class="{ 'is-on': ev.category === c.value }"
                >
                  <input
                    type="radio"
                    class="iw__cat-input"
                    :name="`${uidBase}-category`"
                    :value="c.value"
                    :checked="ev.category === c.value"
                    :aria-describedby="`${uidBase}-cat-${c.value}`"
                    @change="setEvent({ category: c.value }); blur('category')"
                  />
                  <span class="iw__cat-icon"><q-icon :name="c.icon" size="22px" /></span>
                  <span class="iw__cat-text">
                    <span class="iw__cat-label">{{ c.label }}</span>
                    <span :id="`${uidBase}-cat-${c.value}`" class="iw__cat-hint">{{ c.hint }}</span>
                  </span>
                  <q-icon v-if="ev.category === c.value" name="check_circle" size="20px" class="iw__cat-check" />
                </label>
              </div>
              <p v-if="showErr('category')" :id="`${uidBase}-cat-err`" class="iw__err" role="alert">{{ showErr('category') }}</p>
            </fieldset>
          </div>

          <!-- STEP 2 · Where & when -->
          <div v-else-if="current.id === 'where'" key="where" class="iw__fields">
            <div data-field="venue">
              <q-input
                outlined :model-value="ev.venue" label="Venue (optional)" placeholder="e.g. Overland Park Soccer Complex"
                hint="Helps attendees judge how close each hotel is." autocomplete="off"
                @update:model-value="setEvent({ venue: $event })"
              />
            </div>
            <div class="iw__row">
              <div data-field="city" class="iw__col-2">
                <q-input
                  :id="`${uidBase}-city`" outlined :model-value="ev.city" label="City" autocomplete="address-level2"
                  :error="!!showErr('city')" :error-message="showErr('city')" :aria-invalid="!!showErr('city')"
                  @update:model-value="setEvent({ city: $event })" @blur="blur('city')"
                />
              </div>
              <div data-field="region" class="iw__col-1">
                <q-input outlined :model-value="ev.region" label="State / region" autocomplete="address-level1" maxlength="40" @update:model-value="setEvent({ region: $event })" />
              </div>
            </div>

            <div class="iw__dates">
              <div class="iw__row iw__row--dates">
                <div data-field="startDate" class="iw__col-1">
                  <q-input
                    :id="`${uidBase}-startDate`" outlined type="date" stack-label :model-value="ev.startDate" label="Start date"
                    :error="!!showErr('startDate')" :error-message="showErr('startDate')" :aria-invalid="!!showErr('startDate')"
                    @update:model-value="setEvent({ startDate: $event })" @blur="blur('startDate')"
                  />
                </div>
                <div data-field="endDate" class="iw__col-1">
                  <q-input
                    :id="`${uidBase}-endDate`" outlined type="date" stack-label :model-value="ev.endDate" label="End date" :min="ev.startDate || undefined"
                    :error="!!showErr('endDate')" :error-message="showErr('endDate')" :aria-invalid="!!showErr('endDate')"
                    @update:model-value="setEvent({ endDate: $event })" @blur="blur('endDate')"
                  />
                </div>
                <q-btn flat no-caps class="bs-btn iw__cal" icon="calendar_month" label="Pick on calendar" aria-label="Pick the event dates on a calendar">
                  <q-popup-proxy cover :breakpoint="600" transition-show="scale" transition-hide="scale">
                    <q-date :model-value="range" range mask="YYYY-MM-DD" minimal today-btn @update:model-value="onRange">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Done" color="primary" flat no-caps />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-btn>
              </div>
              <p v-if="ev.startDate && ev.endDate && !showErr('endDate')" class="iw__date-sum">
                <q-icon name="event_available" size="18px" /> {{ formatDateRange(ev.startDate, ev.endDate) }}
              </p>
            </div>

            <div data-field="attendance">
              <q-select
                outlined :model-value="ev.attendance || null" :options="ATTENDANCE" label="Expected attendance (optional)"
                hint="Rough is fine — it helps us suggest how many hotels to feature." clearable
                @update:model-value="setEvent({ attendance: $event || '' })"
              />
            </div>
          </div>

          <!-- STEP 3 · Brand (optional) -->
          <div v-else-if="current.id === 'brand'" key="brand" class="iw__fields">
            <div data-field="websiteUrl">
              <q-input
                :id="`${uidBase}-websiteUrl`" outlined type="url" inputmode="url" :model-value="ev.websiteUrl" label="Event website (optional)"
                placeholder="yourevent.com" autocomplete="url"
                :error="!!showErr('websiteUrl')" :error-message="showErr('websiteUrl')" :aria-invalid="!!showErr('websiteUrl')"
                @update:model-value="setEvent({ websiteUrl: $event })" @blur="normalizeWebsite"
              >
                <template #prepend><q-icon name="language" /></template>
              </q-input>
              <p class="iw__note">
                <q-icon name="lock" size="16px" />
                <span>With your approval on the next screen, we’ll read your <strong>public</strong> homepage to suggest your logo, colors and fonts. We never sign in or read private pages.</span>
              </p>
            </div>

            <div class="iw__group">
              <h3 class="bs-subtitle">Logo</h3>
              <p class="iw__help">SVG or a transparent PNG looks sharpest.</p>
              <asset-dropzone kind="logo" label="Upload your logo" :assets="logoAssets" @add="project.setLogo($event)" @remove="project.setLogo(null)" />
            </div>

            <div class="iw__group">
              <h3 class="bs-subtitle">Brand colors</h3>
              <p class="iw__help">Your primary color is used for buttons and the banner; secondary for accents.</p>
              <div class="iw__colors">
                <color-role-field label="Primary" :model-value="bk.colors.primary" @update:model-value="project.setColor('primary', $event)" />
                <color-role-field label="Secondary" :model-value="bk.colors.secondary" @update:model-value="project.setColor('secondary', $event)" />
              </div>
            </div>

            <div class="iw__group">
              <h3 class="bs-subtitle">Event photos</h3>
              <p class="iw__help">Venue, crowd or action shots. Only upload photos you have the rights to use.</p>
              <asset-dropzone kind="photo" multiple :max-files="8" label="Add photos" :assets="photoAssets" @add="addPhoto" @remove="project.removeImage($event)" />
            </div>
          </div>

          <!-- STEP 4 · Contact -->
          <div v-else key="contact" class="iw__fields">
            <div class="iw__row">
              <div data-field="firstName" class="iw__col-1">
                <q-input
                  :id="`${uidBase}-firstName`" outlined :model-value="org.firstName" label="First name" autocomplete="given-name"
                  :error="!!showErr('firstName')" :error-message="showErr('firstName')" :aria-invalid="!!showErr('firstName')"
                  @update:model-value="setOrg({ firstName: $event })" @blur="blur('firstName')"
                />
              </div>
              <div data-field="lastName" class="iw__col-1">
                <q-input
                  :id="`${uidBase}-lastName`" outlined :model-value="org.lastName" label="Last name" autocomplete="family-name"
                  :error="!!showErr('lastName')" :error-message="showErr('lastName')" :aria-invalid="!!showErr('lastName')"
                  @update:model-value="setOrg({ lastName: $event })" @blur="blur('lastName')"
                />
              </div>
            </div>
            <div data-field="email">
              <q-input
                :id="`${uidBase}-email`" outlined type="email" inputmode="email" :model-value="org.email" label="Work email" autocomplete="email"
                hint="We’ll send your preview link here."
                :error="!!showErr('email')" :error-message="showErr('email')" :aria-invalid="!!showErr('email')"
                @update:model-value="setOrg({ email: $event })" @blur="blur('email')"
              />
            </div>
            <div class="iw__row">
              <div data-field="phone" class="iw__col-1">
                <q-input
                  :id="`${uidBase}-phone`" outlined type="tel" inputmode="tel" :model-value="org.phone" label="Phone (optional)" autocomplete="tel"
                  :error="!!showErr('phone')" :error-message="showErr('phone')" :aria-invalid="!!showErr('phone')"
                  @update:model-value="setOrg({ phone: $event })" @blur="blur('phone')"
                />
              </div>
              <div data-field="organization" class="iw__col-1">
                <q-input outlined :model-value="org.organization" label="Organization (optional)" autocomplete="organization" @update:model-value="setOrg({ organization: $event })" />
              </div>
            </div>
            <q-input outlined :model-value="org.role" label="Your role (optional)" placeholder="e.g. Tournament Director" autocomplete="organization-title" @update:model-value="setOrg({ role: $event })" />
            <q-checkbox
              :model-value="org.marketingConsent"
              class="iw__consent"
              label="Send me occasional tips on filling hotel blocks and sponsorships. Unsubscribe anytime."
              @update:model-value="setOrg({ marketingConsent: $event })"
            />
            <p class="iw__note"><q-icon name="shield" size="16px" /><span>We only use your details to send your preview and follow up about your event. We never share them.</span></p>
          </div>
        </Transition>

        <!-- Actions -->
        <div class="iw__actions">
          <q-btn type="button" no-caps unelevated class="bs-btn bs-btn--ghost" :icon="step === 0 ? undefined : 'arrow_back'" :label="step === 0 ? 'Cancel' : 'Back'" @click="back" />
          <div class="iw__actions-right">
            <q-btn v-if="current.optional" type="button" flat no-caps class="bs-btn iw__skip" label="Skip for now" @click="skipBrand" />
            <q-btn
              type="submit"
              no-caps
              unelevated
              class="bs-btn bs-btn--lg bs-btn--primary"
              :label="step === STEPS.length - 1 ? 'Create my booking page' : 'Continue'"
              :icon-right="step === STEPS.length - 1 ? 'auto_awesome' : 'arrow_forward'"
            />
          </div>
        </div>
      </form>

      <!-- Live preview -->
      <aside class="iw__preview" :class="{ 'is-open': previewOpen }" aria-label="Live preview">
        <button type="button" class="iw__preview-toggle bs-focusable" :aria-expanded="previewOpen" @click="previewOpen = !previewOpen">
          <q-icon name="visibility" size="18px" /> {{ previewOpen ? 'Hide preview' : 'Preview your page' }}
          <q-icon :name="previewOpen ? 'expand_less' : 'expand_more'" size="20px" class="iw__preview-chev" />
        </button>
        <div class="iw__preview-body">
          <p class="bs-eyebrow iw__preview-eyebrow">Live preview</p>
          <div class="iw__frame">
            <div class="iw__frame-bar" aria-hidden="true"><span /><span /><span /><em>book.eventpipe.com/{{ project.project.publishing.slug || 'your-event' }}</em></div>
            <brand-hero v-bind="hero" size="card" :heading-level="3" />
            <div class="iw__frame-search" aria-hidden="true">
              <span><q-icon name="place" size="16px" /> {{ hero.location || 'Location' }}</span>
              <span><q-icon name="event" size="16px" /> {{ hero.dates || 'Dates' }}</span>
              <span class="iw__frame-btn" :style="{ background: bk.colors.primary }">Search</span>
            </div>
          </div>
          <ul class="iw__facts">
            <li><q-icon name="badge" size="18px" /><span><strong>Name</strong>{{ ev.name || '—' }}</span></li>
            <li><q-icon name="event" size="18px" /><span><strong>Dates</strong>{{ hero.dates || '—' }}</span></li>
            <li><q-icon name="place" size="18px" /><span><strong>Location</strong>{{ [ev.venue, hero.location].filter(Boolean).join(', ') || '—' }}</span></li>
            <li>
              <q-icon name="palette" size="18px" />
              <span><strong>Brand</strong>
                <span class="iw__sw">
                  <i v-for="r in ['primary', 'secondary', 'accent']" :key="r" :style="{ background: bk.colors[r] }" :title="`${r} ${bk.colors[r]}`" />
                  <em>{{ bk.logo ? 'Logo added' : 'No logo yet' }}</em>
                </span>
              </span>
            </li>
          </ul>
          <p class="iw__saved"><q-icon :name="project.lastSavedAt ? 'cloud_done' : 'person_off'" size="16px" /> {{ savedLabel }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.iw { background: var(--bs-canvas); min-height: 100%; padding: 28px clamp(16px, 4vw, 48px) 56px; font-family: var(--bs-font); color: var(--bs-ink); }
.iw__head { max-width: 1180px; margin: 0 auto 24px; }
.iw__head-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.iw__exit { display: inline-flex; align-items: center; gap: 4px; min-height: 36px; padding: 0 10px; border: 0; background: transparent; color: var(--bs-ink-soft); font: 700 0.875rem var(--bs-font); border-radius: var(--bs-radius-sm); cursor: pointer; }
.iw__exit:hover { background: var(--bs-surface); color: var(--bs-ink); }

/* Stepper */
.iw__steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.iw__step { position: relative; }
.iw__step::before { content: ''; display: block; height: 4px; border-radius: 4px; background: var(--bs-line); margin-bottom: 10px; transition: background var(--ds-duration-base) var(--ds-ease-standard); }
.iw__step.is-done::before, .iw__step.is-current::before { background: var(--bs-brand); }
.iw__step-btn { display: inline-flex; align-items: center; gap: 8px; min-height: 28px; padding: 0; border: 0; background: none; font: 700 0.8125rem/1.2 var(--bs-font); color: var(--bs-ink-soft); border-radius: var(--bs-radius-sm); }
button.iw__step-btn { cursor: pointer; }
button.iw__step-btn:hover .iw__step-label { text-decoration: underline; }
.iw__step.is-current .iw__step-btn { color: var(--bs-ink); }
.iw__step-dot { width: 22px; height: 22px; flex: none; border-radius: 50%; display: grid; place-items: center; font-size: 0.75rem; background: var(--bs-surface); border: 1px solid var(--bs-line-strong); color: var(--bs-ink-soft); }
.iw__step.is-current .iw__step-dot { background: var(--bs-brand); border-color: var(--bs-brand); color: #fff; }
.iw__step.is-done .iw__step-dot { background: var(--ds-palette-navy-50); border-color: var(--bs-brand); color: var(--bs-brand); }
.iw__opt { font-weight: 400; }

/* Layout */
.iw__grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 32px; align-items: start; }
.iw__form { padding: clamp(20px, 3.5vw, 40px); display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.iw__count { margin: 0 0 6px; font: 700 0.8125rem var(--bs-font); color: var(--bs-ink-soft); }
.iw__title { font-size: clamp(1.625rem, 2.6vw, 2.25rem); outline: none; }
.iw__blurb { margin-top: 8px; max-width: 58ch; font-size: 1rem; }
.iw__fields { display: flex; flex-direction: column; gap: 18px; }
.iw__row { display: flex; gap: 14px; flex-wrap: wrap; }
.iw__row > * { min-width: 0; }
.iw__col-1 { flex: 1 1 180px; }
.iw__col-2 { flex: 2 1 240px; }
.iw__row--dates { align-items: flex-start; }
.iw__cal { min-height: 56px; color: var(--bs-brand); }
.iw__date-sum { margin: -4px 0 0; display: flex; align-items: center; gap: 6px; font: 700 0.875rem var(--bs-font); color: var(--ds-color-text-success); }
.iw__group { display: flex; flex-direction: column; gap: 6px; padding-top: 18px; border-top: 1px solid var(--bs-line); }
.iw__group .bs-subtitle { margin: 0; }
.iw__help { margin: 0 0 6px; font-size: 0.875rem; color: var(--bs-ink-soft); line-height: 1.45; }
.iw__colors { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.iw__note { margin: 8px 0 0; display: flex; gap: 8px; align-items: flex-start; font-size: 0.8125rem; line-height: 1.45; color: var(--bs-ink-soft); }
.iw__note .q-icon { margin-top: 1px; flex: none; color: var(--bs-ink-soft); }
.iw__consent { margin-left: -8px; }
.iw__consent :deep(.q-checkbox__label) { font-size: 0.875rem; color: var(--bs-ink-soft); line-height: 1.4; }

/* Category cards */
.iw__fieldset { border: 0; margin: 0; padding: 0; min-width: 0; }
.iw__legend { padding: 0; font: 700 1.0625rem/1.3 var(--bs-font); color: var(--bs-ink); }
.iw__cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.iw__cat {
  position: relative; display: flex; gap: 12px; align-items: flex-start; padding: 14px 14px 14px 12px; min-height: 76px;
  background: var(--bs-surface); border: 1.5px solid var(--bs-line); border-radius: var(--bs-radius-md); cursor: pointer;
  transition: border-color var(--ds-duration-fast) var(--ds-ease-standard), box-shadow var(--ds-duration-fast) var(--ds-ease-standard), transform var(--ds-duration-fast);
}
.iw__cat:hover { border-color: var(--bs-line-strong); box-shadow: var(--bs-shadow-1); }
.iw__cat.is-on { border-color: var(--bs-brand); background: var(--ds-palette-navy-50); }
.iw__cat:has(.iw__cat-input:focus-visible) { box-shadow: var(--bs-ring); }
.iw__cat-input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.iw__cat-icon { flex: none; width: 40px; height: 40px; border-radius: var(--bs-radius-sm); display: grid; place-items: center; background: var(--bs-surface-2); color: var(--bs-brand); }
.iw__cat.is-on .iw__cat-icon { background: var(--bs-brand); color: #fff; }
.iw__cat-text { display: flex; flex-direction: column; gap: 2px; padding-right: 18px; }
.iw__cat-label { font: 700 0.9375rem/1.25 var(--bs-font); color: var(--bs-ink); }
.iw__cat-hint { font-size: 0.8125rem; line-height: 1.35; color: var(--bs-ink-soft); }
.iw__cat-check { position: absolute; top: 10px; right: 10px; color: var(--bs-brand); }
.iw__err { margin: 8px 0 0; font-size: 0.8125rem; color: var(--ds-color-text-danger); }

/* Error summary */
.iw__summary { border: 1px solid var(--ds-palette-red-200, #FECACA); background: var(--ds-color-background-danger); border-radius: var(--bs-radius-md); padding: 12px 16px; }
.iw__summary-title { margin: 0 0 6px; display: flex; align-items: center; gap: 6px; font: 700 0.9375rem var(--bs-font); color: var(--ds-color-text-danger); }
.iw__summary ul { margin: 0; padding-left: 26px; }
.iw__summary a { color: var(--ds-color-text-danger); font-size: 0.875rem; line-height: 1.6; }

/* Actions */
.iw__actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 20px; border-top: 1px solid var(--bs-line); flex-wrap: wrap; }
.iw__actions-right { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
.iw__skip { color: var(--bs-ink-soft); }

/* Preview */
.iw__preview { position: sticky; top: 24px; }
.iw__preview-toggle { display: none; }
.iw__preview-eyebrow { margin-bottom: 10px; }
.iw__frame { border-radius: var(--bs-radius-lg); overflow: hidden; background: #fff; box-shadow: var(--bs-shadow-3); border: 1px solid var(--bs-line); }
.iw__frame-bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; background: var(--bs-surface-2); border-bottom: 1px solid var(--bs-line); }
.iw__frame-bar span { width: 9px; height: 9px; border-radius: 50%; background: var(--bs-line-strong); }
.iw__frame-bar em { margin-left: 8px; font: 400 0.75rem var(--bs-font); font-style: normal; color: var(--bs-ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.iw__frame-search { display: flex; gap: 8px; align-items: center; padding: 10px 12px; font-size: 0.75rem; color: var(--bs-ink-soft); }
.iw__frame-search > span { display: inline-flex; align-items: center; gap: 4px; padding: 6px 8px; border: 1px solid var(--bs-line); border-radius: 4px; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.iw__frame-search > .iw__frame-btn { flex: none; border: 0; color: #fff; font-weight: 700; }
.iw__facts { list-style: none; margin: 18px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.iw__facts li { display: flex; gap: 10px; align-items: flex-start; font-size: 0.875rem; color: var(--bs-ink); }
.iw__facts li > .q-icon { color: var(--bs-ink-soft); margin-top: 1px; }
.iw__facts strong { display: block; font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--bs-ink-soft); margin-bottom: 2px; }
.iw__sw { display: inline-flex; align-items: center; gap: 6px; }
.iw__sw i { width: 18px; height: 18px; border-radius: 50%; border: 1px solid rgb(3 10 38 / 0.12); display: inline-block; }
.iw__sw em { font-style: normal; color: var(--bs-ink-soft); margin-left: 4px; }
.iw__saved { margin: 18px 0 0; display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--bs-ink-soft); }

/* Step transition */
.iw-step-enter-active, .iw-step-leave-active { transition: opacity var(--ds-duration-base) var(--ds-ease-standard), transform var(--ds-duration-base) var(--ds-ease-standard); }
.iw-step-enter-from { opacity: 0; transform: translateX(16px); }
.iw-step-leave-to { opacity: 0; transform: translateX(-16px); }
@media (prefers-reduced-motion: reduce) {
  .iw-step-enter-active, .iw-step-leave-active { transition: none; }
}

@media (max-width: 1023px) {
  .iw__grid { grid-template-columns: minmax(0, 1fr); }
  .iw__preview { position: static; }
  .iw__preview-toggle {
    display: flex; align-items: center; gap: 8px; width: 100%; min-height: 48px; padding: 0 16px;
    border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); background: var(--bs-surface);
    font: 700 0.9375rem var(--bs-font); color: var(--bs-ink); cursor: pointer;
  }
  .iw__preview-chev { margin-left: auto; }
  .iw__preview-body { display: none; margin-top: 16px; }
  .iw__preview.is-open .iw__preview-body { display: block; }
}
@media (max-width: 600px) {
  .iw { padding: 16px 12px 40px; }
  .iw__steps { gap: 6px; }
  .iw__step-label { display: none; }
  .iw__step.is-current .iw__step-label { display: inline; }
  .iw__form { padding: 20px 16px; border-radius: var(--bs-radius-md); }
  .iw__cats { grid-template-columns: 1fr; }
  .iw__actions { flex-direction: column-reverse; align-items: stretch; }
  .iw__actions-right { flex-direction: column-reverse; align-items: stretch; margin-left: 0; }
  .iw__actions .q-btn { width: 100%; }
}
</style>
