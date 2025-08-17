import { useState } from 'react'
import { motion } from 'motion/react'
import { format } from 'date-fns'
import { CalendarIcon, Clock, MapPin, Phone, Video } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const typeOptions = [
  { value: 'phone_screen', label: 'Phone Screen', icon: Phone },
  { value: 'technical', label: 'Technical', icon: Video },
  { value: 'behavioral', label: 'Behavioral', icon: Video },
  { value: 'final', label: 'Final', icon: Video },
  { value: 'onsite', label: 'Onsite', icon: MapPin },
]

const modeOptions = [
  { value: 'online', label: 'Online' },
  { value: 'onsite', label: 'Onsite' },
  { value: 'phone', label: 'Phone' },
]

interface InterviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  interview?: any
  onSave: (data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function InterviewModal({ 
  open, 
  onOpenChange, 
  mode, 
  interview, 
  onSave,
  onDelete 
}: InterviewModalProps) {
  const [type, setType] = useState(interview?.type || 'phone_screen')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    interview?.scheduled_at ? new Date(interview.scheduled_at) : undefined
  )
  const [selectedTime, setSelectedTime] = useState(
    interview?.scheduled_at 
      ? format(new Date(interview.scheduled_at), 'HH:mm')
      : '10:00'
  )
  const [interviewMode, setInterviewMode] = useState(interview?.mode || 'online')
  const [dateOpen, setDateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (!selectedDate || !selectedTime) return
    
    setIsSubmitting(true)
    try {
      const [hours, minutes] = selectedTime.split(':')
      const scheduledDateTime = new Date(selectedDate)
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes))

      await onSave({
        ...(mode === 'edit' && { id: interview.id }),
        type,
        scheduled_at: scheduledDateTime.toISOString(),
        mode: interviewMode
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving interview:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!interview?.id || !onDelete) return
    
    if (!confirm('Are you sure you want to delete this interview?')) return

    setIsSubmitting(true)
    try {
      await onDelete(interview.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting interview:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const TypeIcon = typeOptions.find(t => t.value === type)?.icon || Clock

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass shadow-soft-lg border-zinc-200/20 dark:border-zinc-800/30">
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <TypeIcon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {mode === 'create' ? 'Schedule Interview' : 'Edit Interview'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {mode === 'create' ? 'Add a new interview round' : 'Update interview details'}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Interview Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50">
                  <SelectValue placeholder="Select interview type" />
                </SelectTrigger>
                <SelectContent className="bg-background border-zinc-200/50 dark:border-zinc-800/50">
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between font-normal bg-background/50 border-zinc-200/50 dark:border-zinc-800/50",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      {selectedDate ? format(selectedDate, "MMM dd") : "Select date"}
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date)
                        setDateOpen(false)
                      }}
                      disabled={(date) => date < new Date()}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Time</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Mode</Label>
              <Select value={interviewMode} onValueChange={setInterviewMode}>
                <SelectTrigger className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className="bg-background border-zinc-200/50 dark:border-zinc-800/50">
                  {modeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200/10 dark:border-zinc-800/30">
            <div>
              {mode === 'edit' && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={!selectedDate || !selectedTime || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Schedule' : 'Update'}
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
