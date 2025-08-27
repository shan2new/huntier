import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'

type Section = {
  id: string
  type: string
  title: string
  order: number
}

type SectionManagerProps = {
  sections: Section[]
  onAddSection: (type: string, title: string) => void
  availableSections: Array<{ type: string; title: string; icon: React.ReactNode }>
}

export function SectionManager({ sections, onAddSection, availableSections }: SectionManagerProps) {
  const [showMenu, setShowMenu] = useState(false)

  const existingSectionTypes = sections.map(s => s.type)
  const addableSections = availableSections.filter(s => !existingSectionTypes.includes(s.type))

  if (addableSections.length === 0) return null

  return (
    <div className="relative my-4 section-manager">
      <div className="border-t border-gray-200 relative">
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMenu(!showMenu)}
              className="bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 border-gray-200 shadow-sm transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Section
            </Button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="p-2">
                    {addableSections.map(section => (
                      <button
                        key={section.type}
                        onClick={() => {
                          onAddSection(section.type, section.title)
                          setShowMenu(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-3"
                      >
                        {section.icon}
                        <span>{section.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SectionManager
