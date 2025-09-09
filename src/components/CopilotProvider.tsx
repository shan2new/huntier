import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { CopilotKit } from '@copilotkit/react-core'
import type { PropsWithChildren } from 'react'

export function CopilotProvider({ children }: PropsWithChildren) {
  const { getToken, isSignedIn, isLoaded } = useAuth()
  const [authToken, setAuthToken] = useState<string | null>(null)
  const runtimeUrl = (import.meta as any).env.VITE_COPILOT_RUNTIME_URL || '/api/copilotkit/chat'

  useEffect(() => {
    ;(async () => {
      try {
        if (!isLoaded || !isSignedIn) {
          setAuthToken(null)
          return
        }
        const token = await getToken()
        setAuthToken(token)
        if (typeof window !== 'undefined') {
          ;(window as any).__getAuthToken = async () => (await getToken()) || ''
        }
      } catch {
        setAuthToken(null)
      }
    })()
  }, [getToken, isLoaded, isSignedIn])

  return (
    <CopilotKit runtimeUrl={runtimeUrl} properties={{ authorization: authToken }}>
      {children}
    </CopilotKit>
  )
}

export default CopilotProvider


