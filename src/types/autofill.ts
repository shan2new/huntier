export type CustomFieldType = 'text' | 'textarea' | 'number' | 'url' | 'date'

export interface CustomField {
  id: string
  label: string
  type: CustomFieldType
  value: string
}

export interface AutofillInputs {
  // Identity & links
  fullName: string
  email: string
  phone: string
  location: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string

  // Role & experience
  desiredRole: string
  yearsOfExperience: string
  primarySkills: string // comma-separated

  // Availability & compensation
  noticePeriod: string
  currentCompensation: string
  expectedCompensation: string
  workAuthorization: string
  willingToRelocate: boolean
  remotePreference: 'remote' | 'hybrid' | 'onsite' | ''

  // QA-like fields aligned with Application.qa_snapshot
  reasonForChange: string
  pastLeavingReasons: string

  // Custom fields
  customFields: CustomField[]
}

export interface TemplatesState {
  emailTemplate: string
  linkedinTemplate: string
}

export interface JDCompareState {
  jdText: string
  // Support multiple screenshots (data URLs) pasted or uploaded
  screenshotDataUrl?: string // deprecated single screenshot for backward compat
  screenshots?: string[]
  extractedCompany?: string
  extractedRole?: string
  detectedKeywords: string[]
  // AI analysis suggestions based on screenshots + preview template
  suggestions?: string[]
}

export interface AutofillState {
  inputs: AutofillInputs
  templates: TemplatesState
  compare: JDCompareState
}

export const DEFAULT_EMAIL_TEMPLATE = `Hi {recipient_name},\n\nI'm {full_name}, a {years_experience}+ years {desired_role}. I came across the opening at {company} for {role} and believe my experience in {primary_skills} aligns well.\n\nHere are a few highlights:\n- Notable achievement 1\n- Notable achievement 2\n\nHappy to share my resume and discuss further.\n\nBest,\n{full_name}\n{linkedin_url} | {github_url} | {portfolio_url}`

export const DEFAULT_LINKEDIN_TEMPLATE = `Hi {recipient_name} — I noticed you're hiring for {role} at {company}. I'm a {desired_role} with {years_experience}+ years, focused on {primary_skills}. Would love to connect and share how I can help.\n\nBest, {full_name}`

export const DEFAULT_AUTOFILL_STATE: AutofillState = {
  inputs: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    desiredRole: '',
    yearsOfExperience: '',
    primarySkills: '',
    noticePeriod: '',
    currentCompensation: '',
    expectedCompensation: '',
    workAuthorization: '',
    willingToRelocate: false,
    remotePreference: '',
    reasonForChange: '',
    pastLeavingReasons: '',
    customFields: [],
  },
  templates: {
    emailTemplate: DEFAULT_EMAIL_TEMPLATE,
    linkedinTemplate: DEFAULT_LINKEDIN_TEMPLATE,
  },
  compare: {
    jdText: '',
    screenshotDataUrl: undefined,
    screenshots: [],
    extractedCompany: undefined,
    extractedRole: undefined,
    detectedKeywords: [],
    suggestions: [],
  },
}

export function fillTemplate(template: string, state: AutofillState, extras?: Record<string, string>): string {
  const map: Record<string, string> = {
    recipient_name: extras?.recipient_name || '',
    company: extras?.company || state.compare.extractedCompany || '',
    role: extras?.role || state.compare.extractedRole || state.inputs.desiredRole || '',
    full_name: state.inputs.fullName || '',
    years_experience: state.inputs.yearsOfExperience || '',
    desired_role: state.inputs.desiredRole || '',
    primary_skills: state.inputs.primarySkills || '',
    linkedin_url: state.inputs.linkedinUrl || '',
    github_url: state.inputs.githubUrl || '',
    portfolio_url: state.inputs.portfolioUrl || '',
  }
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => (map[key] ?? ''))
}


