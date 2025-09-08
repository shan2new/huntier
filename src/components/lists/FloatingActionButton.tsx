import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type FloatingActionButtonProps = {
  onClick?: () => void
  icon: ReactNode
  ariaLabel?: string
}

export function FloatingActionButton({ onClick, icon, ariaLabel }: FloatingActionButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      <Button size="icon" className="relative h-14 w-14 rounded-full shadow-lg" onClick={onClick} aria-label={ariaLabel}>
        {icon}
      </Button>
    </motion.div>
  )
}

export default FloatingActionButton


