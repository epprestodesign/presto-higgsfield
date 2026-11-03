<script setup>
// Line icons for the prototype (24px grid, stroked).
defineProps({ name: { type: String, required: true }, size: { type: Number, default: 20 } })
const P = {
  plus: 'M12 5v14M5 12h14',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  clip: 'M20 11.5 12.2 19.3a5 5 0 0 1-7.1-7.1l7.8-7.8a3.3 3.3 0 0 1 4.7 4.7l-7.8 7.8a1.7 1.7 0 0 1-2.4-2.4l7.1-7.1',
  up: 'M12 19V5M6 11l6-6 6 6',
  stop: 'M8 8h8v8H8z',
  down: 'M6 9l6 6 6-6',
  right: 'M9 6l6 6-6 6',
  left: 'M15 6l-6 6 6 6',
  phone: 'M7 3h10v18H7zM11 18h2',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  layers: 'M12 3 2 8l10 5 10-5-10-5zM2 13l10 5 10-5M2 17.5l10 5 10-5',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  check: 'M5 12.5 10 17l9-10',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1 1 0 1 0 0-.01',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  monitor: 'M3 5h18v12H3zM8 21h8M12 17v4',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17v.01',
  menu: 'M4 7h16M4 12h16M4 17h16',
  x: 'M6 6l12 12M18 6 6 18',
  pencil: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  layout: 'M3 4h18v16H3zM3 10h18M9 10v10',
  palette: 'M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-1.2-1-1.5-1-2.5s.8-1.5 2-1.5H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5zM7.5 11.5v.01M10 7.5v.01M15 7.5v.01',
  chat: 'M4 5h16v11H9l-5 4z',
  credit: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v10M9 9.5c0-1 1.3-1.7 3-1.7s3 .7 3 1.7-1.3 1.5-3 2-3 1-3 2 1.3 1.8 3 1.8 3-.8 3-1.8',
  feedback: 'M4 5h16v11H9l-5 4zM9 10.5h6',
  sidebar: 'M3 4h18v16H3zM9 4v16',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
}
</script>

<template>
  <svg class="cs-icon" :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path :d="P[name]" /></svg>
</template>
