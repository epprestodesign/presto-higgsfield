<script setup>
// ConceptCard — one generated creative concept in the gallery. The thumbnail
// is the real BrandHero (card size) with the project's live copy, so what you
// pick is what ships. Selection uses radio semantics (one winner per project);
// favorite / compare are independent toggle buttons.
import { ref, computed } from 'vue'
import BrandHero from '../brand/BrandHero.vue'
import { getDirection } from '../../models/brandKit.js'

const props = defineProps({
  concept: { type: Object, required: true },
  brandKit: { type: Object, required: true },
  copy: { type: Object, default: () => ({}) },
  selected: { type: Boolean, default: false },
  favorite: { type: Boolean, default: false },
  compared: { type: Boolean, default: false },
  compareDisabled: { type: Boolean, default: false },
  busy: { type: Boolean, default: false }, // this card is being regenerated
  locked: { type: Boolean, default: false }, // another job is running
  parentTitle: { type: String, default: '' }, // set for variations
})
const emit = defineEmits(['select', 'favorite', 'compare', 'regenerate', 'variations', 'preview'])

const direction = computed(() => getDirection(props.concept.direction))
const showPrompt = ref(false)
const titleId = computed(() => `cc-title-${props.concept.id}`)
</script>

<template>
  <article
    class="cc bs-animate"
    :class="{ 'cc--selected': selected, 'cc--busy': busy, 'cc--variation': !!parentTitle }"
    :aria-labelledby="titleId"
    :aria-busy="busy"
  >
    <!-- Thumbnail -->
    <div class="cc__media">
      <brand-hero
        :concept="concept"
        :brand-kit="brandKit"
        :headline="copy.headline"
        :tagline="copy.tagline"
        :dates="copy.dates"
        :location="copy.location"
        :show-logo="copy.showLogo !== false"
        size="card"
        :heading-level="3"
        aria-hidden="true"
      />
      <div class="cc__badges">
        <span class="cc__badge" :class="`cc__badge--${concept.direction}`">
          <q-icon :name="direction.icon" size="14px" aria-hidden="true" /> {{ direction.name }}
        </span>
        <span v-if="parentTitle" class="cc__badge cc__badge--var">v{{ concept.version }}</span>
      </div>
      <span v-if="selected" class="cc__chosen"><q-icon name="check" size="16px" aria-hidden="true" /> Selected</span>
      <button type="button" class="cc__zoom bs-focusable" :aria-label="`Preview ${concept.title} on desktop and mobile`" @click="emit('preview', concept)">
        <q-icon name="open_in_full" size="18px" aria-hidden="true" />
      </button>
      <div v-if="busy" class="cc__overlay" role="status">
        <q-spinner-dots size="34px" color="white" />
        <span>Regenerating…</span>
      </div>
    </div>

    <!-- Body -->
    <div class="cc__body">
      <div class="cc__head">
        <div class="cc__titles">
          <h3 :id="titleId" class="cc__title">{{ concept.title }}</h3>
          <p v-if="parentTitle" class="cc__parent">Variation of {{ parentTitle }}</p>
        </div>
        <div class="cc__toggles">
          <button
            type="button"
            class="cc__icon bs-focusable"
            :class="{ 'cc__icon--on cc__icon--fav': favorite }"
            :aria-pressed="favorite"
            :aria-label="favorite ? `Remove ${concept.title} from favorites` : `Add ${concept.title} to favorites`"
            @click="emit('favorite', concept)"
          >
            <q-icon :name="favorite ? 'favorite' : 'favorite_border'" size="20px" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="cc__icon bs-focusable"
            :class="{ 'cc__icon--on': compared }"
            :aria-pressed="compared"
            :disabled="!compared && compareDisabled"
            :aria-label="compared ? `Remove ${concept.title} from compare` : `Add ${concept.title} to compare`"
            :title="!compared && compareDisabled ? 'Compare up to 3 concepts' : 'Compare'"
            @click="emit('compare', concept)"
          >
            <q-icon name="compare" size="20px" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p class="cc__why">{{ concept.rationale }}</p>

      <div class="cc__actions">
        <q-btn
          unelevated
          no-caps
          class="bs-btn cc__select"
          :class="selected ? 'bs-btn--primary' : 'bs-btn--ghost'"
          role="radio"
          :aria-checked="selected"
          :icon="selected ? 'check_circle' : 'radio_button_unchecked'"
          :label="selected ? 'Selected' : 'Use this concept'"
          @click="emit('select', concept)"
        />
        <q-btn flat round dense class="cc__more" icon="auto_awesome" :disable="locked" :aria-label="`AI actions for ${concept.title}`">
          <q-menu anchor="bottom right" self="top right" class="cc__menu">
            <q-list style="min-width: 240px">
              <q-item v-close-popup clickable @click="emit('regenerate', concept)">
                <q-item-section avatar><q-icon name="refresh" color="deep-purple-7" /></q-item-section>
                <q-item-section>
                  <q-item-label>Regenerate</q-item-label>
                  <q-item-label caption>Replace with a fresh take</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="emit('variations', concept)">
                <q-item-section avatar><q-icon name="auto_awesome_motion" color="deep-purple-7" /></q-item-section>
                <q-item-section>
                  <q-item-label>Generate 3 variations</q-item-label>
                  <q-item-label caption>Same idea, new color and photo mixes</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <button type="button" class="cc__prompt-toggle bs-focusable" :aria-expanded="showPrompt" @click="showPrompt = !showPrompt">
        <q-icon :name="showPrompt ? 'expand_less' : 'expand_more'" size="18px" aria-hidden="true" />
        {{ showPrompt ? 'Hide prompt' : 'View prompt' }}
      </button>
      <div v-if="showPrompt" class="cc__prompt">
        <p class="cc__prompt-text">{{ concept.prompt }}</p>
        <p class="cc__prompt-note">
          <q-icon name="info" size="14px" aria-hidden="true" />
          AI makes the artwork only. Your logo, headline, dates and buttons stay editable text.
        </p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.cc {
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--bs-surface); border: 1px solid var(--bs-line); border-radius: var(--bs-radius-lg);
  box-shadow: var(--bs-shadow-1);
  transition: box-shadow var(--ds-duration-base) var(--ds-ease-standard), border-color var(--ds-duration-base), transform var(--ds-duration-base) var(--ds-ease-standard);
  animation: cc-in var(--ds-duration-slow) var(--ds-ease-decelerate) both;
}
.cc:hover { box-shadow: var(--bs-shadow-2); transform: translateY(-2px); }
.cc--selected { border-color: var(--bs-brand); box-shadow: 0 0 0 2px var(--bs-brand), var(--bs-shadow-2); }
.cc--variation { background: linear-gradient(var(--bs-surface), var(--bs-surface)) padding-box, linear-gradient(135deg, var(--bs-accent-line), var(--bs-line)) border-box; border-color: transparent; }
@keyframes cc-in { from { opacity: 0; transform: translateY(8px) scale(0.99); } to { opacity: 1; transform: none; } }

.cc__media { position: relative; }
.cc__media :deep(.bh) { border-radius: 0; }
/* Thumbnail density: taller frame, no tagline, tighter padding — the full copy
   is visible in the Preview dialog. */
.cc__media :deep(.bh--card) { aspect-ratio: 16 / 9; }
.cc__media :deep(.bh--card .bh__tagline),
.cc__media :deep(.bh--card .bh__content) { padding-block: 52px 16px; gap: 6px; }
.cc__media :deep(.bh--card .bh__logo) { height: 40px; }
.cc__badges { position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; }
.cc__badge {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 999px;
  font: 700 0.6875rem/1.2 var(--bs-font); letter-spacing: 0.02em;
  background: rgb(255 255 255 / 0.94); color: var(--bs-ink); box-shadow: var(--bs-shadow-1);
}
.cc__badge--var { background: var(--bs-accent); color: #fff; }
.cc__chosen {
  position: absolute; top: 10px; right: 52px; display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 999px; background: var(--bs-brand); color: #fff; font: 700 0.75rem/1.2 var(--bs-font);
}
.cc__zoom {
  position: absolute; top: 8px; right: 8px; width: 36px; height: 36px; border-radius: 999px; border: 0;
  background: rgb(255 255 255 / 0.94); color: var(--bs-ink); display: grid; place-items: center; cursor: pointer;
  box-shadow: var(--bs-shadow-1); opacity: 0.9; transition: opacity var(--ds-duration-fast);
}
.cc__zoom:hover { opacity: 1; }
.cc__overlay {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  background: rgb(46 16 101 / 0.72); color: #fff; font: 700 0.875rem var(--bs-font); backdrop-filter: blur(2px);
}

.cc__body { padding: 14px 16px 12px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.cc__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.cc__title { margin: 0; font: 700 1.0625rem/1.25 var(--bs-font); color: var(--bs-ink); }
.cc__parent { margin: 2px 0 0; font-size: 0.75rem; color: var(--bs-accent); font-weight: 700; }
.cc__toggles { display: flex; gap: 2px; margin: -4px -6px 0 0; }
.cc__icon {
  width: 36px; height: 36px; border-radius: 999px; border: 0; background: transparent; color: var(--bs-ink-soft);
  display: grid; place-items: center; cursor: pointer; transition: background var(--ds-duration-fast), color var(--ds-duration-fast);
}
.cc__icon:hover:not(:disabled) { background: var(--bs-surface-2); color: var(--bs-ink); }
.cc__icon:disabled { opacity: 0.4; cursor: not-allowed; }
.cc__icon--on { color: var(--bs-brand); background: var(--ds-palette-navy-50); }
.cc__icon--fav { color: #BE123C; background: #FFF1F2; }
.cc__why { margin: 0; font-size: 0.875rem; line-height: 1.45; color: var(--bs-ink-soft); }

.cc__actions { display: flex; align-items: center; gap: 8px; margin-top: auto; padding-top: 4px; }
.cc__select { flex: 1; }
.cc__more { color: var(--bs-accent); background: var(--bs-accent-soft); width: 44px; height: 44px; }

.cc__prompt-toggle {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 2px; padding: 4px 2px; border: 0; background: none;
  color: var(--bs-ink-soft); font: 700 0.8125rem var(--bs-font); cursor: pointer; border-radius: 4px;
}
.cc__prompt-toggle:hover { color: var(--bs-ink); }
.cc__prompt { background: var(--bs-surface-2); border: 1px solid var(--bs-line); border-radius: var(--bs-radius-md); padding: 10px 12px; }
.cc__prompt-text { margin: 0 0 8px; font: 400 0.8125rem/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--bs-ink); }
.cc__prompt-note { margin: 0; display: flex; gap: 6px; align-items: flex-start; font-size: 0.75rem; color: var(--bs-ink-soft); }
.cc__prompt-note .q-icon { margin-top: 1px; color: var(--bs-accent); }

@media (prefers-reduced-motion: reduce) {
  .cc, .cc:hover { animation: none; transform: none; }
}
</style>
