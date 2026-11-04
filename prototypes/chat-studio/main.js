import { createApp } from 'vue'
import ChatStudio from './src/ChatStudio.vue'

// ?open=heartland opens a sample project; ?prompt=… starts one; ?speed=0.4 runs faster.
const q = new URLSearchParams(location.search)
createApp(ChatStudio, {
  openBrand: q.get('open') || '',
  autoPrompt: q.get('prompt') || '',
  theme: q.get('theme') || 'light',
  speed: q.has('speed') ? Number(q.get('speed')) : 1,
}).mount('#app')
