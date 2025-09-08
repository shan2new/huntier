import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { BulkAction } from '@/types/listing'
import type { ReactNode } from 'react'

type ListSectionProps = {
  title: string
  count: number
  editMode?: boolean
  onEditToggle?: () => void
  selectedCount?: number
  bulkActions?: Array<BulkAction>
  children: ReactNode
  className?: string
}

export function ListSection({
  title,
  count,
  editMode,
  onEditToggle,
  selectedCount = 0,
  bulkActions,
  children,
  className,
}: ListSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      <div className="flex items-center justify-between pt-3 pb-2">
        <div className="text-xs font-medium text-muted-foreground">{title}</div>
        <div className="flex items-center gap-2">
          {onEditToggle ? (
            !editMode ? (
              <Button size="sm" variant="outline" onClick={onEditToggle}>Edit</Button>
            ) : (
              <div className="flex items-center gap-2">
                {bulkActions?.map((a) => (
                  <Button
                    key={a.id}
                    size="sm"
                    variant={a.variant ?? 'secondary'}
                    disabled={selectedCount === 0}
                    onClick={() => a.onPerform?.([])}
                  >
                    {a.icon}
                    {a.label}
                  </Button>
                ))}
                <Button size="sm" variant="outline" onClick={onEditToggle}>Cancel</Button>
              </div>
            )
          ) : null}
          <Badge variant="secondary" className="text-[10px] px-2 py-0">{count}</Badge>
        </div>
      </div>
      <Card className="shadow-xs">
        <CardContent className="p-0">{children}</CardContent>
      </Card>
    </motion.div>
  )
}

export default ListSection


