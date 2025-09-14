'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Check,
  Copy,
  XCircle,
  Download,
  Palette as PaletteIcon,
  Type as TypeIcon,
  Accessibility as A11yIcon,
  ExternalLink,
  Book,
  MousePointer2,
  ArrowBigLeft,
  Command,
} from 'lucide-react'
import { BrandBookBtn, Logo } from '@/components/shared'

export default function BrandbookPage() {
  return (
    <main className="relative min-h-screen bg-[#F1F5F9] text-[#0F172A]">
      <Header />
      <Hero />
      <AnchorNav />
      <Section id="logo" title="Logo & Usage" icon={<Command className="h-5 w-5" />}>
        <LogoBlock />
      </Section>
      <Section id="colors" title="Color Palette" icon={<PaletteIcon className="h-5 w-5" />}>
        <ColorsBlock />
      </Section>
      <Section id="typography" title="Typography" icon={<TypeIcon className="h-5 w-5" />}>
        <TypographyBlock />
      </Section>
      <Section id="components" title="UI Components (Spec)" icon={<ComponentsIcon />}>
        <ComponentsBlock />
      </Section>
      <Section id="motion" title="Motion" icon={<MotionIcon />}>
        <MotionBlock />
      </Section>
      <Section id="a11y" title="Accessibility" icon={<A11yIcon className="h-5 w-5" />}>
        <A11yBlock />
      </Section>
      <Section id="voice" title="Voice & Copy" icon={<VoiceIcon />}>
        <VoiceBlock />
      </Section>
      <Section id="assets" title="Assets & Downloads" icon={<Download className="h-5 w-5" />}>
        <AssetsBlock />
      </Section>
      <Footer />
      <BrandBookBtn link="/">
        <ArrowBigLeft color="white" className="w-7 h-7" />
      </BrandBookBtn>
    </main>
  )
}

/* --------------------------------- Layout -------------------------------- */
function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">{children}</div>
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#CBD5E1] bg-white/80 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <a href="#top" className="flex items-center gap-2" aria-label="PillMind brandbook">
            <BrandGlyph>
              <Book color="white" className="w-5 h-5" />
            </BrandGlyph>

            <span className="font-semibold text-[#0EA8BC]">PillMind Brandbook</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[#334155]">
            <a className="hover:text-[#0EA8BC]" href="#logo">
              Logo
            </a>
            <a className="hover:text-[#0EA8BC]" href="#colors">
              Colors
            </a>
            <a className="hover:text-[#0EA8BC]" href="#typography">
              Typography
            </a>
            <a className="hover:text-[#0EA8BC]" href="#components">
              Components
            </a>
            <a className="hover:text-[#0EA8BC]" href="#motion">
              Motion
            </a>
            <a className="hover:text-[#0EA8BC]" href="#a11y">
              A11y
            </a>
            <a className="hover:text-[#0EA8BC]" href="#voice">
              Voice
            </a>
            <a className="hover:text-[#0EA8BC]" href="#assets">
              Assets
            </a>
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
              PillMind Brandbook
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mt-3 max-w-xl text-white/90"
            >
              Visual and verbal rules so PillMind looks and sounds consistent across product, web and communications.
            </motion.p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#assets"
                className="rounded-[12px] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] hover:bg-white/90"
              >
                Download assets
              </a>
              <a
                href="#logo"
                className="rounded-[12px] border border-white/70 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Start with logo
              </a>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="justify-self-center"
          >
            <BrandCardPreview />
          </motion.div>
        </div>
      </Container>
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
    </section>
  )
}

function AnchorNav() {
  const items = [
    { href: '#logo', label: 'Logo' },
    { href: '#colors', label: 'Colors' },
    { href: '#typography', label: 'Typography' },
    { href: '#components', label: 'Components' },
    { href: '#motion', label: 'Motion' },
    { href: '#a11y', label: 'A11y' },
    { href: '#voice', label: 'Voice' },
    { href: '#assets', label: 'Assets' },
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
          <span>© PillMind — Brandbook v1.0</span>
          <span>
            Contact:{' '}
            <a className="text-[#0EA8BC] hover:underline" href="mailto:design@pillmind.app">
              design@pillmind.app
            </a>
          </span>
        </div>
      </Container>
    </footer>
  )
}

/* ------------------------------- Logo Block ------------------------------- */
function LogoBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Primary */}
      <Card>
        <CardHeader title="Primary logo" subtitle="Full-color mark + wordmark" />
        <CardBody>
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-2xl font-semibold text-[#0EA8BC]">PillMind</span>
          </div>
        </CardBody>
      </Card>
      {/* Monochrome */}
      <Card>
        <CardHeader title="Monochrome" subtitle="White on dark / Teal on light" />
        <CardBody>
          <div className="flex gap-4">
            <LogoMono variant="light" />
            <LogoMono variant="dark" />
          </div>
        </CardBody>
      </Card>
      {/* Clearspace */}
      <Card>
        <CardHeader
          title="Clearspace & Min size"
          subtitle="Safe area = height of letter ‘P’; min 120px logo, 24px icon"
        />
        <CardBody>
          <ClearspaceDemo />
        </CardBody>
      </Card>

      {/* Do / Don't */}
      <Card className="lg:col-span-2">
        <CardHeader title="Do" subtitle="Use on clear backgrounds, keep aspect ratio, ensure contrast" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <GoodExample label="Correct spacing" />
            <GoodExample label="High contrast" gradient />
            <GoodExample label="Icon for small sizes" iconOnly />
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Don’t" subtitle="No stretching, recoloring, or busy backgrounds" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
            <BadExample label="Stretched" type="stretch" />
            <BadExample label="Low contrast" type="low-contrast" />
            <BadExample label="Recolored" type="recolor" />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function BrandGlyph({ children, className = 'h-8 w-8' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-[10px] bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6] ${className}`}
    >
      {children}
    </div>
  )
}

function LogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="6" fill="#fff" opacity=".9" />
      <path d="M12 6v12" stroke="#fff" strokeWidth="2" />
    </svg>
  )
}

function LogoMono({ variant }: { variant: 'light' | 'dark' }) {
  if (variant === 'dark') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-[#0F172A] px-3 py-2 text-white">
        <Logo />
        <span className="text-xl font-semibold text-[#0EA8BC]">PillMind</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-[#0F172A] border border-[#E2E8F0]">
      <Logo />
      <span className="text-xl font-semibold text-[#0EA8BC]">PillMind</span>
    </div>
  )
}

function ClearspaceDemo() {
  return (
    <div className="rounded-lg border border-dashed border-[#CBD5E1] p-6">
      <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
        <div className="text-xs text-[#64748B]">Safe</div>
        <div className="relative grid place-items-center rounded-lg border border-[#E2E8F0] bg-white p-6">
          <div className="absolute inset-2 rounded border-2 border-dashed border-[#A3E4EC]" />
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-xl font-semibold text-[#0EA8BC]">PillMind</span>
          </div>
        </div>
        <div className="text-xs text-[#64748B]">Area</div>
      </div>
    </div>
  )
}

function GoodExample({ label, gradient, iconOnly }: { label: string; gradient?: boolean; iconOnly?: boolean }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-card">
      <div
        className={`grid place-items-center rounded-md ${gradient ? 'bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6]' : 'bg-white border border-[#E2E8F0]'} h-28`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center gap-2 rounded-[10px] p-1 ${gradient ? 'bg-white/80' : ''}  `}
          >
            <Logo />
            {!iconOnly && (
              <span className={`font-semibold ${gradient ? 'text-[#0EA8BC]' : 'text-[#0EA8BC]'}`}>PillMind</span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-[#16A34A]">
        <Check className="h-4 w-4" /> {label}
      </div>
    </div>
  )
}

function BadExample({ label, type }: { label: string; type: 'stretch' | 'low-contrast' | 'recolor' }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-card">
      <div className="grid place-items-center h-28 rounded-md bg-white border border-[#E2E8F0]">
        {type === 'stretch' && (
          <div className="flex items-center gap-2">
            <Logo classNameStyles="w-20 h-8" />
            <span className="text-xl font-semibold tracking-[0.4em]">PillMind</span>
          </div>
        )}
        {type === 'low-contrast' && (
          <div className="flex items-center gap-2" style={{ filter: 'contrast(60%)' }}>
            <Logo />
            <span className="text-xl font-semibold text-[#94A3B8]">PillMind</span>
          </div>
        )}
        {type === 'recolor' && (
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-semibold" style={{ color: '#F59E0B' }}>
              PillMind
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-[#DC2626]">
        <XCircle className="h-4 w-4" /> {label}
      </div>
    </div>
  )
}

/* ------------------------------ Colors Block ------------------------------ */
function ColorsBlock() {
  const palette: Swatch[] = useMemo(
    () => [
      { group: 'Primary', name: 'Teal 500', hex: '#12B5C9' },
      { group: 'Primary', name: 'Teal 600', hex: '#0EA8BC' },
      { group: 'Accent', name: 'Mint 500', hex: '#2ED3B7' },
      { group: 'Accent', name: 'Mint 600', hex: '#22C3A8' },
      { group: 'Support', name: 'Sky 500', hex: '#3EC7E6' },
      { group: 'Neutrals', name: 'Slate 900', hex: '#0F172A' },
      { group: 'Neutrals', name: 'Slate 700', hex: '#334155' },
      { group: 'Neutrals', name: 'Slate 500', hex: '#64748B' },
      { group: 'Neutrals', name: 'Slate 300', hex: '#CBD5E1' },
      { group: 'Neutrals', name: 'Slate 100', hex: '#F1F5F9' },
      { group: 'Status', name: 'Success', hex: '#10B981' },
      { group: 'Status', name: 'Warning', hex: '#F59E0B' },
      { group: 'Status', name: 'Danger', hex: '#EF4444' },
    ],
    [],
  )

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Palette" subtitle="Click a swatch to copy HEX" />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {palette.map((s) => (
              <ColorSwatch key={s.name} swatch={s} />
            ))}
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Tailwind tokens" subtitle="Add to tailwind.config.ts" />
        <CardBody>
          <Code>
            {`extend: {
  colors: {
    pm: {
      teal: { 500: '#12B5C9', 600: '#0EA8BC' },
      mint: { 500: '#2ED3B7', 600: '#22C3A8' },
      sky:  { 500: '#3EC7E6' },
      slate:{ 900:'#0F172A',700:'#334155',500:'#64748B',300:'#CBD5E1',100:'#F1F5F9' }
    }
  },
  borderRadius: { sm: '12px', md: '16px', lg: '24px' },
  boxShadow: { card: '0 8px 24px rgba(0,0,0,0.08)' }
}`}
          </Code>
        </CardBody>
      </Card>
    </div>
  )
}

type Swatch = { group: string; name: string; hex: string }

function ColorSwatch({ swatch }: { swatch: Swatch }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(swatch.hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }
  const isLight = useMemo(() => {
    const c = swatch.hex.replace('#', '')
    const r = parseInt(c.substring(0, 2), 16),
      g = parseInt(c.substring(2, 4), 16),
      b = parseInt(c.substring(4, 6), 16)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 // 0..1
    return luminance > 0.75 // very light like Slate 100
  }, [swatch.hex])
  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      className="group relative rounded-lg text-left shadow-card transition hover:-translate-y-0.5 h-auto p-0"
    >
      <div className="h-16 rounded-t-lg" style={{ backgroundColor: swatch.hex }} />
      <div className="p-3">
        <p className="text-sm font-medium text-[#0F172A]">{swatch.name}</p>
        <p className="text-xs text-[#64748B]">{swatch.hex}</p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: copied ? 1 : 0, y: copied ? 0 : 4 }}
        className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] ${isLight ? 'bg-[#0F172A] text-white' : 'bg-white/90 text-[#0F172A]'}`}
      >
        <Check className="h-3.5 w-3.5" /> Copied
      </motion.div>
      <div className="absolute right-2 bottom-2 opacity-60 transition group-hover:opacity-100">
        <Copy className="h-4 w-4" />
      </div>
    </Button>
  )
}

/* ---------------------------- Typography Block --------------------------- */
function TypographyBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Fonts" subtitle="Headings: Poppins • Body/UI: Inter" />
        <CardBody>
          <p className="text-sm text-[#64748B]">
            Load via <code>next/font</code> or Google Fonts. Use 600–700 for headings, 400–600 for body.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-[#0EA8BC]">Heading</div>
              <h1 className="text-4xl font-bold leading-tight">Taking your meds just got easier</h1>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[#0EA8BC]">Body</div>
              <p className="text-[#334155]">
                PillMind reminds you to take meds, analyzes your data, and suggests safe combinations. With your consent
                — and for you only.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-[#334155]">
              <SpecRow label="H1" value="40/48" />
              <SpecRow label="H2" value="32/40" />
              <SpecRow label="H3" value="24/32" />
              <SpecRow label="Body" value="16/24" />
              <SpecRow label="Caption" value="12/16" />
            </div>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Link & emphasis" subtitle="Clear, accessible and descriptive" />
        <CardBody>
          <p className="text-[#334155]">
            Use concise, plain language. Avoid medical jargon. Example link:{' '}
            <a className="text-[#0EA8BC] underline decoration-2 underline-offset-2 hover:text-[#0B95A8]" href="#">
              privacy policy
            </a>
            .
          </p>
          <p className="mt-3 text-sm text-[#64748B]">
            Always include the disclaimer where advice appears:{' '}
            <em>“PillMind does not provide medical diagnoses and does not replace a doctor’s consultation.”</em>
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-white px-3 py-2">
      <span className="font-medium">{label}</span>
      <span className="text-[#64748B]">{value}</span>
    </div>
  )
}

/* --------------------------- Components (Spec) --------------------------- */
function ComponentsBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader title="Buttons" subtitle="Primary • Secondary • Ghost" />
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <Button variant="pillmind" size="md">
              Get started
            </Button>
            <Button variant="pillmindOutline" size="md">
              Learn more
            </Button>
            <Button variant="pillmindGhost" size="md">
              Ghost
            </Button>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Inputs" subtitle="Height ≥44px, radius 12, clear focus" />
        <CardBody>
          <label className="mb-2 block text-sm font-medium text-[#0F172A]">Email</label>
          <input
            placeholder="you@pillmind.app"
            className="h-11 w-full rounded-[12px] border border-[#CBD5E1] bg-white px-4 text-[#0F172A] outline-none transition focus:border-[#0EA8BC] focus:ring-4 focus:ring-[#12B5C9]/20"
          />
          <p className="mt-2 text-xs text-[#64748B]">Help text goes here. Keep it short and specific.</p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Cards" subtitle="Soft shadow, generous padding" />
        <CardBody>
          <div className="rounded-[16px] border border-[#E2E8F0] bg-white p-4 shadow-card">
            <div className="text-sm font-semibold text-[#0F172A]">Adherence</div>
            <div className="mt-2 h-24 rounded-md bg-gradient-to-r from-[#12B5C9]/20 via-[#2ED3B7]/20 to-[#3EC7E6]/20" />
            <div className="mt-2 text-xs text-[#64748B]">
              7‑day avg: <strong className="text-[#0EA8BC]">84%</strong>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

/* -------------------------------- Motion -------------------------------- */
function MotionBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Guidelines" subtitle="200–600ms, easeInOut, subtle stagger" />
        <CardBody>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#334155]">
            <li>Use fade/slide for entrances; avoid aggressive scale.</li>
            <li>Stagger list items by 60–120ms.</li>
            <li>Respect reduced motion preferences.</li>
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Live examples" subtitle="Hover and entrance demos" />
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="rounded-[12px] border border-[#E2E8F0] bg-white p-4 shadow-card"
            >
              Fade & slide in
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              className="rounded-[12px] border border-[#0EA8BC] bg-white p-4 font-semibold text-[#0EA8BC] shadow-card"
            >
              Hover grow
            </motion.button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

/* --------------------------------- A11y --------------------------------- */
function A11yBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="WCAG AA" subtitle="Contrast, focus, target size" />
        <CardBody>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#334155]">
            <li>Contrast: body text ≥ 4.5:1; large headings ≥ 3:1.</li>
            <li>Minimum touch target: 44×44 px. Visible focus rings.</li>
            <li>
              All images and icons require descriptive <code>alt</code> / <code>aria-label</code>.
            </li>
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Do & Don’t" subtitle="Make it usable for everyone" />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-md border border-[#E2E8F0] bg-white p-3 text-sm">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7]">
                <Check className="h-3 w-3 text-[#16A34A]" />
              </span>{' '}
              Use clear labels and sufficient spacing
            </div>
            <div className="rounded-md border border-[#E2E8F0] bg-white p-3 text-sm">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FEE2E2]">
                <XCircle className="h-3 w-3 text-[#DC2626]" />
              </span>{' '}
              Don’t rely on color alone to convey meaning
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

/* ----------------------------- Voice & Copy ------------------------------ */
function VoiceBlock() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Tone" subtitle="Calm, supportive, plain" />
        <CardBody>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#334155]">
            <li>Use everyday language; avoid medical jargon.</li>
            <li>Prefer conditional phrasing: “You could…” over imperatives.</li>
            <li>Always include the disclaimer near advice.</li>
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Examples" subtitle="Good vs. better" />
        <CardBody>
          <ExamplePair good="Take magnesium now." better="If it suits your schedule, you could take magnesium now." />
          <ExamplePair good="Missed a dose." better="Looks like a missed dose — want a gentle reminder later today?" />
        </CardBody>
      </Card>
    </div>
  )
}

function ExamplePair({ good, better }: { good: string; better: string }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2">
      <div className="rounded-md border border-[#E2E8F0] bg-white p-3 text-sm">
        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FEF9C3]">
          <span className="text-[#A16207] font-semibold">G</span>
        </span>
        {good}
      </div>
      <div className="rounded-md border border-[#0EA8BC] bg-[#E6F7FA] p-3 text-sm">
        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#0EA8BC] font-semibold">
          B
        </span>
        {better}
      </div>
    </div>
  )
}

/* ------------------------------ Assets Block ----------------------------- */
function AssetsBlock() {
  const assets = [
    { name: 'Logo — full color (SVG)', href: '/brand/pillmind-logo.svg' },
    {
      name: 'Logo — monochrome (SVG)',
      href: '/brand/pillmind-logo-mono.svg',
    },
    { name: 'Icon (PNG 512)', href: '/brand/pillmind-icon-512.png' },
    { name: 'OG image (PNG)', href: '/brand/og-pm.png' },
    { name: 'Favicon pack', href: '/brand/favicon.zip' },
    {
      name: 'One‑Page Design Profile (PDF)',
      href: '/brand/PillMind-Design-Profile.pdf',
    },
  ]
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Downloads" subtitle="Place files under /public/brand" />
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
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Contact & Rights" subtitle="Use under PillMind brand guidelines" />
        <CardBody>
          <p className="text-sm text-[#334155]">
            For questions, variations, or large‑format artwork, email{' '}
            <a className="text-[#0EA8BC] hover:underline" href="mailto:design@pillmind.app">
              design@pillmind.app
            </a>
            . Do not recolor or alter the marks without written approval.
          </p>
          <a className="mt-3 inline-flex items-center gap-1 text-sm text-[#0EA8BC] hover:underline" href="#logo">
            <ExternalLink className="h-4 w-4" /> See logo rules
          </a>
        </CardBody>
      </Card>
    </div>
  )
}

/* --------------------------------- Cards -------------------------------- */
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

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="whitespace-pre-wrap rounded-[12px] border border-[#E2E8F0] bg-[#0F172A] p-3 text-xs text-[#E2E8F0] break-words">
      <code>{children}</code>
    </pre>
  )
}

/* ---------------------------- Decorative Icons --------------------------- */
function ComponentsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="2" fill="#fff" />
      <rect x="14" y="3" width="7" height="7" rx="2" fill="#fff" opacity=".7" />
      <rect x="3" y="14" width="18" height="7" rx="2" fill="#fff" opacity=".5" />
    </svg>
  )
}
function MotionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="3" fill="#fff" />
      <circle cx="12" cy="12" r="3" fill="#fff" opacity=".7" />
      <circle cx="18" cy="12" r="3" fill="#fff" opacity=".4" />
    </svg>
  )
}
function VoiceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 7h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 17h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ---------------------------- Hero preview card -------------------------- */
function BrandCardPreview() {
  return (
    <div className="w-full max-w-[420px] rounded-[20px] border border-white/40 bg-white/10 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
      <div className="rounded-[16px] border border-white/40 bg-white/10 p-4">
        <div className="flex items-center gap-3">
          <BrandGlyph>
            <MousePointer2 color="white" className="w-5 h-5" />
          </BrandGlyph>

          <div>
            <p className="text-sm font-semibold">Primary button</p>
            <p className="text-xs text-white/80">Radius 12 • Teal 600</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="pillmindWhite" size="sm">
            Get started
          </Button>
          <Button variant="pillmindWhiteOutline" size="sm">
            Learn more
          </Button>
        </div>
        <div className="mt-4 h-20 rounded-md bg-gradient-to-r from-white/20 via-white/10 to-white/20" />
      </div>
    </div>
  )
}
