// Injected into the page main world at document_start. Hooks fetch & XHR to emit network logs.
;(() => {
  if ((window as any).__huntierNetworkHookInstalled) return
  ;(window as any).__huntierNetworkHookInstalled = true

  function safePost(entry: any) {
    try {
      window.postMessage({ source: 'huntier', type: 'huntier:network-log', entry }, '*')
    } catch {}
  }

  function shouldCapture(url: string, headers?: Record<string, string | null | undefined>): boolean {
    try {
      const u = new URL(url, location.href)
      const path = (u.pathname || '').toLowerCase()
      if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|woff2?|ttf|otf|mp4|m3u8|mp3)$/i.test(path)) return false
      const host = u.hostname
      if (!host) return false
      const ct = (headers?.['content-type'] || headers?.['Content-Type'] || '').toString().toLowerCase()
      if (ct.includes('json')) return true
      if (path.includes('api') || path.includes('graphql') || path.includes('jobs') || path.includes('positions')) return true
      console.log('shouldCapture', url, headers)
      return false
    } catch { return false }
  }

  // Hook fetch
  try {
    const origFetch = window.fetch
    window.fetch = async (...args: Array<any>) => {
      let url = ''
      let method = 'GET'
      let reqHeaders: Record<string, string> = {}
      let reqBodyPreview: string | undefined
      console.log('fetch', args)
      try {
        if (typeof args[0] === 'string') url = args[0]
        else if (args[0]?.url) url = String(args[0].url)
        if (args[1]?.method) method = String(args[1].method)
        const h = (args[1]?.headers || args[0]?.headers)
        if (h && typeof (h as any).forEach === 'function') (h as any).forEach((v: string, k: string) => { reqHeaders[k] = v })
        else if (h && typeof h === 'object') reqHeaders = { ...(h as any) }
        if (typeof args[1]?.body === 'string' && (args[1]?.body as string).length < 5000) {
          reqBodyPreview = args[1].body
        }
      } catch {}

      const res = await origFetch.apply(window, args as any)
      console.log('res', res)
      try {
        const clone = res.clone()
        const resHeaders: Record<string, string> = {}
        ;(clone.headers as any)?.forEach?.((v: string, k: string) => { resHeaders[k] = v })
        if (!shouldCapture(url, resHeaders)) return res
        const isJson = (resHeaders['content-type'] || '').toLowerCase().includes('json')
        let payload: any = null
        try {
          payload = isJson ? await clone.json() : await clone.text()
        } catch {
          try { payload = await clone.text() } catch {}
        }
        safePost({ kind: 'fetch', ts: Date.now(), url, method, status: res.status, request: { headers: reqHeaders, body_preview: reqBodyPreview }, response: { headers: resHeaders, body: payload } })
      } catch {}
      return res
    }
  } catch {}

  // Hook XHR
  try {
    const origOpen = XMLHttpRequest.prototype.open
    const origSend = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.open = function(method: string, url: string) {
      console.log('open', method, url)
      ;(this as any).__huntier = { method, url, ts: Date.now() }
      return origOpen.apply(this, arguments as any)
    }
    XMLHttpRequest.prototype.send = function(body?: Document | BodyInit | null) {
      const ctx = (this as any).__huntier || {}
      const reqBodyPreview = typeof body === 'string' && body.length < 5000 ? body : undefined
      console.log('send', ctx.url, ctx.method, reqBodyPreview)
      this.addEventListener('loadend', function() {
        try {
          const url: string = ctx.url || this.responseURL
          const method: string = ctx.method || 'GET'
          const status: number = (this as any).status
          const ct = String(this.getResponseHeader('content-type') || '').toLowerCase()
          if (!shouldCapture(url, { 'content-type': ct })) return
          let payload: any = null
          try {
            payload = ct.includes('json') ? JSON.parse((this as any).responseText || 'null') : (this as any).responseText
          } catch { payload = (this as any).responseText }
          safePost({ kind: 'xhr', ts: Date.now(), url, method, status, request: { body_preview: reqBodyPreview }, response: { headers: { 'content-type': ct }, body: payload } })
        } catch {}
      })
      return origSend.apply(this, arguments as any)
    }
  } catch {}
})()


