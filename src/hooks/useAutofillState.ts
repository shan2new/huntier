import { useEffect, useState } from 'react'
import { DEFAULT_AUTOFILL_STATE, type AutofillState } from '@/types/autofill'
import { useAutosave } from '@/hooks/useAutosave'
import { useAuthToken } from '@/lib/auth'
import { getAutofillStateWithRefresh, saveAutofillStateWithRefresh } from '@/lib/api'

const STORAGE_KEY = 'autofill-state-v1'

function normalize(input: any): AutofillState {
  const src = input || {}
  return {
    inputs: { ...DEFAULT_AUTOFILL_STATE.inputs, ...(src.inputs || {}) },
    templates: { ...DEFAULT_AUTOFILL_STATE.templates, ...(src.templates || {}) },
    compare: { ...DEFAULT_AUTOFILL_STATE.compare, ...(src.compare || {}) },
  }
}

export function useAutofillState() {
  const { data, setData, lastSavedAt, saveNow } = useAutosave<AutofillState>({
    storageKey: STORAGE_KEY,
    initialValue: DEFAULT_AUTOFILL_STATE,
    debounceMs: 700,
  })
  const { getToken } = useAuthToken()
  const [serverUpdatedAt, setServerUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await getAutofillStateWithRefresh(async () => (await getToken()) || '')
        if (!cancelled && res && res.state && typeof res.state === 'object') {
          setData(normalize(res.state))
          setServerUpdatedAt(res.updated_at)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [getToken, setData])

  const saveToServer = async (next?: AutofillState) => {
    saveNow()
    try {
      setSaving(true)
      const res = await saveAutofillStateWithRefresh(async () => (await getToken()) || '', next || data)
      setServerUpdatedAt(res.updated_at)
    } finally {
      setSaving(false)
    }
  }

  return { data, setData, lastSavedAt, serverUpdatedAt, loading, saving, saveToServer }
}

export default useAutofillState


