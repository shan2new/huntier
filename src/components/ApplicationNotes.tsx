import { formatDistanceToNow } from 'date-fns'
import { HelpCircle, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { apiWithToken } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface Note {
  id: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
}

interface FormattedPendingNote {
  content: string
  created_at: Date
  id: string
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
  
  // Format pendingNotes with timestamps
  const formattedPendingNotes: Array<FormattedPendingNote> = pendingNotes.map((content, index) => ({
    content,
    created_at: new Date(),
    id: `pending-${index}`
  }))
  
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
      setNotes(fetchedNotes)
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
      
      setNotes([createdNote, ...notes])
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

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Notes
      </Label>
      
      <div className="space-y-4">
        {/* Add note input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add notes... "
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            disabled={isLoading}
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleAddNote(e)
              }
            }}
          />
          <div className="flex justify-end">
            <Button 
              size="sm"
              onClick={(e) => handleAddNote(e)}
              disabled={isLoading || !newNote.trim()}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Note
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
        
        {/* Pending notes (for create mode) */}
        <AnimatePresence>
          {isCreating && pendingNotes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground">Pending Notes</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Notes will be added when the application is created</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                {formattedPendingNotes.map((note, index) => (
                  <motion.div
                    key={`pending-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-md border border-border bg-background/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-6 w-6">
                          <div className="bg-primary/10 flex items-center justify-center h-full w-full rounded-full">
                            <span className="text-xs font-medium">?</span>
                          </div>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="text-xs whitespace-pre-wrap">{note.content}</div>
                          <div className="text-[10px] text-muted-foreground">
                            pending
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleRemovePendingNote(index)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Existing notes */}
        {!isCreating && notes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Recent Notes</h4>
            <div className="max-h-[300px] overflow-y-auto pr-1">
              <AnimatePresence>
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-md border border-border bg-background/50 mb-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-6 w-6">
                          <div className="bg-primary/10 flex items-center justify-center h-full w-full rounded-full">
                            <span className="text-xs font-medium">{note.user_id.charAt(0).toUpperCase()}</span>
                          </div>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="text-xs whitespace-pre-wrap">{note.content}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
        
        {!isCreating && !isLoading && notes.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-6">
            No notes yet
          </div>
        )}
        
        {isLoading && !isCreating && (
          <div className="flex justify-center py-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent"
            />
          </div>
        )}
      </div>
    </div>
  )
}
