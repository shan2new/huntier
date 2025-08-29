import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Error500Props = {
  title?: string
  message?: string
  details?: string
  onRetry?: () => void
}

export function Error500(props: Error500Props) {
  const { title, message, details, onRetry } = props
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-2 flex-1">
              <h1 className="text-lg font-semibold tracking-tight">{title || 'Something went wrong'}</h1>
              <p className="text-sm text-muted-foreground">
                {message || 'We hit an unexpected error. You can try again or head back to the dashboard.'}
              </p>
              {details ? (
                <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-auto whitespace-pre-wrap border border-border">
                  {details}
                </pre>
              ) : null}
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={onRetry || (() => window.location.reload())}>Reload</Button>
                <Button size="sm" variant="outline" asChild>
                  <a href="/dashboard">Go to Dashboard</a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


