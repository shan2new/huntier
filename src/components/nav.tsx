import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Inbox,
  Send,
  Archive,
  Trash2,
  Star,
  FileText,
  AlertCircle,
  Mail,
  Plus,
  Settings,
} from "lucide-react"

interface NavItem {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  variant?: "default" | "secondary" | "destructive"
}

interface NavProps {
  selectedItem?: string
  onItemSelect?: (itemId: string) => void
}

export function Nav({ selectedItem, onItemSelect }: NavProps) {
  const mainItems: NavItem[] = [
    {
      id: "inbox",
      title: "Inbox",
      icon: Inbox,
      count: 12,
    },
    {
      id: "sent",
      title: "Sent",
      icon: Send,
    },
    {
      id: "drafts",
      title: "Drafts",
      icon: FileText,
      count: 3,
    },
    {
      id: "starred",
      title: "Starred",
      icon: Star,
      count: 5,
    },
    {
      id: "archive",
      title: "Archive",
      icon: Archive,
    },
    {
      id: "trash",
      title: "Trash",
      icon: Trash2,
    },
  ]

  const labels: NavItem[] = [
    {
      id: "important",
      title: "Important",
      icon: AlertCircle,
      variant: "secondary",
    },
    {
      id: "work",
      title: "Work",
      icon: Mail,
      variant: "secondary",
    },
    {
      id: "personal",
      title: "Personal",
      icon: Mail,
      variant: "secondary",
    },
  ]

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 p-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Mail
            </h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {mainItems.map((item) => (
            <Button
              key={item.id}
              variant={selectedItem === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                selectedItem === item.id && "bg-secondary"
              )}
              onClick={() => onItemSelect?.(item.id)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span className="flex-1 text-left">{item.title}</span>
              {item.count !== undefined && (
                <Badge
                  variant="secondary"
                  className="ml-auto h-5 min-w-[20px] rounded-full px-1 text-xs"
                >
                  {item.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Labels */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Labels
            </h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {labels.map((item) => (
            <Button
              key={item.id}
              variant={selectedItem === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                selectedItem === item.id && "bg-secondary"
              )}
              onClick={() => onItemSelect?.(item.id)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span className="flex-1 text-left">{item.title}</span>
            </Button>
          ))}
        </div>

        {/* Settings */}
        <div className="pt-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onItemSelect?.("settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
