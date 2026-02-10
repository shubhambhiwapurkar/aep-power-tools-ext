import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncate(str: string, length: number = 20) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

export function formatDate(date: string | number) {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

export function getStatusBgColor(status: string) {
  if (!status) return 'bg-muted text-muted-foreground'
  const s = status.toLowerCase()
  if (s === 'success' || s === 'active' || s === 'completed' || s === 'enabled') {
    return 'bg-green-500/10 text-green-500'
  }
  if (s === 'failed' || s === 'error' || s === 'inactive' || s === 'disabled') {
    return 'bg-red-500/10 text-red-500'
  }
  if (s === 'processing' || s === 'running' || s === 'ingesting') {
    return 'bg-blue-500/10 text-blue-500'
  }
  return 'bg-muted text-muted-foreground'
}
