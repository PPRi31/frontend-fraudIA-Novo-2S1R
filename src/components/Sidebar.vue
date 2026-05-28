<script setup lang="ts">
import IconDashboard from './icons/IconDashboard.vue'
import IconUpload from './icons/IconUpload.vue'
import IconChat from './icons/IconChat.vue'

export type ViewKey = 'dashboard' | 'upload' | 'chat'

defineProps<{
  current: ViewKey
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'change', view: ViewKey): void
  (e: 'close'): void
}>()

const items: { key: ViewKey; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: IconDashboard },
  { key: 'upload', label: 'Subir archivos', icon: IconUpload },
  { key: 'chat', label: 'Preguntas al chat', icon: IconChat },
]

function select(key: ViewKey) {
  emit('change', key)
  emit('close')
}
</script>

<template>
  <aside
    class="fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md transition-transform duration-300 ease-out"
    :class="open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    aria-label="Navegación principal"
  >
    <div class="flex h-full flex-col">
      <div class="flex items-center gap-2.5 px-5 py-5">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-fuchsia-500 text-white shadow-lg shadow-violet-500/20"
        >
          <span class="text-sm font-semibold">F</span>
        </div>
        <div class="leading-tight">
          <p class="text-sm font-semibold text-[var(--color-text)]">Fraudia</p>
          <p class="text-xs text-[var(--color-text-muted)]">Panel de control</p>
        </div>
      </div>

      <div class="px-3">
        <div
          class="px-2 pb-2 pt-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]"
        >
          Navegación
        </div>
        <nav class="flex flex-col gap-1">
          <button
            v-for="item in items"
            :key="item.key"
            type="button"
            @click="select(item.key)"
            class="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200"
            :class="
              current === item.key
                ? 'bg-[var(--color-surface-3)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
            "
          >
            <span
              v-if="current === item.key"
              class="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            <component
              :is="item.icon"
              class="h-4 w-4 transition-colors"
              :class="
                current === item.key
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-dim)]'
              "
            />
            <span class="font-medium">{{ item.label }}</span>
          </button>
        </nav>
      </div>

      <div class="mt-auto p-3">
        <div
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-3)] text-xs font-semibold text-[var(--color-text)]"
            >
              U
            </div>
            <div class="leading-tight">
              <p class="text-xs font-medium text-[var(--color-text)]">Usuario</p>
              <p class="text-[11px] text-[var(--color-text-muted)]">
                Sesión activa
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <div
    v-if="open"
    class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
    @click="emit('close')"
    aria-hidden="true"
  />
</template>
