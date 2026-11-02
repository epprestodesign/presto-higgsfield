<script setup>
// Light grey Studio canvas with a faint dot grid. Draw it inside a moving or
// scaling group and the dots move with it. `id` must be unique per page.
defineProps({ id: { type: String, required: true } })
</script>

<template>
  <g>
    <defs>
      <pattern :id="id" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle class="tour-dot" cx="10" cy="10" r="1.1" />
      </pattern>
    </defs>
    <rect class="tour-bg" x="-640" y="-360" width="1920" height="1080" />
    <rect x="-640" y="-360" width="1920" height="1080" :fill="`url(#${id})`" />
  </g>
</template>
