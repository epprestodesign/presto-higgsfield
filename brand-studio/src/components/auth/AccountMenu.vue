<script setup>
// AccountMenu — the avatar in the top bar: initials, then a menu with who's
// signed in and Log out. Clerk: <UserButton /> can replace this later.
import { computed } from 'vue'

const props = defineProps({ user: { type: Object, default: null } })
const emit = defineEmits(['sign-out'])
const initials = computed(() => {
  const n = props.user?.name || props.user?.email || 'Guest'
  return n.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
})
</script>

<template>
  <button type="button" class="am" :aria-label="user ? `Account: ${user.name}` : 'Account'">
    {{ initials }}
    <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
      <div class="am__menu">
        <p class="am__who"><strong>{{ user?.name || 'Guest' }}</strong><span>{{ user?.email || 'Not logged in' }}</span></p>
        <q-list dense>
          <q-item v-close-popup clickable @click.prevent>
            <q-item-section avatar><q-icon name="manage_accounts" size="20px" /></q-item-section>
            <q-item-section>Account settings</q-item-section>
          </q-item>
          <q-item v-if="user" v-close-popup clickable @click="emit('sign-out')">
            <q-item-section avatar><q-icon name="logout" size="20px" /></q-item-section>
            <q-item-section>Log out</q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-menu>
  </button>
</template>

<style scoped>
.am { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 50%; background: var(--bs-ink); color: #fff; font: 700 0.75rem var(--bs-font); cursor: pointer; }
.am:focus-visible { outline: 2px solid var(--bs-accent); outline-offset: 2px; }
.am__menu { width: 260px; padding: 6px; font-family: var(--bs-font); }
.am__who { margin: 6px 10px 10px; display: grid; gap: 2px; font-size: 0.875rem; color: var(--bs-ink); }
.am__who span { color: var(--bs-ink-soft); font-size: 0.8125rem; overflow: hidden; text-overflow: ellipsis; }
</style>
