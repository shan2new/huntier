import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

export type EntityListItemProps = {
  id: string
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  selected?: boolean
  selectable?: boolean
  onSelectToggle?: (id: string) => void
  onClick?: () => void
  actions?: ReactNode
  className?: string
  index?: number
}

export function EntityListItem({
  id,
  leading,
  title,
  subtitle,
  meta,
  selected,
  selectable,
  onSelectToggle,
  onClick,
  actions,
  className,
  index = 0,
}: EntityListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      className={`group cursor-pointer px-4 py-3 md:px-6 md:py-4 hover:bg-muted/10 relative ${className ?? ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {selectable ? (
            <Checkbox
              checked={!!selected}
              onCheckedChange={() => onSelectToggle?.(id)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 mr-1"
            />
          ) : null}
          {leading}
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="font-medium text-base truncate">{title}</div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground min-w-0">
              {subtitle}
            </div>
          </div>
        </div>
        {/* Desktop actions (hover-revealed) */}
        <div className="hidden md:flex items-center gap-2 md:opacity-0 group-hover:md:opacity-100 transition-opacity shrink-0">
          {meta}
          {actions}
        </div>
      </div>
      {/* Mobile actions/meta stacked below */}
      {(meta || actions) ? (
        <div className="mt-2 flex items-center justify-between md:hidden text-xs">
          <div className="text-muted-foreground">{meta}</div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      ) : null}
    </motion.div>
  )
}

export default EntityListItem


