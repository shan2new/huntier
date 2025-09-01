export {}
// Prefer direct chrome API in content scripts
function getJobContext(): { title?: string; company?: string; url: string } {
  const url = location.href
  const title = (document.querySelector('h1')?.textContent || '').trim()
  const company = (
    document.querySelector('[data-company], .company, .job-company, [itemprop="hiringOrganization"]')?.textContent || ''
  ).trim()
  return { title, company, url }
}

async function request<T = any>(type: string, payload?: any): Promise<T> {
  return new Promise((resolve) => {
    if (!(globalThis as any)?.chrome?.runtime?.sendMessage) {
      console.warn('[Huntier:cs] chrome.runtime.sendMessage unavailable')
      resolve({ ok: false, error: 'no_runtime' } as any)
      return
    }
    const msg = { type, ...((payload ?? {}) as any) }
    ;(globalThis as any).chrome.runtime.sendMessage(msg, (resp: any) => {
      if (!resp || resp.ok === false) {
        console.warn('[Huntier:cs] request failed', type, resp?.error)
      }
      resolve(resp as any)
    })
  })
}

function injectButtons() {
  if (document.getElementById('huntier-btn-save')) return
  const container = document.body
  const bar = document.createElement('div')
  bar.style.position = 'fixed'
  bar.style.bottom = '16px'
  bar.style.right = '16px'
  bar.style.zIndex = '2147483647'
  bar.style.display = 'flex'
  bar.style.gap = '8px'

  const btnSave = document.createElement('button')
  btnSave.id = 'huntier-btn-save'
  btnSave.textContent = 'Save to Huntier'
  btnSave.style.padding = '8px 12px'
  btnSave.style.borderRadius = '8px'
  btnSave.style.background = '#111827'
  btnSave.style.color = 'white'
  btnSave.style.border = '1px solid rgba(255,255,255,0.2)'
  const feedback = document.createElement('div')
  feedback.style.position = 'fixed'
  feedback.style.bottom = '64px'
  feedback.style.right = '16px'
  feedback.style.zIndex = '2147483647'
  feedback.style.padding = '8px 10px'
  feedback.style.borderRadius = '8px'
  feedback.style.background = 'rgba(17,24,39,0.9)'
  feedback.style.color = 'white'
  feedback.style.fontSize = '12px'
  feedback.style.display = 'none'
  function showFeedback(text: string) {
    feedback.textContent = text
    feedback.style.display = 'block'
    setTimeout(() => { feedback.style.display = 'none' }, 3000)
  }

  btnSave.onclick = async () => {
    showFeedback('Saving via AI…')
    let resp = await request('huntier:save-application-ai', { stage: 'wishlist' })
    if (!(resp as any)?.ok) {
      await request('huntier:get-token')
      resp = await request('huntier:save-application-ai', { stage: 'wishlist' })
    }
    if ((resp as any)?.ok) {
      showFeedback('Saved to Huntier')
      console.log('[Huntier:cs] saved application', (resp as any).data)
    } else {
      showFeedback('Save failed')
    }
  }

  const btnApply = document.createElement('button')
  btnApply.textContent = 'Apply'
  btnApply.style.padding = '8px 12px'
  btnApply.style.borderRadius = '8px'
  btnApply.style.background = 'white'
  btnApply.style.color = '#111827'
  btnApply.style.border = '1px solid rgba(0,0,0,0.15)'
  btnApply.onclick = () => {
    // Heuristic auto-click common buttons
    const sel = [
      'button[aria-label*="apply" i]',
      'button:matches(#apply, .apply, [data-qa="apply"]), button:has-text("Apply")',
      'a:has-text("Apply")',
      'button[title*="Apply" i]'
    ]
    for (const s of sel) {
      try {
        const el = document.querySelector(s as any) as HTMLElement | null
        if (el) {
          el.click()
          break
        }
      } catch {}
    }
  }

  bar.appendChild(btnSave)
  bar.appendChild(btnApply)
  container.appendChild(bar)
  container.appendChild(feedback)
}

function listenHandshakeRelay() {
  window.addEventListener('message', (ev) => {
    if (ev?.data?.source === 'huntier-connect' && ev?.data?.token) {
      // Forward to the extension background to persist
      ;(globalThis as any).chrome?.runtime?.sendMessage?.({ type: 'huntier-token', token: ev.data.token })
    }
  })
}

listenHandshakeRelay()
injectButtons()


