<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchSiniestroById } from '../../services/siniestros'
import {
  ALERTA_LABELS,
  REGLA_LABELS,
  type SemaforoFinal,
  type Siniestro,
} from '../../types/siniestro'

const props = defineProps<{ id: number }>()

const loading = ref(true)
const error = ref<string | null>(null)
const siniestro = ref<Siniestro | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    siniestro.value = await fetchSiniestroById(props.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error desconocido'
    siniestro.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.id, load)

function semaforoTokens(s: SemaforoFinal | null) {
  switch (s) {
    case 'Rojo':
      return {
        dot: 'bg-[var(--color-red-soft)]',
        ring: 'ring-[var(--color-red-soft)]/30',
        bg: 'bg-[var(--color-red-bg)]',
        text: 'text-[var(--color-red-soft)]',
        border: 'border-[var(--color-red-soft)]/30',
      }
    case 'Amarillo':
      return {
        dot: 'bg-[var(--color-yellow-soft)]',
        ring: 'ring-[var(--color-yellow-soft)]/30',
        bg: 'bg-[var(--color-yellow-bg)]',
        text: 'text-[var(--color-yellow-soft)]',
        border: 'border-[var(--color-yellow-soft)]/30',
      }
    case 'Verde':
      return {
        dot: 'bg-[var(--color-green-soft)]',
        ring: 'ring-[var(--color-green-soft)]/30',
        bg: 'bg-[var(--color-green-bg)]',
        text: 'text-[var(--color-green-soft)]',
        border: 'border-[var(--color-green-soft)]/30',
      }
    default:
      return {
        dot: 'bg-[var(--color-text-muted)]',
        ring: 'ring-[var(--color-border)]',
        bg: 'bg-[var(--color-surface-3)]',
        text: 'text-[var(--color-text-muted)]',
        border: 'border-[var(--color-border)]',
      }
  }
}

const semFinal = computed(() => semaforoTokens(siniestro.value?.semaforo_final ?? null))

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
    month: 'long',
    year: 'numeric',
  })
}

const fmtNumber = (v: number | null | undefined, decimals = 2) => {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v)
}

const fmtBool = (v: boolean | null | undefined) => {
  if (v == null) return '—'
  return v ? 'Sí' : 'No'
}

const probMlPct = computed(() => {
  const v = siniestro.value?.probabilidad_ml
  return v == null ? null : Math.round(v * 100)
})

function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    window.location.href = '/'
  }
}
</script>

<template>
  <section class="mx-auto flex h-full w-full max-w-6xl flex-col gap-6">
    <header class="flex items-center justify-between gap-3">
      <button
        type="button"
        @click="goBack"
        class="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
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
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Volver
      </button>
      <p class="font-mono text-xs text-[var(--color-text-muted)]">
        Detalle del siniestro #{{ id }}
      </p>
    </header>

    <div
      v-if="loading"
      class="flex flex-1 flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]"
    >
      <div
        class="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]"
        aria-hidden="true"
      />
      <p class="text-sm">Cargando información…</p>
    </div>

    <div
      v-else-if="error || !siniestro"
      class="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--color-red-soft)]/30 bg-[var(--color-red-bg)] p-10 text-center"
    >
      <p class="text-sm font-medium text-[var(--color-red-soft)]">
        No se pudo cargar el siniestro
      </p>
      <p class="text-xs text-[var(--color-text-dim)]">{{ error }}</p>
      <button
        type="button"
        @click="load"
        class="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
      >
        Reintentar
      </button>
    </div>

    <template v-else>
      <article
        class="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span
                class="h-2.5 w-2.5 rounded-full ring-4"
                :class="[semFinal.dot, semFinal.ring]"
                aria-hidden="true"
              />
              <span
                class="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                :class="[semFinal.bg, semFinal.text, semFinal.border]"
              >
                {{ siniestro.semaforo_final ?? 'Sin clasificar' }}
              </span>
              <span
                v-if="siniestro.estado"
                class="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-text-dim)]"
              >
                {{ siniestro.estado }}
              </span>
            </div>
            <h1
              class="text-2xl font-semibold tracking-tight text-[var(--color-text)]"
            >
              {{ siniestro.cobertura ?? 'Sin cobertura' }}
            </h1>
            <p class="text-sm text-[var(--color-text-dim)]">
              {{ siniestro.ramo ?? '—' }}
              <span v-if="siniestro.sucursal" class="text-[var(--color-text-muted)]">
                · {{ siniestro.sucursal }}
              </span>
            </p>
          </div>

          <div class="flex flex-wrap gap-2 text-right">
            <div
              class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 leading-tight"
            >
              <p
                class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]"
              >
                Score final
              </p>
              <p
                class="text-lg font-semibold tabular-nums"
                :class="semFinal.text"
              >
                {{ fmtNumber(siniestro.score_final, 2) }}
              </p>
            </div>
            <div
              class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 leading-tight"
            >
              <p
                class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]"
              >
                Prob. ML
              </p>
              <p
                class="text-lg font-semibold tabular-nums"
                :class="semFinal.text"
              >
                {{ probMlPct == null ? '—' : `${probMlPct}%` }}
              </p>
            </div>
            <div
              class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 leading-tight"
            >
              <p
                class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]"
              >
                Score reglas
              </p>
              <p
                class="text-lg font-semibold tabular-nums text-[var(--color-text)]"
              >
                {{ siniestro.score_total_reglas }}
              </p>
            </div>
          </div>
        </div>
      </article>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article
          class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <h2 class="text-sm font-semibold text-[var(--color-text)]">
            Identificación
          </h2>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Siniestro</dt>
              <dd class="mt-0.5 font-mono text-[var(--color-text)]">
                #{{ siniestro.id_siniestro }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Póliza</dt>
              <dd class="mt-0.5 font-mono text-[var(--color-text)]">
                {{ siniestro.id_poliza ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Asegurado</dt>
              <dd class="mt-0.5 font-mono text-[var(--color-text)]">
                {{ siniestro.id_asegurado ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Proveedor</dt>
              <dd class="mt-0.5 font-mono text-[var(--color-text)]">
                {{ siniestro.id_proveedor ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Vehículo</dt>
              <dd class="mt-0.5 font-mono text-[var(--color-text)]">
                {{ siniestro.id_vehiculo ?? '—' }}
              </dd>
            </div>
          </dl>
        </article>

        <article
          class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <h2 class="text-sm font-semibold text-[var(--color-text)]">Fechas</h2>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Ocurrencia</dt>
              <dd class="mt-0.5 text-[var(--color-text)]">
                {{ fmtDate(siniestro.fecha_ocurrencia) }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Reporte</dt>
              <dd class="mt-0.5 text-[var(--color-text)]">
                {{ fmtDate(siniestro.fecha_reporte) }}
              </dd>
            </div>
          </dl>
        </article>

        <article
          class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <h2 class="text-sm font-semibold text-[var(--color-text)]">Montos</h2>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Reclamado</dt>
              <dd
                class="mt-0.5 font-medium tabular-nums text-[var(--color-text)]"
              >
                {{ fmtMoney(siniestro.monto_reclamado) }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Estimado</dt>
              <dd
                class="mt-0.5 font-medium tabular-nums text-[var(--color-text)]"
              >
                {{ fmtMoney(siniestro.monto_estimado) }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Pagado</dt>
              <dd
                class="mt-0.5 font-medium tabular-nums text-[var(--color-text)]"
              >
                {{ fmtMoney(siniestro.monto_pagado) }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">
                Suma asegurada
              </dt>
              <dd
                class="mt-0.5 font-medium tabular-nums text-[var(--color-text)]"
              >
                {{ fmtMoney(siniestro.suma_asegurada) }}
              </dd>
            </div>
          </dl>
        </article>

        <article
          class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <h2 class="text-sm font-semibold text-[var(--color-text)]">
            Ubicación
          </h2>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Sucursal</dt>
              <dd class="mt-0.5 text-[var(--color-text)]">
                {{ siniestro.sucursal ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">
                Ciudad póliza
              </dt>
              <dd class="mt-0.5 text-[var(--color-text)]">
                {{ siniestro.ciudad_poliza ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">
                Ciudad asegurado
              </dt>
              <dd class="mt-0.5 text-[var(--color-text)]">
                {{ siniestro.ciudad_asegurado ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">
                Ciudad proveedor
              </dt>
              <dd class="mt-0.5 text-[var(--color-text)]">
                {{ siniestro.ciudad_proveedor ?? '—' }}
              </dd>
            </div>
          </dl>
        </article>

        <article
          class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <h2 class="text-sm font-semibold text-[var(--color-text)]">
            Documentación
          </h2>
          <dl class="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Completos</dt>
              <dd class="mt-0.5 text-[var(--color-text)]">
                {{ fmtBool(siniestro.documentos_completos) }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Faltantes</dt>
              <dd
                class="mt-0.5"
                :class="
                  siniestro.docs_faltantes
                    ? 'text-[var(--color-red-soft)] font-medium'
                    : 'text-[var(--color-text)]'
                "
              >
                {{ fmtBool(siniestro.docs_faltantes) }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">
                Inconsistentes
              </dt>
              <dd
                class="mt-0.5"
                :class="
                  siniestro.docs_inconsistentes
                    ? 'text-[var(--color-red-soft)] font-medium'
                    : 'text-[var(--color-text)]'
                "
              >
                {{ fmtBool(siniestro.docs_inconsistentes) }}
              </dd>
            </div>
          </dl>
        </article>

        <article
          class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <h2 class="text-sm font-semibold text-[var(--color-text)]">
            Frecuencia (18 meses)
          </h2>
          <dl class="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Asegurado</dt>
              <dd
                class="mt-0.5 font-semibold tabular-nums text-[var(--color-text)]"
              >
                {{ siniestro.freq_asegurado_18m }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Vehículo</dt>
              <dd
                class="mt-0.5 font-semibold tabular-nums text-[var(--color-text)]"
              >
                {{ siniestro.freq_vehiculo_18m }}
              </dd>
            </div>
            <div>
              <dt class="text-[11px] text-[var(--color-text-muted)]">Conductor</dt>
              <dd
                class="mt-0.5 font-semibold tabular-nums text-[var(--color-text)]"
              >
                {{ siniestro.freq_conductor_18m }}
              </dd>
            </div>
          </dl>
        </article>
      </div>

      <article
        class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      >
        <h2 class="text-sm font-semibold text-[var(--color-text)]">
          Análisis de riesgo
        </h2>
        <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
          <div>
            <dt class="text-[11px] text-[var(--color-text-muted)]">
              Semáforo final
            </dt>
            <dd
              class="mt-0.5 inline-flex items-center gap-1.5 font-medium"
              :class="semFinal.text"
            >
              <span
                class="h-2 w-2 rounded-full"
                :class="semFinal.dot"
                aria-hidden="true"
              />
              {{ siniestro.semaforo_final ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-[var(--color-text-muted)]">
              Semáforo score
            </dt>
            <dd
              class="mt-0.5 font-medium"
              :class="semaforoTokens(siniestro.semaforo_score).text"
            >
              {{ siniestro.semaforo_score ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-[var(--color-text-muted)]">
              Semáforo score final
            </dt>
            <dd
              class="mt-0.5 font-medium"
              :class="semaforoTokens(siniestro.semaforo_score_final).text"
            >
              {{ siniestro.semaforo_score_final ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-[var(--color-text-muted)]">
              Reglas críticas
            </dt>
            <dd
              class="mt-0.5 font-medium"
              :class="semaforoTokens(siniestro.semaforo_reglas_criticas).text"
            >
              {{ siniestro.semaforo_reglas_criticas ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-[var(--color-text-muted)]">
              Predicción ML
            </dt>
            <dd class="mt-0.5 font-medium text-[var(--color-text)]">
              {{
                siniestro.prediccion_ml == null
                  ? '—'
                  : siniestro.prediccion_ml === 1
                    ? 'Riesgo'
                    : 'Sin riesgo'
              }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-[var(--color-text-muted)]">
              Probabilidad ML
            </dt>
            <dd
              class="mt-0.5 font-mono tabular-nums text-[var(--color-text)]"
            >
              {{ fmtNumber(siniestro.probabilidad_ml, 4) }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-[var(--color-text-muted)]">
              Similitud máx.
            </dt>
            <dd
              class="mt-0.5 font-mono tabular-nums text-[var(--color-text)]"
            >
              {{ fmtNumber(siniestro.max_similitud_textual, 4) }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-[var(--color-text-muted)]">
              Similares (top 5)
            </dt>
            <dd class="mt-0.5 flex flex-wrap gap-1 text-[var(--color-text)]">
              <a
                v-for="sid in siniestro.ids_siniestros_similares_top5"
                :key="sid"
                :href="`/${sid}`"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
              >
                #{{ sid }}
              </a>
              <span
                v-if="!siniestro.ids_siniestros_similares_top5.length"
                class="text-[var(--color-text-muted)]"
                >—</span
              >
            </dd>
          </div>
        </dl>
      </article>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article
          class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-[var(--color-text)]">
              Reglas críticas activadas
            </h2>
            <span
              class="rounded-full bg-[var(--color-surface-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-dim)] tabular-nums"
            >
              {{ siniestro.reglas_criticas_activadas.length }}
            </span>
          </div>
          <ul
            v-if="siniestro.reglas_criticas_activadas.length"
            class="flex flex-wrap gap-2"
          >
            <li
              v-for="r in siniestro.reglas_criticas_activadas"
              :key="r"
              class="flex items-center gap-1.5 rounded-md border border-[var(--color-red-soft)]/30 bg-[var(--color-red-bg)] px-2 py-1 text-[11.5px] text-[var(--color-red-soft)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                class="h-3 w-3"
              >
                <path
                  d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {{ REGLA_LABELS[r] }}
            </li>
          </ul>
          <p v-else class="text-xs text-[var(--color-text-muted)]">
            Ninguna regla crítica activada.
          </p>
        </article>

        <article
          class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-[var(--color-text)]">
              Alertas de score
            </h2>
            <span
              class="rounded-full bg-[var(--color-surface-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-dim)] tabular-nums"
            >
              {{ siniestro.alertas_score_activadas.length }}
            </span>
          </div>
          <ul
            v-if="siniestro.alertas_score_activadas.length"
            class="flex flex-wrap gap-2"
          >
            <li
              v-for="a in siniestro.alertas_score_activadas"
              :key="a"
              class="rounded-md border border-[var(--color-yellow-soft)]/30 bg-[var(--color-yellow-bg)] px-2 py-1 text-[11.5px] text-[var(--color-yellow-soft)]"
            >
              {{ ALERTA_LABELS[a] }}
            </li>
          </ul>
          <p v-else class="text-xs text-[var(--color-text-muted)]">
            Ninguna alerta de score activada.
          </p>
        </article>
      </div>

      <article
        v-if="siniestro.descripcion"
        class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      >
        <h2 class="text-sm font-semibold text-[var(--color-text)]">
          Descripción
        </h2>
        <p
          class="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-dim)]"
        >
          {{ siniestro.descripcion }}
        </p>
      </article>

      <article
        v-if="siniestro.explicabilidad"
        class="flex flex-col gap-3 rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-5"
      >
        <h2 class="text-sm font-semibold text-[var(--color-accent)]">
          Explicabilidad
        </h2>
        <p
          class="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text)]"
        >
          {{ siniestro.explicabilidad }}
        </p>
      </article>
    </template>
  </section>
</template>
