import { InlineEditable } from '@/components/resume/InlineEditable'

type ResumeInlineEditableProps = React.ComponentProps<typeof InlineEditable>

export function ResumeInlineEditable({ className, ...props }: ResumeInlineEditableProps) {
  const enforcedClasses = 'hover:bg-gray-100 transition-colors'
  const mergedClassName = (className ? className + ' ' : '') + enforcedClasses
  return <InlineEditable {...props} className={mergedClassName} />
}

export default ResumeInlineEditable


