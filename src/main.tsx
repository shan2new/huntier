import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from '@tanstack/react-router'
import { ClerkProvider } from '@clerk/clerk-react'
import { router } from './router'
import CopilotProvider from '@/components/CopilotProvider'
import { Toaster } from '@/components/ui/toaster'
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary'
import { makeStore } from '@/store'
 
// CopilotKit styles (chat sidebar UI)
import '@copilotkit/react-ui/styles.css'

import './index.css'

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  const clerkKey = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY
  const store = makeStore()
  root.render(
    <StrictMode>
      <ClerkProvider 
        publishableKey={clerkKey}
      >
        <GlobalErrorBoundary>
          <Provider store={store}>
            <CopilotProvider>
              <RouterProvider router={router} />
            </CopilotProvider>
          </Provider>
          <Toaster />
        </GlobalErrorBoundary>
      </ClerkProvider>
    </StrictMode>,
  )
}
