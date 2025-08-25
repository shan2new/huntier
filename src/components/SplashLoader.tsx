import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import logo512 from '/logo512.svg'

const funTexts = [
  "Brewing your perfect job hunt... ☕",
  "Polishing your applications... ✨", 
  "Connecting the dots... 🔗",
  "Gathering intelligence... 🎯",
  "Preparing your arsenal... ⚡",
  "Loading opportunities... 🚀",
  "Syncing your ambitions... 💫",
  "Crafting your journey... 🛠️"
]

const loadingMessages = [
  "Just a moment while we get things ready...",
  "Setting up your workspace...",
  "Authenticating your session...",
  "Loading your dashboard..."
]

export function SplashLoader() {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [showSecondary, setShowSecondary] = useState(false)

  // Rotate fun texts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % funTexts.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // Show secondary message after delay and rotate
  useEffect(() => {
    const showTimer = setTimeout(() => setShowSecondary(true), 1000)
    
    const rotateTimer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)

    return () => {
      clearTimeout(showTimer)
      clearInterval(rotateTimer)
    }
  }, [])

  return (
    <div className="bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="text-center space-y-8 z-10">
        {/* Logo with enhanced fade-in and pulsating glow animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 1.2,
            ease: "easeOut"
          }}
          className="flex justify-center mb-8"
        >
          <motion.div
            initial={{ y: 0 }}
            animate={{ 
              y: [0, -8, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5 // Start floating after fade-in completes
            }}
            className="relative"
          >
            {/* Main logo with dynamic glow */}
            <motion.img
              src={logo512}
              alt="Huntier"
              className="w-24 h-24 md:w-32 md:h-32 relative z-10"
              initial={{ 
                filter: "drop-shadow(0 0 0px rgba(59, 130, 246, 0))"
              }}
              animate={{ 
                filter: [
                  "drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))",
                  "drop-shadow(0 0 35px rgba(59, 130, 246, 0.8))",
                  "drop-shadow(0 0 25px rgba(59, 130, 246, 0.6))",
                  "drop-shadow(0 0 40px rgba(59, 130, 246, 0.9))",
                  "drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2 // Start glow after fade-in
              }}
            />
            
            {/* Dynamic glow background */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 blur-xl"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0, 0.6, 0.3, 0.8, 0],
                scale: [0.8, 1.3, 1.1, 1.5, 0.8]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2
              }}
            />
            
            {/* Pulsating rings with enhanced effect */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/40"
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                scale: [1, 1.6, 1],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-primary/20"
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                scale: [1, 2, 1],
                opacity: [0, 0.4, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.5
              }}
            />
          </motion.div>
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            Huntier
          </h1>
          <motion.div
            className="h-1 w-32 bg-gradient-to-r from-primary/0 via-primary to-primary/0 mx-auto mt-4 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 1, duration: 1 }}
          />
        </motion.div>

        {/* Fun rotating text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="h-8 flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTextIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-lg md:text-xl text-muted-foreground font-medium"
            >
              {funTexts[currentTextIndex]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Secondary loading message */}
        <AnimatePresence>
          {showSecondary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-6 flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentMessageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-muted-foreground/70"
                >
                  {loadingMessages[currentMessageIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="flex justify-center mt-12"
        >
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary/60 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/50 pointer-events-none" />
    </div>
  )
}
