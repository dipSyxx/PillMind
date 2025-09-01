"use client"

import type React from "react"
import { motion } from "framer-motion"

export default function PillMindLanding() {
  return (
    <main className="min-h-screen bg-[#F1F5F9] text-[#0F172A]">
      <Header />
      <Hero />
      <Trust />
      <HowItWorks />
      <Features />
      <Security />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">{children}</div>
}

function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#CBD5E1]"
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
            <span className="text-xl font-semibold text-[#0EA8BC]">PillMind</span>
          </motion.a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#334155]">
            {[
              { href: "#how", text: "How it works" },
              { href: "#features", text: "Features" },
              { href: "#security", text: "Security" },
              { href: "#pricing", text: "Pricing" },
              { href: "#faq", text: "FAQ" },
            ].map((item, index) => (
              <motion.a
                key={item.href}
                className="hover:text-[#0EA8BC] transition-colors"
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
            <motion.a
              href="#pricing"
              className="hidden sm:inline-block rounded-[12px] border border-[#0EA8BC] px-4 py-2 text-sm font-medium text-[#0EA8BC] hover:bg-[#E6F7FA] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              How it works
            </motion.a>
            <motion.a
              href="#cta"
              className="rounded-[12px] bg-[#0EA8BC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B95A8] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try the demo
            </motion.a>
          </div>
        </div>
      </Container>
    </motion.header>
  )
}

function Hero() {
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
              *Recommendations do not replace a doctor’s consultation.
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

function Trust() {
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
          {["GDPR Ready", "Encryption", "Access control", "Does not replace a doctor"].map((text, index) => (
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

function HowItWorks() {
  const steps = [
    {
      title: "Add your meds",
      text: "Manually or via the AI agent. Set dosage and schedule.",
    },
    {
      title: "Get reminders",
      text: "On-time push notifications. Missed doses under control.",
    },
    {
      title: "Act with confidence",
      text: "Interaction checks and personal regimen tips.",
    },
  ]

  return (
    <motion.section
      id="how"
      className="py-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <HeaderBlock
          eyebrow="How it works"
          title="Three simple steps"
          subtitle="Everything you need for discipline and peace of mind."
        />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="rounded-[16px] bg-white p-6 shadow-card border border-[#E2E8F0]"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <motion.div
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#12B5C9]/10 text-[#0EA8BC] font-bold"
                whileHover={{ scale: 1.1 }}
              >
                {index + 1}
              </motion.div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-[#64748B]">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </motion.section>
  )
}

function Features() {
  const list = [
    {
      title: "Personal reminders",
      text: "Flexible schedules, time zones, missed dose handling and repeats.",
    },
    {
      title: "Interaction checks",
      text: "Warnings about unwanted combinations of meds and vitamins.",
    },
    {
      title: "AI recommendations",
      text: "Suggestions based on your data and regimen.*",
    },
    {
      title: "Analytics & reports",
      text: "Adherence stats, PDF/CSV export for your doctor.",
    },
  ]

  return (
    <motion.section
      id="features"
      className="bg-white py-20 border-y border-[#E2E8F0]"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <HeaderBlock eyebrow="Features" title="Everything for medication control" subtitle="And understanding your state." />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {list.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="flex items-start gap-4 rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <Check className="mt-1" />
              <div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-[#64748B]">{feature.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.p
          className="mt-4 text-xs text-[#64748B]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
        >
          *Recommendations do not replace a doctor’s consultation.
        </motion.p>
      </Container>
    </motion.section>
  )
}

function Security() {
  const points = [
    "Data encryption at rest and in transit",
    "Access control & transparent permissions",
    "GDPR compliance and localized storage",
    "Export and delete data on user request",
  ]

  return (
    <motion.section
      id="security"
      className="py-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <HeaderBlock
          eyebrow="Security"
          title="Your data is yours alone"
          subtitle="We build trust with technology and policy."
        />
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            className="rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-card"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center gap-3 text-[#0EA8BC] font-semibold">
              <Shield /> Protection by default
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[#334155] list-disc pl-5">
              {points.map((point, index) => (
                <motion.li
                  key={point}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  {point}
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            className="rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-card"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <p className="text-sm text-[#64748B]">
              PillMind does not provide medical diagnoses and does not replace a doctor’s consultation. Always consult a
              professional before changing your treatment plan.
            </p>
            <div className="mt-4 h-36 w-full rounded-md bg-gradient-to-r from-[#12B5C9]/15 via-[#2ED3B7]/15 to-[#3EC7E6]/15" />
          </motion.div>
        </div>
      </Container>
    </motion.section>
  )
}

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "0 ₴",
      features: ["Medication tracking", "Reminders", "Up to 5 items"],
      cta: "Start free",
      highlighted: false,
    },
    {
      name: "Plus",
      price: "149 ₴/mo",
      features: ["Interaction checks", "Basic analytics", "Unlimited items"],
      cta: "Choose Plus",
      highlighted: true,
    },
    {
      name: "Pro",
      price: "249 ₴/mo",
      features: ["Advanced analytics", "Doctor export", "Family access"],
      cta: "Choose Pro",
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
        <HeaderBlock
          eyebrow="Pricing"
          title="Flexible for your needs"
          subtitle="Start free, upgrade when you need."
        />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              className={`rounded-[16px] border p-6 shadow-card ${tier.highlighted ? "border-[#0EA8BC] bg-[#E6F7FA]" : "border-[#E2E8F0] bg-white"}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
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
                    transition={{ delay: index * 0.1 + featureIndex * 0.05, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <Check /> {feature}
                  </motion.li>
                ))}
              </ul>
              <motion.a
                href="#cta"
                className={`mt-6 inline-flex w-full items-center justify-center rounded-[12px] px-4 py-3 font-semibold transition-colors ${tier.highlighted ? "bg-[#0EA8BC] text-white hover:bg-[#0B95A8]" : "border border-[#0EA8BC] text-[#0EA8BC] hover:bg-[#E6F7FA]"}`}
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

function Testimonials() {
  const items = [
    { quote: "I finally stopped mixing up doses — and that’s peace of mind.", name: "Olena, 42" },
    { quote: "It’s convenient to see stats and share them with my doctor.", name: "Ihor, 55" },
    { quote: "Reminders work perfectly even when I travel.", name: "Maryna, 34" },
  ]

  return (
    <motion.section
      className="py-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Container>
        <HeaderBlock eyebrow="Testimonials" title="What users say about PillMind" subtitle="We value every experience." />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, index) => (
            <motion.figure
              key={t.name}
              className="rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <blockquote className="text-[#0F172A]">"{t.quote}"</blockquote>
              <figcaption className="mt-4 text-sm text-[#64748B]">{t.name}</figcaption>
            </motion.figure>
          ))}
        </div>
      </Container>
    </motion.section>
  )
}

function FAQ() {
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
        <HeaderBlock eyebrow="FAQ" title="Frequently asked questions" subtitle="If something’s missing — contact us." />
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

function CTA() {
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
          <motion.a
            href="#"
            className="mt-6 rounded-[12px] bg-white px-6 py-3 font-semibold text-[#0F172A] hover:bg-white/90 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try the demo
          </motion.a>
        </motion.div>
      </Container>
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
    </motion.section>
  )
}

function Footer() {
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
                { href: "#features", text: "Features" },
                { href: "#security", text: "Security" },
                { href: "#pricing", text: "Pricing" },
                { href: "#faq", text: "FAQ" },
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

/* ——— UI bits ——— */
function HeaderBlock({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <motion.div
      className="mx-auto max-w-2xl text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {eyebrow && (
        <motion.p
          className="text-sm font-semibold tracking-wide text-[#0EA8BC]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        className="mt-1 text-3xl font-bold text-[#0F172A] text-balance"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        viewport={{ once: true }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          className="mt-3 text-[#64748B] text-pretty"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}

function Logo() {
  return <img src="/images/pillmind-icon.png" alt="PillMind" className="h-8 w-8" />
}

function PillIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="6" fill="#12B5C9" opacity=".15" />
      <path d="M12 6v12" stroke="#0EA8BC" strokeWidth="2" />
    </svg>
  )
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="#0EA8BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Shield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4Z"
        stroke="#0EA8BC"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
