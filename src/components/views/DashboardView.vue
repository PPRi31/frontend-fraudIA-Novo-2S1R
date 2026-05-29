<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  fetchSiniestros,
  groupBySemaforo,
  type SiniestrosBySemaforo,
} from '../../services/siniestros'
import type { SemaforoFinal, Siniestro } from '../../types/siniestro'
import SiniestroCard from './SiniestroCard.vue'

const columns: {
  key: SemaforoFinal
  label: string
  description: string
  dot: string
  ring: string
  badgeBg: string
  badgeText: string
}[] = [
  {
    key: 'Rojo',
    label: 'Rojo',
    description: 'Riesgo crítico · revisión humana',
    dot: 'bg-[var(--color-red-soft)]',
    ring: 'ring-[var(--color-red-soft)]/30',
    badgeBg: 'bg-[var(--color-red-bg)]',
    badgeText: 'text-[var(--color-red-soft)]',
  },
  {
    key: 'Amarillo',
    label: 'Amarillo',
    description: 'Riesgo moderado · seguimiento',
    dot: 'bg-[var(--color-yellow-soft)]',
    ring: 'ring-[var(--color-yellow-soft)]/30',
    badgeBg: 'bg-[var(--color-yellow-bg)]',
    badgeText: 'text-[var(--color-yellow-soft)]',
  },
  {
    key: 'Verde',
    label: 'Verde',
    description: 'Riesgo bajo · flujo normal',
    dot: 'bg-[var(--color-green-soft)]',
    ring: 'ring-[var(--color-green-soft)]/30',
    badgeBg: 'bg-[var(--color-green-bg)]',
    badgeText: 'text-[var(--color-green-soft)]',
  },
]

const loading = ref(true)
const error = ref<string | null>(null)
const siniestros = ref<Siniestro[]>([])

const groups = computed<SiniestrosBySemaforo>(() =>
  groupBySemaforo(siniestros.value),
)

async function load() {
  loading.value = true
  error.value = null
  try {
    siniestros.value = await fetchSiniestros()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error desconocido'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="flex h-full flex-col gap-5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          Dashboard
        </h1>
        <p class="text-sm text-[var(--color-text-dim)]">
          Siniestros procesados clasificados por
          <code
            class="rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 text-[12px] text-[var(--color-text)]"
          >semaforo_final</code>.
        </p>
      </div>

      <button
        type="button"
        @click="load"
        :disabled="loading"
        class="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-3.5 w-3.5"
          :class="{ 'animate-spin': loading }"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path
            d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
          />
        </svg>
        {{ loading ? 'Cargando…' : 'Actualizar' }}
      </button>
    </header>

    <div
      class="grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label="Resumen general"
    >
      <div
        class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
      >
        <p
          class="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]"
        >
          Total siniestros
        </p>
        <p
          class="mt-1 text-lg font-semibold tabular-nums text-[var(--color-text)]"
        >
          {{ siniestros.length }}
        </p>
      </div>
      <div
        class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
      >
        <p
          class="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]"
        >
          Críticos (Rojo)
        </p>
        <p
          class="mt-1 text-lg font-semibold tabular-nums text-[var(--color-red-soft)]"
        >
          {{ groups.Rojo.length }}
        </p>
      </div>
    </div>

    <div
      v-if="error"
      class="rounded-xl border border-[var(--color-red-soft)]/30 bg-[var(--color-red-bg)] px-4 py-3 text-sm text-[var(--color-red-soft)]"
    >
      No se pudo cargar la información: {{ error }}
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
      <article
        v-for="col in columns"
        :key="col.key"
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]"
      >
        <div
          class="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-4 py-3"
        >
          <div class="flex items-center gap-2.5">
            <span
              class="h-2.5 w-2.5 rounded-full ring-4"
              :class="[col.dot, col.ring]"
              aria-hidden="true"
            />
            <div class="leading-tight">
              <h2 class="text-sm font-medium text-[var(--color-text)]">
                {{ col.label }}
              </h2>
              <p class="text-[10.5px] text-[var(--color-text-muted)]">
                {{ col.description }}
              </p>
            </div>
          </div>
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
            :class="[col.badgeBg, col.badgeText]"
          >
            {{ groups[col.key].length }}
          </span>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-3">
          <div
            v-if="loading"
            class="flex flex-col gap-2.5"
            aria-busy="true"
            aria-label="Cargando"
          >
            <div
              v-for="i in 3"
              :key="i"
              class="h-28 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60"
            />
          </div>

          <ul
            v-else-if="groups[col.key].length"
            class="flex flex-col gap-2.5"
          >
            <li
              v-for="(s, i) in groups[col.key]"
              :key="s.id_siniestro"
              class="fade-up"
              :style="{ animationDelay: i * 40 + 'ms' }"
            >
              <SiniestroCard :siniestro="s" />
            </li>
          </ul>

          <div
            v-else
            class="flex h-full items-center justify-center py-10 text-center text-xs text-[var(--color-text-muted)]"
          >
            Sin siniestros en esta categoría
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
