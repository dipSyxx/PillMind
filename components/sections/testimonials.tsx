"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Container } from "../shared/container"
import { HeaderBlock } from "../shared/header-block"

export function Testimonials() {
  const items = [
    { quote: "I finally stopped mixing up doses — and that's peace of mind.", name: "Olena, 42" },
    { quote: "It's convenient to see stats and share them with my doctor.", name: "Ihor, 55" },
    { quote: "Reminders work perfectly even when I travel.", name: "Maryna, 34" },
  ]

  return (
    <motion.section
      className="py-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <HeaderBlock eyebrow="Testimonials" title="What users say about PillMind" subtitle="We value every experience." />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, index) => (
            <motion.figure
              key={t.name}
              className="rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <blockquote className="text-[#0F172A]">"{t.quote}"</blockquote>
              <figcaption className="mt-4 text-sm text-[#64748B]">{t.name}</figcaption>
            </motion.figure>
          ))}
        </div>
      </Container>
    </motion.section>
  )
}
