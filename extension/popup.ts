export {}
const c: any = (globalThis as any).chrome
const APP_ORIGIN = "https://huntier.pro"

type Settings = { helperEnabled?: boolean }

async function getToken(): Promise<string | null> {
  return new Promise((resolve) => {
    c.storage.local.get(['huntier_auth'], (r: any) => {
      resolve((r.huntier_auth && r.huntier_auth.token) || null)
    })
  })
}

async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    c.storage.local.get(['huntier_settings'], (r: any) => {
      resolve((r.huntier_settings as Settings) || {})
    })
  })
}

async function setSettings(patch: Settings): Promise<void> {
  const cur = await getSettings()
  const next = { ...cur, ...patch }
  await c.storage.local.set({ huntier_settings: next })
}

async function connect() {
  const url = `${APP_ORIGIN}/extension/connect?extId=${c.runtime.id}`
  await c.tabs.create({ url, active: true })
}

async function openDashboard() {
  await c.tabs.create({ url: `${APP_ORIGIN}/dashboard`, active: true })
}

function setStatus(text: string, tone: 'muted' | 'success' | 'warn' = 'muted') {
  const status = document.getElementById('status') as HTMLParagraphElement
  if (!status) return
  status.textContent = text
  status.classList.remove('status-success', 'status-warn')
  if (tone === 'success') status.classList.add('status-success')
  else if (tone === 'warn') status.classList.add('status-warn')
}

function updateStatus(token: string | null) {
  const connectButton = document.getElementById('connect') as HTMLButtonElement
  if (!connectButton) return
  if (token) {
    setStatus('✅ Connected to Huntier', 'success')
    connectButton.textContent = 'Reconnect'
    connectButton.style.background = 'var(--secondary)'
    connectButton.style.color = 'var(--secondary-foreground)'
  } else {
    setStatus('🔗 Connect your Huntier account to get started', 'muted')
    connectButton.textContent = 'Connect'
    connectButton.style.background = 'var(--primary)'
    connectButton.style.color = 'var(--primary-foreground)'
  }
}

async function saveNow() {
  try {
    setStatus('⏳ Saving via AI…', 'muted')
    // Ensure token (background handles interactive flow)
    const resp = await new Promise<any>((resolve) => {
      c.runtime.sendMessage({ type: 'huntier:save-application-ai', stage: 'wishlist' }, (r: any) => resolve(r))
    })
    if (resp?.ok) {
      setStatus('✅ Saved to Huntier', 'success')
    } else {
      setStatus('⚠️ Save failed. Try reconnecting.', 'warn')
    }
  } catch {
    setStatus('⚠️ Save failed. Try again.', 'warn')
  }
}

async function init() {
  const connectBtn = document.getElementById('connect') as HTMLButtonElement | null
  const saveBtn = document.getElementById('save-now') as HTMLButtonElement | null
  const dashBtn = document.getElementById('open-dashboard') as HTMLButtonElement | null
  const toggle = document.getElementById('helper-toggle') as HTMLInputElement | null
  const label = document.getElementById('helper-label') as HTMLElement | null

  connectBtn?.addEventListener('click', connect)
  saveBtn?.addEventListener('click', saveNow)
  dashBtn?.addEventListener('click', openDashboard)

  // Load token + settings
  const [token, settings] = await Promise.all([getToken(), getSettings()])
  updateStatus(token)
  const enabled = settings.helperEnabled !== false
  if (toggle) toggle.checked = enabled
  if (label) label.textContent = enabled ? 'Page helper: On' : 'Page helper: Off'

  // When toggled, persist and notify active tab to reflect immediately
  toggle?.addEventListener('change', async () => {
    const on = !!toggle.checked
    await setSettings({ helperEnabled: on })
    if (label) label.textContent = on ? 'Page helper: On' : 'Page helper: Off'
    try {
      const [active] = await c.tabs.query({ active: true, currentWindow: true })
      if (active?.id) {
        c.runtime.sendMessage({ type: 'huntier:toggle-helper', enabled: on, tabId: active.id })
      }
    } catch {}
  })
}

init()


