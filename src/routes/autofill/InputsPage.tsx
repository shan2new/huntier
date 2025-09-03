import { CheckCircle2, Clock } from 'lucide-react'
import InputsForm from '@/components/autofill/InputsForm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import useAutofillState from '@/hooks/useAutofillState'

export function AutofillInputsPage() {
  const { data, setData, lastSavedAt, loading, saving, saveToServer } = useAutofillState()

  return (
    <div className="h-full">
      <div className="max-w-4xl mx-auto h-full px-6 py-4 flex flex-col min-h-0">
        <div className="mb-6 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Personal Information</h1>
              <p className="text-muted-foreground text-lg">Fill in your details once, use everywhere</p>
            </div>
            <div className="flex items-center gap-4">
              {lastSavedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Saved {new Date(lastSavedAt).toLocaleTimeString()}</span>
                </div>
              )}
              <Button 
                onClick={() => saveToServer()} 
                disabled={saving || loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg font-medium shadow-sm"
              >
                {saving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
          {loading && (
            <Badge variant="secondary" className="animate-pulse">
              Loading your information...
            </Badge>
          )}
        </div>
        <ScrollArea className="flex-1 min-h-0 rounded-lg">
          <div className="pr-4">
            <InputsForm value={data.inputs} onChange={(v) => setData((prev) => ({ ...prev, inputs: v }))} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export default AutofillInputsPage


