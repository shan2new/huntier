import { formatDistanceToNow } from 'date-fns'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import {
  Globe,
  Linkedin,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Send,
  User,
  X,
} from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'

import { apiWithToken } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  token: string | null
  isCreating?: boolean
  className?: string
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
  token,
  isCreating = false,
  className = '',
}: ApplicationConversationsProps) {
  const [conversations, setConversations] = useState<Array<Conversation>>([])
  const [contacts, setContacts] = useState<Array<any>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Message input state
  const [newMessage, setNewMessage] = useState('')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [selectedMedium, setSelectedMedium] = useState<string | null>(null)
  
  // Contact creation state
  const [showNewContact, setShowNewContact] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactTitle, setNewContactTitle] = useState('')
  
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
    if (applicationId && token && !isCreating) {
      fetchConversations()
      fetchContacts()
    }
  }, [applicationId, token])
  
  async function fetchConversations() {
    if (!applicationId || !token) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await apiWithToken<Array<Conversation>>(
        `/v1/applications/${applicationId}/conversations?limit=100`,
        token
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
    if (!applicationId || !token) return
    
    try {
      const data = await apiWithToken<Array<any>>(
        `/v1/applications/${applicationId}/contacts`,
        token
      )
      setContacts(data)
    } catch (err) {
      console.error('Failed to fetch contacts:', err)
    }
  }
  
  const handleSendMessage = async () => {
    if (!applicationId || !token || !newMessage.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Create new contact if needed
      let contactId = selectedContact === 'user' ? null : selectedContact
      
      if (showNewContact && newContactName.trim()) {
        const newContact = await apiWithToken<any>(
          `/v1/applications/${applicationId}/contacts`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              contact: {
                name: newContactName,
                title: newContactTitle || null,
              },
              role: 'other',
            }),
          }
        )
        contactId = newContact.contact_id
        await fetchContacts() // Refresh contacts list
      }
      
      const sender = selectedContact === 'user' ? 'user' : 'contact'
      const direction = sender === 'user' ? 'outbound' : 'inbound'
      
      const conversation = await apiWithToken<Conversation>(
        `/v1/applications/${applicationId}/conversations`,
        token,
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
      setNewMessage('')
      setShowNewContact(false)
      setNewContactName('')
      setNewContactTitle('')
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
    if (conv.sender === 'user') return 'Y'
    const name = conv.contact?.name || 'U'
    return name.charAt(0).toUpperCase()
  }
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[300px] max-h-[400px]">
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
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getContactInitials(conv)}
                      </AvatarFallback>
                    </Avatar>
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
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        Y
                      </AvatarFallback>
                    </Avatar>
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
      
      {/* Input Area */}
      <div className="border-t pt-3 space-y-3">
        
        {/* New Contact Form */}
        {showNewContact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <Label className="text-xs">New Contact</Label>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => {
                  setShowNewContact(false)
                  setNewContactName('')
                  setNewContactTitle('')
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Input
              placeholder="Contact name"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              placeholder="Title (optional)"
              value={newContactTitle}
              onChange={(e) => setNewContactTitle(e.target.value)}
              className="h-8 text-sm"
            />
          </motion.div>
        )}
        
        {/* Message Input */}
        <div className="flex gap-2 items-end">
          {/* Avatar Dropdown */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full flex items-center justify-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarFallback className={cn(
                      "text-xs",
                      selectedContact === 'user' && "bg-primary text-primary-foreground"
                    )}>
                      {selectedContact === 'user' 
                        ? 'Y'
                        : selectedContact
                          ? contacts.find(c => c.contact_id === selectedContact)?.contact?.name.charAt(0).toUpperCase() || 'C'
                          : showNewContact && newContactName
                            ? newContactName.charAt(0).toUpperCase()
                            : '?'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => {
                  setSelectedContact('user')
                  setShowNewContact(false)
                }}>
                  <User className="h-3 w-3 mr-2" />
                  You
                </DropdownMenuItem>
                {contacts.map((c) => (
                  <DropdownMenuItem 
                    key={c.contact_id}
                    onClick={() => {
                      setSelectedContact(c.contact_id)
                      setShowNewContact(false)
                    }}
                  >
                    {c.contact?.name}
                    {c.contact?.title && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({c.contact.title})
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => {
                  setSelectedContact(null)
                  setShowNewContact(true)
                }}>
                  <Plus className="h-3 w-3 mr-2" />
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
          
          <TextareaAutosize
            minRows={1}
            maxRows={5}
            placeholder={
              selectedContact === 'user' 
                ? "Type your message..." 
                : selectedContact
                  ? `Message from ${contacts.find(c => c.contact_id === selectedContact)?.contact?.name || 'contact'}...`
                  : showNewContact && newContactName
                    ? `Message from ${newContactName}...`
                    : "Select a sender to continue..."
            }
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
            disabled={isLoading || (!selectedContact && !showNewContact)}
            className="flex-1 p-2 text-sm border rounded-md resize-none min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
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
              (!selectedContact && (!showNewContact || !newContactName.trim()))
            }
            className="h-9 w-9 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {error && (
          <div className="text-xs text-destructive">{error}</div>
        )}
      </div>
    </div>
  )
}
