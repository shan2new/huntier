import { useState } from 'react'
import { formatDateIndian } from '@/lib/utils'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InterviewModal } from '@/components/InterviewModal'
import { Calendar, Video, Users, CheckCircle, Plus, Edit, MapPin, Phone, Clock } from 'lucide-react'

const typeIcons = {
  phone_screen: Phone,
  technical: Video,
  behavioral: Video,
  final: CheckCircle,
  onsite: MapPin,
  // Legacy support
  screen: Phone,
  dsa: Video,
  system_design: Video,
  coding: Video,
  hm: Users,
  bar_raiser: Users,
  other: Calendar,
}

interface InterviewsTimelineProps {
  items: any[]
  onSchedule: (body: any) => Promise<void>
  onUpdate?: (id: string, body: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function InterviewsTimeline({ 
  items, 
  onSchedule, 
  onUpdate, 
  onDelete 
}: InterviewsTimelineProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedInterview, setSelectedInterview] = useState<any>(null)

  const handleCreate = () => {
    setModalMode('create')
    setSelectedInterview(null)
    setModalOpen(true)
  }

  const handleEdit = (interview: any) => {
    setModalMode('edit')
    setSelectedInterview(interview)
    setModalOpen(true)
  }

  const handleSave = async (data: any) => {
    if (modalMode === 'create') {
      await onSchedule(data)
    } else if (modalMode === 'edit' && selectedInterview && onUpdate) {
      await onUpdate(selectedInterview.id, data)
    }
  }

  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Interview Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleCreate}
          size="sm"
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Schedule Interview
        </Button>
      </div>

      {/* Interviews Timeline */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="glass border-border/20">
            <CardContent className="p-12 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No interviews scheduled</p>
              <p className="text-xs text-muted-foreground mt-1">Schedule your first interview above</p>
            </CardContent>
          </Card>
        ) : (
          items.map((interview) => {
            const TypeIcon = typeIcons[interview.type as keyof typeof typeIcons] || Calendar
            const isCompleted = !!interview.completed_at
            const scheduledDate = new Date(interview.scheduled_at)
            
            return (
              <Card key={interview.id} className="glass border-border/20 shadow-soft group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-muted/50 text-muted-foreground'}`}>
                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : <TypeIcon className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs font-medium">
                            {interview.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {interview.mode}
                          </Badge>
                          {isCompleted && (
                            <Badge className="text-xs bg-emerald-100 text-emerald-700">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDateIndian(scheduledDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{format(scheduledDate, 'HH:mm')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {!isCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(interview)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Interview Modal */}
      <InterviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        interview={selectedInterview}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}