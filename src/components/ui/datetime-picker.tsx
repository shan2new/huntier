"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
}

export function DateTimePicker({ 
  value, 
  onChange, 
  placeholder = "Select date & time",
  disabled,
  className 
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [timeValue, setTimeValue] = React.useState<string>(() => {
    if (value) {
      return value.toTimeString().slice(0, 5) // HH:MM format (no seconds)
    }
    return "10:30"
  })

  React.useEffect(() => {
    setSelectedDate(value)
    if (value) {
      setTimeValue(value.toTimeString().slice(0, 5)) // HH:MM format (no seconds)
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && onChange) {
      const [hours, minutes] = timeValue.split(':').map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0) // No seconds
      onChange(newDate)
    }
    // Don't close popup automatically - let parent control it
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)
    if (selectedDate && onChange) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes, 0) // No seconds
      onChange(newDate)
    }
  }

  const displayValue = selectedDate 
    ? `${format(selectedDate, 'MMM d, yyyy')} at ${format(selectedDate, 'h:mm a')}` 
    : placeholder

  return (
    <div className={cn("flex gap-2", className)}>
      <div className="flex flex-col gap-2 flex-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-between font-normal text-xs h-8"
            >
              {displayValue}
              <ChevronDownIcon className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <div className="p-3 space-y-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  captionLayout="dropdown"
                  onSelect={handleDateSelect}
                  disabled={disabled}
                  className="border-0"
                />
              </div>
              <div>
                <Label className="text-xs">Time</Label>
                <Input
                  type="time"
                  value={timeValue}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="mt-1 text-xs h-8"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
