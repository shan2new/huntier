import type { ResumeTemplate, ResumeTemplateId, ResumeSectionType } from '@/types/resume'

const allSections: ResumeSectionType[] = [
  'summary',
  'experience',
  'education',
  'achievements',
  'projects',
  'skills',
  'certifications',
]

export const RESUME_TEMPLATES: Record<ResumeTemplateId, ResumeTemplate> = {
  single: {
    id: 'single',
    name: 'Single Column',
    description: 'All sections in a single flowing column',
    headerAlign: 'center',
    headerDivider: true,
    layout: { kind: 'singleColumn' },
  },
  sidebar: {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Skills and education on left; summary and experience on right',
    headerAlign: 'left',
    headerDivider: true,
    layout: {
      kind: 'twoColumn',
      left: ['skills', 'education', 'certifications'],
      right: ['summary', 'experience', 'projects', 'achievements'],
      leftColSpan: 1,
      rightColSpan: 2,
    },
  },
  twoColumn: {
    id: 'twoColumn',
    name: 'Two Column (Balanced)',
    description: 'Even two-column layout, flowing sections left to right',
    headerAlign: 'center',
    headerDivider: true,
    layout: {
      kind: 'twoColumn',
      left: ['summary', 'experience'],
      right: ['education', 'projects', 'achievements', 'skills', 'certifications'],
      leftColSpan: 1,
      rightColSpan: 2,
    },
  },
  headerBar: {
    id: 'headerBar',
    name: 'Header Bar',
    description: 'Bold top header with left-aligned details',
    headerAlign: 'left',
    headerDivider: false,
    headerStyle: 'bar',
    layout: { kind: 'singleColumn' },
  },
  photoBandLeft: {
    id: 'photoBandLeft',
    name: 'Photo Band Left',
    description: 'Narrow left band (for photo/badges) and content on right',
    headerAlign: 'left',
    headerDivider: false,
    leftBand: { enabled: true },
    layout: {
      kind: 'twoColumn',
      left: ['skills', 'certifications'],
      right: ['summary', 'experience', 'projects', 'education', 'achievements'],
      leftColSpan: 1,
      rightColSpan: 2,
    },
  },
  compactLatex: {
    id: 'compactLatex',
    name: 'Compact LaTeX',
    description: 'Dense academic style inspired by LaTeX resumes',
    headerAlign: 'center',
    headerDivider: false,
    layout: { kind: 'singleColumn' },
  },
}

export const RESUME_TEMPLATE_LIST: ResumeTemplate[] = Object.values(RESUME_TEMPLATES)

export function getResumeTemplate(id?: ResumeTemplateId | string | null): ResumeTemplate {
  if (id && id in RESUME_TEMPLATES) return RESUME_TEMPLATES[id as ResumeTemplateId]
  return RESUME_TEMPLATES.single
}

export function isValidSectionType(value: string): value is ResumeSectionType {
  return (allSections as string[]).includes(value)
}


