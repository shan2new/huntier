import { formatDistanceToNow } from 'date-fns'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'
import {
  Globe,
  Linkedin,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Send,
} from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { useApi } from '@/lib/use-api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ContactModal } from '@/components/ContactModal'

export interface Contact {
  id: string
  name: string
  title?: string | null
  notes?: string | null
  created_at: string
}

export interface Conversation {
  id: string
  application_id: string
  contact_id: string | null
  contact?: Contact | null
  medium: 'email' | 'linkedin' | 'phone' | 'whatsapp' | 'other' | null
  direction: 'outbound' | 'inbound'
  sender: 'user' | 'contact'
  text: string
  occurred_at: string
  created_at: string
}

interface ApplicationConversationsProps {
  applicationId?: string
  isCreating?: boolean
  className?: string
  // Called when a new conversation is created; provides occurred_at ISO string
  onActivity?: (occurredAtIso: string) => void
}

const mediumIcons = {
  email: Mail,
  linkedin: Linkedin,
  phone: Phone,
  whatsapp: MessageSquare,
  other: Globe,
}

const mediumLabels = {
  email: 'Email',
  linkedin: 'LinkedIn',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  other: 'Other',
}

export function ApplicationConversations({
  applicationId,
  isCreating = false,
  className = '',
  onActivity,
}: ApplicationConversationsProps) {
  const { apiCall } = useApi()
  const { user } = useUser()
  const [conversations, setConversations] = useState<Array<Conversation>>([])
  const [contacts, setContacts] = useState<Array<any>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Message input state
  const [newMessage, setNewMessage] = useState('')
  const [selectedContact, setSelectedContact] = useState<string | null>('user')
  const [selectedMedium, setSelectedMedium] = useState<string | null>(null)
  
  // Contact creation state (via ContactModal)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Scroll to bottom when conversations change
  useEffect(() => {
    scrollToBottom()
  }, [conversations])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // Fetch conversations and contacts
  useEffect(() => {
    if (applicationId && !isCreating) {
      fetchConversations()
      fetchContacts()
    }
  }, [applicationId])
  
  async function fetchConversations() {
    if (!applicationId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await apiCall<Array<Conversation>>(
        `/v1/applications/${applicationId}/conversations?limit=100`
      )
      setConversations(data)
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }
  
  async function fetchContacts() {
    if (!applicationId) return
    
    try {
      const data = await apiCall<Array<any>>(
        `/v1/applications/${applicationId}/contacts`
      )
      setContacts(data)
    } catch (err) {
      console.error('Failed to fetch contacts:', err)
    }
  }
  
  // Initialize default sender: last conversation's sender, else current user
  useEffect(() => {
    if (conversations.length > 0) {
      const last = conversations[conversations.length - 1]
      const lastSender = last.sender === 'user' ? 'user' : (last.contact_id || null)
      setSelectedContact(prev => (prev === null || prev === 'user') ? lastSender : prev)
    } else {
      setSelectedContact('user')
    }
  }, [conversations])
  
  const handleSendMessage = async () => {
    if (!applicationId || !newMessage.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const contactId = selectedContact === 'user' ? null : selectedContact
      const sender = selectedContact === 'user' ? 'user' : 'contact'
      const direction = sender === 'user' ? 'outbound' : 'inbound'
      
      const conversation = await apiCall<Conversation>(
        `/v1/applications/${applicationId}/conversations`,
        {
          method: 'POST',
          body: JSON.stringify({
            contact_id: contactId,
            medium: selectedMedium,
            direction,
            sender,
            text: newMessage,
          }),
        }
      )
      
      setConversations([...conversations, conversation])
      onActivity?.(conversation.occurred_at)
      setNewMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }
  
  const getContactName = (conv: Conversation) => {
    if (conv.sender === 'user') return 'You'
    return conv.contact?.name || 'Unknown Contact'
  }
  
  const getContactInitials = (conv: Conversation) => {
    const getInitials = (fullName: string) => fullName
      .split(' ')
      .filter(Boolean)
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)

    if (conv.sender === 'user') {
      const displayName = user?.fullName || 'You'
      return getInitials(displayName)
    }
    const name = conv.contact?.name || 'Unknown'
    return getInitials(name)
  }
  
  const getInitialsFromName = (name?: string | null) => {
    const n = (name || 'C')
      .split(' ')
      .filter(Boolean)
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
    return n
  }
  
  const getContactAvatarUrl = (contact: any | null | undefined): string | undefined => {
    if (!contact) return undefined
    return (
      contact.avatar_url ||
      contact.image_url ||
      contact.avatar ||
      contact.photo ||
      undefined
    )
  }
  
  return (
    <div className={`flex flex-col h-full ${className}`}>      
      {/* Messages Area */}
      <ScrollArea className="h-[300px] w-full">
        <div className="space-y-4 px-3">
        {conversations.length === 0 && !isLoading && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No conversations yet. Start by adding a message below.
          </div>
        )}
        
        <AnimatePresence>
          {conversations.map((conv, index) => {
            const isUser = conv.sender === 'user'
            const showDate = index === 0 || 
              new Date(conv.occurred_at).toDateString() !== 
              new Date(conversations[index - 1].occurred_at).toDateString()
            
            return (
              <div key={conv.id}>
                {showDate && (
                  <div className="flex items-center justify-center py-2">
                    <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      {formatDistanceToNow(new Date(conv.occurred_at), { addSuffix: true })}
                    </div>
                  </div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex gap-2",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!isUser && (
                    <div className="flex items-center justify-center">
                    <Avatar className="h-8 w-8">
                      {getContactAvatarUrl(conv.contact as any) && (
                        <AvatarImage src={getContactAvatarUrl(conv.contact as any)} />
                      )}
                      <AvatarFallback className="text-xs">
                        {getContactInitials(conv)}
                      </AvatarFallback>
                    </Avatar>
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[70%] space-y-1",
                    isUser && "items-end"
                  )}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{getContactName(conv)}</span>
                      {conv.medium && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {(() => {
                              const Icon = mediumIcons[conv.medium]
                              return <Icon className="h-3 w-3" />
                            })()}
                            {mediumLabels[conv.medium]}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className={cn(
                      "px-3 py-2 rounded-lg text-sm",
                      isUser 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-muted"
                    )}>
                      <div className="whitespace-pre-wrap break-words">{conv.text}</div>
                    </div>
                  </div>
                  
                  {isUser && (
                    <div className="flex items-end justify-center">
                    <Avatar className="h-8 w-8">
                      {user?.imageUrl && <AvatarImage src={user.imageUrl} />}
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {(() => {
                          const fullName = user?.fullName || 'You'
                          return fullName
                            .split(' ')
                            .filter(Boolean)
                            .map((n) => n.charAt(0))
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    </div>
                  )}
                </motion.div>
              </div>
            )
          })}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex justify-center py-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent"
            />
          </div>
        )}
        <div ref={messagesEndRef} />
          </div>
      </ScrollArea>
      
      {/* Input Area */}
      <div className="border-t py-2 px-2">
        
        {/* Message Input */}
        <div className="flex gap-2 items-center">
          {/* Avatar Dropdown */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full flex items-center justify-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Avatar className="h-9 w-9 cursor-pointer">
                    {selectedContact === 'user' && user?.imageUrl && (
                      <AvatarImage src={user.imageUrl} />
                    )}
                    {selectedContact && selectedContact !== 'user' && (() => {
                      const foundContact = contacts.find((item: any) => item.contact_id === selectedContact)
                      const url = getContactAvatarUrl(foundContact?.contact)
                      return url ? <AvatarImage src={url} /> : null
                    })()}
                    <AvatarFallback className={cn(
                      "text-xs",
                      selectedContact === 'user' && "bg-primary text-primary-foreground"
                    )}>
                      {(() => {
                        if (selectedContact === 'user') {
                          const fullName = user?.fullName || 'You'
                          return fullName
                            .split(' ')
                            .filter(Boolean)
                            .map((n) => n.charAt(0))
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        }
                        const name = contacts.find(c => c.contact_id === selectedContact)?.contact?.name || 'C'
                        return name.charAt(0).toUpperCase()
                      })()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[220px]">
                <DropdownMenuItem onClick={() => {
                  setSelectedContact('user')
                }} className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {user?.imageUrl && <AvatarImage src={user.imageUrl} />}
                      <AvatarFallback className="text-[10px] bg-primary/10">
                        {getInitialsFromName(user?.fullName || 'You')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">You</div>
                  </div>
                </DropdownMenuItem>
                {contacts.map((c) => (
                  <DropdownMenuItem 
                    key={c.contact_id}
                    onClick={() => {
                      setSelectedContact(c.contact_id)
                    }}
                    className="px-3 py-2 hover:bg-accent/80"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {getContactAvatarUrl(c?.contact) && (
                          <AvatarImage src={getContactAvatarUrl(c?.contact)} />
                        )}
                        <AvatarFallback className="text-[10px]">
                          {getInitialsFromName(c?.contact?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-sm font-medium">{c.contact?.name}</span>
                        {c.contact?.title && (
                          <span className="text-xs text-muted-foreground">{c.contact.title}</span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedContact(null)
                    setContactModalOpen(true)
                  }}
                  className="text-sm px-3 py-2 hover:bg-accent/80"
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  New Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Channel Selection - Only shown if contact is selected */}
          {selectedContact && selectedContact !== 'user' && (
            <Select value={selectedMedium || ''} onValueChange={setSelectedMedium}>
              <SelectTrigger className="w-[110px] text-xs h-9">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="linkedin">
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-3 w-3" />
                    LinkedIn
                  </div>
                </SelectItem>
                <SelectItem value="phone">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Phone
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    WhatsApp
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Other
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Textarea
            placeholder={
              selectedContact === 'user' 
                ? "Type your message..." 
                : selectedContact
                  ? `Message from ${contacts.find(c => c.contact_id === selectedContact)?.contact?.name || 'contact'}...`
                  : "Select a sender to continue..."
            }
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
            disabled={isLoading || !selectedContact}
            rows={1}
            className="text-sm h-9 resize-none flex-1"
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={
              isLoading || 
              !newMessage.trim() || 
              !selectedContact
            }
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {error && (
          <div className="text-xs text-destructive">{error}</div>
        )}
      </div>
      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        onSave={async (contact: any) => {
          if (!applicationId) return
          try {
            setIsLoading(true)
            const created = await apiCall<any>(
              `/v1/applications/${applicationId}/contacts`,
              {
                method: 'POST',
                body: JSON.stringify({
                  contact: { name: contact.name },
                  role: contact.role || 'recruiter',
                }),
              }
            )
            await fetchContacts()
            setSelectedContact(created?.contact_id || null)
          } catch (e) {
            console.error('Failed to create contact from modal:', e)
            setError('Failed to create contact')
          } finally {
            setIsLoading(false)
            setContactModalOpen(false)
          }
        }}
        contact={null}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  )
}
