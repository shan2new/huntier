export class NetworkLogStore {
  private logsByTab = new Map<number, any[]>()

  add(tabId: number, entry: any) {
    const arr = this.logsByTab.get(tabId) || []
    arr.push({ ...entry, tabId })
    if (arr.length > 200) arr.splice(0, arr.length - 200)
    this.logsByTab.set(tabId, arr)
  }

  getRaw(tabId: number | undefined | null): any[] { return tabId ? (this.logsByTab.get(tabId) || []) : [] }

  private estimateSize(obj: any): number { try { return JSON.stringify(obj).length } catch { return 0 } }

  private prunePayload(payload: any): any {
    try {
      if (typeof payload === 'string') return payload.length > 10000 ? payload.slice(0, 10000) : payload
      if (Array.isArray(payload)) return payload.slice(0, Math.min(payload.length, 5))
      if (payload && typeof payload === 'object') {
        const out: any = {}
        for (const [k, v] of Object.entries(payload)) {
          if (Array.isArray(v)) out[k] = v.slice(0, Math.min(v.length, 5))
          else if (typeof v === 'string') out[k] = v.length > 8000 ? v.slice(0, 8000) : v
          else out[k] = v
        }
        return out
      }
    } catch {}
    return payload
  }

  condense(entries: any[]): any[] {
    if (!Array.isArray(entries) || entries.length === 0) return []
    const denyHosts = ['mixpanel.com','segment.com','amplitude.com','google-analytics.com','analytics.google.com','doubleclick.net','hotjar.com','intercom.io','clarity.ms']
    const keywords = ['job','jobs','position','positions','opening','openings','vacancy','careers','role','graphql']
    const results: any[] = []
    let budget = 120_000
    const urlHost = (u: string) => { try { return new URL(u).hostname } catch { return '' } }
    const sorted = [...entries].sort((a, b) => {
      const ac = String(a?.response?.headers?.['content-type'] || a?.response?.headers?.['Content-Type'] || a?.response?.content_type || '').includes('json') ? 1 : 0
      const bc = String(b?.response?.headers?.['content-type'] || b?.response?.headers?.['Content-Type'] || b?.response?.content_type || '').includes('json') ? 1 : 0
      const ah = keywords.some(k => String(a?.url || '').toLowerCase().includes(k)) ? 1 : 0
      const bh = keywords.some(k => String(b?.url || '').toLowerCase().includes(k)) ? 1 : 0
      return (bc + bh) - (ac + ah)
    })
    for (const e of sorted) {
      const host = urlHost(String(e?.url || ''))
      if (!host || denyHosts.some(h => host.endsWith(h))) continue
      const status = Number(e?.status || 0)
      if (status < 200 || status >= 300) continue
      const ct = String(e?.response?.headers?.['content-type'] || e?.response?.headers?.['Content-Type'] || e?.response?.content_type || '').toLowerCase()
      if (!ct.includes('json')) continue
      const simplified: any = {
        url: String(e.url || ''),
        method: String(e.method || 'GET'),
        status,
        response: { content_type: ct, body: this.prunePayload(e?.response?.body) },
      }
      let size = this.estimateSize(simplified)
      if (size > 25_000) {
        simplified.response.body = this.prunePayload(simplified.response.body)
        size = this.estimateSize(simplified)
      }
      if (budget - size <= 0) break
      budget -= size
      results.push(simplified)
      if (results.length >= 12) break
    }
    if (results.length === 0) {
      for (const e of entries) {
        const ct = String(e?.response?.headers?.['content-type'] || e?.response?.headers?.['Content-Type'] || e?.response?.content_type || '').toLowerCase()
        if (!ct.includes('json')) continue
        const simplified: any = { url: String(e.url||''), method: String(e.method||'GET'), status: Number(e.status||0), response: { content_type: ct, body: this.prunePayload(e?.response?.body) } }
        const size = this.estimateSize(simplified)
        if (size < 25_000) { results.push(simplified); break }
      }
    }
    return results
  }

  getCondensed(tabId: number | undefined | null): any[] {
    return this.condense(this.getRaw(tabId))
  }

  pickLikelyJobEntries(entries: any[]): any[] {
    try {
      const scored = entries.map((e) => {
        const url = String(e?.url || '').toLowerCase()
        const body = e?.response?.body
        const ct = String(e?.response?.content_type || '').toLowerCase()
        let score = 0
        if (ct.includes('json')) score += 2
        if (/lever\.co\/api\/postings\//.test(url)) score += 10
        if (/greenhouse\.io|gh\/boards|\/boards\//.test(url) && url.includes('jobs')) score += 8
        if (/ashbyhq\.com|ashby/.test(url) && (url.includes('graphql') || url.includes('jobs'))) score += 6
        if (/workday/.test(url) && /job|posting|jobPostings/i.test(url)) score += 6
        if (/wellfound|angel|angellist/.test(url)) score += 4
        if (/indeed|naukri|linkedin/.test(url)) score += 2
        try {
          if (body && typeof body === 'object') {
            const keys = Object.keys(body)
            const keyStr = keys.join(',').toLowerCase()
            if (keyStr.includes('job') || keyStr.includes('posting')) score += 3
            if ('title' in body) score += 2
            if ('company' in body || 'employer' in body) score += 2
            if ('location' in body) score += 1
            if (Array.isArray((body as any).jobs) || Array.isArray((body as any).postings)) score += 2
          }
        } catch {}
        return { e, score }
      })
      const sorted = scored.sort((a, b) => b.score - a.score)
      return sorted.slice(0, 2).filter((x) => x.score > 0).map((x) => x.e)
    } catch { return [] }
  }
}


