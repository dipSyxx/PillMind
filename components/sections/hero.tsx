'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { Container } from '../shared/container'
import { ExternalLink, Loader2, Pill, SearchIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function MiniAnalytics({ delay = 0 }: { delay?: number }) {
  const data = [68, 72, 55, 80, 62, 90, 76]
  const w = 360,
    h = 96,
    pad = 10

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = Math.max(1, max - min)
  const xStep = (w - pad * 2) / (data.length - 1)

  const points = data.map((v, i) => {
    const x = pad + i * xStep
    const y = h - pad - ((v - min) / span) * (h - pad * 2)
    return [x, y] as const
  })

  const lineD = 'M ' + points.map((p) => p.join(' ')).join(' L ')
  const areaD = lineD + ` L ${points[points.length - 1][0]} ${h - pad} L ${points[0][0]} ${h - pad} Z`
  const last = points[points.length - 1]

  return (
    <div className="mt-2 w-full rounded-md bg-white/0">
      <motion.svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-24"
        aria-label="Weekly adherence trend"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay }}
        role="img"
      >
        <defs>
          <linearGradient id="pmLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#12B5C9" />
            <stop offset="50%" stopColor="#2ED3B7" />
            <stop offset="100%" stopColor="#3EC7E6" />
          </linearGradient>
          <linearGradient id="pmFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#12B5C9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#12B5C9" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* grid */}
        {[1, 2, 3].map((i) => (
          <line key={i} x1={pad} x2={w - pad} y1={(h / 4) * i} y2={(h / 4) * i} stroke="#E2E8F0" strokeWidth="1" />
        ))}

        {/* area fill appears slightly after svg fade-in */}
        <motion.path
          d={areaD}
          fill="url(#pmFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: delay + 0.1 }}
        />

        {/* line draw starts after container finishes (delay ~1.8s) */}
        <motion.path
          d={lineD}
          fill="none"
          stroke="url(#pmLine)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1.2,
            ease: 'easeInOut',
            delay: delay + 0.2,
          }}
        />

        {/* points pop in after the line begins */}
        {points.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill="#0EA8BC"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: delay + 0.6 + i * 0.06,
              type: 'spring',
              stiffness: 200,
              damping: 18,
            }}
          />
        ))}

        {/* pulsing marker starts after everything is visible */}
        <motion.circle
          cx={last[0]}
          cy={last[1]}
          r={6}
          fill="#0EA8BC"
          opacity="0.2"
          animate={{ r: [6, 10, 6], opacity: [0.2, 0, 0.2] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: 'easeOut',
            delay: delay + 1.2,
          }}
        />
      </motion.svg>

      <div className="mt-2 flex items-center justify-between text-xs text-[#64748B]">
        <span>Adherence</span>
        <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.8 }}>
          7-day avg: <strong className="text-[#0EA8BC]">84%</strong>
        </motion.span>
      </div>
    </div>
  )
}

type FkItem = {
  title: string
  formattedTitle?: string
  extraText?: string
  seoUrl?: string | null
  searchValue?: string
  type?: string
}

type FkResponse = {
  elements: FkItem[]
  fullList?: boolean
}

function cn(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(' ')
}

function stripTags(html?: string) {
  if (!html) return ''
  const tmp = typeof window !== 'undefined' ? document.createElement('div') : null
  if (!tmp) return html
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function MedSearch() {
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 300)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<FkItem[]>([])
  const [active, setActive] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    let abort = new AbortController()

    const run = async () => {
      if (!debouncedQ.trim()) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/fk-search?term=${encodeURIComponent(debouncedQ)}&maxRows=0`, {
          signal: abort.signal,
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('Search failed')
        const data: FkResponse = await res.json()
        setResults(data?.elements || [])
        setActive(0)
      } catch {
        if (!abort.signal.aborted) {
          setResults([])
        }
      } finally {
        if (!abort.signal.aborted) setLoading(false)
      }
    }

    run()
    return () => abort.abort()
  }, [debouncedQ])

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
              setResults([])
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
                  <Check /> {item.text}
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

function Check({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="#0EA8BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
