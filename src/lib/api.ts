export type Company = { id: string; name: string; website_url: string; logo_blob_base64?: string | null }
export type Platform = { id: string; name: string; url: string; logo_blob_base64?: string | null }
export type ApplicationListItem = {
  id: string
  company_id: string
  company?: Company | null
  role: string
  job_url: string
  platform_id: string | null
  source: string
  stage: string
  milestone: string
  created_at: string
  last_activity_at: string
  notes?: string | null
}

const BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api'

export async function apiWithToken<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...(init || {}),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}), Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

export async function transitionStage(token: string, id: string, to_stage: string, reason?: string) {
  return apiWithToken(`/v1/applications/${id}/transition`, token, {
    method: 'POST',
    body: JSON.stringify({ to_stage, reason }),
  })
}

// Applications detail helpers
export async function getApplication<T>(token: string, id: string): Promise<T> {
  return apiWithToken(`/v1/applications/${id}`, token)
}

export async function patchApplication<T>(token: string, id: string, body: any): Promise<T> {
  return apiWithToken(`/v1/applications/${id}`, token, { method: 'PATCH', body: JSON.stringify(body) })
}

// Conversations
export async function listConversations<T>(token: string, appId: string, limit = 50): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/conversations?limit=${limit}`, token)
}

export async function addConversation<T>(
  token: string,
  appId: string,
  body: { contact_id?: string; medium: string; direction: string; text: string; occurred_at?: string },
): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/conversations`, token, { method: 'POST', body: JSON.stringify(body) })
}

// Interviews
export async function listInterviews<T>(token: string, appId: string): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/interviews`, token)
}

export async function scheduleInterview<T>(
  token: string,
  appId: string,
  body: { type: string; scheduled_at: string; mode: string },
): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/interviews`, token, { method: 'POST', body: JSON.stringify(body) })
}

// Platforms
export async function listPlatforms<T>(token: string): Promise<T> {
  return apiWithToken(`/v1/platforms`, token)
}

// Companies
export async function searchCompanies<T>(token: string, search?: string): Promise<T> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiWithToken(`/v1/companies${query}`, token)
}

export async function createCompany<T>(token: string, website_url: string): Promise<T> {
  return apiWithToken(`/v1/companies`, token, { 
    method: 'POST', 
    body: JSON.stringify({ website_url }) 
  })
}

// Single company by id
export async function getCompanyById<T>(token: string, id: string): Promise<T> {
  return apiWithToken(`/v1/companies/${id}`, token)
}

// Profile (theme)
export type UserProfile = { notice_period_days?: number | null; earliest_join_date?: string | null; theme?: 'light' | 'dark' | null }
export async function getProfile<T = UserProfile>(token: string): Promise<T> {
  return apiWithToken(`/v1/profile`, token)
}
export async function updateProfile<T = UserProfile>(token: string, body: Partial<UserProfile>): Promise<T> {
  return apiWithToken(`/v1/profile`, token, { method: 'PATCH', body: JSON.stringify(body) })
}


