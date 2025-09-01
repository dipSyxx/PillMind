"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Container } from "../shared/container"
import { HeaderBlock } from "../shared/header-block"
import { Shield } from "../shared/icons"

export function Security() {
  const points = [
    "Data encryption at rest and in transit",
    "Access control & transparent permissions",
    "GDPR compliance and localized storage",
    "Export and delete data on user request",
  ]

  return (
    <motion.section
      id="security"
      className="py-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <HeaderBlock
          eyebrow="Security"
          title="Your data is yours alone"
          subtitle="We build trust with technology and policy."
        />
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            className="rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-card"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center gap-3 text-[#0EA8BC] font-semibold">
              <Shield /> Protection by default
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[#334155] list-disc pl-5">
              {points.map((point, index) => (
                <motion.li
                  key={point}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  {point}
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            className="rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-card"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <p className="text-sm text-[#64748B]">
              PillMind does not provide medical diagnoses and does not replace a doctor's consultation. Always consult a
              professional before changing your treatment plan.
            </p>
            <div className="mt-4 h-36 w-full rounded-md bg-gradient-to-r from-[#12B5C9]/15 via-[#2ED3B7]/15 to-[#3EC7E6]/15" />
          </motion.div>
        </div>
      </Container>
    </motion.section>
  )
}
