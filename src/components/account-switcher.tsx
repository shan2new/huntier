import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface Account {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AccountSwitcherProps {
  accounts: Account[]
  selectedAccount?: Account
  onAccountSelect: (account: Account) => void
}

export function AccountSwitcher({
  accounts,
  selectedAccount,
  onAccountSelect,
}: AccountSwitcherProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an account"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {selectedAccount?.avatar && (
              <img
                src={selectedAccount.avatar}
                alt={selectedAccount.name}
                className="h-4 w-4 rounded-full"
              />
            )}
            <span className="truncate">
              {selectedAccount?.name || "Select account..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search account..." />
          <CommandList>
            <CommandEmpty>No account found.</CommandEmpty>
            <CommandGroup>
              {accounts.map((account) => (
                <CommandItem
                  key={account.id}
                  value={account.name}
                  onSelect={() => {
                    onAccountSelect(account)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2">
                    {account.avatar && (
                      <img
                        src={account.avatar}
                        alt={account.name}
                        className="h-4 w-4 rounded-full"
                      />
                    )}
                    <span className="truncate">{account.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedAccount?.id === account.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
