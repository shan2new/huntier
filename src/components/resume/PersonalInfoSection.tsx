import { useEffect } from 'react'
import { ResumeInlineEditable } from '@/components/resume/ResumeInlineEditable'
import { Link, Mail, MapPin, Phone } from 'lucide-react'

type PersonalInfo = {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
}

type PersonalInfoSectionProps = {
  personalInfo: PersonalInfo
  onChange: (field: keyof PersonalInfo, value: string) => void
}

export function PersonalInfoSection({ personalInfo, onChange }: PersonalInfoSectionProps) {
  // Auto-detect location from browser if not set
  useEffect(() => {
    if (!personalInfo.location && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use a reverse geocoding service to get city/country from coordinates
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            )
            const data = await response.json()
            if (data.city && data.countryName) {
              onChange('location', `${data.city}, ${data.countryName}`)
            }
          } catch (error) {
            console.error('Failed to get location:', error)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
        }
      )
    }
  }, [personalInfo.location, onChange])

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
    <div className="text-center pb-6 mb-6 border-b border-gray-200">
      <ResumeInlineEditable 
        value={personalInfo.fullName || ''} 
        onChange={(v) => onChange('fullName', v)} 
        placeholder="Your Name" 
        className="text-3xl font-bold text-gray-900 mb-4 px-2 py-1 hover:bg-gray-50 rounded transition-colors"
      />
      <div className="flex flex-wrap justify-center items-center gap-y-2 text-sm text-gray-600">
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


