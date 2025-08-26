import { Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RoleSuggestionCombobox } from "@/components/RoleSuggestionCombobox"

interface RoleFieldProps {
  companyId?: string
  role: string
  onRoleChange: (val: string) => void
  placeholder?: string
  className?: string
  showLabel?: boolean
  currentRole?: string
}

export function RoleField({
  companyId,
  role,
  onRoleChange,
  placeholder = "e.g. Senior Software Engineer",
  className,
  showLabel = true,
  currentRole,
}: RoleFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <Label className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Role
        </Label>
      )}
      {companyId ? (
        <RoleSuggestionCombobox
          companyId={companyId}
          onChoose={(s) => onRoleChange(s.role)}
          showAsInput
          inputValue={role}
          onInputValueChange={onRoleChange}
          currentRole={currentRole}
          placeholder={placeholder}
          className="w-full"
        />
      ) : (
        <Input
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-background border-border"
        />
      )}
    </div>
  )
}
