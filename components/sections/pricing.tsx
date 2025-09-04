'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { Container } from '../shared/container'
import { HeaderBlock } from '../shared/header-block'
import { Check } from '../shared/icons'

export function Pricing() {
  const tiers = [
    {
      name: 'Free',
      price: '0 $',
      features: ['Medication tracking', 'Reminders', 'Up to 5 items'],
      cta: 'Start free',
      highlighted: false,
    },
    {
      name: 'Plus',
      price: '10 $/mo',
      features: ['Interaction checks', 'Basic analytics', 'Unlimited items'],
      cta: 'Choose Plus',
      highlighted: true,
    },
    {
      name: 'Pro',
      price: '25 $/mo',
      features: ['Advanced analytics', 'Doctor export', 'Family access'],
      cta: 'Choose Pro',
      highlighted: false,
    },
  ]

  return (
    <motion.section
      id="pricing"
      className="bg-white py-20 border-y border-[#E2E8F0]"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <HeaderBlock eyebrow="Pricing" title="Flexible for your needs" subtitle="Start free, upgrade when you need." />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              className={`rounded-[16px] border p-6 shadow-card ${tier.highlighted ? 'border-[#0EA8BC] bg-[#E6F7FA]' : 'border-[#E2E8F0] bg-white'}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{
                y: -10,
                transition: { duration: 0.2 },
              }}
            >
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="mt-1 text-3xl font-bold">{tier.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#334155]">
                {tier.features.map((feature, featureIndex) => (
                  <motion.li
                    key={feature}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.1 + featureIndex * 0.05,
                      duration: 0.5,
                    }}
                    viewport={{ once: true }}
                  >
                    <Check /> {feature}
                  </motion.li>
                ))}
              </ul>
              <motion.a
                href="#cta"
                className={`mt-6 inline-flex w-full items-center justify-center rounded-[12px] px-4 py-3 font-semibold transition-colors ${tier.highlighted ? 'bg-[#0EA8BC] text-white hover:bg-[#0B95A8]' : 'border border-[#0EA8BC] text-[#0EA8BC] hover:bg-[#E6F7FA]'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tier.cta}
              </motion.a>
            </motion.div>
          ))}
        </div>
      </Container>
    </motion.section>
  )
}
