import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebouncedValue } from '@tanstack/react-pacer/debouncer'

export interface UseAutosaveOptions<T> {
  storageKey: string
  initialValue: T
  debounceMs?: number
  onLoadError?: (error: unknown) => void
  onSaveError?: (error: unknown) => void
}

export interface UseAutosaveReturn<T> {
  data: T
  setData: (updater: T | ((prev: T) => T)) => void
  reset: () => void
  clearStorage: () => void
  lastSavedAt: number | null
  isSaving: boolean
  saveNow: () => void
}

function safeParse<T>(text: string | null): T | null {
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export function useAutosave<T>(options: UseAutosaveOptions<T>): UseAutosaveReturn<T> {
  const { storageKey, initialValue, debounceMs = 600, onLoadError, onSaveError } = options
  const [data, _setData] = useState<T>(initialValue)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const isMountedRef = useRef(false)

  // Load from localStorage once
  useEffect(() => {
    try {
      const loaded = safeParse<T>(typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null)
      if (loaded) {
        _setData(loaded)
      }
    } catch (e) {
      onLoadError?.(e)
    } finally {
      isMountedRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const setData = useCallback((updater: T | ((prev: T) => T)) => {
    _setData((prev) => (typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater))
  }, [])

  const [debouncedSerialized] = useDebouncedValue(
    useMemo(() => JSON.stringify(data), [data]),
    { wait: debounceMs }
  )

  const saveSerialized = useCallback(
    (serialized: string) => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey, serialized)
          setLastSavedAt(Date.now())
        }
      } catch (e) {
        onSaveError?.(e)
      }
    },
    [storageKey, onSaveError]
  )

  // Debounced autosave
  useEffect(() => {
    if (!isMountedRef.current) return
    if (!debouncedSerialized) return
    setIsSaving(true)
    saveSerialized(debouncedSerialized)
    setIsSaving(false)
  }, [debouncedSerialized, saveSerialized])

  const reset = useCallback(() => {
    _setData(initialValue)
  }, [initialValue])

  const clearStorage = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(storageKey)
      }
      setLastSavedAt(null)
    } catch (e) {
      onSaveError?.(e)
    }
  }, [storageKey, onSaveError])

  const saveNow = useCallback(() => {
    try {
      const serialized = JSON.stringify(data)
      saveSerialized(serialized)
    } catch (e) {
      onSaveError?.(e)
    }
  }, [data, saveSerialized, onSaveError])

  return { data, setData, reset, clearStorage, lastSavedAt, isSaving, saveNow }
}

export default useAutosave


