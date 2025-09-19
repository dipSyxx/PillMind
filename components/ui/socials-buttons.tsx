'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Github, Mail, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

type Props = {
  callbackUrl?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function SocialButtons({ callbackUrl = '/', size = 'lg' }: Props) {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null)

  const handle = async (provider: 'google' | 'github') => {
    setLoading(provider)
    // next-auth signIn з callback URL
    await signIn(provider, { callbackUrl })
    setLoading(null)
  }

  const common = { className: 'w-full', disabled: !!loading, size }

  return (
    <div className="space-y-3">
      <Button variant="outline" onClick={() => handle('google')} {...common}>
        {loading === 'google' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Image src="/images/icons8-google.svg" alt="Google" width={16} height={16} className="mr-2" />
        )}
        Continue with Google
      </Button>

      <Button variant="outline" onClick={() => handle('github')} {...common}>
        {loading === 'github' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
        Continue with GitHub
      </Button>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} className="text-center text-xs text-slate-500">
        By continuing you agree to the Terms & Privacy.
      </motion.p>
    </div>
  )
}
