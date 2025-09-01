import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { createContext, useContext } from "react"
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Context to track mobile mode within ResponsiveModal
const ResponsiveModalContext = createContext<{ isMobile: boolean }>({ isMobile: false })

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  trigger?: React.ReactNode
  className?: string
  contentClassName?: string
  hideClose?: boolean
}

export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  trigger,
  className,
  contentClassName,
  hideClose,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <ResponsiveModalContext.Provider value={{ isMobile: true }}>
        {trigger && (
          <div onClick={() => onOpenChange(true)}>
            {trigger}
          </div>
        )}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 rounded-lg"
            >
              {/* Full page backdrop */}
              <motion.div 
                className="fixed inset-0 bg-background"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              
              {/* Full page content */}
              <motion.div 
                className={cn(
                  "fixed inset-0 flex flex-col bg-background",
                  contentClassName
                )}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ 
                  type: "spring",
                  damping: 30,
                  stiffness: 300
                }}
              >                
                <div className="flex-1 min-h-0 pt-0">
                  <ScrollArea className="h-full">
                    <div className={cn("flex flex-col", className)}>
                      {children}
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ResponsiveModalContext.Provider>
    )
  }

  return (
    <ResponsiveModalContext.Provider value={{ isMobile: false }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className={cn("max-w-2xl max-h-[85vh] md:max-h-[75vh] p-0 flex flex-col shadow-2xl", contentClassName)} hideClose={hideClose}>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className={cn("flex flex-col", className)}>
                {children}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </ResponsiveModalContext.Provider>
  )
}

interface ResponsiveModalHeaderProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveModalHeader({ children, className }: ResponsiveModalHeaderProps) {
  const { isMobile } = useContext(ResponsiveModalContext)
  
  if (isMobile) {
    return <div className={cn("px-4 pb-4", className)}>{children}</div>
  }
  
  return <DialogHeader className={className}>{children}</DialogHeader>
}

interface ResponsiveModalTitleProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveModalTitle({ children, className }: ResponsiveModalTitleProps) {
  const { isMobile } = useContext(ResponsiveModalContext)
  
  if (isMobile) {
    return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
  }
  
  return <DialogTitle className={className}>{children}</DialogTitle>
}

interface ResponsiveModalDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveModalDescription({ children, className }: ResponsiveModalDescriptionProps) {
  const { isMobile } = useContext(ResponsiveModalContext)
  
  if (isMobile) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  }
  
  return <DialogDescription className={className}>{children}</DialogDescription>
}

interface ResponsiveModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveModalFooter({ children, className }: ResponsiveModalFooterProps) {
  const { isMobile } = useContext(ResponsiveModalContext)
  
  if (isMobile) {
    return (
      <div className={cn("px-4 pb-4 flex flex-col gap-2", className)}>
        {children}
      </div>
    )
  }
  
  return <DialogFooter className={className}>{children}</DialogFooter>
}

// Nested responsive modal for secondary dialogs
interface NestedResponsiveModalProps extends ResponsiveModalProps {
  level?: 'primary' | 'secondary'
}

export function NestedResponsiveModal({
  open,
  onOpenChange,
  children,
  trigger,
  className,
  contentClassName,
  level = 'secondary',
}: NestedResponsiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    // For mobile, secondary modals should also be full page
    return (
      <ResponsiveModalContext.Provider value={{ isMobile: true }}>
        {trigger && (
          <div onClick={() => onOpenChange(true)}>
            {trigger}
          </div>
        )}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50"
            >
              {/* Full page backdrop */}
              <motion.div 
                className="fixed inset-0 bg-background"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              
              {/* Full page content */}
              <motion.div 
                className={cn(
                  "fixed inset-0 flex flex-col bg-background",
                  contentClassName
                )}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ 
                  type: "spring",
                  damping: 30,
                  stiffness: 300
                }}
              >
                <div className="flex-1 min-h-0 pt-12">
                  <ScrollArea className="h-full">
                    <div className={cn("flex flex-col px-2", className)}>
                      {children}
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ResponsiveModalContext.Provider>
    )
  }

  // Desktop remains as dialog
  return (
    <ResponsiveModalContext.Provider value={{ isMobile: false }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent 
          className={cn(
            level === 'secondary' ? "max-w-md" : "max-w-2xl",
            "max-h-[85vh] md:max-h-[75vh] p-0 flex flex-col shadow-2xl",
            contentClassName
          )}
        >
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className={cn("flex flex-col", className)}>
                {children}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </ResponsiveModalContext.Provider>
  )
}
