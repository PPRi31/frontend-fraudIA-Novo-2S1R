<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Sidebar, { type ViewKey } from './components/Sidebar.vue'
import DashboardView from './components/views/DashboardView.vue'
import UploadView from './components/views/UploadView.vue'
import ChatView from './components/views/ChatView.vue'
import SiniestroDetailView from './components/views/SiniestroDetailView.vue'
import IconMenu from './components/icons/IconMenu.vue'

type Route =
  | { name: 'home' }
  | { name: 'detail'; id: number }

function parseRoute(pathname: string): Route {
  const match = pathname.match(/^\/(\d+)\/?$/)
  if (match) return { name: 'detail', id: Number(match[1]) }
  return { name: 'home' }
}

const route = ref<Route>(parseRoute(window.location.pathname))

function onPopState() {
  route.value = parseRoute(window.location.pathname)
}

onMounted(() => window.addEventListener('popstate', onPopState))
onUnmounted(() => window.removeEventListener('popstate', onPopState))

const current = ref<ViewKey>('dashboard')
const sidebarOpen = ref(false)

const titles: Record<ViewKey, string> = {
  dashboard: 'Dashboard',
  upload: 'Subir archivos',
  chat: 'Preguntas al chat',
}

const currentTitle = computed(() => titles[current.value])
</script>

<template>
  <SiniestroDetailView
    v-if="route.name === 'detail'"
    :id="route.id"
    class="min-h-screen overflow-y-auto bg-[var(--color-bg)] p-4 sm:p-6 lg:p-8"
  />

  <div
    v-else
    class="flex h-screen w-full bg-[var(--color-bg)] text-[var(--color-text)]"
  >
    <Sidebar
      :current="current"
      :open="sidebarOpen"
      @change="(v) => (current = v)"
      @close="sidebarOpen = false"
    />

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 backdrop-blur-md lg:hidden"
      >
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
          aria-label="Abrir menú"
          @click="sidebarOpen = true"
        >
          <IconMenu class="h-4 w-4" />
        </button>
        <p class="text-sm font-medium text-[var(--color-text)]">
          {{ currentTitle }}
        </p>
      </header>

      <main class="min-h-0 flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
        <transition name="view" mode="out-in">
          <DashboardView v-if="current === 'dashboard'" key="dashboard" />
          <UploadView v-else-if="current === 'upload'" key="upload" />
          <ChatView v-else key="chat" />
        </transition>
      </main>
    </div>
  </div>
</template>

<style>
.view-enter-active,
.view-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.view-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.view-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
