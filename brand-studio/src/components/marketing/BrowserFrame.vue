<script setup>
// BrowserFrame — a quiet desktop browser chrome around a page mockup.
defineProps({
  url: { type: String, default: 'demo.eventpipe.com' },
  label: { type: String, default: 'Desktop preview' },
})
</script>

<template>
  <figure class="bf" :aria-label="label">
    <div class="bf__bar" aria-hidden="true">
      <span class="bf__dots"><i /><i /><i /></span>
      <span class="bf__url"><q-icon name="lock" size="12px" /> {{ url }}</span>
      <span class="bf__spacer" />
    </div>
    <div class="bf__body"><slot /></div>
  </figure>
</template>

<style scoped>
.bf {
  margin: 0;
  border-radius: var(--bs-radius-md);
  overflow: hidden;
  background: var(--bs-surface);
  box-shadow: var(--bs-shadow-3);
  border: 1px solid rgb(3 10 38 / 0.08);
}
.bf__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 36px;
  padding: 0 14px;
  background: var(--bs-surface-2);
  border-bottom: 1px solid var(--bs-line);
}
.bf__dots { display: flex; gap: 6px; width: 54px; }
.bf__dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--bs-line-strong); }
.bf__url {
  flex: 1;
  min-width: 0;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 22px;
  border-radius: 6px;
  background: var(--bs-surface);
  border: 1px solid var(--bs-line);
  font: 400 12px/1 var(--bs-font);
  color: var(--bs-ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bf__spacer { width: 54px; }
.bf__body { position: relative; background: var(--ds-color-surface-sunken, #f8fafc); }
</style>
