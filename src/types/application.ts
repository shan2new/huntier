export interface StageObject {
  id: string
  name: string
  type: 'standard' | 'interview_round'
  interview_round_number?: number
  interview_data?: {
    type: string
    custom_name?: string
    status: 'unscheduled' | 'scheduled' | 'rescheduled' | 'completed' | 'rejected' | 'withdrawn'
    scheduled_at?: string
    completed_at?: string
    result?: string
    rejection_reason?: string
  }
}

export interface Application {
  id: string
  milestone: 'exploration' | 'screening' | 'interviewing' | 'post_interview'
  stage: StageObject
  status: 'active' | 'rejected' | 'offer' | 'accepted' | 'withdrawn' | 'on_hold'
  company: {
    id: string
    name: string
    website_url: string
    logo_blob_base64?: string
  }
  role: string
  job_url?: string
  platform?: {
    id: string
    name: string
  }
  source: 'applied_self' | 'applied_referral' | 'recruiter_outreach'
  created_at: string
  last_activity_at: string
  compensation?: {
    fixed_min_lpa?: string
    fixed_max_lpa?: string
    var_min_lpa?: string
    var_max_lpa?: string
    tentative_ctc_note?: string
  }
  qa_snapshot?: {
    current_ctc_text?: string
    expected_ctc_text?: string
    notice_period_text?: string
    reason_leaving_current_text?: string
    past_leaving_reasons_text?: string
  }
}
