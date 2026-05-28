<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { sendChatMessage, type ChatMessage } from '../../services/chat'

const messages = ref<ChatMessage[]>([
  {
    id: 1,
    role: 'bot',
    text: 'Hola, soy tu asistente virtual. ¿En qué puedo ayudarte?',
  },
])
const input = ref('')
const isTyping = ref(false)
const listRef = ref<HTMLElement | null>(null)

let nextId = 2

async function scrollToBottom() {
  await nextTick()
  const el = listRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
}

async function send() {
  const text = input.value.trim()
  if (!text || isTyping.value) return

  messages.value.push({ id: nextId++, role: 'user', text })
  input.value = ''
  await scrollToBottom()

  isTyping.value = true
  try {
    const { reply } = await sendChatMessage(text)
    messages.value.push({ id: nextId++, role: 'bot', text: reply })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    messages.value.push({
      id: nextId++,
      role: 'bot',
      text: `No pude procesar tu mensaje: ${msg}`,
    })
  } finally {
    isTyping.value = false
    await scrollToBottom()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void send()
  }
}
</script>

<template>
  <section class="flex h-full flex-col gap-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
        Preguntas al chat
      </h1>
      <p class="text-sm text-[var(--color-text-dim)]">
        Conversa con el asistente para resolver tus dudas.
      </p>
    </header>

    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div
        ref="listRef"
        class="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6"
      >
        <ul class="mx-auto flex max-w-3xl flex-col gap-3">
          <li
            v-for="m in messages"
            :key="m.id"
            class="fade-up flex"
            :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              v-if="m.role === 'bot'"
              class="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-fuchsia-500 text-[11px] font-semibold text-white shadow-md shadow-violet-500/20"
            >
              F
            </div>
            <div
              class="max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm"
              :class="
                m.role === 'user'
                  ? 'bg-[var(--color-accent)] text-white rounded-br-md'
                  : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-md'
              "
            >
              {{ m.text }}
            </div>
            <div
              v-if="m.role === 'user'"
              class="ml-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-3)] text-[11px] font-semibold text-[var(--color-text)]"
            >
              U
            </div>
          </li>

          <li v-if="isTyping" class="fade-up flex justify-start">
            <div
              class="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-fuchsia-500 text-[11px] font-semibold text-white shadow-md shadow-violet-500/20"
            >
              F
            </div>
            <div
              class="flex items-center gap-1 rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3"
            >
              <span class="dot" />
              <span class="dot" style="animation-delay: 150ms" />
              <span class="dot" style="animation-delay: 300ms" />
            </div>
          </li>
        </ul>
      </div>

      <div
        class="border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-4 py-3 sm:px-6"
      >
        <form
          class="mx-auto flex max-w-3xl items-end gap-2"
          @submit.prevent="send"
        >
          <div
            class="flex flex-1 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-accent)]/60 focus-within:ring-2 focus-within:ring-[var(--color-accent)]/20 transition-all"
          >
            <input
              v-model="input"
              type="text"
              placeholder="Escribe tu pregunta…"
              class="w-full bg-transparent px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none"
              @keydown="onKeydown"
            />
          </div>
          <button
            type="submit"
            :disabled="!input.trim() || isTyping"
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white shadow-md shadow-violet-500/20 transition-all hover:scale-[1.03] hover:bg-violet-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            aria-label="Enviar mensaje"
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
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-text-muted);
  animation: bounce 1s infinite ease-in-out;
}

@keyframes bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
</style>
