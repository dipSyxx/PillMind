'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  email: string
  name: string
  onSubmitCode: (code: string) => Promise<void>
  onResend: () => Promise<void>
  initialSeconds?: number
}

export default function VerifyCodeModal({
  open,
  onClose,
  email,
  name,
  onSubmitCode,
  onResend,
  initialSeconds = 60,
}: Props) {
  const [code, setCode] = useState('')
  const [seconds, setSeconds] = useState(initialSeconds)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setCode('')
      setError(null)
      setSeconds(initialSeconds)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, initialSeconds])

  useEffect(() => {
    if (!open) return
    if (seconds <= 0) return
    const id = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [open, seconds])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code.')
      return
    }
    setSending(true)
    try {
      await onSubmitCode(code.trim())
    } catch (err: any) {
      setError(err?.message || 'Verification failed')
    } finally {
      setSending(false)
    }
  }

  const handleResend = async () => {
    if (seconds > 0) return
    setError(null)
    try {
      await onResend()
      setSeconds(initialSeconds)
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
      >
        <h3 className="text-xl font-semibold text-slate-900">Verify your email</h3>
        <p className="text-slate-600 mt-1">
          We've sent a 6-digit code to <span className="font-medium">{email}</span>. Enter it to complete registration.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            ref={inputRef as any}
            label="Verification code"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(digits)
              setError(null)
            }}
            required
          />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button type="submit" variant="pillmind" disabled={sending || code.length !== 6}>
              {sending ? 'Verifying…' : 'Verify & Create account'}
            </Button>
            <button
              type="button"
              onClick={handleResend}
              disabled={seconds > 0}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              {seconds > 0 ? `Resend in ${seconds}s` : 'Resend code'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-slate-500">By continuing, you confirm you control this inbox.</div>

        <div className="mt-4 text-right">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  )
}
