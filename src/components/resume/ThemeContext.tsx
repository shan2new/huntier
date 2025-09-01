import React, { createContext, useContext } from 'react'
import type { ResumeTheme } from '@/lib/themes'
import { getResumeTheme } from '@/lib/themes'

type ResumeThemeContextValue = ResumeTheme

const ResumeThemeContext = createContext<ResumeThemeContextValue>(getResumeTheme('minimal'))

export function ResumeThemeProvider({ theme, children }: { theme: ResumeTheme; children: React.ReactNode }) {
  return (
    <ResumeThemeContext.Provider value={theme}>{children}</ResumeThemeContext.Provider>
  )
}

export function useResumeTheme(): ResumeTheme {
  const ctx = useContext(ResumeThemeContext)
  return ctx
}


