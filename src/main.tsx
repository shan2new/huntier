import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { ClerkProvider } from '@clerk/clerk-react'
import { router } from './router'
import { Toaster } from '@/components/ui/toaster'
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary'
import { ReauthProvider } from '@/components/ReauthProvider'
import './index.css'

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  const clerkKey = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY
  root.render(
    <StrictMode>
      <ClerkProvider 
        publishableKey={clerkKey}
      >
        <GlobalErrorBoundary>
          <ReauthProvider>
            <RouterProvider router={router} />
          </ReauthProvider>
          <Toaster />
        </GlobalErrorBoundary>
      </ClerkProvider>
    </StrictMode>,
  )
}
