import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react'
import { router } from './router'
import './styles.css'

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  const clerkKey = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={clerkKey}>
        <SignedIn>
          <RouterProvider router={router} />
        </SignedIn>
        <SignedOut>
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
            <img src="/logo192.png" alt="brand" className="h-16 w-16 mb-4 opacity-90" />
            <h1 className="text-3xl font-semibold mb-2">Huntier</h1>
            <p className="text-gray-500 max-w-md">Sign in to manage your job hunt.</p>
          </div>
        </SignedOut>
      </ClerkProvider>
    </StrictMode>,
  )
}
