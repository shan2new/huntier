import type { StageObject } from '@/types/application'

export type Company = {
  id: string
  name: string
  website_url: string
  logo_url?: string | null
  // Optional enriched fields
  founded_year?: string | null
  hq?: { city?: string; country?: string } | null
  industries?: Array<string> | null
  domain?: string | null
  description?: string | null
}

export type RoleSuggestion = { role: string; reason?: string; confidence?: number }

export type RoleSuggestionResponse = { suggestions: Array<RoleSuggestion> }
export type Platform = { id: string; name: string; url: string; logo_url?: string | null }
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
  stage: StageObject
  milestone: string
  created_at: string
  last_activity_at: string
  notes?: string | null
  compensation?: ApplicationCompensation | null
}

const BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api'

// Track token refresh attempts to prevent infinite loops
const tokenRefreshAttempts = new Map<string, number>()

// Ensure write payloads never send a full StageObject. We only send the stage id string.
function normalizeStageForWrite<T extends Record<string, any> | undefined>(payload: T): T {
  if (!payload || typeof payload !== 'object') return payload
  const copy: any = { ...(payload as any) }
  if ('stage' in copy) {
    const s = copy.stage
    if (s && typeof s === 'object' && 'id' in s) {
      copy.stage = s.id
    }
  }
  return copy
}

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
    err.needsTokenRefresh = res.status === 401
    
    throw err
  }
  return res.json()
}

// Wrapper function that handles token refresh on 401
export async function apiWithTokenRefresh<T>(
  path: string, 
  getToken: () => Promise<string>, 
  init?: RequestInit
): Promise<T> {
  const requestKey = `${init?.method || 'GET'}:${path}`
  const attempts = tokenRefreshAttempts.get(requestKey) || 0
  
  try {
    // Get a fresh token for each request
    const token = await getToken()
    const result = await apiWithToken<T>(path, token, init)
    
    // Reset attempts on success
    tokenRefreshAttempts.delete(requestKey)
    return result
  } catch (error: any) {
    // If it's a 401 and we haven't retried yet, try once more with a fresh token
    if (error.needsTokenRefresh && attempts < 1) {
      tokenRefreshAttempts.set(requestKey, attempts + 1)
      
      console.log('Token expired, attempting refresh...')
      
      // Wait a bit to ensure Clerk has time to refresh
      await new Promise(resolve => setTimeout(resolve, 100))
      
      try {
        // Force a fresh token fetch
        const freshToken = await getToken()
        const result = await apiWithToken<T>(path, freshToken, init)
        
        // Reset attempts on success
        tokenRefreshAttempts.delete(requestKey)
        return result
      } catch (retryError: any) {
        tokenRefreshAttempts.delete(requestKey)
        
        // If still 401 after refresh attempt, redirect to login
        if (retryError.status === 401) {
          console.warn('Token refresh failed - redirecting to login')
          
          if (typeof window !== 'undefined') {
            // Clear any cached tokens
            localStorage.removeItem('clerk-token-cache')
            sessionStorage.removeItem('clerk-token-cache')
            
            // Redirect to login after a short delay
            setTimeout(() => {
              window.location.href = '/auth'
            }, 1000)
          }
        }
        
        throw retryError
      }
    }
    
    tokenRefreshAttempts.delete(requestKey)
    throw error
  }
}

// Keep old token-based functions for backward compatibility but mark as deprecated
/** @deprecated Use the new functions with getToken parameter instead */
export async function transitionStage(token: string, id: string, to_stage: string, reason?: string) {
  return apiWithToken(`/v1/applications/${id}/transition`, token, {
    method: 'POST',
    body: JSON.stringify({ to_stage, reason }),
  })
}

// New API functions that handle token refresh automatically
export async function transitionStageWithRefresh(
  getToken: () => Promise<string>,
  id: string, 
  to_stage: string, 
  reason?: string
) {
  return apiWithTokenRefresh(`/v1/applications/${id}/transition`, getToken, {
    method: 'POST',
    body: JSON.stringify({ to_stage, reason }),
  })
}

// Applications detail helpers
/** @deprecated Use getApplicationWithRefresh instead */
export async function getApplication<T>(token: string, id: string): Promise<T> {
  return apiWithToken(`/v1/applications/${id}`, token)
}

export async function getApplicationWithRefresh<T>(getToken: () => Promise<string>, id: string): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${id}`, getToken)
}

/** @deprecated Use patchApplicationWithRefresh instead */
export async function patchApplication<T>(token: string, id: string, body: any): Promise<T> {
  return apiWithToken(`/v1/applications/${id}`, token, { method: 'PATCH', body: JSON.stringify(normalizeStageForWrite(body)) })
}

export async function patchApplicationWithRefresh<T>(
  getToken: () => Promise<string>, 
  id: string, 
  body: any
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${id}`, getToken, { 
    method: 'PATCH', 
    body: JSON.stringify(normalizeStageForWrite(body)) 
  })
}

// Conversations
/** @deprecated Use listConversationsWithRefresh instead */
export async function listConversations<T>(token: string, appId: string, limit = 50): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/conversations?limit=${limit}`, token)
}

export async function listConversationsWithRefresh<T>(
  getToken: () => Promise<string>, 
  appId: string, 
  limit = 50
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/conversations?limit=${limit}`, getToken)
}

/** @deprecated Use addConversationWithRefresh instead */
export async function addConversation<T>(
  token: string,
  appId: string,
  body: { contact_id?: string; medium: string; direction: string; text: string; occurred_at?: string },
): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/conversations`, token, { method: 'POST', body: JSON.stringify(body) })
}

export async function addConversationWithRefresh<T>(
  getToken: () => Promise<string>,
  appId: string,
  body: { contact_id?: string; medium: string; direction: string; text: string; occurred_at?: string },
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/conversations`, getToken, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  })
}

// Interviews
/** @deprecated Use listInterviewsWithRefresh instead */
export async function listInterviews<T>(token: string, appId: string): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/interviews`, token)
}

export async function listInterviewsWithRefresh<T>(
  getToken: () => Promise<string>, 
  appId: string
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/interviews`, getToken)
}

/** @deprecated Use scheduleInterviewWithRefresh instead */
export async function scheduleInterview<T>(
  token: string,
  appId: string,
  body: { type: string; scheduled_at?: string; mode?: string; custom_name?: string },
): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/interviews`, token, { method: 'POST', body: JSON.stringify(body) })
}

export async function scheduleInterviewWithRefresh<T>(
  getToken: () => Promise<string>,
  appId: string,
  body: { type: string; scheduled_at?: string; mode?: string; custom_name?: string },
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/interviews`, getToken, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  })
}

/** @deprecated Use rescheduleInterviewWithRefresh instead */
export async function rescheduleInterview<T>(
  token: string,
  appId: string,
  roundId: string,
  body: { scheduled_at: string },
): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/interviews/${roundId}/reschedule`, token, { method: 'POST', body: JSON.stringify(body) })
}

export async function rescheduleInterviewWithRefresh<T>(
  getToken: () => Promise<string>,
  appId: string,
  roundId: string,
  body: { scheduled_at: string },
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/interviews/${roundId}/reschedule`, getToken, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  })
}

/** @deprecated Use completeInterviewWithRefresh instead */
export async function completeInterview<T>(
  token: string,
  appId: string,
  roundId: string,
  body: { started_at?: string; completed_at: string; result: string; feedback?: string },
): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/interviews/${roundId}/complete`, token, { method: 'POST', body: JSON.stringify(body) })
}

export async function completeInterviewWithRefresh<T>(
  getToken: () => Promise<string>,
  appId: string,
  roundId: string,
  body: { started_at?: string; completed_at: string; result: string; feedback?: string },
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/interviews/${roundId}/complete`, getToken, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  })
}

/** @deprecated Use rejectInterviewWithRefresh instead */
export async function rejectInterview<T>(
  token: string,
  appId: string,
  roundId: string,
  body: { rejection_reason?: string },
): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/interviews/${roundId}/reject`, token, { method: 'POST', body: JSON.stringify(body) })
}

export async function rejectInterviewWithRefresh<T>(
  getToken: () => Promise<string>,
  appId: string,
  roundId: string,
  body: { rejection_reason?: string },
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/interviews/${roundId}/reject`, getToken, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  })
}

/** @deprecated Use withdrawInterviewWithRefresh instead */
export async function withdrawInterview<T>(
  token: string,
  appId: string,
  roundId: string,
  body: { rejection_reason?: string },
): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/interviews/${roundId}/withdraw`, token, { method: 'POST', body: JSON.stringify(body) })
}

export async function withdrawInterviewWithRefresh<T>(
  getToken: () => Promise<string>,
  appId: string,
  roundId: string,
  body: { rejection_reason?: string },
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/interviews/${roundId}/withdraw`, getToken, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  })
}

/** @deprecated Use updateInterviewNameWithRefresh instead */
export async function updateInterviewName<T>(
  token: string,
  appId: string,
  roundId: string,
  body: { custom_name: string },
): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/interviews/${roundId}/name`, token, { method: 'PUT', body: JSON.stringify(body) })
}

export async function updateInterviewNameWithRefresh<T>(
  getToken: () => Promise<string>,
  appId: string,
  roundId: string,
  body: { custom_name: string },
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/interviews/${roundId}/name`, getToken, { 
    method: 'PUT', 
    body: JSON.stringify(body) 
  })
}

export async function updateInterviewTypeWithRefresh<T>(
  getToken: () => Promise<string>,
  appId: string,
  roundId: string,
  body: { type: string },
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/interviews/${roundId}/type`, getToken, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** @deprecated Use deleteInterviewWithRefresh instead */
export async function deleteInterview<T>(
  token: string,
  appId: string,
  roundId: string,
): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/interviews/${roundId}`, token, { method: 'DELETE' })
}

export async function deleteInterviewWithRefresh<T>(
  getToken: () => Promise<string>,
  appId: string,
  roundId: string,
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/interviews/${roundId}`, getToken, { 
    method: 'DELETE' 
  })
}

// Application Contacts
export type ApplicationContactAddBody = {
  contact_id?: string
  contact?: { name: string; title?: string | null; channels?: Array<{ medium: string; channel_value: string }> }
  role: 'recruiter' | 'referrer' | 'hiring_manager' | 'interviewer' | 'other'
  is_primary?: boolean
}

/** @deprecated Use listApplicationContactsWithRefresh instead */
export async function listApplicationContacts<T>(token: string, appId: string): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/contacts`, token)
}

export async function listApplicationContactsWithRefresh<T>(
  getToken: () => Promise<string>, 
  appId: string
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/contacts`, getToken)
}

/** @deprecated Use addApplicationContactWithRefresh instead */
export async function addApplicationContact<T>(token: string, appId: string, body: ApplicationContactAddBody): Promise<T> {
  return apiWithToken(`/v1/applications/${appId}/contacts`, token, { method: 'POST', body: JSON.stringify(body) })
}

export async function addApplicationContactWithRefresh<T>(
  getToken: () => Promise<string>, 
  appId: string, 
  body: ApplicationContactAddBody
): Promise<T> {
  return apiWithTokenRefresh(`/v1/applications/${appId}/contacts`, getToken, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  })
}

// Platforms
/** @deprecated Use listPlatformsWithRefresh instead */
export async function listPlatforms<T>(token: string): Promise<T> {
  return apiWithToken(`/v1/platforms`, token)
}

export async function listPlatformsWithRefresh<T>(getToken: () => Promise<string>): Promise<T> {
  return apiWithTokenRefresh(`/v1/platforms`, getToken)
}

// New: POST /v1/platforms/search - AI-assisted search by platform name
/** @deprecated Use searchPlatformsByNameWithRefresh instead */
export async function searchPlatformsByName<T>(token: string, query: string): Promise<T> {
  return apiWithToken(`/v1/platforms/search`, token, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

export async function searchPlatformsByNameWithRefresh<T>(
  getToken: () => Promise<string>, 
  query: string
): Promise<T> {
  return apiWithTokenRefresh(`/v1/platforms/search`, getToken, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

// Companies
/** @deprecated Use searchCompaniesWithRefresh instead */
export async function searchCompanies<T>(token: string, search?: string): Promise<T> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiWithToken(`/v1/companies${query}`, token)
}

export async function searchCompaniesWithRefresh<T>(
  getToken: () => Promise<string>, 
  search?: string
): Promise<T> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiWithTokenRefresh(`/v1/companies${query}`, getToken)
}

/** @deprecated Use createCompanyWithRefresh instead */
export async function createCompany<T>(token: string, website_url: string): Promise<T> {
  return apiWithToken(`/v1/companies`, token, { 
    method: 'POST', 
    body: JSON.stringify({ website_url }) 
  })
}

export async function createCompanyWithRefresh<T>(
  getToken: () => Promise<string>, 
  website_url: string
): Promise<T> {
  return apiWithTokenRefresh(`/v1/companies`, getToken, { 
    method: 'POST', 
    body: JSON.stringify({ website_url }) 
  })
}

// New: POST /v1/companies/search - search by company name (AI-assisted)
/** @deprecated Use searchCompaniesByNameWithRefresh instead */
export async function searchCompaniesByName<T>(token: string, query: string): Promise<T> {
  return apiWithToken(`/v1/companies/search`, token, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

export async function searchCompaniesByNameWithRefresh<T>(
  getToken: () => Promise<string>, 
  query: string
): Promise<T> {
  return apiWithTokenRefresh(`/v1/companies/search`, getToken, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

// Single company by id
/** @deprecated Use getCompanyByIdWithRefresh instead */
export async function getCompanyById<T>(token: string, id: string): Promise<T> {
  return apiWithToken(`/v1/companies/${id}`, token)
}

export async function getCompanyByIdWithRefresh<T>(
  getToken: () => Promise<string>, 
  id: string
): Promise<T> {
  return apiWithTokenRefresh(`/v1/companies/${id}`, getToken)
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
  linkedin_url?: string | null;
}

/** @deprecated Use getProfileWithRefresh instead */
export async function getProfile<T = UserProfile>(token: string): Promise<T> {
  return apiWithToken(`/v1/profile`, token)
}

export async function getProfileWithRefresh<T = UserProfile>(
  getToken: () => Promise<string>
): Promise<T> {
  return apiWithTokenRefresh(`/v1/profile`, getToken)
}

// Fetch LinkedIn URL from Clerk external accounts (server helper)
// (Removed LinkedIn Clerk helpers)

/** @deprecated Use updateProfileWithRefresh instead */
export async function updateProfile<T = UserProfile>(token: string, body: Partial<UserProfile>): Promise<T> {
  return apiWithToken(`/v1/profile`, token, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function updateProfileWithRefresh<T = UserProfile>(
  getToken: () => Promise<string>, 
  body: Partial<UserProfile>
): Promise<T> {
  return apiWithTokenRefresh(`/v1/profile`, getToken, { 
    method: 'PATCH', 
    body: JSON.stringify(body) 
  })
}

// Role suggestions
/** @deprecated Use getRoleSuggestionsWithRefresh instead */
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

export async function getRoleSuggestionsWithRefresh(
  getToken: () => Promise<string>,
  companyId: string,
  body?: { current_role?: string | null; current_company?: string | null }
): Promise<RoleSuggestionResponse> {
  return apiWithTokenRefresh(`/v1/companies/${companyId}/role-suggestions`, getToken, { 
    method: 'POST', 
    body: JSON.stringify(body || {})
  })
}

// Resume API functions
export async function getResumesWithRefresh(getToken: () => Promise<string>) {
  return apiWithTokenRefresh('/v1/resumes', getToken)
}

export async function getResumeWithRefresh(id: string, getToken: () => Promise<string>) {
  return apiWithTokenRefresh(`/v1/resumes/${id}`, getToken)
}

export async function createResumeWithRefresh(data: any, getToken: () => Promise<string>) {
  return apiWithTokenRefresh('/v1/resumes', getToken, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateResumeWithRefresh(id: string, data: any, getToken: () => Promise<string>) {
  return apiWithTokenRefresh(`/v1/resumes/${id}`, getToken, {
    method: 'PUT', 
    body: JSON.stringify(data)
  })
}

export async function deleteResumeWithRefresh(id: string, getToken: () => Promise<string>) {
  return apiWithTokenRefresh(`/v1/resumes/${id}`, getToken, {
    method: 'DELETE'
  })
}

export async function duplicateResumeWithRefresh(id: string, getToken: () => Promise<string>) {
  return apiWithTokenRefresh(`/v1/resumes/${id}/duplicate`, getToken, {
    method: 'POST'
  })
}

export async function setDefaultResumeWithRefresh(id: string, getToken: () => Promise<string>) {
  return apiWithTokenRefresh(`/v1/resumes/${id}/set-default`, getToken, {
    method: 'PUT'
  })
}

// AI helpers
export async function aiSuggestSummaryWithRefresh(id: string, getToken: () => Promise<string>, body?: { job?: string }) {
  return apiWithTokenRefresh(`/v1/resumes/${id}/ai/suggest-summary`, getToken, {
    method: 'POST',
    body: JSON.stringify(body || {}),
  })
}

export async function aiSuggestBulletsWithRefresh(id: string, getToken: () => Promise<string>, body?: { sectionId?: string; role?: string; jd?: string }) {
  return apiWithTokenRefresh(`/v1/resumes/${id}/ai/suggest-bullets`, getToken, {
    method: 'POST',
    body: JSON.stringify(body || {}),
  })
}

export async function aiKeywordsWithRefresh(id: string, getToken: () => Promise<string>, body: { jd: string }) {
  return apiWithTokenRefresh(`/v1/resumes/${id}/ai/keywords`, getToken, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Import/export
export async function importLinkedInWithRefresh(getToken: () => Promise<string>, body: { html?: string; url?: string }) {
  return apiWithTokenRefresh(`/v1/resumes/import/linkedin`, getToken, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function exportResumeWithRefresh(id: string, getToken: () => Promise<string>) {
  return apiWithTokenRefresh(`/v1/resumes/${id}/export`, getToken)
}

// Resume API object for easier usage
export const resumeApi = {
  getAll: getResumesWithRefresh,
  get: getResumeWithRefresh,
  create: createResumeWithRefresh,
  update: updateResumeWithRefresh,
  delete: deleteResumeWithRefresh,
  duplicate: duplicateResumeWithRefresh,
  setDefault: setDefaultResumeWithRefresh
}

export const api = {
  resumeApi
}


