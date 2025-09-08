import type { ResumeFontId } from '@/types/resume'

export type ResumeFont = { id: ResumeFontId; name: string; stack: string }

export const RESUME_FONTS: Record<ResumeFontId, ResumeFont> = {
  inter: {
    id: 'inter',
    name: 'Inter',
    stack: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  },
  outfit: {
    id: 'outfit',
    name: 'Outfit',
    stack: 'Outfit, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  },
  ebgaramond: {
    id: 'ebgaramond',
    name: 'EB Garamond',
    stack: '"EB Garamond", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  },
  georgia: {
    id: 'georgia',
    name: 'Georgia',
    stack: 'Georgia, ui-serif, serif',
  },
  palatino: {
    id: 'palatino',
    name: 'Palatino',
    stack: 'Palatino, "Palatino Linotype", "Book Antiqua", ui-serif, serif',
  },
  times: {
    id: 'times',
    name: 'Times New Roman',
    stack: '"Times New Roman", Times, ui-serif, serif',
  },
  plexSans: {
    id: 'plexSans',
    name: 'IBM Plex Sans',
    stack: '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  },
  merriweather: {
    id: 'merriweather',
    name: 'Merriweather',
    stack: 'Merriweather, ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  },
  mono: {
    id: 'mono',
    name: 'Monospace',
    stack: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  geistMono: {
    id: 'geistMono',
    name: 'Geist Mono',
    stack: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
}

export const RESUME_FONT_LIST: Array<ResumeFont> = Object.values(RESUME_FONTS)

export function getResumeFont(id?: string | null): ResumeFont {
  const key = String(id || '').toLowerCase() as ResumeFontId
  return (RESUME_FONTS[key] || RESUME_FONTS.inter)
}


