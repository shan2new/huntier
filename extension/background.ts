import { NetworkLogStore } from './bg/services'
// Avoid polluting global types; reference chrome via local alias
const c: any = (globalThis as any).chrome
export {}
const API_BASE = 'https://prod.huntier.pro/api'
const APP_ORIGIN = 'https://huntier.pro'

type StoredAuth = { token?: string; lastAt?: number }
let connectTabId: number | null = null
const pendingResolvers: Array<(t: string) => void> = []
type Settings = { helperEnabled?: boolean }

// Deep crawl coordination
async function runDeepCrawl(targetUrl: string): Promise<any | null> {
  try {
    // Open a background popup window with the target URL. Keep it unfocused to avoid user disruption.
    const win = await c.windows.create({ url: targetUrl, focused: false, type: 'popup', width: 900, height: 900, left: 5000, top: 5000 })
    const crawlWindowId: number | undefined = win?.id
    const crawlTabId: number | undefined = win?.tabs?.[0]?.id
    if (!crawlTabId) throw new Error('crawl_tab_missing')

    // Wait for the tab to be fully loaded
    await new Promise<void>((resolve) => {
      const listener = (tabId: number, info: any) => {
        if (tabId === crawlTabId && info?.status === 'complete') {
          c.tabs.onUpdated.removeListener(listener)
          resolve()
        }
      }
      c.tabs.onUpdated.addListener(listener)
    })

    // Inject crawler script file
    await c.scripting.executeScript({ target: { tabId: crawlTabId }, files: ['crawler.js'] })

    // Await a single crawl result message for this tab
    const result = await new Promise<any>((resolve) => {
      const timeout = setTimeout(() => {
        off()
        resolve(null)
      }, 20000)
      const handler = (message: any, sender: any, _sendResponse: any) => {
        if (sender?.tab?.id === crawlTabId && message?.type === 'huntier:crawl-result') {
          clearTimeout(timeout)
          off()
          resolve(message?.extracted || null)
        }
      }
      const off = () => c.runtime.onMessage.removeListener(handler)
      c.runtime.onMessage.addListener(handler)
    })

    // Close the crawl window
    if (crawlWindowId) {
      try { await c.windows.remove(crawlWindowId) } catch {}
    }
    return result
  } catch (e) {
    console.warn('[Huntier:bg] runDeepCrawl failed', e)
    return null
  }
}

console.log('[Huntier:bg] service worker loaded')

function notifyToken(token: string) {
  setAuth({ token, lastAt: Date.now() })
  console.log('[Huntier:bg] token received and stored')
  while (pendingResolvers.length) {
    try { pendingResolvers.shift()?.(token) } catch {}
  }
}

// Ensure our main-world network hook is registered at document_start
async function registerNetworkHook() {
  try {
    const exists = await c.scripting.getRegisteredContentScripts({ ids: ['huntier-network-hook'] }).catch(() => [])
    if (!exists || !exists.length) {
      await c.scripting.registerContentScripts([{
        id: 'huntier-network-hook',
        matches: ['http://*/*', 'https://*/*'],
        js: ['network-hook.js'],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: false,
        persistAcrossSessions: true,
      }])
      console.log('[Huntier:bg] registered network hook content script')
    }
  } catch (e) {
    console.warn('[Huntier:bg] failed to register network hook; will attempt lazy injection on tab updates', e)
    try {
      c.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
        if (changeInfo?.status === 'loading' || changeInfo?.status === 'complete') {
          c.scripting.executeScript({ target: { tabId }, files: ['network-hook.js'], world: 'MAIN' }).catch(() => {})
        }
      })
    } catch {}
  }
}

registerNetworkHook()

const logs = new NetworkLogStore()

// Relay from content script: harvest network logs from page main world
c.runtime.onMessage.addListener((message: any, sender: any, _sendResponse: any) => {
  if (message?.type === 'huntier:network-log' && sender?.tab?.id) {
    logs.add(sender.tab.id, message.entry)
  }
})

const condenseNetworkEntries = (all: any[]) => logs.condense(all)
const selectLikelyJobEntries = (entries: any[]) => logs.pickLikelyJobEntries(entries)

// removed duplicate; using logs.pickLikelyJobEntries

async function getAuth(): Promise<StoredAuth> {
  const data = await c.storage.local.get(['huntier_auth'])
  return (data.huntier_auth as StoredAuth) || {}
}

async function setAuth(auth: StoredAuth) {
  await c.storage.local.set({ huntier_auth: auth })
}

async function getSettings(): Promise<Settings> {
  const data = await c.storage.local.get(['huntier_settings'])
  return (data.huntier_settings as Settings) || {}
}

async function setSettings(patch: Settings) {
  const cur = await getSettings()
  const next = { ...cur, ...patch }
  await c.storage.local.set({ huntier_settings: next })
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
      if (message?.type === 'huntier:toggle-helper') {
        const enabled = !!message?.enabled
        await setSettings({ helperEnabled: enabled })
        // Broadcast to all tabs or just the target tab if provided
        const targetTabId: number | undefined = message?.tabId
        if (targetTabId) {
          try { await c.tabs.sendMessage(targetTabId, { type: 'huntier:toggle-helper', enabled }) } catch {}
        } else {
          const tabs = await c.tabs.query({})
          for (const t of tabs) {
            if (t?.id) try { await c.tabs.sendMessage(t.id, { type: 'huntier:toggle-helper', enabled }) } catch {}
          }
        }
        sendResponse({ ok: true })
        return
      }
      if (message?.type === 'huntier-token') {
        notifyToken(message.token)
        sendResponse({ ok: true })
        return
      }
      // Removed precheck-application handler per request
      if (message?.type === 'huntier:save-application-ai') {
        const token = await ensureToken(true)
        console.log('[Huntier:bg] AI save requested', { stage: message?.stage, extracted: !!message?.extracted })
        // 0) Collect recent network logs for this tab
        const [active] = await c.tabs.query({ active: true, currentWindow: true })
        const activeTabId = active?.id
        const networkEntriesRaw = logs.getRaw(activeTabId)
        const condensed = condenseNetworkEntries(networkEntriesRaw)
        const likely = selectLikelyJobEntries(condensed)
        const networkEntries = likely.length ? likely : condensed
        console.log('[Huntier:bg] collected network entries', { count: networkEntries.length })
        // 0.1) Perform an invisible deep-crawl on a background window to enrich extracted hints (optional)
        let deepExtracted: any = null
        try {
          const url = active?.url
          if (url) {
            console.log('[Huntier:bg] launching deep crawl', url)
            deepExtracted = await runDeepCrawl(url)
          }
        } catch (e) { console.warn('[Huntier:bg] deep crawl skipped', e) }
        // 1) Capture current tab screenshot (JPEG, compressed) for context and reuse later
        const dataUrl: string = await new Promise((resolve, reject) => {
          try {
            c.tabs.captureVisibleTab({ format: 'jpeg', quality: 60 }, (url: string) => {
              if (url) resolve(url); else reject(new Error('capture failed'))
            })
          } catch (e) { reject(e as any) }
        })
        const blob = await (await fetch(dataUrl)).blob()
        // 0.2) Send network entries to backend AI extractor first; prefer its result if present
        let draft_id: string | null = null
        try {
          if (networkEntries.length > 0) {
            // Phase 1: quick mapping request
            let mapping: any = null
            try {
              const mapRes = await fetch(`${API_BASE}/v1/applications/ai/map-network`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ entries: condensed.slice(0, 12) })
              })
              mapping = await mapRes.json().catch(() => null)
            } catch {}

            let entriesForExtract = networkEntries
            if (mapping?.best_entry_index !== undefined && mapping?.best_entry_index !== null) {
              const i = Number(mapping.best_entry_index)
              if (!isNaN(i) && i >= 0 && i < condensed.length) {
                entriesForExtract = [condensed[i]]
              }
            }

            console.log('[Huntier:bg] calling network extractor', { count: entriesForExtract.length })
            const netRes = await fetch(`${API_BASE}/v1/applications/ai/extract-from-network`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ entries: entriesForExtract, screenshot_data_url: dataUrl })
            })
            const net = await netRes.json().catch(() => null)
            if (netRes.ok && net?.draft_id) {
              draft_id = net.draft_id
              console.log('[Huntier:bg] network extractor draft', draft_id, { ai: net?.ai, used: entriesForExtract.length })
            } else {
              console.warn('[Huntier:bg] network extractor failed', netRes.status, net)
            }
          }
        } catch (e) { console.warn('[Huntier:bg] network extractor error', e) }
        // Pre-check: if platform_job_id present, query for existing app
        let existingApp: any = null
        try {
          const pj = message?.platform_job_id
          if (pj) {
            const search = new URLSearchParams({ platform_job_id: pj }).toString()
            const res = await fetch(`${API_BASE}/v1/applications?${search}`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) {
              const arr = await res.json().catch(() => [])
              if (Array.isArray(arr) && arr.length > 0) existingApp = arr[0]
            }
          }
        } catch {}
        if (existingApp?.id) {
          sendResponse({ ok: true, data: existingApp, already_exists: true })
          return
        }

        // 2) Upload to AI extract endpoint
        const form = new FormData()
        form.append('files', blob, 'screenshot.jpg')
        console.log('[Huntier:bg] uploading screenshot to extractor', { size: blob.size, type: blob.type })
        const extractRes = await fetch(`${API_BASE}/v1/applications/ai/extract-from-images${draft_id ? `?draft_id=${encodeURIComponent(draft_id)}` : ''}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        if (!extractRes.ok) {
          const text = await extractRes.text().catch(() => '')
          sendResponse({ ok: false, error: `extract_failed:${extractRes.status}:${text}` })
          return
        }
        if (!draft_id) {
          const j = await extractRes.json()
          draft_id = j?.draft_id
        } else {
          await extractRes.json().catch(()=>null)
        }
        console.log('[Huntier:bg] extracted draft id', draft_id)
        // 2.5) Enrich draft with tab URL + platform upsert
        try {
          const [tab] = await c.tabs.query({ active: true, currentWindow: true })
          const tabUrl: string | undefined = tab?.url
          if (tabUrl) {
            // Upsert platform by origin
            const u = new URL(tabUrl)
            const origin = `${u.protocol}//${u.hostname}`
            const host = u.hostname.replace(/^www\./, '')
            const prettyName = host
              .split('.')
              .slice(0, -1)
              .join(' ')
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (m) => m.toUpperCase()) || host
            const platRes = await fetch(`${API_BASE}/v1/platforms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ name: prettyName, url: origin }),
            })
            const platform = await platRes.json().catch(() => null)
            console.log('[Huntier:bg] upsert platform', { origin, id: platform?.id })
            // Patch draft with platform_id, job_url and extracted fields
            const patchBody: any = { job_url: tabUrl }
            if (platform?.id) patchBody.platform_id = platform.id
            // Map extracted hint fields
            const ex = { ...(message?.extracted || {}), ...(deepExtracted || {}) }
            if (ex?.title && !ex?.company?.name) patchBody.role = String(ex.title).slice(0, 180)
            if (ex?.company?.name || ex?.company?.website) {
              // We keep company_id path in commit; here we can only store notes or rely on commit to resolve company
              // Append as draft notes for context
              patchBody.notes = [
                ...(Array.isArray(ex?.notes) ? ex.notes : []),
                [ex?.company?.name, ex?.company?.website].filter(Boolean).join(' • ')
              ].filter(Boolean).slice(0, 10)
            }
            if (ex?.location) {
              // Store as notes; commit() will currently ignore but safe to keep for future mapping
              patchBody.notes = [...(patchBody.notes || []), [ex.location.city, ex.location.country, ex.location.type].filter(Boolean).join(' • ')].filter(Boolean).slice(0, 10)
            }
            await fetch(`${API_BASE}/v1/applications/drafts/${draft_id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(patchBody),
            })
          }
        } catch (e) {
          console.warn('[Huntier:bg] draft enrich failed', e)
        }
        // 3) Commit draft to application
        const commit = await fetch(`${API_BASE}/v1/applications/drafts/${draft_id}/commit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const app = await commit.json()
        console.log('[Huntier:bg] committed draft -> application', { id: app?.id, company_id: app?.company_id })
        // 3.5) Optionally update platform_job_id to prevent duplicates in future
        try {
          const platform_job_id: string | null | undefined = message?.platform_job_id
          if (platform_job_id) {
            await fetch(`${API_BASE}/v1/applications/${app.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ platform_job_id })
            })
          }
        } catch {}
        // 4) Optional stage transition (e.g., wishlist)
        if (message?.stage) {
          try {
            await fetch(`${API_BASE}/v1/applications/${app.id}/transition`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ to_stage: message.stage }),
            })
            console.log('[Huntier:bg] transitioned stage', message.stage)
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
        console.log('[Huntier:bg] creating application (raw)', message.body)
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


