import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  className?: string
  action?: { label: string; onClick: () => void; variant?: 'default' | 'secondary' | 'outline' }
}

export function EmptyState({ title, description, icon, className, action }: EmptyStateProps) {
  return (
    <div className={cn('h-full w-full flex items-center justify-center', className)}>
      <div className="text-center max-w-sm mx-auto p-6">
        {icon && <div className="mb-4 mx-auto flex items-center justify-center text-muted-foreground">{icon}</div>}
        <div className="text-lg font-medium">{title}</div>
        {description && <div className="text-sm text-muted-foreground mt-1">{description}</div>}
        {action && (
          <div className="mt-4">
            <Button size="sm" variant={action.variant || 'default'} onClick={action.onClick}>{action.label}</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmptyState


