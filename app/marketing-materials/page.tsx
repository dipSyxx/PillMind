'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Target,
  Users,
  Megaphone,
  MessageSquare,
  Instagram,
  Video,
  Facebook,
  Youtube,
  FileText,
  Mail,
  Link as LinkIcon,
  Palette as PaletteIcon,
  Type as TypeIcon,
  BarChart3,
  FlaskConical,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Download,
  Copy,
  // NEW — platform UI icons
  MoreHorizontal,
  Heart,
  MessageCircle as MessageCircleIcon,
  Send,
  Bookmark,
  ThumbsUp,
  Share,
  Search,
  Music,
  Home,
  Compass,
  Plus,
  Inbox,
  User as UserIcon,
  ArrowBigLeft,
} from 'lucide-react'
import { BrandBookBtn, Logo } from '@/components/shared'

/* --------------------------------- UI Bits -------------------------------- */
function BrandGlyph({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-[10px] bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6] ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 4h6a5 5 0 0 1 5 5v6H10a5 5 0 0 1-5-5V4Z" fill="white" opacity=".9" />
        <path d="M13 4h6v6a5 5 0 0 1-5 5h-6V9a5 5 0 0 1 5-5Z" stroke="white" strokeWidth="2" opacity=".9" />
      </svg>
    </div>
  )
}

function HeroPreviewCard() {
  return (
    <div className="w-full max-w-[420px] rounded-[20px] border border-white/40 bg-white/10 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
      <div className="rounded-[16px] border border-white/40 bg-white/10 p-4">
        <div className="text-sm font-semibold">Campaign snippet</div>
        <div className="mt-2 rounded-md bg-white/10 p-3 text-xs">Taking your meds just got easier — Try the demo</div>
        <div className="mt-3 flex gap-2">
          <Button variant="pillmindWhite" size="sm">
            Download kit
          </Button>
          <Button variant="pillmindWhiteOutline" size="sm">
            See templates
          </Button>
        </div>
      </div>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[16px] border border-[#E2E8F0] bg-white shadow-card ${className}`}>{children}</div>
}
function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-[#E2E8F0] p-4">
      <h3 className="text-lg font-semibold text-[#0F172A]">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>}
    </div>
  )
}
function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>
}
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#CBD5E1] px-2 py-0.5 text-xs text-[#334155]">
      {children}
    </span>
  )
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="whitespace-pre-wrap rounded-[12px] border border-[#E2E8F0] bg-[#0F172A] p-3 text-xs text-[#E2E8F0]">
      <code>{children}</code>
    </pre>
  )
}

export default function MarketingMaterialsPage() {
  return (
    <main className="min-h-screen bg-[#F1F5F9] text-[#0F172A]">
      <Header />
      <Hero />
      <AnchorNav />

      <Section id="goals" title="Marketing Objectives" icon={<Target className="h-5 w-5" />}>
        <GoalsBlock />
      </Section>

      <Section id="audiences" title="Audiences & Messaging" icon={<Users className="h-5 w-5" />}>
        <AudiencesBlock />
      </Section>

      <Section id="core-message" title="Core Message & CTAs" icon={<MessageSquare className="h-5 w-5" />}>
        <CoreMessageBlock />
      </Section>

      <Section id="channels" title="Channels & Formats" icon={<Megaphone className="h-5 w-5" />}>
        <ChannelsBlock />
      </Section>

      <Section id="visual" title="Visual Style (Brand Aligned)" icon={<PaletteIcon className="h-5 w-5" />}>
        <VisualBlock />
      </Section>

      <Section id="copy" title="Ready-to-use Copy" icon={<TypeIcon className="h-5 w-5" />}>
        <CopyBlock />
      </Section>

      <Section id="analytics" title="Analytics, UTM & Events" icon={<BarChart3 className="h-5 w-5" />}>
        <AnalyticsBlock />
      </Section>

      <Section id="ab" title="A/B Test Plan" icon={<FlaskConical className="h-5 w-5" />}>
        <ABBlock />
      </Section>

      <Section id="calendar" title="4-Week Content Plan" icon={<CalendarIcon className="h-5 w-5" />}>
        <CalendarBlock />
      </Section>

      <Section id="templates" title="Templates Library" icon={<FileText className="h-5 w-5" />}>
        <TemplatesBlock />
      </Section>

      <Section id="mockups" title="Social Post Mockups" icon={<Instagram className="h-5 w-5" />}>
        <MockupsBlock />
      </Section>
      <Section id="checklists" title="Checklists & File Naming" icon={<CheckCircle2 className="h-5 w-5" />}>
        <ChecklistsBlock />
      </Section>

      <Section id="downloads" title="Assets & Downloads" icon={<Download className="h-5 w-5" />}>
        <DownloadsBlock />
      </Section>

      <Footer />

      <BrandBookBtn link="/">
        <ArrowBigLeft color="white" className="w-7 h-7" />
      </BrandBookBtn>
    </main>
  )
}

/* ------------------------------- Layout ---------------------------------- */
function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">{children}</div>
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#CBD5E1] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <a href="#top" className="flex items-center gap-2" aria-label="PillMind Marketing Materials">
            <Logo />
            <span className="font-semibold">PillMind — Marketing</span>
          </a>
          <nav className="hidden md:flex items-center gap-5 text-sm text-[#334155]">
            {[
              { href: '#goals', label: 'Objectives' },
              { href: '#audiences', label: 'Audiences' },
              { href: '#channels', label: 'Channels' },
              { href: '#copy', label: 'Copy' },
              { href: '#analytics', label: 'Analytics' },
              { href: '#templates', label: 'Templates' },
              { href: '#downloads', label: 'Downloads' },
            ].map((i) => (
              <a key={i.href} className="hover:text-[#0EA8BC]" href={i.href}>
                {i.label}
              </a>
            ))}
          </nav>
        </div>
      </Container>
    </header>
  )
}

function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6] py-14 text-white"
    >
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold leading-tight text-balance"
            >
              Marketing Materials
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mt-3 max-w-xl text-white/90"
            >
              One place for PillMind campaign assets, copy, formats, analytics rules and templates — aligned with our
              brandbook.
            </motion.p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#templates"
                className="rounded-[12px] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] hover:bg-white/90"
              >
                Browse templates
              </a>
              <a
                href="#downloads"
                className="rounded-[12px] border border-white/70 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Get assets
              </a>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="justify-self-center"
          >
            <HeroPreviewCard />
          </motion.div>
        </div>
      </Container>
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
    </section>
  )
}

function AnchorNav() {
  const items = [
    { href: '#goals', label: 'Objectives' },
    { href: '#audiences', label: 'Audiences' },
    { href: '#core-message', label: 'Message' },
    { href: '#channels', label: 'Channels' },
    { href: '#visual', label: 'Visual' },
    { href: '#copy', label: 'Copy' },
    { href: '#analytics', label: 'Analytics' },
    { href: '#ab', label: 'A/B' },
    { href: '#calendar', label: 'Plan' },
    { href: '#templates', label: 'Templates' },
    { href: '#mockups', label: 'Mockups' },
    { href: '#checklists', label: 'Checklists' },
    { href: '#downloads', label: 'Downloads' },
  ]
  return (
    <div className="border-b border-[#E2E8F0] bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <Container>
        <div className="flex flex-wrap items-center gap-3 py-3 text-sm">
          {items.map((i) => (
            <a
              key={i.href}
              className="rounded-full border border-[#CBD5E1] px-3 py-1 text-[#334155] hover:border-[#0EA8BC] hover:text-[#0EA8BC]"
              href={i.href}
            >
              {i.label}
            </a>
          ))}
        </div>
      </Container>
    </div>
  )
}

function Section({
  id,
  title,
  icon,
  children,
}: {
  id: string
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="py-14">
      <Container>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6] text-white">
            {icon}
          </div>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        {children}
      </Container>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white py-8 text-sm text-[#334155]">
      <Container>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>© PillMind — Marketing Library v1.0</span>
          <span>
            Contact:{' '}
            <a className="text-[#0EA8BC] hover:underline" href="mailto:marketing@pillmind.app">
              marketing@pillmind.app
            </a>
          </span>
        </div>
      </Container>
    </footer>
  )
}

/* ------------------------------ Goals Block ------------------------------ */
function GoalsBlock() {
  const items = [
    {
      title: 'Increase awareness',
      desc: 'Reach & impressions, video views, brand searches.',
      kpis: ['Reach', 'Impressions', 'VTR'],
    },
    { title: 'Reach target audiences', desc: 'Right segments at efficient cost.', kpis: ['CPM', 'CPC', '% in target'] },
    {
      title: 'Drive interest & engagement',
      desc: 'Clicks, time watched, comments & shares.',
      kpis: ['CTR', 'ER', 'Avg. watch time'],
    },
    {
      title: 'Build brand',
      desc: 'Consistency, followers growth, mentions.',
      kpis: ['Brand lift', 'Followers', 'Mentions'],
    },
    { title: 'Conversions', desc: 'Demo signups and app installs when ready.', kpis: ['Signups', 'CVR', 'CPA'] },
  ]
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((it, i) => (
        <Card key={i}>
          <CardHeader title={it.title} subtitle={it.desc} />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {it.kpis.map((k) => (
                <Tag key={k}>{k}</Tag>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

/* -------------------------- Audiences & Messaging ------------------------- */
function AudiencesBlock() {
  const personas = [
    { title: 'Vitamins & wellness (25–40)', lines: ['Wants reliable nudges', 'Simple logging', 'Light AI tips'] },
    {
      title: 'Chronic conditions (45–65)',
      lines: ['Precise schedules', 'Adherence overview for doctor', 'Trust & clarity'],
    },
    { title: 'Caregivers & family', lines: ['Shared access (v2)', 'Gentle reminders', 'Peace of mind'] },
  ]
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {personas.map((p) => (
        <Card key={p.title}>
          <CardHeader title={p.title} />
          <CardBody>
            <ul className="list-disc pl-5 text-sm text-[#334155] space-y-1">
              {p.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

/* --------------------------- Core Message & CTAs -------------------------- */
function CoreMessageBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Headline & Subheadline" />
        <CardBody>
          <p className="text-sm text-[#64748B]">Use across ads & landing pages.</p>
          <Code>
            {`H1: Taking your meds just got easier.
Sub: Reminders, interaction checks and gentle AI tips — with your consent, for you only.`}
          </Code>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Primary CTAs" />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {['Try the demo', 'Add your meds', 'Check interactions', 'Join the waitlist'].map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#64748B]">
            Always display the disclaimer near any advice: “PillMind does not provide medical diagnoses and does not
            replace a doctor’s consultation.”
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

/* ---------------------------- Channels & Formats -------------------------- */
function ChannelsBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <ChannelCard
        icon={<Instagram className="h-5 w-5" />}
        title="Instagram Posts & Stories"
        size="1080×1080 / 1080×1920"
        copy={`Forget vitamins? PillMind reminds you on time. Try the demo today.`}
        assets={['/marketing/ig-post-1080.png', '/marketing/ig-story-1080x1920.png']}
      />
      <ChannelCard
        icon={<Video className="h-5 w-5" />}
        title="TikTok / Reels"
        size="9:16 • 15–30s"
        copy={`Hook (first 3s): Missed your meds again? Show: Reminder → Log dose → CTA: Try the demo.`}
        assets={['/marketing/tiktok-15s-script.txt']}
      />
      <ChannelCard
        icon={<Facebook className="h-5 w-5" />}
        title="Facebook Ads"
        size="1200×628 or 1080×1080"
        copy={`Primary: PillMind reminds you and checks interactions. CTA: Try the demo.`}
        assets={['/marketing/fb-ad-1200x628.png']}
      />
      <ChannelCard
        icon={<Youtube className="h-5 w-5" />}
        title="YouTube Intro"
        size="30–45s"
        copy={`Problem → Solution → How it works → Safety → CTA. Include disclaimer.`}
        assets={['/marketing/youtube-intro-script.txt']}
      />
      <ChannelCard
        icon={<FileText className="h-5 w-5" />}
        title="Digital Flyers & Posters"
        size="A4/A3 + 1080×1350"
        copy={`Logo, H1, 3 bullets, QR to landing, disclaimer.`}
        assets={['/marketing/flyer-a4.pdf']}
      />
      <ChannelCard
        icon={<Mail className="h-5 w-5" />}
        title="Email (Welcome/Onboarding)"
        size="600–700px width"
        copy={`Subject: Welcome to PillMind — let’s set your first reminder.`}
        assets={['/marketing/email-welcome.html']}
      />
    </div>
  )
}

function ChannelCard({
  icon,
  title,
  size,
  copy,
  assets,
}: {
  icon: React.ReactNode
  title: string
  size: string
  copy: string
  assets: string[]
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={size} />
      <CardBody>
        <div className="mb-3 flex items-center gap-2 text-sm text-[#334155]">
          {icon}
          <span>Example copy:</span>
        </div>
        <Code>{copy}</Code>
        <div className="mt-3 flex flex-wrap gap-2">
          {assets.map((a) => (
            <a
              key={a}
              href={a}
              className="inline-flex items-center gap-1 rounded-md border border-[#0EA8BC] px-2 py-1 text-sm text-[#0EA8BC] hover:bg-[#E6F7FA]"
              download
            >
              <Download className="h-4 w-4" /> Download
            </a>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

/* --------------------------- Visual Style Block --------------------------- */
function VisualBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader title="Colors" subtitle="Teal/Mint/Sky + Slate neutrals" />
        <CardBody>
          <div className="grid grid-cols-3 gap-2">
            {[
              '#12B5C9',
              '#0EA8BC',
              '#2ED3B7',
              '#22C3A8',
              '#3EC7E6',
              '#0F172A',
              '#334155',
              '#64748B',
              '#CBD5E1',
              '#F1F5F9',
            ].map((hex) => (
              <Swatch key={hex} hex={hex} />
            ))}
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Typography" subtitle="Headings: Poppins • Body: Inter" />
        <CardBody>
          <div className="space-y-2">
            <p className="text-2xl font-bold">Taking your meds just got easier</p>
            <p className="text-sm text-[#334155]">
              Reminders, interaction checks and gentle AI tips — with your consent.
            </p>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="A11y & Motion" subtitle="WCAG AA • 200–600ms easeInOut" />
        <CardBody>
          <ul className="list-disc pl-5 text-sm text-[#334155] space-y-1">
            <li>Contrast body ≥ 4.5:1; touch targets ≥ 44×44px.</li>
            <li>Subtle fade/slide; stagger 60–120ms; respect reduced motion.</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function Swatch({ hex }: { hex: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-[#E2E8F0] bg-white text-xs">
      <div className="h-10" style={{ backgroundColor: hex }} />
      <div className="p-2 text-[#334155]">{hex}</div>
    </div>
  )
}

/* ------------------------------ Copy Block ------------------------------- */
function CopyBlock() {
  const blocks = [
    {
      title: 'Main message',
      text: 'PillMind reminds you to take meds, checks interactions and offers gentle AI tips — with your consent, for you only.',
    },
    {
      title: 'Benefits (bullets)',
      text: 'On‑time reminders • Interaction checks • Clean reports for you and your doctor',
    },
    {
      title: 'Disclaimer',
      text: 'Recommendations are not medical advice. For treatment changes, consult your doctor.',
    },
    { title: 'CTA variants', text: 'Try the demo • Add your meds • Check interactions • Join the waitlist' },
  ]
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {blocks.map((b) => (
        <CopyCard key={b.title} title={b.title} text={b.text} />
      ))}
    </div>
  )
}

function CopyCard({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        <Code>{text}</Code>
        <Button onClick={copy} variant="copy" size="copy" className="mt-2">
          <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardBody>
    </Card>
  )
}

/* ------------------------- Analytics & UTM Block ------------------------- */
function AnalyticsBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="UTM Scheme" subtitle="Add to every campaign link" />
        <CardBody>
          <Code>
            {`utm_source=<platform>&utm_medium=<ad|social|email>&utm_campaign=<theme>&utm_content=<creative-variant>&utm_term=<optional>`}
          </Code>
          <div className="mt-3 text-sm text-[#334155]">
            Example:{' '}
            <span className="font-mono break-words">
              ?utm_source=instagram&utm_medium=social&utm_campaign=awareness_q4&utm_content=carousel_a
            </span>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Events & KPIs" subtitle="Track consistently across channels" />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm text-[#334155]">
            <div>
              <p className="font-semibold">Events</p>
              <ul className="mt-1 list-disc pl-5 space-y-1">
                <li>
                  <code>signup_started</code>, <code>signup_completed</code>
                </li>
                <li>
                  <code>demo_clicked</code>
                </li>
                <li>
                  <code>med_added</code>, <code>schedule_set</code>
                </li>
                <li>
                  <code>export_generated</code>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Channel KPIs</p>
              <ul className="mt-1 list-disc pl-5 space-y-1">
                <li>IG/TikTok: ER ≥ 5–8%, VTR ≥ 30%, CTR ≥ 0.8–1.5%</li>
                <li>FB Ads: CTR ≥ 1–1.5%, CVR signup ≥ 10–20%</li>
                <li>Email: Open ≥ 30–40%, CTR ≥ 3–6%</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

/* ------------------------------ A/B Test Plan ---------------------------- */
function ABBlock() {
  const tests = [
    { id: 'H1', A: 'Taking your meds just got easier', B: 'You’ll never forget your meds again' },
    { id: 'Proof', A: 'Security badges below hero', B: 'Security section mid-page' },
    { id: 'Creative', A: 'Morning routine photo', B: 'App interface cards' },
    { id: 'CTA', A: 'Try the demo', B: 'Start free' },
  ]
  return (
    <Card>
      <CardHeader title="Start here" subtitle="Run simple A/Bs; keep one change per test" />
      <CardBody>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {tests.map((t) => (
            <div key={t.id} className="rounded-md border border-[#E2E8F0] bg-white p-3 text-sm text-[#334155]">
              <div className="font-semibold">{t.id}</div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <div className="rounded border border-[#DCFCE7] bg-[#F0FDF4] p-2">
                  <span className="text-xs text-[#16A34A]">A</span> — {t.A}
                </div>
                <div className="rounded border border-[#FFE4E6] bg-[#FFF1F2] p-2">
                  <span className="text-xs text-[#DC2626]">B</span> — {t.B}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

/* ---------------------------- 4-Week Calendar ---------------------------- */
function CalendarBlock() {
  const weeks = [
    { week: 'Week 1', items: ['IG post (problem/solution)', 'Stories with CTA', 'TikTok hook', 'Email: Welcome #1'] },
    { week: 'Week 2', items: ['FB traffic to landing', 'Reels: 3 steps', 'Blog: Routine & calm'] },
    { week: 'Week 3', items: ['IG carousel: Security/GDPR', 'Email: 3 small habits', 'YouTube intro'] },
    { week: 'Week 4', items: ['Case creative (Ihor, 55)', 'Remarketing ads', 'A/B test H1 on landing'] },
  ]
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {weeks.map((w) => (
        <Card key={w.week}>
          <CardHeader title={w.week} />
          <CardBody>
            <ul className="list-disc pl-5 text-sm text-[#334155] space-y-1">
              {w.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

/* ---------------------------- Templates Library -------------------------- */
export type Template = {
  id: string
  title: string
  purpose: string
  size: string
  copy?: string
  script?: string
  assets: string[]
}

function TemplatesBlock() {
  const templates: Template[] = useMemo(
    () => [
      {
        id: 'ig-post-1080',
        title: 'Instagram Post 1080×1080',
        purpose: 'Awareness',
        size: '1080×1080',
        copy: 'Forget vitamins? PillMind reminds you on time. Try the demo today.',
        assets: ['/marketing/templates/ig-post-1080.psd', '/marketing/templates/ig-post-1080.png'],
      },
      {
        id: 'ig-story-1080x1920',
        title: 'Instagram Story 1080×1920',
        purpose: 'Traffic → demo',
        size: '1080×1920',
        copy: 'Taking your meds just got easier — Try the demo',
        assets: ['/marketing/templates/ig-story-1080x1920.psd', '/marketing/templates/ig-story-1080x1920.png'],
      },
      {
        id: 'tiktok-15s',
        title: 'TikTok 15s Hook',
        purpose: 'Engagement',
        size: '9:16, 15s',
        script: 'Hook: Missed your meds again? → Show reminder → Log dose → CTA: Try the demo.',
        assets: ['/marketing/templates/tiktok-15s-script.txt'],
      },
      {
        id: 'fb-ad-1200x628',
        title: 'Facebook Ad 1200×628',
        purpose: 'Traffic',
        size: '1200×628',
        copy: 'PillMind reminds you and checks interactions. Try the demo.',
        assets: ['/marketing/templates/fb-ad-1200x628.png'],
      },
      {
        id: 'youtube-intro',
        title: 'YouTube Intro 30–45s',
        purpose: 'Awareness',
        size: '1920×1080 (export)',
        script: 'Problem → Solution → How it works → Safety → CTA.',
        assets: ['/marketing/templates/youtube-intro-script.txt'],
      },
      {
        id: 'flyer-a4',
        title: 'Digital Flyer A4',
        purpose: 'Offline/Online',
        size: 'A4 PDF + 1080×1350',
        copy: 'On‑time reminders • Interaction checks • Clean reports',
        assets: ['/marketing/templates/flyer-a4.pdf'],
      },
      {
        id: 'email-welcome',
        title: 'Email — Welcome #1',
        purpose: 'Activation',
        size: '600–700px width',
        copy: 'Welcome to PillMind — let’s set your first reminder.',
        assets: ['/marketing/templates/email-welcome.html'],
      },
    ],
    [],
  )

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {templates.map((t) => (
        <Card key={t.id}>
          <CardHeader title={t.title} subtitle={`${t.purpose} • ${t.size}`} />
          <CardBody>
            {t.copy && <Code>{t.copy}</Code>}
            {t.script && <Code>{t.script}</Code>}
            <div className="mt-3 flex flex-wrap gap-2">
              {t.assets.map((a) => (
                <a
                  key={a}
                  href={a}
                  className="inline-flex items-center gap-1 rounded-md border border-[#0EA8BC] px-2 py-1 text-sm text-[#0EA8BC] hover:bg-[#E6F7FA]"
                  download
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

/* ------------------------------- Mockups Block ------------------------------ */
function MockupsBlock() {
  const mocks = [
    {
      id: 'ig-post',
      title: 'Instagram Post 1080×1080',
      subtitle: 'Feed • 1080×1080',
      aspect: '1 / 1',
      Component: IgPostUI,
      props: {
        username: 'pillmind',
        headline: 'Forget vitamins?',
        subline: 'PillMind reminds you on time.\nTry the demo today.',
        likes: '2,540',
        time: '2 hours ago',
      },
      downloads: [
        { label: 'PNG', href: '/marketing/mockups/ig-post-1080.png' },
        { label: 'PSD', href: '/marketing/mockups/ig-post-1080.psd' },
      ],
    },
    {
      id: 'ig-story',
      title: 'Instagram Story 1080×1920',
      subtitle: 'Stories • 1080×1920',
      aspect: '9 / 16',
      Component: IgStoryUI,
      props: {
        username: 'pillmind',
        headline: 'Taking your meds just got easier',
        subline: '— Try the demo',
      },
      downloads: [
        { label: 'PNG', href: '/marketing/mockups/ig-story-1080x1920.png' },
        { label: 'PSD', href: '/marketing/mockups/ig-story-1080x1920.psd' },
      ],
    },
    {
      id: 'tiktok',
      title: 'TikTok 15s Hook',
      subtitle: 'For You • 9:16, 15s',
      aspect: '9 / 16',
      Component: TikTokUI,
      props: {
        username: 'pillmind',
        headline: 'Missed your meds again?',
        subline: '→ Reminder → Log dose → CTA: Try the demo.',
        likes: '2.5M',
        comments: '342',
        shares: '13.1K',
        music: 'Original sound — PillMind',
      },
      downloads: [{ label: 'Script (TXT)', href: '/marketing/templates/tiktok-15s-script.txt' }],
    },
    {
      id: 'fb-ad',
      title: 'Facebook Ad 1200×628',
      subtitle: 'Feed • 1200×628',
      aspect: '1200 / 628',
      Component: FacebookAdUI,
      props: {
        pagename: 'PillMind',
        headline: 'On-time reminders',
        subline: 'Interaction checks • Clean reports',
        reactions: '4.2K',
        comments: '268',
        shares: '159',
      },
      downloads: [{ label: 'PNG', href: '/marketing/mockups/fb-ad-1200x628.png' }],
    },
    {
      id: 'flyer-a4',
      title: 'Digital Flyer A4',
      subtitle: 'Offline/Online • A4 PDF + 1080×1350',
      aspect: '3 / 4',
      Component: FlyerA4UI,
      props: {
        bullets: ['On-time reminders', 'Interaction checks', 'Clean reports'],
        footer: 'Scan to try the demo',
      },
      downloads: [
        { label: 'PDF', href: '/marketing/templates/flyer-a4.pdf' },
        { label: 'PNG', href: '/marketing/mockups/flyer-a4-1080x1350.png' },
      ],
    },
    {
      id: 'email',
      title: 'Email — Welcome #1',
      subtitle: 'Activation • 600–700px width',
      aspect: '3 / 2',
      Component: EmailWelcomeUI,
      props: { headline: 'Welcome to PillMind', subline: 'Let’s set your first reminder.' },
      downloads: [
        { label: 'HTML', href: '/marketing/templates/email-welcome.html' },
        { label: 'PNG', href: '/marketing/mockups/email-preview.png' },
      ],
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {mocks.map((m) => (
        <Card key={m.id}>
          <CardHeader title={m.title} subtitle={m.subtitle} />
          <CardBody>
            <MockFrame aspect={m.aspect}>
              <m.Component {...(m.props as any)} />
            </MockFrame>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-[#334155]">Exact mockup</span>
              <div className="flex flex-wrap gap-2">
                {m.downloads.map((d) => (
                  <a
                    key={d.label}
                    href={d.href}
                    download
                    className="inline-flex items-center gap-1 rounded-md border border-[#0EA8BC] px-2 py-1 text-[#0EA8BC] hover:bg-[#E6F7FA]"
                  >
                    <Download className="h-4 w-4" /> {d.label}
                  </a>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function MockFrame({ aspect, children }: { aspect: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-[10px] text-[#64748B]">
        <span className="inline-block h-2 w-2 rounded-full bg-[#EF4444]" />
        <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />
        <span className="inline-block h-2 w-2 rounded-full bg-[#10B981]" />
        <span className="ml-2">Preview</span>
      </div>
      <div className="relative" style={{ aspectRatio: aspect }}>
        {children}
      </div>
    </div>
  )
}

/* --------------------------- Platform UI mockups -------------------------- */
/* Instagram — Feed post */
function IgPostUI({
  username,
  headline,
  subline,
  likes = '0',
  time = '1h',
}: {
  username: string
  headline: string
  subline?: string
  likes?: string
  time?: string
}) {
  return (
    <div className="flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 text-[12px] text-[#111]">
        <div className="flex items-center gap-2">
          <Logo classNameStyles="w-7 h-7" />
          <div className="leading-tight">
            <div className="font-semibold">@{username}</div>
            <div className="text-[10px] text-[#6B7280]">•</div>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-[#111]" />
      </div>

      {/* Media */}
      <div className="relative" style={{ aspectRatio: '1 / 1' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6]" />
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <div className="max-w-[80%] text-white">
            <p className="text-xl font-semibold md:text-2xl">{headline}</p>
            {subline && <p className="mt-2 whitespace-pre-line text-xs md:text-sm opacity-90">{subline}</p>}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[#111]">
            <Heart className="h-6 w-6" />
            <MessageCircleIcon className="h-6 w-6" />
            <Send className="h-6 w-6" />
          </div>
          <Bookmark className="h-6 w-6 text-[#111]" />
        </div>

        {/* Likes */}
        <div className="text-[12px] font-semibold text-[#111]">{likes} likes</div>

        {/* Caption */}
        <div className="text-[12px] leading-snug">
          <span className="font-semibold">@{username}</span> Taking your meds just got easier — reminders & interaction
          checks. #pillmind #routine
        </div>

        {/* Comments & time */}
        <div className="text-[12px] text-[#6B7280]">View all 42 comments</div>
        <div className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">{time}</div>
      </div>
    </div>
  )
}

/* Instagram — Story */
function IgStoryUI({ username, headline, subline }: { username: string; headline: string; subline?: string }) {
  return (
    <div className="absolute inset-0 bg-black">
      {/* Progress bar */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-white/30">
        <div className="h-full w-1/3 bg-white" />
      </div>

      {/* Top row */}
      <div className="absolute z-1 inset-x-0 top-2 flex items-center justify-between px-3 text-white">
        <div className="flex items-center gap-2">
          <Logo classNameStyles="w-7 h-7" />
          <div className="text-[12px] font-semibold">@{username}</div>
        </div>
        <div className="text-[12px]">•</div>
      </div>

      {/* Media */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6]" />
      <div className="absolute inset-0 grid place-items-center px-6 text-center text-white">
        <div className="max-w-[80%]">
          <p className="text-2xl font-semibold md:text-3xl">{headline}</p>
          {subline && <p className="mt-2 text-sm opacity-90">{subline}</p>}
        </div>
      </div>

      {/* Fade top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />
    </div>
  )
}

/* Facebook — Feed ad/post */
function FacebookAdUI({
  pagename,
  headline,
  subline,
  reactions = '0',
  comments = '0',
  shares = '0',
}: {
  pagename: string
  headline: string
  subline?: string
  reactions?: string
  comments?: string
  shares?: string
}) {
  return (
    <div className="flex flex-col bg-[#F0F2F5]">
      <div className="mx-auto h-full w-full max-w-[720px]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3">
          <div className="flex items-center gap-2">
            <Logo classNameStyles="w-9 h-9" />
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-[#1B1B1B]">{pagename}</div>
              <div className="flex items-center gap-2 text-[11px] text-[#65676B]">
                <span>Sponsored</span>
                <span className="h-1 w-1 rounded-full bg-[#BDC1C6]" />
                <span>www.pillmind.app</span>
              </div>
            </div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-[#4B5563]" />
        </div>

        {/* Post text */}
        <div className="px-3 pt-2 text-[14px] text-[#1B1B1B]">
          Taking your meds just got easier — reminders & interaction checks.
        </div>

        {/* Media */}
        <div
          className="mx-3 mt-2 overflow-hidden rounded-md border border-[#E2E8F0]"
          style={{ aspectRatio: '1200 / 628' }}
        >
          <div className="relative h-full w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6]" />
            <div className="absolute inset-0 grid place-items-center px-6 text-center text-white">
              <div className="max-w-[80%]">
                <p className="text-xl font-semibold">{headline}</p>
                {subline && <p className="mt-2 text-sm opacity-90">{subline}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between px-3 py-2 text-[12px] text-[#65676B]">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              <div className="h-4 w-4 rounded-full bg-[#1877F2]" />
              <div className="h-4 w-4 rounded-full bg-[#F02849]" />
              <div className="h-4 w-4 rounded-full bg-[#F7B928]" />
            </div>
            <span className="ml-1">{reactions}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{comments} comments</span>
            <span>{shares} shares</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="mx-3 mb-3 grid grid-cols-3 gap-2 rounded-md border border-[#E5E7EB] bg-white py-1.5 text-[13px] text-[#4B5563]">
          <div className="flex items-center justify-center gap-2 py-1">
            <ThumbsUp className="h-4 w-4" /> Like
          </div>
          <div className="flex items-center justify-center gap-2 py-1">
            <MessageCircleIcon className="h-4 w-4" /> Comment
          </div>
          <div className="flex items-center justify-center gap-2 py-1">
            <Share className="h-4 w-4" /> Share
          </div>
        </div>
      </div>
    </div>
  )
}

/* TikTok — For You */
function TikTokUI({
  username,
  headline,
  subline,
  likes = '0',
  comments = '0',
  shares = '0',
  music = 'Original sound',
}: {
  username: string
  headline: string
  subline?: string
  likes?: string
  comments?: string
  shares?: string
  music?: string
}) {
  return (
    <div className="absolute flex flex-col justify-end inset-0 bg-[#0B0B0B] text-white">
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-4 py-2 text-[12px]">
        <span className="opacity-70">Following</span>
        <span className="font-semibold">|</span>
        <span className="font-semibold">For You</span>
        <div className="absolute right-3">
          <Search className="h-5 w-5 opacity-80" />
        </div>
      </div>

      {/* Phone viewport */}
      <div className="absolute inset-0 grid place-items-top mb-[50px]">
        <div className="relative h-full w-full min-w-[180px] rounded-none border-none border-white/10 bg-black shadow-xl">
          {/* Video */}
          <div className="absolute inset-0 m-0 overflow-hidden rounded-none">
            <div className="absolute inset-0 bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6]" />
            <div className="absolute inset-0 grid place-items-center px-6 text-center">
              <div className="max-w-[80%]">
                <p className="text-xl font-semibold md:text-2xl">{headline}</p>
                {subline && <p className="mt-2 text-xs md:text-sm opacity-90">{subline}</p>}
              </div>
            </div>
          </div>

          {/* Right rail */}
          <div className="absolute right-1 bottom-[-150px] flex -translate-y-1/2 flex-col items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="flex flex-col justify-center items-center h-10 w-10 rounded-full bg-white/80">
                <Logo classNameStyles="w-8 h-8" />
              </div>
              <div className="mt-1 text-[10px] opacity-80">@{username}</div>
            </div>
            <div className="flex flex-col items-center">
              <Heart className="h-7 w-7" />
              <div className="mt-1 text-[11px] opacity-80">{likes}</div>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircleIcon className="h-7 w-7" />
              <div className="mt-1 text-[11px] opacity-80">{comments}</div>
            </div>
            <div className="flex flex-col items-center">
              <Share className="h-7 w-7" />
              <div className="mt-1 text-[11px] opacity-80">{shares}</div>
            </div>
            <div className="mt-2 h-9 w-9 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>

          {/* Caption & music */}
          <div className="absolute bottom-3 left-3 right-3 text-[12px] leading-snug">
            <div className="font-semibold">@{username}</div>
            <div className="opacity-90">
              Taking your meds just got easier — reminders & checks. #pillmind #routine #health
            </div>
            <div className="mt-1 flex items-center gap-1 opacity-90">
              <Music className="h-4 w-4" />
              <span className="truncate">{music}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className=" inset-x-0 bottom-0 flex items-center justify-around px-6 pb-3 pt-2 opacity-80">
        <Home className="h-5 w-5" />
        <Compass className="h-5 w-5" />
        <Plus className="h-7 w-7" />
        <Inbox className="h-5 w-5" />
        <UserIcon className="h-5 w-5" />
      </div>
    </div>
  )
}

function FlyerA4UI({ bullets, footer }: { bullets: string[]; footer?: string }) {
  return (
    <div className="flex flex-col h-full inset-0 bg-white">
      <div className="h-28 w-full bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6]" />
      <div className="px-6">
        <div className="mt-6 space-y-1">
          <div className="flex flex-row items-center gap-2">
            <Logo />
            <h3 className="text-2xl font-bold text-[#0F172A]">PillMind</h3>
          </div>
          <p className="text-sm text-[#334155]">Taking your meds just got easier</p>
        </div>

        <ul className="mt-5 list-disc pl-6 text-sm text-[#334155] space-y-1">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3 px-6 mt-6">
        <div className="h-16 w-16 rounded bg-[#E2E8F0] grid place-items-center text-[10px] text-[#64748B]">QR</div>
        <div className="rounded-md bg-[#0EA8BC] px-3 py-2 text-xs font-semibold text-white">{footer}</div>
      </div>

      <p className=" text-[11px] leading-snug text-[#64748B] p-6">
        PillMind does not provide medical diagnoses and does not replace a doctor’s consultation.
      </p>
    </div>
  )
}

function EmailWelcomeUI({ headline, subline }: { headline: string; subline?: string }) {
  return (
    <div className="flex flex-col place-items-center bg-[#F8FAFC] p-2">
      <div className="w-[90%] max-w-[560px] rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex items-center gap-2">
          <Logo classNameStyles="w-6 h-6" />
          <span className="text-sm font-semibold text-[#0F172A]">PillMind</span>
        </div>

        <h3 className="mt-3 text-lg font-semibold text-[#0F172A]">{headline}</h3>
        <p className="mt-1 text-sm text-[#334155]">{subline}</p>

        <div className="mt-4 inline-flex rounded-[10px] bg-[#0EA8BC] px-4 py-2 text-xs font-semibold text-white">
          Get started
        </div>

        <p className="mt-3 text-[11px] text-[#64748B]">
          PillMind does not provide medical diagnoses and does not replace a doctor’s consultation.
        </p>
      </div>
    </div>
  )
}

function ChecklistsBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader title="Publish Checklist" />
        <CardBody>
          <ul className="list-disc pl-5 text-sm text-[#334155] space-y-1">
            <li>Contrast passes WCAG AA, mobile preview OK.</li>
            <li>Disclaimer visible near any advice.</li>
            <li>Logo/colors/fonts follow brandbook.</li>
            <li>One clear CTA; UTM tags added.</li>
            <li>Correct sizes and file weights.</li>
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="File Naming" />
        <CardBody>
          <Code>
            {`pillmind_[channel]_[format]_[campaign]_[YYYY-MM].ext
pillmind_ig_post_awareness_q4_2025-09.png`}
          </Code>
        </CardBody>
      </Card>
    </div>
  )
}

/* ------------------------------ Downloads -------------------------------- */
function DownloadsBlock() {
  const assets = [
    { name: 'Brandbook (PDF)', href: '/brand/PillMind-Brandbook.pdf' },
    { name: 'Logo Pack (SVG/PNG)', href: '/brand/PillMind-Logos.zip' },
    { name: 'Social Templates (PSD)', href: '/marketing/kits/PillMind-Social-Templates.psd' },
    { name: 'Email Template (HTML)', href: '/marketing/kits/email-welcome.html' },
    { name: 'UTM Guide (PDF)', href: '/marketing/kits/UTM-Guide.pdf' },
  ]
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader title="Downloads" subtitle="Place files under /public/brand and /public/marketing" />
        <CardBody>
          <ul className="space-y-2 text-sm">
            {assets.map((a) => (
              <li
                key={a.name}
                className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-white px-3 py-2"
              >
                <span className="text-[#334155]">{a.name}</span>
                <a
                  className="inline-flex items-center gap-1 rounded-md border border-[#0EA8BC] px-2 py-1 text-[#0EA8BC] hover:bg-[#E6F7FA]"
                  href={a.href}
                  download
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Links" subtitle="Related pages" />
        <CardBody>
          <ul className="space-y-2 text-sm text-[#334155]">
            <li>
              <a className="text-[#0EA8BC] hover:underline" href="/brandbook">
                Brandbook
              </a>
            </li>
            <li>
              <a className="text-[#0EA8BC] hover:underline" href="/">
                Landing
              </a>
            </li>
            <li>
              <a className="text-[#0EA8BC] hover:underline" href="/privacy">
                Privacy summary
              </a>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
