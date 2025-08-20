import { useEffect, useState } from 'react'
import { useAuthToken } from '@/lib/auth'

export function TokenDebug() {
  const { getToken } = useAuthToken()
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean
    expiresIn: number | null
    lastFetch: Date | null
  }>({
    hasToken: false,
    expiresIn: null,
    lastFetch: null,
  })

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await getToken()
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const expiresAt = payload.exp * 1000
          const now = Date.now()
          const expiresIn = Math.round((expiresAt - now) / 1000)
          
          setTokenInfo({
            hasToken: true,
            expiresIn,
            lastFetch: new Date(),
          })
        }
      } catch (error) {
        setTokenInfo({
          hasToken: false,
          expiresIn: null,
          lastFetch: new Date(),
        })
      }
    }

    checkToken()
    
    // Check token every 30 seconds
    const interval = setInterval(checkToken, 30000)
    return () => clearInterval(interval)
  }, [getToken])

  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div>Token: {tokenInfo.hasToken ? '✅' : '❌'}</div>
      {tokenInfo.expiresIn !== null && (
        <div>Expires: {tokenInfo.expiresIn}s</div>
      )}
      {tokenInfo.lastFetch && (
        <div>Last: {tokenInfo.lastFetch.toLocaleTimeString()}</div>
      )}
    </div>
  )
}
