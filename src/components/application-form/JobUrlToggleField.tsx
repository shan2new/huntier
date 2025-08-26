import { AnimatePresence, motion } from "motion/react"
import { Globe } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface JobUrlToggleFieldProps {
  include: boolean
  onIncludeChange: (val: boolean) => void
  url: string
  onUrlChange: (val: string) => void
  placeholder?: string
  id?: string
}

export function JobUrlToggleField({
  include,
  onIncludeChange,
  url,
  onUrlChange,
  placeholder = "https://company.com/careers/job-123",
  id = "include-job-url",
}: JobUrlToggleFieldProps) {
  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center w-full justify-end gap-2">
        <Checkbox id={id} checked={include} onCheckedChange={(v) => onIncludeChange(!!v)} />
        <Label htmlFor={id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
          Include Job Link
        </Label>
      </div>
      <AnimatePresence>
        {include && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Job URL
            </Label>
            <Input
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder={placeholder}
              className="w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
