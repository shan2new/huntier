import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

import { apiWithToken } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export interface Note {
  id: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
}

interface ApplicationNotesProps {
  applicationId?: string
  token: string | null
  isCreating?: boolean
  onAddPendingNote?: (content: string, updatedNotes?: Array<string>) => void
  pendingNotes?: Array<string>
  className?: string
}

export function ApplicationNotes({ 
  applicationId, 
  token, 
  isCreating = false, 
  onAddPendingNote,
  pendingNotes = [],
  className = '' 
}: ApplicationNotesProps) {
  const [notes, setNotes] = useState<Array<Note>>([]) 
  const [isLoading, setIsLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // We now access pendingNotes directly in our bubble UI
  
  // Handle removing a pending note
  const handleRemovePendingNote = (index: number) => {
    if (onAddPendingNote) {
      const updatedNotes = [...pendingNotes]
      updatedNotes.splice(index, 1)
      // We're reusing the onAddPendingNote callback to update parent state
      // This is a bit of a hack but simplifies the interface
      onAddPendingNote("__UPDATE_PENDING_NOTES__", updatedNotes)
    }
  }

  // Fetch existing notes when applicationId changes
  useEffect(() => {
    if (applicationId && token && !isCreating) {
      fetchNotes()
    }
  }, [applicationId, token])

  async function fetchNotes() {
    if (!applicationId || !token) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const fetchedNotes = await apiWithToken<Array<Note>>(`/v1/applications/${applicationId}/notes`, token)
      setNotes(fetchedNotes.reverse())
    } catch (err) {
      console.error('Failed to fetch notes:', err)
      setError('Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = async (e?: React.KeyboardEvent | React.MouseEvent) => {
    // Prevent form submission if triggered by Enter key
    if (e) {
      e.preventDefault()
      
      // If Shift+Enter was pressed, add a new line instead of submitting
      if (e.shiftKey) return
    }
    
    // Handle adding pending note in create mode
    if (isCreating) {
      if (!newNote.trim()) return
      
      if (onAddPendingNote) {
        onAddPendingNote(newNote)
        setNewNote('')
      }
      return
    }
    
    if (!applicationId || !token) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const createdNote = await apiWithToken<Note>(
        `/v1/applications/${applicationId}/notes`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ content: newNote }),
        }
      )
      
      setNotes([...notes, createdNote])
      setNewNote('')
    } catch (err) {
      console.error('Failed to add note:', err)
      setError('Failed to add note')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!token) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      await apiWithToken(
        `/v1/applications/notes/${noteId}`,
        token,
        { method: 'DELETE' }
      )
      
      setNotes(notes.filter(note => note.id !== noteId))
    } catch (err) {
      console.error('Failed to delete note:', err)
      setError('Failed to delete note')
    } finally {
      setIsLoading(false)
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Scroll to bottom when notes change
  useEffect(() => {
    scrollToBottom()
  }, [notes, pendingNotes])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      
      {/* Notes Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[300px] max-h-[400px]">
        {!isLoading && !isCreating && notes.length === 0 && pendingNotes.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No notes yet. Add one below.
          </div>
        )}
        
        <AnimatePresence>
          {/* Existing notes */}
          {!isCreating && notes.map((note) => (
            <div key={note.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-end gap-2 mb-4"
              >
                <div className="max-w-[70%] space-y-1 items-end">                  
                  <div className="flex items-end gap-2">
                    <div className="flex items-center">
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity" 
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm">
                      <div className="whitespace-pre-wrap break-words">{note.content}</div>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-muted-foreground text-right">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </div>
                </div>
                
                <div className="flex items-start justify-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      Y
                    </AvatarFallback>
                  </Avatar>
                </div>
              </motion.div>
            </div>
          ))}
          
          {/* Pending notes (for create mode) */}
          {pendingNotes.map((content, index) => (
            <div key={`pending-${index}`}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-end gap-2 mb-4"
              >
                <div className="max-w-[70%] space-y-1 items-end">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">You</span>
                    <span>•</span>
                    <span>pending</span>
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <div className="flex items-center">
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity" 
                        onClick={() => handleRemovePendingNote(index)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="bg-primary/80 text-primary-foreground px-3 py-2 rounded-lg text-sm">
                      <div className="whitespace-pre-wrap break-words">{content}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-end justify-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/70 text-primary-foreground">
                      Y
                    </AvatarFallback>
                  </Avatar>
                </div>
              </motion.div>
            </div>
          ))}
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
        {/* Note input */}
        <div className="flex gap-2 items-end">
          <div className="flex items-end justify-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                Y
              </AvatarFallback>
            </Avatar>
          </div>
          
          <TextareaAutosize
            minRows={1}
            maxRows={5}
            placeholder="Add a note..."
            value={newNote}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
            disabled={isLoading}
            className="flex-1 p-2 text-sm border rounded-md resize-none min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAddNote(e)
              }
            }}
          />
          
          <Button 
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={(e) => handleAddNote(e)}
            disabled={isLoading || !newNote.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {error && (
          <div className="text-xs text-destructive">{error}</div>
        )}
      </div>
    </div>
  )
}
