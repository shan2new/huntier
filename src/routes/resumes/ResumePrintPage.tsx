import { useEffect, useMemo, useState } from 'react'
import ResumePrintDocument from '@/components/resume/ResumePrintDocument'
import '@/components/resume/resume-editor.css'

type Props = { resumeId: string }

type ResumeData = {
  id: string
  name?: string
  personal_info?: Record<string, any>
  sections?: Array<any>
}

export function ResumePrintPage({ resumeId }: Props) {
  const [data, setData] = useState<ResumeData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const search = useMemo(() => new URLSearchParams(globalThis.location?.search || ''), [])
  const token = search.get('token') || ''
  const auto = search.get('auto') === '1'

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const BASE = ((import.meta as any).env.VITE_API_URL as string) || 'http://localhost:3001/api'
        const res = await fetch(`${BASE}/v1/resumes/${resumeId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error(String(res.status))
        const json = await res.json()
        if (!cancelled) setData(json)
        if (auto) {
          setTimeout(() => globalThis.print && globalThis.print(), 50)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load')
      }
    }
    run()
    return () => { cancelled = true }
  }, [resumeId, token, auto])

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>
  }
  if (!data) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>
  }
  return (
    <div className="document-viewer">
      <div className="mx-auto px-8 py-8" style={{ maxWidth: '1600px' }}>
        <div className="w-full max-w-[900px] mx-auto">
          <ResumePrintDocument data={data as any} />
        </div>
      </div>
    </div>
  )
}

export default ResumePrintPage


