import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'

const LOCAL_KEY = 'mail_scope_check_complete'

export function ReauthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user } = useUser()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isSignedIn) {
      localStorage.removeItem(LOCAL_KEY)
      setReady(true)
      return
    }

    const flag = localStorage.getItem(LOCAL_KEY)
    if (flag) {
      setReady(true)
      return
    }

    const google = user.externalAccounts.find((ea) => String(ea.provider).includes('google')) as any
    if (!google) {
      setReady(true)
      return
    }

    // Determine required scopes dynamically from user.publicMetadata
    const requiredAdditional = ((user as any)?.publicMetadata?.additionalScopes as Array<string> | undefined) || []
    const requiredScopes = ['https://www.googleapis.com/auth/gmail.readonly', ...requiredAdditional]

    const approvedStr = (google.approvedScopes || google.approved_scopes || '') as string
    const approved = approvedStr ? approvedStr.split(' ') : []
    const hasAll = requiredScopes.every((s) => approved.includes(s))
    if (hasAll) {
      localStorage.setItem(LOCAL_KEY, '1')
      setReady(true)
      return
    }

    ;(async () => {
      try {
        const res = await google.reauthorize?.({ redirectUrl: window.location.href, additionalScopes: requiredScopes })
        const redirect = (res?.verification?.externalVerificationRedirectURL?.href) || (res?.verification?.external_verification_redirect_url)
        if (redirect) window.location.href = redirect
      } catch {
        setReady(true)
      }
    })()
  }, [isSignedIn, user])

  if (!ready) return null
  return <>{children}</>
}


