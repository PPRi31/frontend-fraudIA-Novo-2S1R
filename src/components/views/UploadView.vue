<script setup lang="ts">
import { ref } from 'vue'
import IconUpload from '../icons/IconUpload.vue'
import { uploadCsv } from '../../services/upload'

const isDragging = ref(false)
const isUploading = ref(false)
const fileName = ref<string | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

function isCsv(file: File) {
  return (
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel' ||
    file.name.toLowerCase().endsWith('.csv')
  )
}

async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return
  const file = files[0]
  if (!isCsv(file)) {
    alert('Solo se permiten archivos .csv')
    return
  }
  isUploading.value = true
  try {
    const result = await uploadCsv(file)
    fileName.value = result.fileName
    alert('Archivo subido correctamente')
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    alert(`No se pudo subir el archivo: ${msg}`)
  } finally {
    isUploading.value = false
  }
}

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  void handleFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  void handleFiles(e.dataTransfer?.files ?? null)
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
</script>

<template>
  <section class="flex h-full flex-col gap-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
        Subir archivos
      </h1>
      <p class="text-sm text-[var(--color-text-dim)]">
        Selecciona o arrastra un archivo
        <code
          class="rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 text-[12px] text-[var(--color-text)]"
          >.csv</code
        >
        para procesarlo.
      </p>
    </header>

    <div class="flex flex-1 items-start justify-center">
      <div class="w-full max-w-2xl">
        <div
          @click="openPicker"
          @keydown.enter.prevent="openPicker"
          @keydown.space.prevent="openPicker"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          tabindex="0"
          role="button"
          aria-label="Subir archivo CSV"
          class="group relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-14 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/60"
          :class="[
            isUploading
              ? 'cursor-progress opacity-80'
              : 'cursor-pointer',
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
            <p
              v-if="isUploading"
              class="text-sm font-medium text-[var(--color-text)]"
            >
              Subiendo archivo…
            </p>
            <p v-else class="text-sm font-medium text-[var(--color-text)]">
              Arrastra tu archivo aquí o
              <span class="text-[var(--color-accent)]"
                >haz clic para seleccionar</span
              >
            </p>
            <p class="text-xs text-[var(--color-text-muted)]">
              Solo archivos CSV · Máximo 10MB
            </p>
          </div>

          <input
            ref="inputRef"
            type="file"
            accept=".csv,text/csv"
            class="sr-only"
            @change="onChange"
          />
        </div>

        <transition name="fade">
          <div
            v-if="fileName"
            class="fade-up mt-4 flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-green-bg)] text-[var(--color-green-soft)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div class="leading-tight">
                <p class="text-sm font-medium text-[var(--color-text)]">
                  {{ fileName }}
                </p>
                <p class="text-xs text-[var(--color-text-muted)]">
                  Subido correctamente
                </p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text)]"
              @click="fileName = null"
            >
              Quitar
            </button>
          </div>
        </transition>
      </div>
    </div>
  </section>
</template>
