"use client"

import type React from "react"
import { motion } from "framer-motion"

interface HeaderBlockProps {
  eyebrow?: string
  title: string
  subtitle?: string
}

export function HeaderBlock({ eyebrow, title, subtitle }: HeaderBlockProps) {
  return (
    <motion.div
      className="mx-auto max-w-2xl text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {eyebrow && (
        <motion.p
          className="text-sm font-semibold tracking-wide text-[#0EA8BC]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        className="mt-1 text-3xl font-bold text-[#0F172A] text-balance"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        viewport={{ once: true }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          className="mt-3 text-[#64748B] text-pretty"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}
