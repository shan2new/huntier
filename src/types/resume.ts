export type ResumeFontId =
  | 'inter'
  | 'outfit'
  | 'ebgaramond'
  | 'georgia'
  | 'palatino'
  | 'times'
  | 'plexSans'
  | 'merriweather'
  | 'mono'
  | 'geistMono'


// Resume editor templates
export type ResumeSectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'achievements'
  | 'projects'
  | 'skills'
  | 'certifications'

export type ResumeTemplateId = 'single' | 'sidebar' | 'twoColumn' | 'headerBar' | 'photoBandLeft' | 'compactLatex'

export type ResumeTemplateLayout =
  | { kind: 'singleColumn' }
  | {
      kind: 'twoColumn'
      left: ResumeSectionType[]
      right: ResumeSectionType[]
      /** Tailwind fraction class for left column width when using grid. Defaults to col-span-1 of 3 */
      leftColSpan?: number
      rightColSpan?: number
    }

export type ResumeTemplate = {
  id: ResumeTemplateId
  name: string
  description: string
  headerAlign: 'left' | 'center'
  /** Adds a visual separator below the header when true */
  headerDivider?: boolean
  /** Optional header style */
  headerStyle?: 'default' | 'bar'
  /** When present, renders an auxiliary band/column on left */
  leftBand?: {
    enabled: boolean
  }
  layout: ResumeTemplateLayout
}


