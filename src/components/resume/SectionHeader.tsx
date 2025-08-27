type SectionHeaderProps = {
  title: string
  right?: React.ReactNode
}

export function SectionHeader({ title, right }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-px bg-border w-10" />
        <h2 className="shrink-0 text-[12px] sm:text-[13px] font-medium tracking-[0.12em] uppercase text-foreground">
          {title}
        </h2>
        <div className="h-px bg-border flex-1" />
      </div>
      <div className="ml-3">{right}</div>
    </div>
  )
}

export default SectionHeader


