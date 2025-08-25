import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  React.useEffect(() => {
    adjustHeight()
  }, [adjustHeight, props.value])

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    adjustHeight()
    if (props.onInput) {
      props.onInput(e)
    }
  }

  return (
    <textarea
      ref={textareaRef}
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background flex min-h-[0.4rem] w-full rounded-md border px-3 py-2 text-copy-14 shadow-xs transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden",
        className
      )}
      rows={1}
      onInput={handleInput}
      {...props}
    />
  )
}

export { Textarea }
