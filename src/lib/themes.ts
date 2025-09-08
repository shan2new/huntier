export type ResumeThemeId =
  | 'minimal'
  | 'classic'
  | 'elegant'
  | 'modern'
  | 'mono'
  | 'serif'
  | 'gradient'
  | 'slate'
  | 'emerald'
  | 'royal'
  | 'latex'

export type ResumeTheme = {
  id: ResumeThemeId
  name: string
  description: string
  previewAccent: string
  rootClass: string
  contentClass?: string
  headingClass: string
  bodyClass: string
  accentClass: string
  chipClass: string
  dividerClass: string
  fontFamily?: string
}

export const RESUME_THEMES: Record<ResumeThemeId, ResumeTheme> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, airy spacing with subtle accents',
    previewAccent: 'bg-zinc-800',
    rootClass: 'bg-white text-zinc-900',
    contentClass: 'px-14 py-14',
    headingClass: 'tracking-[0.14em] uppercase text-[12px] font-medium text-zinc-800',
    bodyClass: 'text-[13.5px] leading-relaxed text-zinc-800',
    accentClass: 'text-zinc-500',
    chipClass: 'px-2 py-1 text-[11px] rounded-md border border-zinc-200 bg-zinc-100 text-zinc-800',
    dividerClass: 'h-px bg-zinc-200',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Dense, traditional resume layout',
    previewAccent: 'bg-neutral-900',
    rootClass: 'bg-white text-neutral-900',
    contentClass: 'px-12 py-12',
    headingClass: 'tracking-[0.08em] uppercase text-[12px] font-semibold text-neutral-900',
    bodyClass: 'text-[12.75px] leading-[1.6] text-neutral-900',
    accentClass: 'text-neutral-600',
    chipClass: 'px-2 py-0.5 text-[11px] rounded border border-neutral-300 bg-neutral-50 text-neutral-900',
    dividerClass: 'h-px bg-neutral-300',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system',
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Refined serif headings with soft contrast',
    previewAccent: 'bg-indigo-600',
    rootClass: 'bg-white text-slate-900',
    contentClass: 'px-16 py-16',
    headingClass: 'font-serif tracking-wide uppercase text-[12.5px] font-medium text-indigo-700',
    bodyClass: 'text-[13.5px] leading-[1.75] text-slate-800',
    accentClass: 'text-slate-500',
    chipClass: 'px-2 py-1 text-[11px] rounded-md border border-indigo-100 bg-indigo-50 text-indigo-800',
    dividerClass: 'h-px bg-indigo-100',
    fontFamily: '"Georgia", ui-serif, serif',
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Bold nameplate, generous whitespace',
    previewAccent: 'bg-blue-600',
    rootClass: 'bg-white text-gray-900',
    contentClass: 'px-14 py-14',
    headingClass: 'tracking-[0.2em] uppercase text-[12px] font-medium text-gray-900',
    bodyClass: 'text-[13.5px] leading-7 text-gray-800',
    accentClass: 'text-gray-500',
    chipClass: 'px-2 py-1 text-[11px] rounded-md border border-blue-200 bg-blue-50 text-blue-800',
    dividerClass: 'h-px bg-gray-200',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system',
  },
  mono: {
    id: 'mono',
    name: 'Mono',
    description: 'Monospace aesthetic for tech roles',
    previewAccent: 'bg-zinc-700',
    rootClass: 'bg-white text-zinc-900',
    contentClass: 'px-14 py-14',
    headingClass: 'font-mono tracking-[0.2em] uppercase text-[11.5px] text-zinc-800',
    bodyClass: 'font-mono text-[12.5px] leading-[1.7] text-zinc-800',
    accentClass: 'text-zinc-600',
    chipClass: 'px-2 py-0.5 text-[11px] rounded border border-zinc-300 bg-zinc-50 text-zinc-800',
    dividerClass: 'h-px bg-zinc-200',
    fontFamily: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  serif: {
    id: 'serif',
    name: 'Serif',
    description: 'Editorial vibe with readable serif body',
    previewAccent: 'bg-rose-600',
    rootClass: 'bg-white text-stone-900',
    contentClass: 'px-16 py-16',
    headingClass: 'font-serif tracking-[0.12em] uppercase text-[12px] text-stone-900',
    bodyClass: 'font-serif text-[13.25px] leading-[1.8] text-stone-800',
    accentClass: 'text-stone-500',
    chipClass: 'px-2 py-1 text-[11px] rounded-md border border-rose-200 bg-rose-50 text-rose-800',
    dividerClass: 'h-px bg-stone-200',
    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  },
  gradient: {
    id: 'gradient',
    name: 'Gradient',
    description: 'Vibrant gradient accents for headings',
    previewAccent: 'bg-gradient-to-r from-fuchsia-600 to-cyan-500',
    rootClass: 'bg-white text-slate-900',
    contentClass: 'px-14 py-14',
    headingClass: 'tracking-[0.18em] uppercase text-[12px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-cyan-600',
    bodyClass: 'text-[13.5px] leading-7 text-slate-800',
    accentClass: 'text-slate-500',
    chipClass: 'px-2 py-1 text-[11px] rounded-md border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
    dividerClass: 'h-px bg-gradient-to-r from-slate-200 to-transparent',
    fontFamily: 'Inter, ui-sans-serif, system-ui',
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    description: 'Cool neutrals with subtle borders',
    previewAccent: 'bg-slate-700',
    rootClass: 'bg-white text-slate-900',
    contentClass: 'px-14 py-14',
    headingClass: 'tracking-[0.14em] uppercase text-[12px] font-medium text-slate-800',
    bodyClass: 'text-[13.25px] leading-relaxed text-slate-800',
    accentClass: 'text-slate-500',
    chipClass: 'px-2 py-1 text-[11px] rounded-md border border-slate-200 bg-slate-100 text-slate-800',
    dividerClass: 'h-px bg-slate-200',
    fontFamily: 'Inter, ui-sans-serif, system-ui',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    description: 'Fresh green accents with rounded tags',
    previewAccent: 'bg-emerald-600',
    rootClass: 'bg-white text-gray-900',
    contentClass: 'px-14 py-14',
    headingClass: 'tracking-[0.18em] uppercase text-[12px] font-medium text-emerald-700',
    bodyClass: 'text-[13.5px] leading-7 text-gray-800',
    accentClass: 'text-gray-500',
    chipClass: 'px-2 py-1 text-[11px] rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800',
    dividerClass: 'h-px bg-emerald-100',
    fontFamily: 'Inter, ui-sans-serif, system-ui',
  },
  royal: {
    id: 'royal',
    name: 'Royal',
    description: 'Deep purple headings with sharp lines',
    previewAccent: 'bg-violet-700',
    rootClass: 'bg-white text-zinc-900',
    contentClass: 'px-16 py-16',
    headingClass: 'tracking-[0.2em] uppercase text-[12px] font-semibold text-violet-700',
    bodyClass: 'text-[13.5px] leading-7 text-zinc-800',
    accentClass: 'text-zinc-600',
    chipClass: 'px-2 py-1 text-[11px] rounded-md border border-violet-200 bg-violet-50 text-violet-800',
    dividerClass: 'h-px bg-violet-200',
    fontFamily: 'Inter, ui-sans-serif, system-ui',
  },
  latex: {
    id: 'latex',
    name: 'LaTeX',
    description: 'Compact, typeset-inspired layout with small caps headings',
    previewAccent: 'bg-zinc-800',
    rootClass: 'bg-white text-zinc-900',
    contentClass: 'px-12 py-12',
    headingClass: 'tracking-[0.18em] uppercase text-[11.5px] font-medium text-zinc-800',
    bodyClass: 'text-[12.75px] leading-[1.7] text-zinc-800',
    accentClass: 'text-zinc-600',
    chipClass: 'px-2 py-0.5 text-[10.5px] rounded border border-zinc-300 bg-zinc-50 text-zinc-800',
    dividerClass: 'h-px bg-zinc-200',
    // Use Outfit as preferred per project styling
    fontFamily: 'Outfit, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  },
}

export const RESUME_THEME_LIST: ResumeTheme[] = Object.values(RESUME_THEMES)

export function getResumeTheme(id: ResumeThemeId | string | undefined | null): ResumeTheme {
  if (id && id in RESUME_THEMES) return RESUME_THEMES[id as ResumeThemeId]
  return RESUME_THEMES.minimal
}


