import { useCallback, useEffect, useRef, useState } from 'react'
import type { JDCompareState } from '@/types/autofill'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { analyzeAutofillScreenshotsWithRefresh } from '@/lib/api'
import { useAuthToken } from '@/lib/auth'
// Using native <img> for preview to avoid extra dependencies

export interface JDCompareProps {
  value: JDCompareState
  onChange: (value: JDCompareState) => void
  onExtract?: (value: JDCompareState) => void
}

export function JDCompare({ value, onChange, onExtract }: JDCompareProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const { getToken } = useAuthToken()
  const [isAnalyzing, setAnalyzing] = useState(false)

  const onFiles = useCallback(async (files: Array<File>) => {
    const urls = await Promise.all(files.map((f) => fileToDataUrl(f)))
    const existing = Array.isArray(value.screenshots) ? value.screenshots : []
    onChange({ ...value, screenshots: [...existing, ...urls].slice(0, 12) })
  }, [onChange, value])

  const extract = useCallback(() => {
    // Simple keyword extraction baseline (client-only; can be replaced with backend)
    const text = (value.jdText || '').toLowerCase()
    const keywords = Array.from(new Set(
      (text.match(/[a-zA-Z+#.]{3,}/g) || [])
        .filter((w) => w.length <= 18)
        .slice(0, 40)
    ))
    onChange({ ...value, detectedKeywords: keywords })
    onExtract?.({ ...value, detectedKeywords: keywords })
  }, [value, onChange, onExtract])

  // Paste handler for images
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || [])
      const files = items
        .filter((it) => it.kind === 'file')
        .map((it) => it.getAsFile())
        .filter(Boolean) as Array<File>
      if (files.length) {
        e.preventDefault()
        await onFiles(files)
      }
    }
    document.addEventListener('paste', handler as any)
    return () => document.removeEventListener('paste', handler as any)
  }, [onFiles])

  // Drag & drop support
  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const onOver = (ev: DragEvent) => { ev.preventDefault() }
    const onDrop = async (ev: DragEvent) => {
      ev.preventDefault()
      const files: Array<File> = []
      if (ev.dataTransfer?.files) {
        for (const f of Array.from(ev.dataTransfer.files)) files.push(f)
      }
      if (files.length) await onFiles(files)
    }
    el.addEventListener('dragover', onOver)
    el.addEventListener('drop', onDrop)
    return () => {
      el.removeEventListener('dragover', onOver)
      el.removeEventListener('drop', onDrop)
    }
  }, [onFiles])

  const runAnalyze = useCallback(async () => {
    try {
      setAnalyzing(true)
      const files: Array<File> = []
      // Allow re-upload from previews by reconstructing Blobs is complex; encourage users to paste/upload again
      // Here we only support analysis using files just chosen via input
      // For pasted images (data URLs), we convert them to Blob
      const dataUrls = Array.isArray(value.screenshots) ? value.screenshots : (value.screenshotDataUrl ? [value.screenshotDataUrl] : [])
      for (const url of dataUrls) {
        try {
          const res = await fetch(url)
          const blob = await res.blob()
          files.push(new File([blob], 'pasted.png', { type: blob.type }))
        } catch {}
      }
      if (files.length === 0) return
      const out = await analyzeAutofillScreenshotsWithRefresh(getToken, files, { previewText: value.jdText || '', jdText: value.jdText || '' })
      onChange({ ...value, suggestions: out.suggestions })
    } finally {
      setAnalyzing(false)
    }
  }, [value, getToken, onChange])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-8">
        <h3 className="text-xl font-semibold">Evidence Analyzer</h3>
        <p className="text-muted-foreground">Paste or drop multiple screenshots of the JD / LinkedIn post / profile. Press Enter to analyze, or click Analyze.</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Evidence input */}
        <div ref={dropRef} className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-8 space-y-8">
          <div className="text-center lg:text-left">
            <h4 className="text-xl font-semibold text-foreground mb-3">Screenshots & Notes</h4>
            <p className="text-muted-foreground">Paste multiple images (Cmd+V), drag & drop, or upload. Add any text notes.</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Notes / Snippets</Label>
              <Textarea 
                rows={16} 
                value={value.jdText} 
                onChange={(e) => onChange({ ...value, jdText: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runAnalyze() }
                }} 
                placeholder="Paste any text from JD/LinkedIn here. Press Enter to analyze."
                className="border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring] min-h-[400px] resize-none"
              />
            </div>
            
            <div className="space-y-4">
              <Label className="text-sm font-medium text-foreground">Actions</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Input 
                  ref={fileRef} 
                  type="file" 
                  accept="image/*" multiple
                  className="hidden" 
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length) onFiles(files)
                  }} 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 sm:flex-none h-11"
                >
                  Upload Screenshots
                </Button>
                <Button 
                  type="button" 
                  onClick={extract}
                  className="flex-1 sm:flex-none h-11"
                >
                  Detect Keywords
                </Button>
                <Button type="button" onClick={runAnalyze} disabled={isAnalyzing} className="flex-1 sm:flex-none h-11">
                  {isAnalyzing ? 'Analyzing…' : 'Analyze' }
                </Button>
              </div>
            </div>
            
            {((value.screenshots && value.screenshots.length) || value.screenshotDataUrl) && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Screenshots</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(value.screenshots && value.screenshots.length ? value.screenshots : [value.screenshotDataUrl!]).map((src, idx) => (
                    <div key={idx} className="relative group border border-border rounded-md overflow-hidden bg-muted/20">
                      <img src={src} className="w-full h-32 object-cover" />
                      <button
                        className="absolute -top-1.5 -right-1.5 bg-background/90 border border-border rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100"
                        onClick={() => {
                          const arr = (value.screenshots && value.screenshots.length) ? [...value.screenshots] : [value.screenshotDataUrl!]
                          const next = arr.filter((_, i) => i !== idx)
                          onChange({ ...value, screenshots: next })
                        }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detected Highlights */}
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-8 space-y-8">
          <div className="text-center lg:text-left">
            <h4 className="text-xl font-semibold text-foreground mb-3">Detected Highlights</h4>
            <p className="text-muted-foreground">Use these to tailor your templates.</p>
          </div>
          
          <div className="space-y-8">
            {/* Company and Role Section */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="extractedCompany" className="text-sm font-medium text-foreground">Company</Label>
                <Input 
                  id="extractedCompany" 
                  value={value.extractedCompany || ''} 
                  onChange={(e) => onChange({ ...value, extractedCompany: e.target.value })} 
                  placeholder="Acme Inc."
                  className="border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring] h-11"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="extractedRole" className="text-sm font-medium text-foreground">Role</Label>
                <Input 
                  id="extractedRole" 
                  value={value.extractedRole || ''} 
                  onChange={(e) => onChange({ ...value, extractedRole: e.target.value })} 
                  placeholder="Senior Frontend Engineer"
                  className="border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring] h-11"
                />
              </div>
            </div>
            
            {/* Keywords Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-foreground">Detected Keywords</Label>
              <div className="min-h-[200px] bg-muted/20 rounded-lg border border-border p-6">
                {value.detectedKeywords.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-muted/40 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🔍</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-2">No keywords detected yet</p>
                    <p className="text-xs">Upload a JD or paste text, then click "Detect Keywords"</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Found {value.detectedKeywords.length} keywords
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {value.detectedKeywords.map((k) => (
                        <Badge key={k} variant="secondary" className="font-medium px-3 py-1.5 text-xs">{k}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions from analysis */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-foreground">AI Suggestions</Label>
              <div className="min-h-[160px] bg-muted/20 rounded-lg border border-border p-4 text-sm">
                {!value.suggestions || value.suggestions.length === 0 ? (
                  <div className="text-muted-foreground">Paste screenshots and press Enter or click Analyze to get suggestions.</div>
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    {value.suggestions.map((s, i) => (<li key={i}>{s}</li>))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default JDCompare


