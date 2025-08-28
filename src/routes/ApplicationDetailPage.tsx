import { motion } from 'motion/react'

export function ApplicationDetailPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto pt-8 max-w-[1100px] md:max-w-[900px] lg:max-w-[1024px] xl:max-w-[1200px]">
      {/* TODO: implement details */}
    </motion.div>
  )
}

export default ApplicationDetailPage
