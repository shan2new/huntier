import { useState } from 'react'
import { formatDateIndian } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConversationModal } from '@/components/ConversationModal'
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Video,
  Plus, 
  Edit,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

const mediumIcons = {
  email: Mail,
  call: Phone,
  message: MessageSquare,
  video: Video,
}

const directionIcons = {
  outbound: ArrowUp,
  inbound: ArrowDown,
}

const directionColors = {
  outbound: 'bg-blue-100 text-blue-700 border-blue-200',
  inbound: 'bg-green-100 text-green-700 border-green-200',
}

interface ConversationFeedProps {
  items: any[]
  onAdd: (body: any) => Promise<void>
  onUpdate?: (id: string, body: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function ConversationFeed({ 
  items, 
  onAdd, 
  onUpdate, 
  onDelete 
}: ConversationFeedProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedConversation, setSelectedConversation] = useState<any>(null)

  const handleCreate = () => {
    setModalMode('create')
    setSelectedConversation(null)
    setModalOpen(true)
  }

  const handleEdit = (conversation: any) => {
    setModalMode('edit')
    setSelectedConversation(conversation)
    setModalOpen(true)
  }

  const handleSave = async (data: any) => {
    if (modalMode === 'create') {
      await onAdd(data)
    } else if (modalMode === 'edit' && selectedConversation && onUpdate) {
      await onUpdate(selectedConversation.id, data)
    }
  }

  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id)
    }
  }

  // Sort conversations by created_at descending (newest first)
  const sortedItems = [...items].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Add New Conversation Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleCreate}
          size="sm"
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Conversation
        </Button>
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        {sortedItems.length === 0 ? (
          <Card className="glass border-border/20">
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first conversation above</p>
            </CardContent>
          </Card>
        ) : (
          sortedItems.map((conversation) => {
            const MediumIcon = mediumIcons[conversation.medium as keyof typeof mediumIcons] || MessageSquare
            const DirectionIcon = directionIcons[conversation.direction as keyof typeof directionIcons] || ArrowUp
            const directionColor = directionColors[conversation.direction as keyof typeof directionColors] || directionColors.outbound
            const createdDate = conversation.created_at ? new Date(conversation.created_at) : new Date()
            
            return (
              <Card key={conversation.id} className="glass border-border/20 shadow-soft group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <MediumIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs font-medium">
                          {conversation.medium}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${directionColor} border`}
                        >
                          <DirectionIcon className="h-3 w-3 mr-1" />
                          {conversation.direction}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {!isNaN(createdDate.getTime()) ? formatDateIndian(createdDate) : 'Invalid Date'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(conversation)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {conversation.subject && (
                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-foreground">
                        {conversation.subject}
                      </h4>
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <p className="text-sm leading-relaxed line-clamp-3">
                      {conversation.text}
                    </p>
                  </div>

                  {conversation.text.length > 150 && (
                    <button 
                      onClick={() => handleEdit(conversation)}
                      className="text-xs text-primary hover:text-primary/80 mt-2 font-medium"
                    >
                      Read more...
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Conversation Modal */}
      <ConversationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        conversation={selectedConversation}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}