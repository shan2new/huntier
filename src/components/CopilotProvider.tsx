import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { CopilotKit } from '@copilotkit/react-core'
import type { PropsWithChildren } from 'react'

export function CopilotProvider({ children }: PropsWithChildren) {
  const { getToken, isSignedIn, isLoaded } = useAuth()
  const [authToken, setAuthToken] = useState<string | null>(null)
  const runtimeUrl = (import.meta as any).env.VITE_COPILOT_RUNTIME_URL || '/api/copilotkit/chat'

  // Expose a resilient token getter immediately on mount.
  // It waits for Clerk to load and a token to be available, avoiding empty-token 401s on first paint.
  if (typeof window !== 'undefined') {
    ;(window as any).__getAuthToken = async () => {
      for (let i = 0; i < 60; i++) { // ~6s max
        try {
          if (isLoaded && isSignedIn) {
            const t = await getToken()
            if (t) return t
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 100))
      }
      return ''
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        if (!isLoaded || !isSignedIn) {
          setAuthToken(null)
          return
        }
        const token = await getToken()
        setAuthToken(token)
      } catch {
        setAuthToken(null)
      }
    })()
  }, [getToken, isLoaded, isSignedIn])

  return (
    <CopilotKit runtimeUrl={runtimeUrl} properties={{ authorization: authToken }} showDevConsole={false}>
      {children}
    </CopilotKit>
  )
}

export default CopilotProvider


