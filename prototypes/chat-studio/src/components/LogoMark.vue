<script setup>
// The project logo in one of its four looks (see LOGO_LOOKS).
defineProps({
  project: { type: Object, required: true },
  look: { type: String, default: null },
  size: { type: Number, default: 64 },
})
</script>

<template>
  <span class="lm" :class="`lm--${look || project.look}`" :style="{ '--s': `${size}px` }">
    <img :src="(look || project.look) === 'dark' && project.brand.logoOnDark ? project.brand.logoOnDark : project.brand.logo" :alt="`${project.brand.name} logo`" />
  </span>
</template>

<style scoped>
.lm { display: inline-grid; place-items: center; width: var(--s); height: var(--s); flex: none; }
.lm img { max-width: 100%; max-height: 100%; object-fit: contain; }
.lm--badge { padding: calc(var(--s) * 0.12); border-radius: calc(var(--s) * 0.22); background: #fff; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18); }
.lm--white img { filter: brightness(0) invert(1); }
.lm--dark { padding: calc(var(--s) * 0.12); border-radius: 50%; background: #111; }
.lm--dark img { filter: brightness(1.15) contrast(1.05); }
</style>
