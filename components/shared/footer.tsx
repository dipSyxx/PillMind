'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { Container } from './container'
import { Logo } from './logo'

export function Footer() {
  return (
    <motion.footer
      className="bg-white py-10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3">
              <Logo />
              <span className="text-lg font-semibold">PillMind</span>
            </div>
            <p className="mt-3 text-sm text-[#64748B]">We remember your meds — so you can focus on life.</p>
          </motion.div>
          <motion.nav
            className="text-sm text-[#334155]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="font-semibold">Menu</p>
            <ul className="mt-2 space-y-1">
              {[
                { href: '#features', text: 'Features' },
                { href: '#security', text: 'Security' },
                { href: '#pricing', text: 'Pricing' },
                { href: '#faq', text: 'FAQ' },
              ].map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-[#0EA8BC] transition-colors">
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
          <motion.div
            className="text-sm text-[#334155]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="font-semibold">Contacts</p>
            <ul className="mt-2 space-y-1">
              <li>support@pillmind.app</li>
              <li>© PillMind</li>
            </ul>
          </motion.div>
        </div>
      </Container>
    </motion.footer>
  )
}
