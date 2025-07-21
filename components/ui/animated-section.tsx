"use client"

import React from "react"
import { motion, type Variants } from "framer-motion"

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  staggerChildren?: boolean
  staggerDelay?: number
  once?: boolean
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
  duration = 0.5,
  direction = "up",
  staggerChildren = false,
  staggerDelay = 0.1,
  once = true,
}: AnimatedSectionProps) {
  // Define animation variants based on direction
  const getVariants = (): Variants => {
    const directionOffset = 50

    const variants: Variants = {
      hidden: {
        opacity: 0,
        ...(direction === "up" && { y: directionOffset }),
        ...(direction === "down" && { y: -directionOffset }),
        ...(direction === "left" && { x: directionOffset }),
        ...(direction === "right" && { x: -directionOffset }),
      },
      visible: {
        opacity: 1,
        y: 0,
        x: 0,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
          ...(staggerChildren && {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          }),
        },
      },
    }

    return variants
  }

  // Child variants for staggered animations
  const childVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  }

  return (
    <motion.div
      className={className}
      variants={getVariants()}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
    >
      {staggerChildren
        ? React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return (
                <motion.div variants={childVariants} key={child.key}>
                  {child}
                </motion.div>
              )
            }
            return child
          })
        : children}
    </motion.div>
  )
}

