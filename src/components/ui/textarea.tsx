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
        "border-input h-10 placeholder:text-muted-foreground focus-visible:none focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input flex min-h-[0.4rem] w-full rounded-md border bg-input px-2 py-1 text-copy-14 shadow-xs transition-[color,box-shadow] outline-none focus-visible:none disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden",
        className
      )}
      rows={1}
      onInput={handleInput}
      {...props}
    />
  )
}

export { Textarea }
