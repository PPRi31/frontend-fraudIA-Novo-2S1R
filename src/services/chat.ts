import { apiUrl, readError } from './api'

export type ChatRole = 'user' | 'bot'

export interface ChatMessage {
  id: number
  role: ChatRole
  text: string
}

export interface ChatResponse {
  reply: string
  session_id: string
}

export async function sendChatMessage(
  message: string,
  sessionId?: string | null,
): Promise<ChatResponse> {
  const payload: { message: string; session_id?: string } = { message }
  if (sessionId) payload.session_id = sessionId

  const res = await fetch(apiUrl('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as ChatResponse
}
