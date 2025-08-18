export type Company = {
  id: string
  name: string
  website_url: string
  logo_blob_base64?: string | null
  // Optional enriched fields
  founded_year?: string | null
  hq?: { city?: string; country?: string } | null
  industries?: Array<string> | null
  domain?: string | null
  description?: string | null
}
export type RoleSuggestion = { role: string; reason?: string; confidence?: number }
export type RoleSuggestionResponse = { suggestions: Array<RoleSuggestion> }
export type Platform = { id: string; name: string; url: string; logo_blob_base64?: string | null }
export type ApplicationCompensation = {
  fixed_min_lpa?: string | null
  fixed_max_lpa?: string | null
  var_min_lpa?: string | null
  var_max_lpa?: string | null
  tentative_ctc_note?: string | null
}

export type ApplicationListItem = {
  id: string
  company_id: string
  company?: Company | null
  role: string
  job_url: string
  platform_id: string | null
  platform?: Platform | null
  source: string
  stage: string
  milestone: string
  created_at: string
  last_activity_at: string
  notes?: string | null
  compensation?: ApplicationCompensation | null
}

const BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api'

export async function apiWithToken<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...(init || {}),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}), Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    let message = `${res.status}`
    try {
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        message = (data && (data.message || data.error)) || text || message
      } catch {
        message = text || message
      }
    } catch {}
    const err: any = new Error(message)
    err.status = res.status
    throw err
  }
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

// Application Contacts
export type ApplicationContactAddBody = {
  contact_id?: string
  contact?: { name: string; title?: string | null; channels?: Array<{ medium: string; channel_value: string }> }
  role: 'recruiter' | 'referrer' | 'hiring_manager' | 'interviewer' | 'other'
  is_primary?: boolean
}

export async function listApplicationContacts<T>(token: string, appId: string): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/contacts`, token)
}

export async function addApplicationContact<T>(token: string, appId: string, body: ApplicationContactAddBody): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/contacts`, token, { method: 'POST', body: JSON.stringify(body) })
}

// Platforms
export async function listPlatforms<T>(token: string): Promise<T> {
  return apiWithToken(`/v1/platforms`, token)
}

// New: POST /v1/platforms/search - AI-assisted search by platform name
export async function searchPlatformsByName<T>(token: string, query: string): Promise<T> {
  return apiWithToken(`/v1/platforms/search`, token, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
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

// New: POST /v1/companies/search - search by company name (AI-assisted)
export async function searchCompaniesByName<T>(token: string, query: string): Promise<T> {
  return apiWithToken(`/v1/companies/search`, token, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

// Single company by id
export async function getCompanyById<T>(token: string, id: string): Promise<T> {
  return apiWithToken(`/v1/companies/${id}`, token)
}

// Profile
export type UserProfile = { 
  notice_period_days?: number | null; 
  earliest_join_date?: string | null; 
  theme?: 'light' | 'dark' | null;
  current_role?: string | null;
  // Deprecated free-text field retained for backward compatibility
  current_company?: string | null;
  // New canonical company reference
  current_company_id?: string | null;
  // Hydrated company entity when available (server loads relation)
  company?: Company | null;
  persona?: 'student' | 'intern' | 'professional' | null;
  persona_info?: Record<string, any> | null;
}
export async function getProfile<T = UserProfile>(token: string): Promise<T> {
  return apiWithToken(`/v1/profile`, token)
}
export async function updateProfile<T = UserProfile>(token: string, body: Partial<UserProfile>): Promise<T> {
  return apiWithToken(`/v1/profile`, token, { method: 'PATCH', body: JSON.stringify(body) })
}

// Role suggestions
export async function getRoleSuggestions(
  token: string,
  companyId: string,
  body?: { current_role?: string | null; current_company?: string | null }
): Promise<RoleSuggestionResponse> {
  return apiWithToken(`/v1/companies/${companyId}/role-suggestions`, token, { 
    method: 'POST', 
    body: JSON.stringify(body || {})
  })
}


