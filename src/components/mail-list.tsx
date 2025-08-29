import * as React from "react"
import { format } from "date-fns"
import { Archive, Filter, MoreHorizontal, Search, Star, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Mail {
  id: string
  name: string
  email: string
  subject: string
  text: string
  date: string
  read: boolean
  labels: Array<string>
  starred?: boolean
}

interface MailListProps {
  mails: Array<Mail>
  selectedMailId?: string
  onMailSelect: (mail: Mail) => void
  onMailStar?: (mailId: string, starred: boolean) => void
  onMailArchive?: (mailId: string) => void
  onMailDelete?: (mailId: string) => void
}

export function MailList({
  mails,
  selectedMailId,
  onMailSelect,
  onMailStar,
  onMailArchive,
  onMailDelete,
}: MailListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "unread" | "starred">("all")

  const filteredMails = React.useMemo(() => {
    let filtered = mails

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (mail) =>
          mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mail.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mail.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    switch (filter) {
      case "unread":
        filtered = filtered.filter((mail) => !mail.read)
        break
      case "starred":
        filtered = filtered.filter((mail) => mail.starred)
        break
      default:
        break
    }

    return filtered
  }, [mails, searchQuery, filter])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter("all")}>
                All emails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("unread")}>
                Unread
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("starred")}>
                Starred
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mail List */}
      <div className="flex-1 overflow-auto">
        {filteredMails.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No emails found" : "No emails"}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {filteredMails.map((mail) => (
              <div
                key={mail.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50",
                  selectedMailId === mail.id && "bg-muted",
                  !mail.read && "bg-blue-50 dark:bg-blue-950/20"
                )}
                onClick={() => onMailSelect(mail)}
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMailStar?.(mail.id, !mail.starred)
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        mail.starred
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {mail.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "truncate font-medium",
                        !mail.read && "font-semibold"
                      )}
                    >
                      {mail.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(mail.date), "MMM d")}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "truncate text-sm",
                      !mail.read && "font-medium"
                    )}
                  >
                    {mail.subject}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {mail.text.substring(0, 100)}
                    {mail.text.length > 100 && "..."}
                  </p>
                  {mail.labels.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {mail.labels.slice(0, 2).map((label) => (
                        <Badge
                          key={label}
                          variant="secondary"
                          className="text-xs"
                        >
                          {label}
                        </Badge>
                      ))}
                      {mail.labels.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{mail.labels.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onMailArchive?.(mail.id)}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onMailDelete?.(mail.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
