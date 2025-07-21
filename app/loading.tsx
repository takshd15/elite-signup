"use client"

import { motion } from "framer-motion"

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative h-24 w-24 mx-auto mb-8"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 opacity-70"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 0.2, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-black flex items-center justify-center text-white font-bold text-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            E
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-white mb-2"
        >
          ELITE
        </motion.h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, delay: 0.7 }}
          className="h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full max-w-[120px] mx-auto"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-zinc-400 mt-4"
        >
          Loading your growth journey...
        </motion.p>
      </div>
    </div>
  )
}

