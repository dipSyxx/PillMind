"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Container } from "./container"
import { Logo } from "./logo"

export function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#CBD5E1]"
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          <motion.a
            href="#hero"
            className="flex items-center gap-3"
            aria-label="PillMind home"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Logo />
            <span className="text-xl font-semibold text-[#0EA8BC]">PillMind</span>
          </motion.a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#334155]">
            {[
              { href: "#how", text: "How it works" },
              { href: "#features", text: "Features" },
              { href: "#security", text: "Security" },
              { href: "#pricing", text: "Pricing" },
              { href: "#faq", text: "FAQ" },
            ].map((item, index) => (
              <motion.a
                key={item.href}
                className="hover:text-[#0EA8BC] transition-colors"
                href={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ y: -2 }}
              >
                {item.text}
              </motion.a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <motion.a
              href="#pricing"
              className="hidden sm:inline-block rounded-[12px] border border-[#0EA8BC] px-4 py-2 text-sm font-medium text-[#0EA8BC] hover:bg-[#E6F7FA] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              How it works
            </motion.a>
            <motion.a
              href="#cta"
              className="rounded-[12px] bg-[#0EA8BC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B95A8] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try the demo
            </motion.a>
          </div>
        </div>
      </Container>
    </motion.header>
  )
}
