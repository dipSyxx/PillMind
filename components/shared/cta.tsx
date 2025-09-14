'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { Container } from './container'
import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <motion.section
      id="cta"
      className="relative overflow-hidden bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6] py-16 text-white"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-balance">Ready to try PillMind?</h2>
          <p className="mt-2 max-w-2xl text-white/90 text-pretty">
            Try the demo and feel the peace of mind that comes with staying on top of your meds and vitamins.
          </p>
          <Button asChild variant="pillmindWhite" size="lg" className="mt-6">
            <motion.a href="#" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Try the demo
            </motion.a>
          </Button>
        </motion.div>
      </Container>
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
    </motion.section>
  )
}
