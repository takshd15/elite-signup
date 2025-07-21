"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Github, Twitter, Linkedin, Instagram } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <motion.footer
      className="border-t border-zinc-800 bg-black/90 backdrop-blur-lg py-8 px-4 mt-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/Annotation 2025-07-18 034118.png" alt="ELITESCORE logo" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                ELITESCORE
              </span>
            </Link>
            <p className="text-sm text-zinc-400">
              Your journey to self-improvement starts here. Track your progress, connect with like-minded individuals,
              and achieve your goals.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-zinc-400 hover:text-primary-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-primary-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-primary-500 transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-primary-500 transition-colors">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/home" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <Link href="/goals" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Goals
                </Link>
              </li>
              <li>
                <Link href="/improve" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Improve
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Data Protection
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-zinc-400 hover:text-primary-500 transition-colors">
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-8 pt-8 text-center text-sm text-zinc-500">
          <p>© {currentYear} Strivio. All rights reserved.</p>
        </div>
      </div>
    </motion.footer>
  )
}

