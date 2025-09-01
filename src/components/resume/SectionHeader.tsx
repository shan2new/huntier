import { useResumeTheme } from '@/components/resume/ThemeContext'

type SectionHeaderProps = {
  title: string
  right?: React.ReactNode
}

export function SectionHeader({ title, right }: SectionHeaderProps) {
  const theme = useResumeTheme()
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-px w-10 ${theme.dividerClass}`}></div>
        <h2 className={theme.headingClass}>
          {title}
        </h2>
        <div className={`h-px flex-1 ${theme.dividerClass}`}></div>
      </div>
      <div className="ml-3">{right}</div>
    </div>
  )
}

export default SectionHeader


