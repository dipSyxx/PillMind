'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { Container } from '../shared/container'
import { Check, ExternalLink, Loader2, Pill, SearchIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { useFkSearch } from '@/hooks/useFkSearch'
import { MiniAnalytics } from '../shared/mini-analytics'

export type FkItem = {
  title: string
  formattedTitle?: string
  extraText?: string
  seoUrl?: string | null
  searchValue?: string
  type?: string
}

export type FkResponse = {
  elements: FkItem[]
  fullList?: boolean
}

function stripTags(html?: string) {
  if (!html) return ''
  const tmp = typeof window !== 'undefined' ? document.createElement('div') : null
  if (!tmp) return html
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

function MedSearch() {
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 300)
  const { results, loading } = useFkSearch(debouncedQ, { maxRows: 0 })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useOutsideClick(rootRef, () => setOpen(false))

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (!results.length) return

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        setActive((a) => Math.min(a + 1, results.length - 1))
        const el = listRef.current?.querySelector(`[data-idx="${Math.min(active + 1, results.length - 1)}"]`)
        ;(el as HTMLElement | null)?.scrollIntoView({ block: 'nearest' })
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
        const el = listRef.current?.querySelector(`[data-idx="${Math.max(active - 1, 0)}"]`)
        ;(el as HTMLElement | null)?.scrollIntoView({ block: 'nearest' })
        break
      }
      case 'Enter': {
        e.preventDefault()
        const item = results[active]
        if (item) handlePick(item)
        break
      }
      case 'Escape': {
        setOpen(false)
        break
      }
    }
  }

  const handlePick = (item: FkItem) => {
    const label = item.searchValue || stripTags(item.formattedTitle) || item.title

    const url = item.seoUrl
      ? `https://www.felleskatalogen.no/medisin${item.seoUrl}`
      : `https://www.felleskatalogen.no/medisin/internsok?sokord=${encodeURIComponent(label)}`

    setQ(label)
    setOpen(false)
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const hasQuery = q.trim().length > 0
  useEffect(() => {
    setOpen(hasQuery)
  }, [hasQuery])

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#12B5C9]" size={16} />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim() && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search Meds"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="med-search-listbox"
          className="h-8 w-full rounded-[12px] border border-[#CBD5E1] bg-white pl-8 pr-8 text-[#0F172A] outline-none transition focus:border-[#0EA8BC] focus:ring-4 focus:ring-[#12B5C9]/20"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQ('')
              setOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1 text-[#64748B] hover:bg-slate-100"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <motion.div
          id="med-search-listbox"
          role="listbox"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-auto rounded-[12px] border border-[#E2E8F0] bg-white shadow-lg"
          ref={listRef}
        >
          {/* Loading state */}
          {loading && (
            <div className="flex items-center gap-2 p-3 text-sm text-[#64748B]">
              <Loader2 className="animate-spin" size={16} />
              Searching…
            </div>
          )}

          {/* Results */}
          {!loading &&
            results.length > 0 &&
            results.map((item, idx) => (
              <button
                key={`${item.seoUrl ?? item.title}-${idx}`}
                title={item.title}
                type="button"
                role="option"
                aria-selected={active === idx}
                data-idx={idx}
                onMouseEnter={() => setActive(idx)}
                onClick={() => handlePick(item)}
                className={cn(
                  'w-full cursor-pointer px-3 py-2 text-left transition',
                  active === idx ? 'bg-[#F1F5F9]' : 'hover:bg-[#F8FAFC]',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div
                      className="truncate text-sm font-medium text-[#0F172A]"
                      dangerouslySetInnerHTML={{
                        __html: item.formattedTitle || item.title,
                      }}
                    />
                    {item.extraText && <p className="mt-0.5 line-clamp-1 text-xs text-[#64748B]">{item.extraText}</p>}
                  </div>
                  <ExternalLink size={16} className="shrink-0 text-[#94A3B8]" />
                </div>
              </button>
            ))}

          {/* Empty */}
          {!loading && hasQuery && results.length === 0 && <div className="p-3 text-sm text-[#64748B]">No results</div>}
        </motion.div>
      )}
    </div>
  )
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6] text-white"
    >
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-20 md:py-28 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <motion.h1
              className="text-4xl md:text-5xl font-bold leading-tight text-balance"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Taking your meds just got easier
            </motion.h1>
            <motion.p
              className="mt-4 text-lg/relaxed text-white/90 text-pretty"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              PillMind reminds you to take meds, analyzes your data, and suggests safe combinations. With your consent —
              and for you only.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.a
                href="#cta"
                className="inline-flex items-center justify-center rounded-[12px] bg-white px-6 py-3 text-[#0F172A] font-semibold hover:bg-white/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try the demo
              </motion.a>
              <motion.a
                href="#how"
                className="inline-flex items-center justify-center rounded-[12px] border border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn more
              </motion.a>
            </motion.div>
            <motion.ul
              className="mt-6 flex flex-wrap gap-4 text-white/90 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {[
                { text: 'Reminders', delay: 0 },
                { text: 'Interaction check', delay: 0.1 },
                { text: 'AI-recommendations*', delay: 0.2 },
              ].map((item, index) => (
                <motion.li
                  key={item.text}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.8 + item.delay,
                    duration: 0.5,
                  }}
                >
                  <Check className="w-5 h-5 text-[#0EA8BC]" /> {item.text}
                </motion.li>
              ))}
            </motion.ul>
            <motion.p
              className="mt-2 text-xs text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              *Recommendations do not replace a doctor's consultation.
            </motion.p>
          </motion.div>
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.div
              className="mx-auto h-[540px] w-full max-w-[420px] rounded-[28px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-5"
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-full rounded-[20px] border border-[#E2E8F0] bg-gradient-to-b from-[#F8FAFC] to-white p-5">
                <div className="flex gap-3 items-center justify-between">
                  <span className="min-w-[63px] text-sm font-semibold text-[#334155]">My meds</span>
                  <div className="w-full">
                    <MedSearch />
                  </div>
                  <span className="text-xs text-[#64748B]">Today</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      name: 'Vitamin D3',
                      time: '09:00',
                      dose: '2000 IU',
                    },
                    {
                      name: 'Magnesium',
                      time: '13:00',
                      dose: '200 mg',
                    },
                    {
                      name: 'Prescription',
                      time: '21:00',
                      dose: '1 tablet',
                    },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-white p-3 hover:scale-105 transition-all duration-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.8 + idx * 0.1,
                        duration: 0.5,
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-3">
                        <Pill size={20} color="#0EA8BC" />
                        <div>
                          <p className="font-medium text-[#0F172A]">{item.name}</p>
                          <p className="text-xs text-[#64748B]">{item.dose}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-[#0EA8BC]">{item.time}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  className="mt-5 rounded-[12px] bg-[#F1F5F9] p-4 hover:scale-105 transition-all duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  <p className="text-sm font-semibold text-[#0F172A]">Analytics</p>
                  <MiniAnalytics delay={1.3} />
                </motion.div>
              </div>
            </motion.div>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
