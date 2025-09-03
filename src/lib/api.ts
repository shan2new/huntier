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
export type UserPlatform = { id: string; user_id: string; platform_id: string; platform?: Platform; rating?: number | null; notes?: string | null; created_at: string; updated_at: string }
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
  progress_updated_at?: string
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

export async function deleteApplicationWithRefresh(
  getToken: () => Promise<string>,
  id: string
): Promise<void> {
  return apiWithTokenRefresh(`/v1/applications/${id}`, getToken, {
    method: 'DELETE'
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

// Mail API
export type MailThread = {
  id: string
  account_id: string
  gmail_thread_id: string
  subject?: string | null
  snippet?: string | null
  preview_from?: any | null
  preview_to?: any | null
  latest_at: string
  application_id?: string | null
}

export type MailMessage = {
  id: string
  thread_id: string
  gmail_message_id: string
  internal_date: string
  headers?: any | null
  from?: any | null
  to?: any | null
  cc?: any | null
  bcc?: any | null
  subject?: string | null
  body_text?: string | null
  body_html?: string | null
  label_ids?: Array<string> | null
  has_attachments: boolean
  direction: 'inbound' | 'outbound'
}

export async function listMailThreadsWithRefresh(
  getToken: () => Promise<string>,
  opts: { query?: string; before?: string } = {}
) {
  const params = new URLSearchParams()
  if (opts.query) params.set('query', opts.query)
  if (opts.before) params.set('before', opts.before)
  return apiWithTokenRefresh<Array<MailThread>>(`/v1/mail/threads?${params.toString()}`, getToken)
}

export async function listMailMessagesWithRefresh(getToken: () => Promise<string>, threadId: string) {
  return apiWithTokenRefresh<Array<MailMessage>>(`/v1/mail/threads/${threadId}/messages`, getToken)
}

export async function assignMailThreadWithRefresh(
  getToken: () => Promise<string>,
  threadId: string,
  application_id: string
) {
  return apiWithTokenRefresh(`/v1/mail/threads/${threadId}/assign`, getToken, {
    method: 'POST',
    body: JSON.stringify({ application_id })
  })
}

export async function replyToMailThreadWithRefresh(
  getToken: () => Promise<string>,
  threadId: string,
  body: { text?: string; html?: string }
) {
  return apiWithTokenRefresh(`/v1/mail/threads/${threadId}/reply`, getToken, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

// Gmail connect/callback helpers
// (Removed) connectGmailWithRefresh - Clerk handles Google OAuth

// (Removed) gmailCallbackWithRefresh - Clerk handles Google OAuth

// Mail queue status
export type MailQueueStatus = {
  counts: Record<string, number>
  job: { id: string; name: string; state?: string; timestamp: number; attemptsMade: number } | null
  hasAccount?: boolean
  hasGoogleLinked?: boolean
  needsAuth?: boolean
  scopes?: Array<string>
  hasRequiredScopes?: boolean
  missingScopes?: Array<string>
  requiredScopes?: Array<string>
}

export async function getMailStatusWithRefresh(
  getToken: () => Promise<string>,
  opts: { accountId?: string } = {}
) {
  const params = new URLSearchParams()
  if (opts.accountId) params.set('accountId', opts.accountId)
  return apiWithTokenRefresh<MailQueueStatus>(`/v1/mail/status?${params.toString()}`, getToken)
}

// Update per-user additional mail scopes in Clerk (via backend)
export async function updateMailScopesWithRefresh(
  getToken: () => Promise<string>,
  body: { send_enabled?: boolean; additionalScopes?: string[] }
) {
  return apiWithTokenRefresh<{ additionalScopes: string[] }>(`/v1/mail/scopes`, getToken, {
    method: 'POST',
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

// --- User platforms ---
export async function listMyPlatformsWithRefresh(getToken: () => Promise<string>): Promise<Array<UserPlatform>> {
  return apiWithTokenRefresh(`/v1/platforms/me`, getToken)
}

export async function addMyPlatformWithRefresh(
  getToken: () => Promise<string>,
  body: { platform_id: string; rating?: number | null; notes?: string | null }
): Promise<UserPlatform> {
  return apiWithTokenRefresh(`/v1/platforms/me`, getToken, { method: 'POST', body: JSON.stringify(body) })
}

export async function updateMyPlatformWithRefresh(
  getToken: () => Promise<string>,
  id: string,
  body: { rating?: number | null; notes?: string | null }
): Promise<UserPlatform> {
  return apiWithTokenRefresh(`/v1/platforms/me/${id}`, getToken, { method: 'PUT', body: JSON.stringify(body) })
}

export async function deleteMyPlatformWithRefresh(getToken: () => Promise<string>, id: string): Promise<{ success: boolean }> {
  return apiWithTokenRefresh(`/v1/platforms/me/${id}`, getToken, { method: 'DELETE' })
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

// --- My Companies (targets & groups) ---
export type UserCompanyTarget = {
  id: string
  user_id: string
  company_id: string
  company?: Company | null
  group_id?: string | null
}

export type CompanyGroup = {
  id: string
  user_id: string
  name: string
  sort_order: number
}

export async function listMyCompaniesAllWithRefresh(getToken: () => Promise<string>, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiWithTokenRefresh<Array<Company>>(`/v1/companies/me/all${query}`, getToken)
}

export async function listMyCompanyTargetsWithRefresh(getToken: () => Promise<string>) {
  return apiWithTokenRefresh<Array<UserCompanyTarget>>(`/v1/companies/me/targets`, getToken)
}

export async function addMyCompanyTargetWithRefresh(
  getToken: () => Promise<string>,
  body: { company_id: string; group_id?: string | null }
) {
  return apiWithTokenRefresh<UserCompanyTarget>(`/v1/companies/me/targets`, getToken, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function deleteMyCompanyTargetWithRefresh(getToken: () => Promise<string>, id: string) {
  return apiWithTokenRefresh(`/v1/companies/me/targets/${id}`, getToken, { method: 'DELETE' })
}

export async function updateMyCompanyTargetGroupWithRefresh(
  getToken: () => Promise<string>,
  id: string,
  group_id: string | null
) {
  return apiWithTokenRefresh(`/v1/companies/me/targets/${id}/group`, getToken, {
    method: 'PUT',
    body: JSON.stringify({ group_id })
  })
}

export async function reorderGroupTargetsWithRefresh(
  getToken: () => Promise<string>,
  group_id: string,
  orderedIds: string[]
) {
  return apiWithTokenRefresh(`/v1/companies/me/groups/${group_id}/reorder`, getToken, {
    method: 'PUT',
    body: JSON.stringify({ orderedIds })
  })
}

export async function listMyCompanyGroupsWithRefresh(getToken: () => Promise<string>) {
  return apiWithTokenRefresh<Array<CompanyGroup>>(`/v1/companies/me/groups`, getToken)
}

export async function createMyCompanyGroupWithRefresh(
  getToken: () => Promise<string>,
  body: { name: string; sort_order?: number }
) {
  return apiWithTokenRefresh<CompanyGroup>(`/v1/companies/me/groups`, getToken, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function updateMyCompanyGroupWithRefresh(
  getToken: () => Promise<string>,
  id: string,
  body: { name?: string; sort_order?: number }
) {
  return apiWithTokenRefresh<CompanyGroup>(`/v1/companies/me/groups/${id}`, getToken, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function deleteMyCompanyGroupWithRefresh(getToken: () => Promise<string>, id: string) {
  return apiWithTokenRefresh(`/v1/companies/me/groups/${id}`, getToken, { method: 'DELETE' })
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

// Roles search (database-first)
export type RoleSearchItem = {
  id: string
  title: string
  normalized_title: string
  synonyms?: Array<string> | null
  group_id?: string | null
}

export async function searchRolesWithRefresh(
  getToken: () => Promise<string>,
  q: string,
  limit = 20,
): Promise<Array<RoleSearchItem>> {
  const query = encodeURIComponent(q)
  return apiWithTokenRefresh(`/v1/roles/search?q=${query}&limit=${limit}`, getToken)
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

// Enhance a small text snippet (summary, bullet, paragraph) using HybridFallback via OpenRouter
export async function aiEnhanceTextWithRefresh(
  id: string,
  getToken: () => Promise<string>,
  body: { text: string; mode?: 'rewrite' | 'proofread'; contentType?: 'summary' | 'bullet' | 'paragraph' | 'role' | 'company' | 'achievement' | 'educationField'; tone?: 'professional' | 'confident' | 'friendly' | 'concise'; field?: string; resume?: any }
) {
  return apiWithTokenRefresh(`/v1/resumes/${id}/ai/enhance-text`, getToken, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Generate a default resume strictly in schema from the user's profile
export async function aiGenerateResumeFromProfileWithRefresh(getToken: () => Promise<string>, profile?: any) {
  return apiWithTokenRefresh(`/v1/resumes/ai/generate-from-profile`, getToken, {
    method: 'POST',
    body: JSON.stringify({ profile }),
  })
}

// Import/export
// (Removed) LinkedIn import API

// Import resume from PDF (parse and return draft object)
export async function importResumeFromPdfWithRefresh(
  getToken: () => Promise<string>,
  file: File
): Promise<any> {
  const form = new FormData()
  form.append('file', file)
  const token = await getToken()
  const url = `${BASE}/v1/resumes/import/pdf?ts=${Date.now()}`
  console.log('[ResumeImport] uploading file', { name: file.name, size: file.size, type: file.type })
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    body: form,
  })
  console.log('[ResumeImport] response', { status: res.status })
  if (!res.ok) {
    throw new Error(`Import failed: ${res.status}`)
  }
  return res.json()
}

export async function exportResumeWithRefresh(id: string, getToken: () => Promise<string>) {
  return apiWithTokenRefresh(`/v1/resumes/${id}/export`, getToken)
}

// Binary export for resume (PDF/DOCX)
export async function exportResumeBlobWithRefresh(
  id: string,
  format: 'pdf' | 'docx',
  getToken: () => Promise<string>
): Promise<Blob> {
  const token = await getToken()
  const url = `${BASE}/v1/resumes/${id}/export?format=${encodeURIComponent(format)}&ts=${Date.now()}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`Export failed: ${res.status}`)
  }
  return res.blob()
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

// Upsert a platform by name and url
export async function upsertPlatformWithRefresh<T = Platform>(
  getToken: () => Promise<string>,
  body: { name: string; url: string }
): Promise<T> {
  return apiWithTokenRefresh(`/v1/platforms`, getToken, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Analytics
export type FunnelAnalytics = { exploration: number; interviewing: number; post_interview: number }
export type AgingAnalyticsItem = { id: string; stage: string; time_in_stage_days: number }
export type PlatformAnalyticsItem = {
  platform_id: string
  totals: number
  offers: number
  rejects: number
  in_progress: number
  // Additional fields may be present from the API; we keep them flexible
  [key: string]: any
}

export type QARehearsalResponse = {
  responses: {
    current_ctc?: string
    expected_ctc?: string
    notice_period?: string
    reason_leaving?: string
    past_reasons?: string
  }
  pitch: string
  note?: string
}

export async function getFunnelAnalyticsWithRefresh(
  getToken: () => Promise<string>,
  opts?: { window_start?: string; window_end?: string }
): Promise<FunnelAnalytics> {
  const qs = new URLSearchParams()
  if (opts?.window_start) qs.set('window_start', opts.window_start)
  if (opts?.window_end) qs.set('window_end', opts.window_end)
  const query = qs.toString()
  return apiWithTokenRefresh(`/v1/analytics/funnel${query ? `?${query}` : ''}`, getToken)
}

export async function getAgingAnalyticsWithRefresh(
  getToken: () => Promise<string>,
  opts?: { stage?: string; gt_days?: number; window_start?: string; window_end?: string }
): Promise<Array<AgingAnalyticsItem>> {
  const qs = new URLSearchParams()
  if (opts?.stage) qs.set('stage', opts.stage)
  if (typeof opts?.gt_days === 'number') qs.set('gt_days', String(opts.gt_days))
  if (opts?.window_start) qs.set('window_start', opts.window_start)
  if (opts?.window_end) qs.set('window_end', opts.window_end)
  const query = qs.toString()
  return apiWithTokenRefresh(`/v1/analytics/aging${query ? `?${query}` : ''}`, getToken)
}

export async function getPlatformAnalyticsWithRefresh(
  getToken: () => Promise<string>,
  opts?: { window_start?: string; window_end?: string }
): Promise<Array<PlatformAnalyticsItem>> {
  const qs = new URLSearchParams()
  if (opts?.window_start) qs.set('window_start', opts.window_start)
  if (opts?.window_end) qs.set('window_end', opts.window_end)
  const query = qs.toString()
  return apiWithTokenRefresh(`/v1/analytics/platforms${query ? `?${query}` : ''}`, getToken)
}

export async function generateQARehearsalWithRefresh(
  getToken: () => Promise<string>,
  applicationId: string
): Promise<QARehearsalResponse> {
  return apiWithTokenRefresh(`/v1/applications/${applicationId}/qa-rehearsal`, getToken, {
    method: 'POST'
  })
}

export async function generateProfileQARehearsalWithRefresh(
  getToken: () => Promise<string>
): Promise<QARehearsalResponse> {
  return apiWithTokenRefresh(`/v1/recruiter-qa/rehearsal`, getToken, {
    method: 'POST'
  })
}

export async function clearQARehearsalCacheWithRefresh(
  getToken: () => Promise<string>
): Promise<{ message: string }> {
  return apiWithTokenRefresh(`/v1/recruiter-qa/rehearsal/clear-cache`, getToken, {
    method: 'POST'
  })
}

// Drafts
export type ApplicationDraft = {
  id: string
  user_id: string
  company_id: string | null
  company?: Company | null
  role: string | null
  job_url: string | null
  platform_id: string | null
  platform?: Platform | null
  source: string | null
  compensation?: ApplicationCompensation | null
  notes?: Array<string> | null
}

export async function createApplicationDraftWithRefresh(getToken: () => Promise<string>) {
  return apiWithTokenRefresh(`/v1/applications/drafts`, getToken, { method: 'POST' })
}

export async function getApplicationDraftWithRefresh(getToken: () => Promise<string>, id: string) {
  return apiWithTokenRefresh(`/v1/applications/drafts/${id}`, getToken)
}

export async function updateApplicationDraftWithRefresh(getToken: () => Promise<string>, id: string, body: Partial<ApplicationDraft>) {
  return apiWithTokenRefresh(`/v1/applications/drafts/${id}`, getToken, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function deleteApplicationDraftWithRefresh(getToken: () => Promise<string>, id: string) {
  return apiWithTokenRefresh(`/v1/applications/drafts/${id}`, getToken, { method: 'DELETE' })
}

export async function commitApplicationDraftWithRefresh(getToken: () => Promise<string>, id: string) {
  return apiWithTokenRefresh(`/v1/applications/drafts/${id}/commit`, getToken, { method: 'POST' })
}

// AI: send images and get a draft id back
export async function extractApplicationDraftFromImagesWithRefresh(
  getToken: () => Promise<string>,
  files: Array<File>
): Promise<{ draft_id: string }> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const token = await getToken()
  const res = await fetch(`${BASE}/v1/applications/ai/extract-from-images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    throw new Error(`AI draft extract failed: ${res.status}`)
  }
  return res.json()
}


