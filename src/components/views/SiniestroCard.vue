<script setup lang="ts">
import { computed } from 'vue'
import type { Siniestro } from '../../types/siniestro'

const props = defineProps<{
  siniestro: Siniestro
}>()

const colorTokens = {
  Rojo: {
    border: 'hover:border-[var(--color-red-soft)]/40',
    badgeBg: 'bg-[var(--color-red-bg)]',
    badgeText: 'text-[var(--color-red-soft)]',
    dot: 'bg-[var(--color-red-soft)]',
  },
  Amarillo: {
    border: 'hover:border-[var(--color-yellow-soft)]/40',
    badgeBg: 'bg-[var(--color-yellow-bg)]',
    badgeText: 'text-[var(--color-yellow-soft)]',
    dot: 'bg-[var(--color-yellow-soft)]',
  },
  Verde: {
    border: 'hover:border-[var(--color-green-soft)]/40',
    badgeBg: 'bg-[var(--color-green-bg)]',
    badgeText: 'text-[var(--color-green-soft)]',
    dot: 'bg-[var(--color-green-soft)]',
  },
} as const

const tokens = computed(
  () => colorTokens[props.siniestro.semaforo_final ?? 'Verde'],
)

const fmtMoney = (v: number | null) => {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v)
}

const fmtDate = (v: string | null) => {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const probMlPct = computed(() =>
  props.siniestro.probabilidad_ml == null
    ? null
    : Math.round(props.siniestro.probabilidad_ml * 100),
)

const scoreFinal = computed(() =>
  props.siniestro.score_final == null
    ? null
    : Math.round(props.siniestro.score_final * 10) / 10,
)
</script>

<template>
  <article
    class="group cursor-default rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3.5 transition-all duration-200 hover:-translate-y-px hover:bg-[var(--color-surface-3)] hover:shadow-lg hover:shadow-black/30"
    :class="tokens.border"
  >
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span
            class="h-1.5 w-1.5 shrink-0 rounded-full"
            :class="tokens.dot"
            aria-hidden="true"
          />
          <p
            class="truncate text-[11px] font-mono text-[var(--color-text-muted)]"
          >
            #{{ siniestro.id_siniestro }}
          </p>
        </div>
        <h3
          class="mt-1 truncate text-sm font-medium text-[var(--color-text)]"
          :title="siniestro.cobertura ?? ''"
        >
          {{ siniestro.cobertura ?? 'Sin cobertura' }}
        </h3>
        <p class="mt-0.5 truncate text-xs text-[var(--color-text-dim)]">
          {{ siniestro.ramo ?? '—' }}
          <span
            v-if="siniestro.sucursal"
            class="text-[var(--color-text-muted)]"
          >
            · {{ siniestro.sucursal }}
          </span>
        </p>
      </div>

      <div
        v-if="scoreFinal != null"
        class="flex shrink-0 flex-col items-end leading-tight"
      >
        <span
          class="rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
          :class="[tokens.badgeBg, tokens.badgeText]"
        >
          {{ scoreFinal }}
        </span>
        <span class="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
          score
        </span>
      </div>
    </header>

    <div class="mt-3 grid grid-cols-2 gap-2 text-[11px]">
      <div
        class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5"
      >
        <p class="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
          Reclamado
        </p>
        <p class="mt-0.5 truncate text-[12px] font-medium text-[var(--color-text)] tabular-nums">
          {{ fmtMoney(siniestro.monto_reclamado) }}
        </p>
      </div>
      <div
        class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5"
      >
        <p class="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
          Prob. ML
        </p>
        <p
          class="mt-0.5 text-[12px] font-medium tabular-nums"
          :class="tokens.badgeText"
        >
          {{ probMlPct == null ? '—' : `${probMlPct}%` }}
        </p>
      </div>
    </div>

    <p
      v-if="siniestro.explicabilidad"
      class="mt-3 line-clamp-2 text-[11.5px] leading-snug text-[var(--color-text-dim)]"
    >
      {{ siniestro.explicabilidad }}
    </p>

    <footer
      class="mt-3 flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-2.5 text-[10.5px] text-[var(--color-text-muted)]"
    >
      <div class="flex items-center gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          class="h-3 w-3"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{{ fmtDate(siniestro.fecha_ocurrencia) }}</span>
      </div>

      <div class="flex items-center gap-1.5">
        <span
          v-if="siniestro.reglas_criticas_activadas.length"
          class="flex items-center gap-1 rounded-md bg-[var(--color-surface-3)] px-1.5 py-0.5 font-medium text-[var(--color-text-dim)]"
          :title="`${siniestro.reglas_criticas_activadas.length} reglas críticas`"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            class="h-3 w-3"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {{ siniestro.reglas_criticas_activadas.length }}
        </span>
        <span
          v-if="siniestro.docs_faltantes || siniestro.docs_inconsistentes"
          class="rounded-md bg-[var(--color-surface-3)] px-1.5 py-0.5 font-medium text-[var(--color-text-dim)]"
          title="Problemas documentales"
        >
          docs
        </span>
        <span
          v-if="siniestro.freq_asegurado_18m >= 3"
          class="rounded-md bg-[var(--color-surface-3)] px-1.5 py-0.5 font-medium text-[var(--color-text-dim)]"
          :title="`Frecuencia asegurado 18m: ${siniestro.freq_asegurado_18m}`"
        >
          ×{{ siniestro.freq_asegurado_18m }}
        </span>
      </div>
    </footer>
  </article>
</template>
