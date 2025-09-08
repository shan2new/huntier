import type { ReactNode } from 'react'

// Common listing-related types used across pages

export type ListItemId = string

export interface SelectableEntity {
  id: ListItemId
}

export type BulkActionHandler = (ids: Array<ListItemId>) => Promise<void> | void

export interface BulkAction {
  id: string
  label: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  icon?: ReactNode
  onPerform: BulkActionHandler
}

export interface ListSectionConfig<TItem extends SelectableEntity> {
  key: string
  title: string
  items: Array<TItem>
}


