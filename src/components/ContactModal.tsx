import { useEffect, useState } from 'react'
import { AlertCircle, User } from 'lucide-react'
import { MotionEffect } from '@/components/animate-ui/effects/motion-effect'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIsMobile } from '@/hooks/use-mobile'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

interface Contact {
  id: string
  name: string
  role: 'recruiter' | 'referrer' | 'interviewer'
  isThirdParty: boolean
  description: string
  avatar?: string
  is_primary?: boolean
}

interface ContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (contact: Contact | Omit<Contact, 'id'>) => void
  contact?: Contact | null
  onClose: () => void
}

const relationOptions = [
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'referrer', label: 'Referrer' },
  { value: 'interviewer', label: 'Interviewer' },
]

export function ContactModal({
  open,
  onOpenChange,
  onSave,
  contact,
  onClose,
}: ContactModalProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<'recruiter' | 'referrer' | 'interviewer'>('recruiter')
  const [isThirdParty, setIsThirdParty] = useState(false)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const isMobile = useIsMobile()

  const isEditing = !!contact

  // Initialize form with contact data when editing
  useEffect(() => {
    if (contact) {
      setName(contact.name)
      setRole(contact.role)
      setIsThirdParty(contact.isThirdParty)
      setDescription(contact.description)
    } else {
      setName('')
      setRole('recruiter')
      setIsThirdParty(false)
      setDescription('')
    }
    setError('')
  }, [contact, open])

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    const contactData = {
      name: name.trim(),
      role,
      isThirdParty,
      description: description.trim(),
    }

    if (contact) {
      onSave({ ...contact, ...contactData })
    } else {
      onSave(contactData)
    }

    handleClose()
  }

  const handleClose = () => {
    onClose()
    setName('')
    setRole('recruiter')
    setIsThirdParty(false)
    setDescription('')
    setError('')
  }

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!open) return null

  const Body = (
    <MotionEffect fade className="space-y-6">
      {/* Avatar and Name Section */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
            {name ? (
              <span className="text-lg font-semibold text-primary">
                {getInitials(name)}
              </span>
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Name and Relation */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relation">Relation</Label>
            <Select value={role} onValueChange={(value: 'recruiter' | 'referrer' | 'interviewer') => setRole(value)}>
              <SelectTrigger id="relation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Third Party Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="third-party"
          checked={isThirdParty}
          onCheckedChange={(checked) => setIsThirdParty(!!checked)}
        />
        <Label htmlFor="third-party" className="text-sm">
          Is Third Party?
        </Label>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Anything you wish to add about this contact..."
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Error Message */}
      {error && (
        <MotionEffect fade>
          <div className="flex items-center space-x-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </MotionEffect>
      )}
    </MotionEffect>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <div className="flex flex-col max-h-[80vh]">
            <DrawerHeader className="px-6 py-4 border-b border-border">
              <DrawerTitle className="text-lg font-semibold tracking-tight">
                {isEditing ? 'Edit Contact' : 'Add Contact'}
              </DrawerTitle>
            </DrawerHeader>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {Body}
                </div>
              </ScrollArea>
            </div>

            <DrawerFooter className="border-t border-border bg-background/30">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!name.trim()}>
                  {isEditing ? 'Update' : 'Save'}
                </Button>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw] p-0 gap-0 border border-border rounded-xl bg-card">
        <div className="flex flex-col">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {isEditing ? 'Edit Contact' : 'Add Contact'}
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          <div className="p-6 space-y-6">
            {Body}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-background/30">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!name.trim()}
              >
                {isEditing ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
