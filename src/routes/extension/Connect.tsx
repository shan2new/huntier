import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

export function ExtensionConnectPage() {
  const { getToken, isSignedIn } = useAuth()
  const [status, setStatus] = useState<'idle' | 'fetching' | 'sent' | 'error' | 'needs-auth'>(
    'idle',
  )

  const extId = useMemo(() => new URLSearchParams(window.location.search).get('extId') || '', [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!isSignedIn) {
        setStatus('needs-auth')
        return
      }
      setStatus('fetching')
      try {
        const token = (await getToken({ template: 'dev-jwt' }).catch(() => getToken())) || ''
        if (!token) throw new Error('No token')

        // Try to deliver token directly to the extension (preferred)
        try {
          const runtime = (window as any)?.chrome?.runtime
          if (extId && runtime?.sendMessage) {
            runtime.sendMessage(extId, { type: 'huntier-token', token })
          }
        } catch {}

        // Fallback: post back to opener/tab for content-script relay
        try {
          window.opener?.postMessage({ source: 'huntier-connect', token }, '*')
          window.postMessage({ source: 'huntier-connect', token }, '*')
        } catch {}

        if (!cancelled) setStatus('sent')
      } catch (e) {
        if (!cancelled) setStatus('error')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [extId, getToken, isSignedIn])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="rounded-xl p-6 border border-border bg-card max-w-sm text-center">
        {status === 'needs-auth' ? (
          <div>
            <h2 className="text-lg font-semibold mb-2">Sign in required</h2>
            <p className="text-sm text-muted-foreground">
              Please sign in to Huntier, then re-open this page from the extension.
            </p>
          </div>
        ) : null}
        {status === 'fetching' ? (
          <div className="text-sm text-muted-foreground">Retrieving secure token…</div>
        ) : null}
        {status === 'sent' ? (
          <div className="text-sm">Connected to the Huntier extension. You can close this tab.</div>
        ) : null}
        {status === 'error' ? (
          <div className="text-sm text-red-500">Failed to connect. Please try again.</div>
        ) : null}
      </div>
    </div>
  )
}

export default ExtensionConnectPage


