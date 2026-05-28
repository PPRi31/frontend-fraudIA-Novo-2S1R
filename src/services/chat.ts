export type ChatRole = 'user' | 'bot'

export interface ChatMessage {
  id: number
  role: ChatRole
  text: string
}

export interface ChatResponse {
  reply: string
}

const FALLBACK_REPLY =
  'Hola, soy tu asistente virtual. ¿En qué puedo ayudarte?'

// Cuando el backend esté listo, reemplazar el cuerpo por:
//
//   const res = await fetch('/api/chat', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ message }),
//   })
//   if (!res.ok) throw new Error(`HTTP ${res.status}`)
//   return (await res.json()) as ChatResponse
//
// Notas:
// - Si el backend mantiene contexto de conversación, enviar también el
//   historial: `body: JSON.stringify({ message, history })`.
// - Si el endpoint hace streaming (SSE / chunked), usar `ReadableStream` y
//   actualizar `messages` token por token en lugar de retornar `reply` completo.
// - Si requiere auth, agregar `headers: { Authorization: ... }`.
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  void message
  return { reply: FALLBACK_REPLY }
}
