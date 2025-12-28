'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Container } from './container'
import { Logo } from './logo'

const navItems = [
  { href: '#how', text: 'How it works' },
  { href: '#features', text: 'Features' },
  { href: '#security', text: 'Security' },
  { href: '#pricing', text: 'Pricing' },
  { href: '#faq', text: 'FAQ' },
]

export function Header() {
  const { status } = useSession()
  const isAuthed = status === 'authenticated'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pm-slate-300 dark:bg-pm-slate-900/80 dark:border-pm-slate-700"
    >
      <Container>
        <div className="flex h-14 md:h-16 items-center justify-between">
          {/* Logo */}
          <motion.a
            href="#hero"
            className="flex items-center gap-2 md:gap-3"
            aria-label="PillMind home"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Logo />
            <span className="text-lg md:text-xl font-semibold text-pm-teal-600 dark:text-pm-teal-500">PillMind</span>
          </motion.a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm text-pm-slate-700 dark:text-pm-slate-300">
            {navItems.map((item, index) => (
              <motion.a
                key={item.href}
                className="hover:text-pm-teal-600 dark:hover:text-pm-teal-400 transition-colors whitespace-nowrap"
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <ThemeToggle />
            {status === 'loading' ? (
              <div className="h-9 w-24 rounded-[12px] bg-pm-slate-300 dark:bg-pm-slate-700 animate-pulse" />
            ) : isAuthed ? (
              <>
                <Button asChild variant="pillmind" size="sm" className="hidden lg:inline-flex">
                  <motion.a href="#cta" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    Try the demo
                  </motion.a>
                </Button>
                <Button asChild variant="pillmindOutline" size="sm">
                  <motion.a href="/profile" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    Profile
                  </motion.a>
                </Button>
              </>
            ) : (
              <Button asChild variant="pillmind" size="sm">
                <motion.a href="/login" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  Try the demo
                </motion.a>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center p-4 border-b border-pm-slate-200 dark:border-pm-slate-700">
                    <div className="flex items-center gap-2">
                      <Logo />
                      <span className="text-lg font-semibold text-pm-teal-600 dark:text-pm-teal-500">PillMind</span>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-1">
                      {navItems.map((item) => (
                        <li key={item.href}>
                          <a
                            href={item.href}
                            className="block px-4 py-3 rounded-[12px] text-base font-medium text-pm-slate-700 dark:text-pm-slate-300 hover:bg-pm-teal-50 dark:hover:bg-pm-slate-800 hover:text-pm-teal-600 dark:hover:text-pm-teal-400 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  {/* Mobile Actions */}
                  <div className="p-4 border-t border-pm-slate-200 dark:border-pm-slate-700 space-y-2">
                    {status === 'loading' ? (
                      <div className="h-10 w-full rounded-[12px] bg-pm-slate-300 dark:bg-pm-slate-700 animate-pulse" />
                    ) : isAuthed ? (
                      <>
                        <Button asChild variant="pillmind" size="md" className="w-full">
                          <a href="#cta" onClick={() => setMobileMenuOpen(false)}>
                            Try the demo
                          </a>
                        </Button>
                        <Button asChild variant="pillmindOutline" size="md" className="w-full">
                          <a href="/profile" onClick={() => setMobileMenuOpen(false)}>
                            Profile
                          </a>
                        </Button>
                      </>
                    ) : (
                      <Button asChild variant="pillmind" size="md" className="w-full">
                        <a href="/login" onClick={() => setMobileMenuOpen(false)}>
                          Try the demo
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </motion.header>
  )
}
