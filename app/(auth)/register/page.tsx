'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordStrength } from '@/components/ui/password-strength'
import {
  registerSchema,
  calculatePasswordStrength,
  nameSchema,
  emailSchema,
  passwordSchema,
  confirmPasswordSchema,
} from '@/lib/validation'
import { cn } from '@/lib/utils'
import SocialButtons from '@/components/ui/socials-buttons'
import VerifyCodeModal from '@/components/shared/verify-code-modal'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Modal state
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    if (error) setError(null)
  }

  const validateField = (field: string, value: string) => {
    try {
      const fieldSchemas = {
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema,
      }
      const fieldSchema = fieldSchemas[field as keyof typeof fieldSchemas]
      if (fieldSchema) fieldSchema.parse(value)
      return ''
    } catch (error: any) {
      return error.errors[0]?.message || 'Invalid input'
    }
  }

  const handleBlur = (field: string) => {
    const value = formData[field as keyof typeof formData]
    const error = validateField(field, value)
    setFieldErrors((prev) => ({ ...prev, [field]: error }))
  }

  // Step 1: form validation + code submission + modal opening
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // 1) Form validation
    try {
      registerSchema.parse(formData)
    } catch (error: any) {
      const errors: Record<string, string> = {}
      error?.errors?.forEach((err: any) => {
        if (err.path?.[0]) errors[err.path[0]] = err.message
      })
      setFieldErrors(errors)
      setError('Please fix the errors below and try again.')
      return
    }

    // 2) Sending the code
    setSendingCode(true)
    try {
      const resp = await fetch('/api/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.name }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data?.error || 'Failed to send verification code')
      }
      // 3) Open a pop-up to enter the code
      setCodeModalOpen(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code')
    } finally {
      setSendingCode(false)
    }
  }

  // Step 2: user enters code → final registration
  const completeRegistration = async (code: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          code,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Registration failed. Please try again.')
      }
      setCodeModalOpen(false)
      router.push('/login?message=Registration successful! Please sign in.')
    } catch (err: any) {
      // The error is shown in the modal via throw
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    const resp = await fetch('/api/verify/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email, name: formData.name }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data?.error || 'Failed to resend verification code')
  }

  const passwordStrength = calculatePasswordStrength(formData.password)
  const isFormValid =
    Object.values(fieldErrors).every((e) => !e) &&
    formData.name &&
    formData.email &&
    formData.password &&
    formData.confirmPassword

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0EA8BC]/10 rounded-[16px] mb-4">
              <User className="w-8 h-8 text-[#0EA8BC]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Create your account</h1>
            <p className="text-[#64748B]">Join PillMind and start managing your medications</p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <Input
              label="Full Name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              error={fieldErrors.name}
              leftIcon={<User className="w-4 h-4" />}
              helperText="Use your real name for better experience"
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              error={fieldErrors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="We'll use this to send you important updates"
            />

            <div className="space-y-2">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                error={fieldErrors.password}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              {formData.password && <PasswordStrength password={formData.password} />}
            </div>

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              error={fieldErrors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="space-y-2">
              <p className="text-sm font-medium text-[#334155]">Password must contain:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { text: 'At least 8 characters', check: formData.password.length >= 8 },
                  { text: 'One lowercase letter', check: /[a-z]/.test(formData.password) },
                  { text: 'One uppercase letter', check: /[A-Z]/.test(formData.password) },
                  { text: 'One number', check: /\d/.test(formData.password) },
                  { text: 'One special character', check: /[@$!%*?&]/.test(formData.password) },
                  {
                    text: 'Passwords match',
                    check: formData.password === formData.confirmPassword && formData.confirmPassword,
                  },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {req.check ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-[#CBD5E1]" />
                    )}
                    <span className={cn('text-[#64748B]', req.check && 'text-green-600')}>{req.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-[12px]"
              >
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              variant="pillmind"
              size="lg"
              disabled={sendingCode || !isFormValid}
              className="w-full"
            >
              {sendingCode ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending code…
                </div>
              ) : (
                'Create account'
              )}
            </Button>
          </motion.form>

          <div className="flex items-center my-6">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="px-3 text-xs uppercase tracking-widest text-slate-400">or</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <SocialButtons callbackUrl="/" />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-[#64748B]">
              Already have an account?{' '}
              <a href="/login" className="text-[#0EA8BC] hover:text-[#0B95A8] font-medium transition-colors">
                Sign in
              </a>
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* POPUP */}
      <VerifyCodeModal
        open={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        email={formData.email}
        name={formData.name}
        onSubmitCode={completeRegistration}
        onResend={resendCode}
        initialSeconds={60}
      />
    </div>
  )
}
