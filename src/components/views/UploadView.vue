<script setup lang="ts">
import { computed, ref } from 'vue'
import IconUpload from '../icons/IconUpload.vue'
import {
  REQUIRED_UPLOAD_FILES,
  uploadFraudCsvSet,
  type RequiredUploadField,
  type UploadFilesMap,
  type UploadResult,
} from '../../services/upload'

const isDragging = ref(false)
const isUploading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<Partial<Record<RequiredUploadField, File>>>({})
const lastResult = ref<UploadResult | null>(null)

const selectedCount = computed(() => Object.keys(selectedFiles.value).length)
const allSelected = computed(
  () => selectedCount.value === REQUIRED_UPLOAD_FILES.length,
)

function isCsv(file: File) {
  return (
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel' ||
    file.name.toLowerCase().endsWith('.csv')
  )
}

function identifyField(file: File): RequiredUploadField | null {
  const lower = file.name.toLowerCase()
  const match = REQUIRED_UPLOAD_FILES.find((item) => {
    const field = item.field.toLowerCase()
    return (
      lower === item.filename.toLowerCase() ||
      lower.startsWith(`${field}.`) ||
      lower.startsWith(`${field}_`) ||
      lower.startsWith(`${field}-`)
    )
  })
  return match?.field ?? null
}

function handleFiles(files: FileList | null) {
  if (!files || files.length === 0 || isUploading.value) return

  const rejected: string[] = []
  const unknown: string[] = []
  const next = { ...selectedFiles.value }

  for (const file of Array.from(files)) {
    if (!isCsv(file)) {
      rejected.push(file.name)
      continue
    }

    const field = identifyField(file)
    if (!field) {
      unknown.push(file.name)
      continue
    }

    next[field] = file
  }

  selectedFiles.value = next
  lastResult.value = null

  if (rejected.length) alert(`Solo se permiten CSV: ${rejected.join(', ')}`)
  if (unknown.length) {
    alert(
      `No pude asociar estos archivos al pipeline: ${unknown.join(', ')}. Usa los nombres requeridos o selecciona los CSV originales.`,
    )
  }
}

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  handleFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  handleFiles(e.dataTransfer?.files ?? null)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function openPicker() {
  if (isUploading.value) return
  inputRef.value?.click()
}

function removeFile(field: RequiredUploadField) {
  const next = { ...selectedFiles.value }
  delete next[field]
  selectedFiles.value = next
  lastResult.value = null
}

function clearFiles() {
  selectedFiles.value = {}
  lastResult.value = null
}

function buildFilesMap(): UploadFilesMap {
  const missing = REQUIRED_UPLOAD_FILES.filter(
    (item) => !selectedFiles.value[item.field],
  )
  if (missing.length) {
    throw new Error(
      `Faltan archivos: ${missing.map((item) => item.filename).join(', ')}`,
    )
  }
  return selectedFiles.value as UploadFilesMap
}

async function processFiles() {
  if (isUploading.value) return

  isUploading.value = true
  try {
    const result = await uploadFraudCsvSet(buildFilesMap(), true)
    lastResult.value = result
    alert(`Procesamiento completado: ${result.processed_rows} registros.`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    alert(`No se pudieron procesar los archivos: ${msg}`)
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <section class="flex h-full flex-col gap-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
        Subir archivos
      </h1>
      <p class="max-w-3xl text-sm text-[var(--color-text-dim)]">
        Selecciona o arrastra los 6 CSV requeridos por el pipeline. Se procesarán
        con reglas, modelo ML y explicabilidad; luego se guardarán en PostgreSQL.
      </p>
    </header>

    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <div
          @click="openPicker"
          @keydown.enter.prevent="openPicker"
          @keydown.space.prevent="openPicker"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          tabindex="0"
          role="button"
          aria-label="Subir archivos CSV"
          class="group relative flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-14 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/60"
          :class="[
            isUploading ? 'cursor-progress opacity-80' : 'cursor-pointer',
            isDragging
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8 scale-[1.01]'
              : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-surface-2)]',
          ]"
          :aria-busy="isUploading || undefined"
        >
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-dim)] transition-all duration-200 group-hover:scale-105 group-hover:border-[var(--color-accent)]/40 group-hover:text-[var(--color-accent)]"
          >
            <IconUpload class="h-6 w-6" />
          </div>
          <div class="flex flex-col gap-1">
            <p v-if="isUploading" class="text-sm font-medium text-[var(--color-text)]">
              Procesando archivos…
            </p>
            <p v-else class="text-sm font-medium text-[var(--color-text)]">
              Arrastra los CSV aquí o
              <span class="text-[var(--color-accent)]">haz clic para seleccionar</span>
            </p>
            <p class="text-xs text-[var(--color-text-muted)]">
              {{ selectedCount }}/{{ REQUIRED_UPLOAD_FILES.length }} archivos listos · solo CSV
            </p>
          </div>

          <input
            ref="inputRef"
            type="file"
            accept=".csv,text/csv"
            multiple
            class="sr-only"
            @change="onChange"
          />
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            :disabled="!allSelected || isUploading"
            class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            @click="processFiles"
          >
            {{ isUploading ? 'Procesando…' : 'Procesar y guardar' }}
          </button>
          <button
            type="button"
            :disabled="selectedCount === 0 || isUploading"
            class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
            @click="clearFiles"
          >
            Limpiar selección
          </button>
        </div>

        <transition name="fade">
          <div
            v-if="lastResult"
            class="fade-up mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-text-dim)]"
          >
            <p class="font-medium text-[var(--color-text)]">
              Procesamiento completado
            </p>
            <p class="mt-1">
              {{ lastResult.processed_rows }} registros procesados ·
              {{ lastResult.inserted_rows ?? 0 }} guardados/actualizados.
            </p>
            <p class="mt-1 text-xs text-[var(--color-text-muted)]">
              Rojo: {{ lastResult.summary.semaforo_final.Rojo ?? 0 }} · Amarillo:
              {{ lastResult.summary.semaforo_final.Amarillo ?? 0 }} · Verde:
              {{ lastResult.summary.semaforo_final.Verde ?? 0 }}
            </p>
          </div>
        </transition>
      </div>

      <aside
        class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-[var(--color-text)]">
              Archivos requeridos
            </h2>
            <p class="mt-1 text-xs text-[var(--color-text-muted)]">
              Puedes seleccionarlos en una sola acción o agregarlos uno por uno.
            </p>
          </div>
          <span
            class="rounded-full bg-[var(--color-surface-3)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-dim)]"
          >
            {{ selectedCount }}/6
          </span>
        </div>

        <ul class="mt-4 flex flex-col gap-2.5">
          <li
            v-for="item in REQUIRED_UPLOAD_FILES"
            :key="item.field"
            class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-medium text-[var(--color-text)]">
                  {{ item.label }}
                </p>
                <p class="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                  {{ selectedFiles[item.field]?.name ?? item.filename }}
                </p>
              </div>
              <button
                v-if="selectedFiles[item.field]"
                type="button"
                class="rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text)]"
                :disabled="isUploading"
                @click="removeFile(item.field)"
              >
                Quitar
              </button>
              <span
                v-else
                class="rounded-md bg-[var(--color-surface-3)] px-2 py-1 text-xs text-[var(--color-text-muted)]"
              >
                Pendiente
              </span>
            </div>
          </li>
        </ul>
      </aside>
    </div>
  </section>
</template>
