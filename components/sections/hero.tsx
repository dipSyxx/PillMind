"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Container } from "../shared/container"

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
                { text: "Reminders", delay: 0 },
                { text: "Interaction check", delay: 0.1 },
                { text: "AI-recommendations*", delay: 0.2 },
              ].map((item, index) => (
                <motion.li
                  key={item.text}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + item.delay, duration: 0.5 }}
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
              className="mx-auto h-[520px] w-full max-w-[420px] rounded-[28px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-5"
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-full rounded-[20px] border border-[#E2E8F0] bg-gradient-to-b from-[#F8FAFC] to-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#334155]">My meds</span>
                  <span className="text-xs text-[#64748B]">Today</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { name: "Vitamin D3", time: "09:00", dose: "2000 IU" },
                    { name: "Magnesium", time: "13:00", dose: "200 mg" },
                    { name: "Prescription", time: "21:00", dose: "1 tablet" },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-white p-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + idx * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-3">
                        <PillIcon />
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
                  className="mt-5 rounded-[12px] bg-[#F1F5F9] p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  <p className="text-sm font-semibold text-[#0F172A]">Analytics</p>
                  <div className="mt-2 h-24 w-full rounded-md bg-gradient-to-r from-[#12B5C9]/20 via-[#2ED3B7]/20 to-[#3EC7E6]/20" />
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

function Check({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="#0EA8BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PillIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="6" fill="#12B5C9" opacity=".15" />
      <path d="M12 6v12" stroke="#0EA8BC" strokeWidth="2" />
    </svg>
  )
}
