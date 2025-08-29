import * as React from "react"
import { format } from "date-fns"
import { ArrowLeft, Forward, MoreHorizontal, Reply, ReplyAll } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface Mail {
  id: string
  name: string
  email: string
  subject: string
  text: string
  date: string
  read: boolean
  labels: Array<string>
}

interface MailDisplayProps {
  mail?: Mail
  onBack: () => void
}

export function MailDisplay({ mail, onBack }: MailDisplayProps) {
  if (!mail) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">No mail selected</h3>
          <p className="text-sm text-muted-foreground">
            Choose a mail from the list to view its content
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{mail.subject}</h2>
            <p className="text-sm text-muted-foreground">
              {mail.email}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Reply className="mr-2 h-4 w-4" />
              Reply
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ReplyAll className="mr-2 h-4 w-4" />
              Reply All
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Forward className="mr-2 h-4 w-4" />
              Forward
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mail Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Sender Info */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {mail.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{mail.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {mail.email}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(mail.date), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Labels */}
          {mail.labels.length > 0 && (
            <div className="flex gap-1">
              {mail.labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            <div
              className="whitespace-pre-wrap text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: mail.text }}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Reply className="mr-2 h-4 w-4" />
            Reply
          </Button>
          <Button size="sm" variant="outline">
            <ReplyAll className="mr-2 h-4 w-4" />
            Reply All
          </Button>
          <Button size="sm" variant="outline">
            <Forward className="mr-2 h-4 w-4" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  )
}
