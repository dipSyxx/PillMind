'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { Container } from './container'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useSession } from 'next-auth/react'
import { Badge } from '../ui/badge'

export function Header() {
  const { status } = useSession()
  const isAuthed = status === 'authenticated'

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-pm-slate-300"
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
            <span className="text-xl font-semibold text-pm-teal-600">PillMind</span>
          </motion.a>

          <nav className="hidden md:flex items-center gap-8 text-sm text-pm-slate-700">
            {[
              { href: '#how', text: 'How it works' },
              { href: '#features', text: 'Features' },
              { href: '#security', text: 'Security' },
              { href: '#pricing', text: 'Pricing' },
              { href: '#faq', text: 'FAQ' },
            ].map((item, index) => (
              <motion.a
                key={item.href}
                className="hover:text-pm-teal-600 transition-colors"
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
            <ThemeToggle />
            <Button asChild variant="pillmindOutline" size="md">
              <motion.a href="#pricing" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                How it works
              </motion.a>
            </Button>

            {status === 'loading' ? (
              <div className="h-10 w-28 rounded-[12px] bg-pm-slate-300 animate-pulse" />
            ) : isAuthed ? (
              <>
                <Button asChild variant="pillmind" size="md">
                  <motion.a href="#cta" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    Try the demo
                  </motion.a>
                </Button>
                <Button asChild variant="pillmindOutline" size="md">
                  <motion.a href="/profile" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    Profile
                  </motion.a>
                </Button>
              </>
            ) : (
              <Button asChild variant="pillmind" size="md">
                <motion.a href="/login" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  Try the demo
                </motion.a>
              </Button>
            )}
          </div>
        </div>
      </Container>
    </motion.header>
  )
}
