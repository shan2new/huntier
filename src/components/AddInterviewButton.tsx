import { PlusCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AddInterviewButtonProps {
  onAdd: () => void
}

export function AddInterviewButton({ onAdd }: AddInterviewButtonProps) {
  return (
    <div className="relative">
      {/* Edge to Add Interview button */}
      <div className="absolute left-1/2 translate-x-1 top-full w-1 h-12 z-0">
        <div className="w-full h-full border-l-1 border-dashed border-muted-foreground/30" />
      </div>
      
      <div className="mt-12">
        {/* Add Interview step */}
        <div className="flex items-center">
          <div className="ml-3 flex-1 relative z-10" onClick={onAdd}>
            <Card className="rounded-md border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 transition-colors relative z-10 cursor-pointer">
              <CardContent className="px-2 py-1.5">
                <div className="flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    <PlusCircle className="h-4 w-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
