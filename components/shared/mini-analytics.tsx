import { motion } from 'framer-motion'

export function MiniAnalytics({ delay = 0 }: { delay?: number }) {
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
