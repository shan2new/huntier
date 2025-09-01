// Avoid polluting global types; reference chrome via local alias
const c: any = (globalThis as any).chrome
export {}
const API_BASE = (self as any).VITE_API_URL || 'http://localhost:3001/api'
const APP_ORIGIN = (self as any).VITE_APP_ORIGIN || 'http://localhost:3000'

type StoredAuth = { token?: string; lastAt?: number }
let connectTabId: number | null = null
const pendingResolvers: Array<(t: string) => void> = []

console.log('[Huntier:bg] service worker loaded')

function notifyToken(token: string) {
  setAuth({ token, lastAt: Date.now() })
  console.log('[Huntier:bg] token received and stored')
  while (pendingResolvers.length) {
    try { pendingResolvers.shift()?.(token) } catch {}
  }
}

async function getAuth(): Promise<StoredAuth> {
  const data = await c.storage.local.get(['huntier_auth'])
  return (data.huntier_auth as StoredAuth) || {}
}

async function setAuth(auth: StoredAuth) {
  await c.storage.local.set({ huntier_auth: auth })
}

async function ensureToken(interactive = true): Promise<string> {
  const cur = await getAuth()
  if (cur.token) return cur.token
  if (!interactive) throw new Error('No token')

  // Open a tab to the hosted app to obtain a Clerk token via the connect route
  const url = `${APP_ORIGIN}/extension/connect?extId=${c.runtime.id}`
  if (!connectTabId) {
    console.log('[Huntier:bg] opening connect tab', url)
    const tab = await c.tabs.create({ url, active: true })
    connectTabId = tab.id || null
  } else {
    try { await c.tabs.update(connectTabId, { active: true, url }) } catch (e) { console.warn('[Huntier:bg] failed to update connect tab', e) }
  }

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      // do not auto-close; just clear tracking
      connectTabId = null
      console.warn('[Huntier:bg] token wait timed out')
      reject(new Error('Timed out obtaining token'))
    }, 60_000)

    // If token arrives via any channel, resolve
    pendingResolvers.push((t: string) => {
      clearTimeout(timeout)
      resolve(t)
    })
  })
}

// Listen for direct token messages from the web app (preferred path)
c.runtime.onMessageExternal.addListener((message: any, _sender: any, sendResponse: any) => {
  console.log('[Huntier:bg] external message', message?.type)
  if (message?.type === 'huntier-token') {
    notifyToken(message.token)
    sendResponse({ ok: true })
    return true
  }
  return undefined
})

// Handle messages from content scripts and popup
c.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
  console.log('[Huntier:bg] message', message?.type)
  ;(async () => {
    try {
      if (message?.type === 'huntier-token') {
        notifyToken(message.token)
        sendResponse({ ok: true })
        return
      }
      if (message?.type === 'huntier:save-application-ai') {
        const token = await ensureToken(true)
        // 1) Capture current tab screenshot
        const dataUrl: string = await new Promise((resolve, reject) => {
          try {
            c.tabs.captureVisibleTab({ format: 'png' }, (url: string) => {
              if (url) resolve(url); else reject(new Error('capture failed'))
            })
          } catch (e) { reject(e as any) }
        })
        const blob = await (await fetch(dataUrl)).blob()
        // 2) Upload to AI extract endpoint
        const form = new FormData()
        form.append('files', blob, 'screenshot.png')
        const extractRes = await fetch(`${API_BASE}/v1/applications/ai/extract-from-images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        if (!extractRes.ok) {
          const text = await extractRes.text().catch(() => '')
          sendResponse({ ok: false, error: `extract_failed:${extractRes.status}:${text}` })
          return
        }
        const { draft_id } = await extractRes.json()
        // 3) Commit draft to application
        const commit = await fetch(`${API_BASE}/v1/applications/drafts/${draft_id}/commit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const app = await commit.json()
        // 4) Optional stage transition (e.g., wishlist)
        if (message?.stage) {
          try {
            await fetch(`${API_BASE}/v1/applications/${app.id}/transition`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ to_stage: message.stage }),
            })
          } catch {}
        }
        sendResponse({ ok: true, data: app })
        return
      }
      if (message?.type === 'huntier:get-token') {
        const token = await ensureToken(true)
        sendResponse({ token })
        return
      }

      if (message?.type === 'huntier:save-application') {
        const token = await ensureToken(true)
        console.log('[Huntier:bg] creating application')
        const res = await fetch(`${API_BASE}/v1/applications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(message.body || {}),
        })
        const data = await res.json()
        sendResponse({ ok: res.ok, data })
        return
      }

      if (message?.type === 'huntier:create-draft') {
        const token = await ensureToken(true)
        console.log('[Huntier:bg] creating draft')
        const res = await fetch(`${API_BASE}/v1/applications/drafts`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        sendResponse({ ok: res.ok, data })
        return
      }
    } catch (e: any) {
      console.error('[Huntier:bg] error', e)
      sendResponse({ ok: false, error: e?.message || String(e) })
    }
  })()
  return true
})


