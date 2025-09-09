import { useRef } from 'react'
import { Link, Mail, MapPin, Phone } from 'lucide-react'
import { ResumeInlineEditable } from '@/components/resume/ResumeInlineEditable'
import { Button } from '@/components/ui/button'

type PersonalInfo = {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  photoUrl?: string
}

type PersonalInfoSectionProps = {
  personalInfo: PersonalInfo
  onChange: (field: keyof PersonalInfo, value: string) => void
  align?: 'left' | 'center'
  divider?: boolean
  headerStyle?: 'default' | 'bar'
  showPhotoControls?: boolean
}

export function PersonalInfoSection({ personalInfo, onChange, align = 'center', divider = true, headerStyle = 'default', showPhotoControls = false }: PersonalInfoSectionProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const onPickFile = () => fileRef.current?.click()
  const onFileSelected = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      onChange('photoUrl' as any, dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const items = [
    {
      key: 'email',
      icon: <Mail className="h-3.5 w-3.5 text-gray-500" />,
      field: 'email' as const,
      placeholder: 'email@example.com',
    },
    {
      key: 'phone',
      icon: <Phone className="h-3.5 w-3.5 text-gray-500" />,
      field: 'phone' as const,
      placeholder: '(555) 123-4567',
    },
    {
      key: 'location',
      icon: <MapPin className="h-3.5 w-3.5 text-gray-500" />,
      field: 'location' as const,
      placeholder: 'City, Country',
    },
    {
      key: 'linkedin',
      icon: <Link className="h-3.5 w-3.5 text-gray-500" />,
      field: 'linkedin' as const,
      placeholder: 'linkedin.com/in/username',
    },
  ]

  return (
    <div className={(align === 'center' ? 'text-center' : 'text-left') + ' pb-6 mb-6 ' + (divider ? 'border-b border-gray-200' : '')}>
      {headerStyle === 'bar' && (
        <div className="-mt-2 mb-4 h-2 w-full bg-gray-900 rounded" />
      )}
      {showPhotoControls && (
        <div className={(align === 'center' ? 'justify-center' : 'justify-start') + ' flex items-center gap-3 mb-3'}>
          <div className="w-16 h-16 rounded-full overflow-hidden ring-1 ring-border bg-muted">
            {personalInfo.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={personalInfo.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-[10px] text-muted-foreground">Photo</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFileSelected(f)
              e.currentTarget.value = ''
            }} />
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onPickFile}>Upload</Button>
            {personalInfo.photoUrl && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onChange('photoUrl' as any, '')}>Remove</Button>
            )}
          </div>
        </div>
      )}
      <ResumeInlineEditable 
        value={personalInfo.fullName || ''} 
        onChange={(v) => onChange('fullName', v)} 
        placeholder="Your Name" 
        className={(align === 'center' ? '' : 'pl-0') + ' text-3xl font-bold text-gray-900 mb-4 px-2 py-1 hover:bg-gray-50 rounded transition-colors'}
      />
      <div className={'flex flex-wrap ' + (align === 'center' ? 'justify-center' : 'justify-start') + ' items-center gap-y-2 text-sm text-gray-600'}>
        {items.map((it, idx) => {
          const value = (personalInfo as any)[it.field] as string | undefined
          return (
            <div
              key={it.key}
              className={
                `flex items-center gap-1.5 px-1` +
                (idx > 0
                  ? ' relative pl-4 before:content-["•"] before:text-gray-400 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2'
                  : '')
              }
            >
              {it.icon}
              <ResumeInlineEditable 
                value={value || ''} 
                onChange={(v) => onChange(it.field, v)} 
                placeholder={it.placeholder} 
                className="px-2 py-1 hover:bg-gray-50 rounded transition-colors"
              />
              {it.key === 'linkedin' && value && /^https?:\/\//.test(value.trim()) && (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-600 hover:underline"
                >
                  View
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PersonalInfoSection


