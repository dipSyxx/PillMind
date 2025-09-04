'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { Container } from '../shared/container'
import { HeaderBlock } from '../shared/header-block'

export function HowItWorks() {
  const steps = [
    {
      title: 'Add your meds',
      text: 'Manually or via the AI agent. Set dosage and schedule.',
    },
    {
      title: 'Get reminders',
      text: 'On-time push notifications. Missed doses under control.',
    },
    {
      title: 'Act with confidence',
      text: 'Interaction checks and personal regimen tips.',
    },
  ]

  return (
    <motion.section
      id="how"
      className="py-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <HeaderBlock
          eyebrow="How it works"
          title="Three simple steps"
          subtitle="Everything you need for discipline and peace of mind."
        />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="rounded-[16px] bg-white p-6 shadow-card border border-[#E2E8F0]"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{
                y: -5,
                transition: { duration: 0.2 },
              }}
            >
              <motion.div
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#12B5C9]/10 text-[#0EA8BC] font-bold"
                whileHover={{ scale: 1.1 }}
              >
                {index + 1}
              </motion.div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-[#64748B]">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </motion.section>
  )
}
