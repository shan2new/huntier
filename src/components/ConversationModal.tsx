import { useState } from 'react'
import { motion } from 'motion/react'
import { Linkedin, Mail, MessageCircle, MessageSquare, Phone, Send } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const mediumOptions = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'other', label: 'Other', icon: MessageSquare },
]

const directionOptions = [
  { value: 'outbound', label: 'Outbound (You initiated)' },
  { value: 'inbound', label: 'Inbound (They contacted you)' },
]

interface ConversationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  conversation?: any
  onSave: (data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function ConversationModal({ 
  open, 
  onOpenChange, 
  mode, 
  conversation, 
  onSave,
  onDelete 
}: ConversationModalProps) {
  const [medium, setMedium] = useState(conversation?.medium || 'email')
  const [direction, setDirection] = useState(conversation?.direction || 'outbound')
  const [text, setText] = useState(conversation?.text || '')
  const [occurredAt, setOccurredAt] = useState(
    conversation?.occurred_at
      ? new Date(conversation.occurred_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (!text.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSave({
        ...(mode === 'edit' && { id: conversation.id }),
        medium,
        direction,
        text: text.trim(),
        occurred_at: new Date(occurredAt).toISOString(),
      })

      onOpenChange(false)
      
      // Reset form if creating new
      if (mode === 'create') {
        setText('')
        setOccurredAt(new Date().toISOString().slice(0, 16))
      }
    } catch (error) {
      console.error('Error saving conversation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!conversation?.id || !onDelete) return
    
    if (!confirm('Are you sure you want to delete this conversation?')) return

    setIsSubmitting(true)
    try {
      await onDelete(conversation.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting conversation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedMedium = mediumOptions.find(m => m.value === medium)
  const MediumIcon = selectedMedium?.icon || MessageSquare

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass shadow-soft-lg border-zinc-200/20 dark:border-zinc-800/30">
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
                <MediumIcon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {mode === 'create' ? 'Add Conversation' : 'Edit Conversation'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {mode === 'create' ? 'Record a new interaction' : 'Update conversation details'}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Medium</Label>
                <Select value={medium} onValueChange={setMedium}>
                  <SelectTrigger className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50">
                    <SelectValue placeholder="Select medium" />
                  </SelectTrigger>
                                  <SelectContent className="bg-background border-zinc-200/50 dark:border-zinc-800/50">
                  {mediumOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Direction</Label>
                <Select value={direction} onValueChange={setDirection}>
                  <SelectTrigger className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-zinc-200/50 dark:border-zinc-800/50">
                    {directionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Date & time</Label>
              <Input
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {medium === 'email' ? 'Message' : 'Notes'}
              </Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  medium === 'email' 
                    ? 'Email content or summary...' 
                    : 'Conversation notes or summary...'
                }
                className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50 min-h-[120px] resize-none"
                rows={6}
              />
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
                disabled={!text.trim() || isSubmitting}
              >
                <Send className="h-4 w-4 mr-1.5" />
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add' : 'Update'}
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
