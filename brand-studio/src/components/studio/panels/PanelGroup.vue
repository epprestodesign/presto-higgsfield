<script setup>
// PanelGroup — a titled block inside a sidebar panel (Webflow-style section).
defineProps({
  title: { type: String, required: true },
  hint: { type: String, default: '' },
})
</script>

<template>
  <section class="pg">
    <header class="pg__head">
      <h3 class="pg__title">{{ title }}</h3>
      <div class="pg__actions"><slot name="actions" /></div>
    </header>
    <p v-if="hint" class="pg__hint">{{ hint }}</p>
    <div class="pg__body"><slot /></div>
  </section>
</template>

<style scoped>
.pg { padding: 16px 16px 18px; border-bottom: 1px solid var(--bs-line); }
.pg:last-child { border-bottom: 0; }
.pg__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 24px; }
.pg__title { margin: 0; font: 700 0.75rem/1.2 var(--bs-font); letter-spacing: 0.08em; text-transform: uppercase; color: var(--bs-ink-soft); }
.pg__actions { display: flex; align-items: center; gap: 4px; }
.pg__hint { margin: 4px 0 0; font: 400 0.8125rem/1.4 var(--bs-font); color: var(--bs-ink-soft); }
.pg__body { margin-top: 12px; display: flex; flex-direction: column; gap: 12px; }
</style>
