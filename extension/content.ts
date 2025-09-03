export {}

type Settings = { helperEnabled?: boolean }

// Ensure network hook is injected into the page main world
function ensureNetworkHook() {
  try {
    const id = 'huntier-network-hook'
    if (document.getElementById(id)) return
    const s = document.createElement('script')
    s.id = id
    s.src = (globalThis as any).chrome?.runtime?.getURL?.('network-hook.js')
    s.type = 'text/javascript'
    s.async = false
    ;(document.head || document.documentElement).appendChild(s)
  } catch {}
}

function ensureOutfitFont() {
  try {
    const id = 'huntier-font-outfit'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');`
    ;(document.head || document.documentElement).appendChild(style)
  } catch {}
}

async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    try {
      (globalThis as any).chrome?.storage?.local?.get?.(['huntier_settings'], (r: any) => {
        resolve((r?.huntier_settings as Settings) || {})
      })
    } catch {
      resolve({})
    }
  })
}

async function request<T = any>(type: string, payload?: any): Promise<T> {
  return new Promise((resolve) => {
    if (!(globalThis as any)?.chrome?.runtime?.sendMessage) {
      resolve({ ok: false, error: 'no_runtime' } as any)
      return
    }
    const msg = { type, ...((payload ?? {}) as any) }
    ;(globalThis as any).chrome.runtime.sendMessage(msg, (resp: any) => {
      resolve(resp as any)
    })
  })
}

let helperDismissed = false

function removeHelper() {
  const bar = document.getElementById('huntier-helper-bar')
  if (bar) try { bar.remove() } catch {}
  const fb = document.getElementById('huntier-feedback')
  if (fb) try { fb.remove() } catch {}
}

function injectButtons() {
  if (document.getElementById('huntier-helper-bar')) return
  ensureOutfitFont()
  const container = document.body
  const bar = document.createElement('div')
  bar.id = 'huntier-helper-bar'
  bar.style.position = 'fixed'
  bar.style.bottom = '16px'
  bar.style.right = '16px'
  bar.style.zIndex = '2147483647'
  bar.style.display = 'flex'
  bar.style.gap = '8px'
  bar.style.background = 'rgba(255,255,255,0.9)'
  bar.style.backdropFilter = 'blur(6px)'
  bar.style.border = '1px solid rgba(0,0,0,0.08)'
  bar.style.borderRadius = '10px'
  bar.style.padding = '6px'
  bar.style.boxShadow = '0 6px 24px rgba(0,0,0,0.15)'
  bar.style.fontFamily = "Outfit, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"

  const btnSave = document.createElement('button')
  btnSave.id = 'huntier-btn-save'
  btnSave.textContent = 'Save to Huntier'
  btnSave.style.padding = '6px'
  btnSave.style.borderRadius = '8px'
  btnSave.style.background = '#111827'
  btnSave.style.color = 'white'
  btnSave.style.border = '1px solid rgba(255,255,255,0.2)'
  const saveDefaultLabel = 'Save to Huntier'
  function setSaving(saving: boolean, label?: string) {
    btnSave.disabled = saving
    btnSave.style.opacity = saving ? '0.7' : '1'
    btnSave.style.cursor = saving ? 'wait' : 'pointer'
    btnSave.textContent = label || (saving ? 'Saving…' : saveDefaultLabel)
  }

  const btnApply = document.createElement('button')
  btnApply.textContent = 'Apply'
  btnApply.style.padding = '6px'
  btnApply.style.borderRadius = '8px'
  btnApply.style.background = 'white'
  btnApply.style.color = '#111827'
  btnApply.style.border = '1px solid rgba(0,0,0,0.15)'

  const btnClose = document.createElement('button')
  btnClose.textContent = '×'
  btnClose.title = 'Hide helper'
  btnClose.style.width = '24px'
  btnClose.style.height = '24px'
  btnClose.style.lineHeight = '22px'
  btnClose.style.textAlign = 'center'
  btnClose.style.borderRadius = '999px'
  btnClose.style.border = '1px solid rgba(0,0,0,0.12)'
  btnClose.style.background = 'white'
  btnClose.style.color = '#111827'

  // remove feedback toast usage in favor of inline spinner on button
  const styleSpin = document.createElement('style')
  styleSpin.textContent = '@keyframes hnt-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}'
  ;(document.head || document.documentElement).appendChild(styleSpin)

  // Removed processing pre-check on load per request

  async function computePlatformJobId(): Promise<string | null> {
    try {
      const u = new URL(location.href)
      const idParam = u.searchParams.get('gh_jid') || u.searchParams.get('lever-origin-jobId') || u.searchParams.get('jobId') || u.searchParams.get('jid')
      const key = `${u.hostname}:${idParam || (u.pathname || '/')}`
      return key.toLowerCase()
    } catch { return null }
  }

  btnSave.onclick = async () => {
    setSaving(true)
    console.log('[Huntier:ext] extracting structured')
    const extracted = extractStructured()
    console.log('[Huntier:ext] extracted', extracted)
    const platform_job_id = await computePlatformJobId()
    console.log('[Huntier:ext] platform_job_id', platform_job_id)
    let resp = await request('huntier:save-application-ai', { stage: 'wishlist', extracted, platform_job_id })
    console.log('[Huntier:ext] resp', resp)
    if (!(resp as any)?.ok) {
      await request('huntier:get-token')
      resp = await request('huntier:save-application-ai', { stage: 'wishlist', extracted, platform_job_id })
    }
    console.log('[Huntier:ext] resp', resp)
    try {
      if ((resp as any)?.ok && (resp as any)?.data?.id) {
        const already = !!(resp as any)?.already_exists
        setSaving(false, already ? 'Saved ✓' : 'Saved ✓')
        setTimeout(() => { btnSave.textContent = 'Re-save' }, 900)
      } else {
        setSaving(false, 'Retry Save')
      }
    } finally {
      if (!(resp as any)?.ok) setSaving(false)
    }
  }

  btnApply.onclick = () => {
    const sel = [
      'button[aria-label*="apply" i]',
      'button:matches(#apply, .apply, [data-qa="apply"]), button:has-text("Apply")',
      'a:has-text("Apply")',
      'button[title*="Apply" i]'
    ]
    for (const s of sel) {
      try {
        const el = document.querySelector(s as any) as HTMLElement | null
        if (el) { el.click(); break }
      } catch {}
    }
  }

  btnClose.onclick = () => {
    helperDismissed = true
    removeHelper()
  }

  bar.appendChild(btnSave)
  bar.appendChild(btnApply)
  bar.appendChild(btnClose)
  container.appendChild(bar)
  // feedback toast removed
}

function extractStructured() {
  const data: any = { title: '', company: {}, location: {} }
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
  for (const s of scripts) {
    try {
      const json = JSON.parse(s.textContent || 'null')
      const nodes = Array.isArray(json) ? json : [json]
      for (const n of nodes) {
        if (!n) continue
        const type = (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).map((x:any)=>String(x).toLowerCase())
        if (type.includes('jobposting')) {
          data.title = data.title || (n.title || '')
          const org = n.hiringOrganization || {}
          data.company.name = data.company.name || org.name || ''
          data.company.website = data.company.website || org.sameAs || org.url || ''
          data.company.logo = data.company.logo || org.logo || ''
          const jl = n.jobLocation || n.jobLocationType || {}
          const addr = (jl.address || n.address) || {}
          data.location.city = data.location.city || addr.addressLocality || ''
          data.location.country = data.location.country || addr.addressCountry || ''
          const jlt = (n.jobLocationType || '').toString().toLowerCase()
          if (jlt.includes('remote')) data.location.type = 'remote'
          else if (jlt.includes('hybrid')) data.location.type = 'hybrid'
          else if (jlt.includes('onsite') || jlt.includes('on-site')) data.location.type = 'onsite'
        }
      }
    } catch {}
  }
  data.title = data.title || (document.querySelector('h1')?.textContent || '').trim()
  const metaUrl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  const ogSite = document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement | null
  const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null
  data.company.website = data.company.website || (ogUrl?.content || metaUrl?.href || '')
  data.company.name = data.company.name || (ogSite?.content || '')
  return data
}

function listenHandshakeRelay() {
  window.addEventListener('message', (ev) => {
    if (ev?.data?.source === 'huntier-connect' && ev?.data?.token) {
      ;(globalThis as any).chrome?.runtime?.sendMessage?.({ type: 'huntier-token', token: ev.data.token })
    }
    if (ev?.data?.source === 'huntier' && ev?.data?.type === 'huntier:network-log') {
      ;(globalThis as any).chrome?.runtime?.sendMessage?.({ type: 'huntier:network-log', entry: ev.data.entry })
    }
  })
}

function listenToggleMessages() {
  try {
    (globalThis as any).chrome?.runtime?.onMessage?.addListener?.((message: any, sender: any, _sendResponse: any) => {
      if (message?.type === 'huntier:toggle-helper' && sender?.tab?.id) {
        const enabled = !!message?.enabled
        if (enabled && !helperDismissed) injectButtons(); else removeHelper()
      }
    })
  } catch {}
}

async function boot() {
  listenHandshakeRelay()
  listenToggleMessages()
  ensureNetworkHook()
  const settings = await getSettings()
  const enabled = settings.helperEnabled !== false
  if (enabled && !helperDismissed) injectButtons()
}

boot()



