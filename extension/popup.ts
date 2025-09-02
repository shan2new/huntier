export {}
const c: any = (globalThis as any).chrome
const APP_ORIGIN = (self as any).VITE_APP_ORIGIN || 'http://localhost:3000'

async function getToken(): Promise<string | null> {
  return new Promise((resolve) => {
    c.storage.local.get(['huntier_auth'], (r: any) => {
      resolve((r.huntier_auth && r.huntier_auth.token) || null)
    })
  })
}

async function connect() {
  const url = `${APP_ORIGIN}/extension/connect?extId=${c.runtime.id}`
  await c.tabs.create({ url, active: true })
}

function updateStatus(token: string | null) {
  const status = document.getElementById('status')!
  const connectButton = document.getElementById('connect') as HTMLButtonElement
  
  if (token) {
    status.textContent = '✅ Connected to Huntier'
    status.style.background = '#ecfdf5'
    status.style.borderColor = '#10b981'
    status.style.color = '#065f46'
    connectButton.textContent = 'Reconnect account'
    connectButton.style.background = '#6b7280'
  } else {
    status.textContent = '🔗 Connect your Huntier account to get started'
    status.style.background = '#f9fafb'
    status.style.borderColor = '#e5e7eb'
    status.style.color = '#6b7280'
    connectButton.textContent = 'Connect account'
    connectButton.style.background = '#111827'
  }
}

document.getElementById('connect')?.addEventListener('click', connect)

getToken().then(updateStatus)


