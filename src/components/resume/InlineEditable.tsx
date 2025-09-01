import { useEffect, useRef } from 'react'

type InlineEditableProps = {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
}

export function InlineEditable({
  value,
  onChange,
  placeholder,
  className,
  multiline,
}: InlineEditableProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) return
    // Avoid resetting caret position while the user is actively editing
    if (document.activeElement === ref.current) return
    if (ref.current.innerText !== (value || '')) {
      ref.current.innerText = value || ''
    }
  }, [value])

  return (
    <div
      ref={ref}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder || ''}
      className={
        `outline-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:bg-blue-50/50 rounded px-1 transition-all duration-150 cursor-text
        empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:italic
        hover:outline-2 hover:outline-gray-200 hover:outline-offset-2 ` +
        (className || '')
      }
      style={{
        minWidth: multiline ? 'auto' : '60px',
        minHeight: multiline ? '1.5em' : 'auto',
        display: 'inline-block',
        wordBreak: 'break-word',
        whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
      }}
      onInput={(e) => {
        // Normalize NBSP to regular spaces but do not trim; trimming can cause
        // controlled updates that reset the caret position on key presses
        const text = (e.currentTarget.innerText || '').replace(/\u00A0/g, ' ')
        onChange(text)
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          ;(e.currentTarget as HTMLDivElement).blur()
        }
        // prevent accidental line splits on space in non-multiline nodes due to IME/non-breaking space quirks
        if (!multiline && e.key === ' ') {
          // Let the space insert normally; avoid any custom text mutations that reset caret
          // No-op on purpose
        }
      }}
      onFocus={(e) => {
        // Select all text on focus for easier editing
        if (!multiline && window.getSelection && e.currentTarget.innerText) {
          const selection = window.getSelection()
          const range = document.createRange()
          range.selectNodeContents(e.currentTarget)
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
      }}
    />
  )
}

export default InlineEditable


