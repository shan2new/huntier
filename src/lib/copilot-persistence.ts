export type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: number }

const KEY_PREFIX = 'huntier:copilot:chat:'

export function loadChat(resumeId: string): Array<ChatMessage> {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + resumeId)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveChat(resumeId: string, messages: Array<ChatMessage>) {
  try {
    localStorage.setItem(KEY_PREFIX + resumeId, JSON.stringify(messages))
  } catch {}
}

export function clearChat(resumeId: string) {
  try { localStorage.removeItem(KEY_PREFIX + resumeId) } catch {}
}


