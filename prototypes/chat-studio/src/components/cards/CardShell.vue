<script setup>
// The soft grey panel every result sits in: a small kicker, a title, an
// optional count on the right, and the body.
defineProps({
  kicker: { type: String, default: '' },
  title: { type: String, required: true },
  aside: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>

<template>
  <section class="card" :aria-label="title">
    <header class="card__head">
      <div>
        <p v-if="kicker" class="card__kicker"><slot name="icon" />{{ kicker }}</p>
        <h3 class="card__title">{{ title }}</h3>
      </div>
      <div class="card__aside"><span v-if="aside">{{ aside }}</span><slot name="aside" /></div>
    </header>
    <slot />
    <footer v-if="$slots.foot" class="card__foot"><slot name="foot" /></footer>
  </section>
</template>

<style scoped>
.card { position: relative; padding: 22px 24px 24px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); box-shadow: var(--shadow); }
.card__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.card__kicker { display: flex; align-items: center; gap: 6px; margin: 0 0 2px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); }
.card__title { margin: 0; font: 700 20px/1.3 var(--sans); }
.card__aside { display: grid; justify-items: end; gap: 2px; font-size: 13px; color: var(--ink-3); white-space: nowrap; }
.card__foot { position: absolute; left: 50%; bottom: 0; transform: translate(-50%, 50%); display: flex; gap: 8px; }
</style>
