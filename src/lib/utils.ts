import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formats a date in Indian locale (DD/MM/YYYY or with time if includeTime)
export function formatDateIndian(dateLike: string | number | Date, includeTime = false) {
  const d = new Date(dateLike)
  const options: Intl.DateTimeFormatOptions = includeTime
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }
  return d.toLocaleString('en-IN', options)
}
