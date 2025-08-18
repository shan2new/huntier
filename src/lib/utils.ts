import {  clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type {ClassValue} from "clsx";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

// Formats a date in Indian locale (DD Mon YYYY or with time if includeTime)
export function formatDateIndian(dateLike: string | number | Date, includeTime = false) {
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return ''

  // Build "DD Mon YYYY" (no comma) using parts
  const dateParts = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(d)

  const day = dateParts.find(p => p.type === 'day')?.value ?? ''
  const month = dateParts.find(p => p.type === 'month')?.value ?? ''
  const year = dateParts.find(p => p.type === 'year')?.value ?? ''

  let formatted = `${day} ${month} ${year}`

  if (includeTime) {
    const time = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
    formatted = `${formatted}, ${time}`
  }

  return formatted
}
