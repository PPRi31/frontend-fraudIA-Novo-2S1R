<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { sendChatMessage, type ChatMessage } from '../../services/chat'
import { sanitizeHtml } from '../../utils/sanitize'

function looksLikeHtml(text: string) {
  return /<\/?[a-z][\s\S]*>/i.test(text)
}

function buildBotMessage(id: number, text: string): ChatMessage {
  const html = looksLikeHtml(text)
    ? sanitizeHtml(text)
    : sanitizeHtml(`<p>${text.replace(/\n/g, '<br>')}</p>`)
  return { id, role: 'bot', text, html }
}

const messages = ref<ChatMessage[]>([
  buildBotMessage(1, 'Hola, soy tu asistente virtual. ¿En qué puedo ayudarte?'),
])
const input = ref('')
const isTyping = ref(false)
const sessionId = ref<string | null>(null)
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
    const { reply, session_id } = await sendChatMessage(text, sessionId.value)
    sessionId.value = session_id
    messages.value.push(buildBotMessage(nextId++, reply))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    messages.value.push(
      buildBotMessage(nextId++, `No pude procesar tu mensaje: ${msg}`),
    )
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
                  : 'bot-rich bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-md'
              "
            >
              <template v-if="m.role === 'bot'">
                <div v-html="m.html ?? m.text" />
              </template>
              <template v-else>{{ m.text }}</template>
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

.bot-rich :deep(> div > *:first-child) {
  margin-top: 0;
}
.bot-rich :deep(> div > *:last-child) {
  margin-bottom: 0;
}

.bot-rich :deep(p) {
  margin: 0.5em 0;
  line-height: 1.55;
}

.bot-rich :deep(strong),
.bot-rich :deep(b) {
  color: var(--color-text);
  font-weight: 600;
}

.bot-rich :deep(em),
.bot-rich :deep(i) {
  font-style: italic;
}

.bot-rich :deep(a) {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: rgba(139, 92, 246, 0.5);
  transition: text-decoration-color 0.2s ease;
}
.bot-rich :deep(a:hover) {
  text-decoration-color: var(--color-accent);
}

.bot-rich :deep(code) {
  font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.85em;
  padding: 0.1em 0.4em;
  border-radius: 4px;
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.bot-rich :deep(pre) {
  margin: 0.6em 0;
  padding: 0.75em 0.9em;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.8em;
  line-height: 1.5;
}
.bot-rich :deep(pre code) {
  padding: 0;
  border: none;
  background: transparent;
  font-size: inherit;
}

.bot-rich :deep(ul),
.bot-rich :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.25em;
  display: flex;
  flex-direction: column;
  gap: 0.2em;
}
.bot-rich :deep(ul) {
  list-style: disc;
}
.bot-rich :deep(ol) {
  list-style: decimal;
}
.bot-rich :deep(li) {
  line-height: 1.5;
}
.bot-rich :deep(li::marker) {
  color: var(--color-text-muted);
}

.bot-rich :deep(h1),
.bot-rich :deep(h2),
.bot-rich :deep(h3),
.bot-rich :deep(h4) {
  margin: 0.8em 0 0.35em;
  color: var(--color-text);
  font-weight: 600;
  line-height: 1.3;
}
.bot-rich :deep(h1) {
  font-size: 1.15em;
}
.bot-rich :deep(h2) {
  font-size: 1.05em;
}
.bot-rich :deep(h3),
.bot-rich :deep(h4) {
  font-size: 0.95em;
}

.bot-rich :deep(blockquote) {
  margin: 0.5em 0;
  padding: 0.4em 0.8em;
  border-left: 2px solid var(--color-border-strong);
  color: var(--color-text-dim);
  background: var(--color-surface-3);
  border-radius: 0 6px 6px 0;
}

.bot-rich :deep(hr) {
  margin: 0.8em 0;
  border: 0;
  border-top: 1px solid var(--color-border);
}

.bot-rich :deep(table) {
  width: 100%;
  margin: 0.6em 0;
  border-collapse: collapse;
  font-size: 0.85em;
}
.bot-rich :deep(th),
.bot-rich :deep(td) {
  padding: 0.4em 0.6em;
  border: 1px solid var(--color-border);
  text-align: left;
}
.bot-rich :deep(th) {
  background: var(--color-surface-3);
  color: var(--color-text);
  font-weight: 600;
}

.bot-rich :deep(small) {
  font-size: 0.85em;
  color: var(--color-text-muted);
}
</style>
