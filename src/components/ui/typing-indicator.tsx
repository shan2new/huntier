import { motion } from "framer-motion"

export function TypingIndicator() {
  const dotVariants = {
    animate: (i: number) => ({
      y: [0, -3, 0],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.15,
      },
    }),
  }

  return (
    <div className="justify-left flex space-x-1">
      <div className="rounded-lg bg-muted p-2">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="h-2 w-2 rounded-full bg-muted-foreground"
            variants={dotVariants}
            animate="animate"
            custom={0}
          />
          <motion.span
            className="h-2 w-2 rounded-full bg-muted-foreground"
            variants={dotVariants}
            animate="animate"
            custom={1}
          />
          <motion.span
            className="h-2 w-2 rounded-full bg-muted-foreground"
            variants={dotVariants}
            animate="animate"
            custom={2}
          />
        </div>
      </div>
    </div>
  )
}
