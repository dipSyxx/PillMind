"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Container } from "../shared/container"
import { HeaderBlock } from "../shared/header-block"

export function FAQ() {
  const qas = [
    {
      q: "Do you store prescriptions?",
      a: "No, we only store data you intentionally add. You can export/delete anytime.",
    },
    {
      q: "How does the AI work?",
      a: "It analyzes your data and regimen, suggests typical dosages and checks interactions. It is not a medical diagnosis.",
    },
    {
      q: "Do I need internet access?",
      a: "Basic reminders work offline; sync and analytics require a connection.",
    },
  ]

  return (
    <motion.section
      id="faq"
      className="bg-white py-20 border-y border-[#E2E8F0]"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <HeaderBlock eyebrow="FAQ" title="Frequently asked questions" subtitle="If something's missing — contact us." />
        <div className="mt-8 divide-y divide-[#E2E8F0] rounded-[16px] border border-[#E2E8F0] bg-white">
          {qas.map((item, index) => (
            <motion.details
              key={index}
              className="group p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <h3 className="font-medium text-[#0F172A]">{item.q}</h3>
                <span className="text-[#64748B] group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-2 text-sm text-[#334155]">{item.a}</p>
            </motion.details>
          ))}
        </div>
      </Container>
    </motion.section>
  )
}
