"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Container } from "../shared/container"
import { HeaderBlock } from "../shared/header-block"
import { Check } from "../shared/icons"

export function Features() {
  const list = [
    {
      title: "Personal reminders",
      text: "Flexible schedules, time zones, missed dose handling and repeats.",
    },
    {
      title: "Interaction checks",
      text: "Warnings about unwanted combinations of meds and vitamins.",
    },
    {
      title: "AI recommendations",
      text: "Suggestions based on your data and regimen.*",
    },
    {
      title: "Analytics & reports",
      text: "Adherence stats, PDF/CSV export for your doctor.",
    },
  ]

  return (
    <motion.section
      id="features"
      className="bg-white py-20 border-y border-[#E2E8F0]"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <HeaderBlock eyebrow="Features" title="Everything for medication control" subtitle="And understanding your state." />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {list.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="flex items-start gap-4 rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <Check className="mt-1" />
              <div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-[#64748B]">{feature.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.p
          className="mt-4 text-xs text-[#64748B]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
        >
          *Recommendations do not replace a doctor's consultation.
        </motion.p>
      </Container>
    </motion.section>
  )
}
