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

document.getElementById('connect')?.addEventListener('click', connect)

getToken().then((t) => {
  const status = document.getElementById('status')!
  status.textContent = t ? 'Connected' : 'Not connected'
})


