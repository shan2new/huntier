import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface FloatingShapesProps {
  className?: string;
}

export function FloatingShapes({ className }: FloatingShapesProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Large background circles */}
      <motion.div
        className="absolute top-20 -left-10 w-72 h-72 bg-gradient-to-br from-primary/5 to-primary/10 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-40 -right-10 w-96 h-96 bg-gradient-to-bl from-primary/3 to-primary/8 rounded-full blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating geometric elements */}
      <motion.div
        className="absolute top-32 left-1/4 w-4 h-4 bg-primary/20 rounded-full"
        animate={{
          y: [0, -10, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-1/2 right-1/4 w-6 h-6 border border-primary/30 rounded-full"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg rotate-45"
        animate={{
          x: [0, 15, 0],
          rotate: [45, 135, 45],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Subtle lines */}
      <motion.div
        className="absolute top-1/4 right-1/3 w-px h-16 bg-gradient-to-b from-transparent via-primary/20 to-transparent"
        animate={{
          scaleY: [1, 1.5, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
