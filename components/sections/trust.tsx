'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { Container } from '../shared/container'
import { Shield } from '../shared/icons'

export function Trust() {
  return (
    <motion.section
      className="bg-white py-12 border-b border-[#E2E8F0]"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-sm text-[#64748B]">
          {['GDPR Ready', 'Encryption', 'Access control', 'Does not replace a doctor'].map((text, index) => (
            <motion.div
              key={text}
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Shield />
              <span>{text}</span>
            </motion.div>
          ))}
        </div>
      </Container>
    </motion.section>
  )
}
