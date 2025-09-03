import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import InputsForm from '@/components/autofill/InputsForm'
import TemplateEditor from '@/components/autofill/TemplateEditor'
import JDCompare from '@/components/autofill/JDCompare'
import { DEFAULT_AUTOFILL_STATE, type AutofillState } from '@/types/autofill'
import { useAutosave } from '@/hooks/useAutosave'
import { useAuthToken } from '@/lib/auth'
import { getAutofillStateWithRefresh, saveAutofillStateWithRefresh } from '@/lib/api'

const STORAGE_KEY = 'autofill-state-v1'

export function AutofillPage() {
  const { data, setData, lastSavedAt, saveNow } = useAutosave<AutofillState>({
    storageKey: STORAGE_KEY,
    initialValue: DEFAULT_AUTOFILL_STATE,
    debounceMs: 700,
  })
  const { getToken } = useAuthToken()
  const [serverUpdatedAt, setServerUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  function normalizeState(input: any): AutofillState {
    const src = input || {}
    return {
      inputs: { ...DEFAULT_AUTOFILL_STATE.inputs, ...(src.inputs || {}) },
      templates: { ...DEFAULT_AUTOFILL_STATE.templates, ...(src.templates || {}) },
      compare: { ...DEFAULT_AUTOFILL_STATE.compare, ...(src.compare || {}) },
    }
  }

  // Normalize any preloaded data (from localStorage via useAutosave)
  useEffect(() => {
    if (!data || !(data as any).inputs) {
      setData((prev) => normalizeState(prev))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await getAutofillStateWithRefresh(async () => (await getToken()) || '')
        if (!cancelled && res && res.state && typeof res.state === 'object') {
          setData(normalizeState(res.state))
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

  const header = useMemo(() => (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-semibold tracking-tight">Autofill Assistant</h1>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {loading ? <span>Loading...</span> : lastSavedAt ? <span>Saved {new Date(lastSavedAt).toLocaleTimeString()}</span> : <span>Not saved yet</span>}
        {serverUpdatedAt && <span className="hidden sm:inline">Server: {new Date(serverUpdatedAt).toLocaleTimeString()}</span>}
        <Button
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={async () => {
            saveNow()
            try {
              setSaving(true)
              const res = await saveAutofillStateWithRefresh(async () => (await getToken()) || '', data)
              setServerUpdatedAt(res.updated_at)
            } finally {
              setSaving(false)
            }
          }}
        >{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </div>
  ), [loading, lastSavedAt, serverUpdatedAt, saving, getToken, data, saveNow])

  return (
    <div className="container mx-auto px-4">
      {header}
      <Card className="p-4">
        <Tabs defaultValue="inputs" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="compare">JD Compare</TabsTrigger>
          </TabsList>
          <TabsContent value="inputs" className="mt-6">
            <InputsForm
              value={data.inputs}
              onChange={(v) => setData((prev) => ({ ...prev, inputs: v }))}
            />
          </TabsContent>
          <TabsContent value="templates" className="mt-6">
            <TemplateEditor
              value={data.templates}
              onChange={(v) => setData((prev) => ({ ...prev, templates: v }))}
              previewWith={data}
            />
          </TabsContent>
          <TabsContent value="compare" className="mt-6">
            <JDCompare
              value={data.compare}
              onChange={(v) => setData((prev) => ({ ...prev, compare: v }))}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

export default AutofillPage


