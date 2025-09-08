import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type InlineEditableProps = {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  maxChars?: number
  maxLines?: number
  onRewrite?: (current: string) => Promise<string>
}

export function InlineEditable({
  value,
  onChange,
  placeholder,
  className,
  multiline,
  maxChars,
  maxLines,
  onRewrite,
}: InlineEditableProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [selectionOpen, setSelectionOpen] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null)
  const [focused, setFocused] = useState(false)
  // Hover not used for counters anymore (only show on edit)

  useEffect(() => {
    if (!ref.current) return
    // Avoid resetting caret position while the user is actively editing
    if (document.activeElement === ref.current) return
    if (ref.current.innerText !== (value || '')) {
      ref.current.innerText = value || ''
    }
  }, [value])

  // Selection toolbar positioning
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !el.contains(sel.anchorNode) || !el.contains(sel.focusNode)) {
        setSelectionOpen(false)
        return
      }
      let rect: DOMRect | null = null
      try {
        const r = sel.getRangeAt(0)
        rect = r.getBoundingClientRect()
        if ((!rect || (rect.width === 0 && rect.height === 0)) && (r as any).getClientRects) {
          const first = (r as any).getClientRects?.()[0]
          if (first) rect = first
        }
      } catch {}
      if (rect) {
        setToolbarPos({ x: rect.left + rect.width / 2, y: rect.top })
        setSelectionOpen(true)
      }
    }
    const onScrollOrResize = () => {
      if (selectionOpen) update()
    }
    document.addEventListener('selectionchange', update)
    document.addEventListener('mouseup', update, true)
    document.addEventListener('keyup', update, true)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      document.removeEventListener('selectionchange', update)
      document.removeEventListener('mouseup', update, true)
      document.removeEventListener('keyup', update, true)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [selectionOpen])

  return (
    <>
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
        let text = (e.currentTarget.innerText || '').replace(/\u00A0/g, ' ')
        if (typeof maxLines === 'number' && maxLines > 0) {
          const lines = text.split(/\n|\r|\r\n/g)
          if (lines.length > maxLines) {
            text = lines.slice(0, maxLines).join('\n')
            e.currentTarget.innerText = text
          }
        }
        if (typeof maxChars === 'number' && maxChars > 0 && text.length > maxChars) {
          text = text.slice(0, maxChars)
          e.currentTarget.innerText = text
        }
        onChange(text)
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          ;(e.currentTarget as HTMLDivElement).blur()
        }
        // Bullets ergonomics for multiline: Enter adds new line, Shift+Enter soft break; Backspace merge
        if (multiline) {
          if (e.key === 'Enter' && !e.shiftKey) {
            // Allow default but ensure we don't exceed maxLines
            if (typeof maxLines === 'number' && maxLines > 0) {
              const text = (e.currentTarget.innerText || '')
              const lines = text.split(/\n|\r|\r\n/g)
              if (lines.length >= maxLines) {
                e.preventDefault()
              }
            }
          }
          if (e.key === 'Enter' && e.shiftKey) {
            // Soft break already default in contentEditable; keep
          }
          if (e.key === 'Backspace') {
            // Let browser handle merge; we avoid custom mutation to preserve caret
          }
        }
      }}
      onPaste={(e) => {
        // Paste sanitization: force plain text
        e.preventDefault()
        const text = (e.clipboardData || (window as any).clipboardData).getData('text/plain') || ''
        document.execCommand('insertText', false, text)
      }}
      onFocus={(e) => {
        setFocused(true)
        // Select all text on focus for easier editing
        if (!multiline && window.getSelection && e.currentTarget.innerText) {
          const selection = window.getSelection()
          const range = document.createRange()
          range.selectNodeContents(e.currentTarget)
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
      }}
      onBlur={() => setFocused(false)}
    />
    {/* Tiny counters */}
    {(maxChars || maxLines) ? (() => {
      const textNow = (ref.current?.innerText || value || '')
      const charCount = textNow.length
      const lineCount = textNow.split(/\n|\r|\r\n/g).length
      const show = focused
      return show ? (
        <div className="mt-1 text-[10px] text-muted-foreground">
          {typeof maxChars === 'number' ? `${charCount}/${maxChars} chars` : ''}
          {typeof maxChars === 'number' && typeof maxLines === 'number' ? ' · ' : ''}
          {typeof maxLines === 'number' ? `${lineCount}/${maxLines} lines` : ''}
        </div>
      ) : null
    })() : null}
    {/* Selection toolbar */}
    {selectionOpen && toolbarPos ? (
      createPortal(
        <div
          className="fixed z-[100] rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1 flex items-center gap-1"
          style={{
            left: Math.min(Math.max(toolbarPos.x, 8), window.innerWidth - 8),
            top: Math.max(toolbarPos.y, 8),
            transform: 'translate(-50%, -100%)'
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            className="px-2 py-1 text-xs rounded hover:bg-muted"
            onClick={() => document.execCommand('bold')}
            aria-label="Bold"
          >
            B
          </button>
          <button
            className="px-2 py-1 text-xs rounded hover:bg-muted italic"
            onClick={() => document.execCommand('italic')}
            aria-label="Italic"
          >
            I
          </button>
          <button
            className="px-2 py-1 text-xs rounded hover:bg-muted"
            onClick={() => {
              const url = prompt('Link URL')
              if (url) document.execCommand('createLink', false, url)
            }}
            aria-label="Link"
          >
            Link
          </button>
          {onRewrite ? (
            <button
              className="px-2 py-1 text-xs rounded hover:bg-primary/10 text-primary disabled:opacity-50"
              onClick={async () => {
                if (rewriting) return
                const sel = window.getSelection()
                if (!sel || sel.isCollapsed) return
                const selected = sel.toString()
                if (!selected.trim()) return
                setRewriting(true)
                try {
                  const next = await onRewrite(selected)
                  if (typeof next === 'string' && next.trim()) {
                    document.execCommand('insertText', false, next)
                    const text = (ref.current?.innerText || '').replace(/\u00A0/g, ' ')
                    onChange(text)
                  }
                } finally {
                  setRewriting(false)
                }
              }}
              aria-label="Rewrite selection with AI"
              disabled={rewriting}
            >
              {rewriting ? '…' : 'Rewrite'}
            </button>
          ) : null}
        </div>,
        document.body
      )
    ) : null}
    </>
  )
}

export default InlineEditable


