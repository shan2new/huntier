import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/chrome-extension'

// Use chrome alias to avoid polluting global types
const c: any = (globalThis as any).chrome

const APP_ORIGIN = 'https://huntier.pro'

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

function connect() {
  const url = `${APP_ORIGIN}/extension/connect?extId=${c.runtime.id}`
  c.tabs.create({ url, active: true })
}

function openDashboard() {
  c.tabs.create({ url: `${APP_ORIGIN}/dashboard`, active: true })
}

function useStoredState() {
  const [token, setToken] = useState<string | null>(null)
  const [settings, setSettingsState] = useState<Settings>({})
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [t, s] = await Promise.all([getToken(), getSettings()])
      if (!mounted) return
      setToken(t)
      setSettingsState(s)
    })()
    return () => {
      mounted = false
    }
  }, [])
  return { token, settings, setToken, setSettingsState }
}

function PopupApp() {
  const { token, settings, setSettingsState } = useStoredState()
  const enabled = settings.helperEnabled !== false

  async function onToggleHelper(on: boolean) {
    await setSettings({ helperEnabled: on })
    setSettingsState((s) => ({ ...s, helperEnabled: on }))
    try {
      const [active] = await c.tabs.query({ active: true, currentWindow: true })
      if (active?.id) {
        c.runtime.sendMessage({ type: 'huntier:toggle-helper', enabled: on, tabId: active.id })
      }
    } catch {}
  }

  return (
    <div className="root">
      <div className="logo-container">
        <img src="logo192.png" alt="Huntier" className="logo" width={48} height={48} />
        <div style={{ marginLeft: 'auto' }}>
          <SignedOut>
            <SignInButton mode="modal" />
          </SignedOut>
          <SignedIn>
            <UserButton />
            <TokenSync />
          </SignedIn>
        </div>
      </div>
      <p id="status" className={`status ${token ? 'status-success' : ''}`}>
        {token ? '✅ Connected to Huntier' : '🔗 Connect your Huntier account to get started'}
      </p>
      <div className="stack mt-2">
        <label className="switch" title="Show floating helper on pages">
          <input
            id="helper-toggle"
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggleHelper(e.currentTarget.checked)}
          />
          <span className="muted" id="helper-label">{enabled ? 'Page helper: On' : 'Page helper: Off'}</span>
        </label>
        <div className="buttons">
          <button id="open-dashboard" className="btn btn-secondary" title="Open Huntier dashboard" onClick={openDashboard}>
            Dashboard
          </button>
          <button id="connect" className="btn btn-primary" title="Connect your account" onClick={connect}>
            {token ? 'Reconnect' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TokenSync() {
  const { isSignedIn, getToken } = useAuth()
  useEffect(() => {
    let cancelled = false
    if (!isSignedIn) return
    ;(async () => {
      try {
        const t = await getToken()
        if (!cancelled && t) {
          c.runtime.sendMessage({ type: 'huntier-token', token: t })
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [isSignedIn, getToken])
  return null
}

function mount() {
  const EXTENSION_URL = c.runtime.getURL('.')
  const publishableKey =
    (globalThis as any).__HUNTIER_CLERK_PUBLISHABLE_KEY__ ||
    (import.meta as any)?.env?.VITE_CLERK_PUBLISHABLE_KEY ||
    (process as any)?.env?.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    // Fail gently with UI text so users know they need to configure the key
    const el = document.getElementById('root') || document.body.appendChild(document.createElement('div'))
    el.id = 'root'
    el.innerHTML = '<div style="padding:12px;font-family:sans-serif;color:#b91c1c">Clerk publishable key missing. Set VITE_CLERK_PUBLISHABLE_KEY.</div>'
    return
  }

  const rootEl = document.getElementById('root') || document.body.appendChild(document.createElement('div'))
  rootEl.id = 'root'
  const root = createRoot(rootEl)
  root.render(
    <ClerkProvider
      publishableKey={String(publishableKey)}
      afterSignOutUrl={`${EXTENSION_URL}/popup.html`}
      signInFallbackRedirectUrl={`${EXTENSION_URL}/popup.html`}
      signUpFallbackRedirectUrl={`${EXTENSION_URL}/popup.html`}
      syncHost={APP_ORIGIN}
    >
      <PopupApp />
    </ClerkProvider>
  )
}

mount()


