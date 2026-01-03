'use client'

import { Container } from '@/components/shared/container'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { PasswordStrength } from '@/components/ui/password-strength'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTimezonesWithCurrent } from '@/lib/timezones'
import { cn } from '@/lib/utils'
import {
  changePasswordSchema,
  confirmNewPasswordSchema,
  currentPasswordSchema,
  newPasswordSchema,
} from '@/lib/validation'
import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Key,
  Lock,
  LogOut,
  Mail,
  Pill,
  Save,
  SettingsIcon,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type TimeFormat = 'H12' | 'H24'
type Channel = 'PUSH' | 'EMAIL' | 'SMS'

type UserSettings = {
  userId: string
  timezone: string
  timeFormat: TimeFormat
  defaultChannels: Channel[]
}

type UserPublic = {
  id: string
  name: string | null
  email: string | null
  emailVerified: string | null
  image: string | null
  createdAt: string
  updatedAt: string
  hasPassword: boolean
}

interface UserProfile extends Omit<UserPublic, 'emailVerified'> {
  emailVerified: string | null
}

interface AccountInfo {
  userId: string | null
  providers: string[]
  hasPassword: boolean
}

type TabId = 'profile' | 'security' | 'accounts' | 'settings' | 'danger'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  // Data state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)

  // First render loader only
  const [userLoading, setUserLoading] = useState(true)
  const [accountsLoading, setAccountsLoading] = useState(true)

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // === UserSettings state ===
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)

  // ---------- Guards ----------
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      void fetchUser()
      void fetchAccountInfo()
      void fetchSettings()
    }
  }, [status])

  useEffect(() => {
    if (activeTab === 'settings' && !settings && !settingsLoading) {
      void fetchSettings()
    }
  }, [activeTab, settings, settingsLoading])

  // ---------- Fetchers ----------
  const fetchUser = async () => {
    setUserLoading(true)
    try {
      const res = await fetch('/api/profile/user', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load user')
      const data: UserPublic = await res.json()
      setProfile({
        id: data.id,
        name: data.name,
        email: data.email,
        image: data.image,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        emailVerified: data.emailVerified,
        hasPassword: data.hasPassword,
      })
    } catch (e) {
      console.error(e)
      setError('Unable to load your profile. Please refresh the page.')
    } finally {
      setUserLoading(false)
    }
  }

  const fetchAccountInfo = async () => {
    setAccountsLoading(true)
    try {
      const res = await fetch('/api/profile/accounts', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load accounts')
      const data: AccountInfo = await res.json()
      setAccountInfo(data)
    } catch (e) {
      console.error(e)
      setError('Unable to load connected accounts.')
    } finally {
      setAccountsLoading(false)
    }
  }

  const fetchSettings = async () => {
    setSettingsLoading(true)
    setSettingsError(null)
    try {
      const res = await fetch('/api/profile/settings', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load settings')
      const data: UserSettings = await res.json()
      setSettings(data)
    } catch {
      setSettingsError('Unable to load settings.')
    } finally {
      setSettingsLoading(false)
    }
  }

  // ---------- Derived UI (badges, security, health) ----------
  const isVerified = !!profile?.emailVerified
  const verifiedBadge = isVerified ? 'Verified' : 'Unverified'

  // Score rules: 0..100
  // +40 — you have a password; +20 — email confirmed; +20 — ≥1 OAuth provider;
  // +20 — ≥2 OAuth providers (additional bonus for a backup login method).
  const providersCount = accountInfo?.providers?.length ?? 0
  const securityScore = useMemo(() => {
    if (!profile) return 0
    let s = 0
    if (profile.hasPassword) s += 40
    if (isVerified) s += 20
    if (providersCount >= 1) s += 20
    if (providersCount >= 2) s += 20
    return s
  }, [profile, isVerified, providersCount])

  const securityLevel = securityScore >= 80 ? 'High' : securityScore >= 50 ? 'Medium' : 'Low'

  const securityColor =
    securityLevel === 'High'
      ? 'text-green-700 bg-green-100'
      : securityLevel === 'Medium'
        ? 'text-amber-700 bg-amber-100'
        : 'text-red-700 bg-red-100'

  const healthBar = Math.max(10, securityScore) // so that there is no 0% empty

  const suggestions: string[] = useMemo(() => {
    const tips: string[] = []
    if (!profile?.hasPassword) tips.push('Set a login password to avoid losing access if a provider fails.')
    if (!isVerified) tips.push('Verify your email to enable recovery and notifications.')
    if (providersCount === 0) tips.push('Link at least one OAuth provider (Google / GitHub) as a backup method.')
    if (providersCount === 1) tips.push('Add a second provider for redundancy (optional, but recommended).')
    return tips
  }, [profile?.hasPassword, isVerified, providersCount])

  // ---------- Handlers ----------
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const validatedData = changePasswordSchema.parse(passwordData)
      const res = await fetch('/api/profile/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: validatedData.currentPassword,
          newPassword: validatedData.newPassword,
        }),
      })
      if (res.ok) {
        setSuccess('Password changed successfully!')
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
        setPasswordErrors({})
        // After changing your password, we will update your profile. (hasPassword=true)
        void fetchUser()
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to change password')
      }
    } catch (err: any) {
      if (err?.errors) {
        const errors: Record<string, string> = {}
        err.errors.forEach((e: any) => {
          if (e.path?.[0]) errors[e.path[0]] = e.message
        })
        setPasswordErrors(errors)
        setError('Please fix the errors below and try again.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkAccount = async (provider: string) => {
    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) return
    try {
      const res = await fetch('/api/profile/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      if (res.ok) {
        setSuccess(`${provider} account unlinked successfully!`)
        void fetchAccountInfo()
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to unlink account')
      }
    } catch {
      setError('Failed to unlink account')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type "DELETE" to confirm account deletion')
      return
    }
    if (!confirm('This action cannot be undone. Are you sure you want to delete your account?')) return
    try {
      const res = await fetch('/api/profile/delete', { method: 'POST' })
      if (res.ok) {
        await signOut({ callbackUrl: '/' })
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to delete account')
      }
    } catch {
      setError('Failed to delete account')
    }
  }

  const validateField = (field: keyof typeof passwordData, value: string) => {
    try {
      const schemaMap = {
        currentPassword: currentPasswordSchema,
        newPassword: newPasswordSchema,
        confirmNewPassword: confirmNewPasswordSchema,
      }
      schemaMap[field].parse(value)
      return ''
    } catch (e: any) {
      return e?.errors?.[0]?.message || 'Invalid input'
    }
  }

  const onPwdChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData((p) => ({ ...p, [field]: value }))
    if (passwordErrors[field]) setPasswordErrors((er) => ({ ...er, [field]: '' }))
  }

  const onPwdBlur = (field: keyof typeof passwordData) => {
    const msg = validateField(field, passwordData[field])
    setPasswordErrors((er) => ({ ...er, [field]: msg }))
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setSettingsError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/profile/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone: settings.timezone,
          timeFormat: settings.timeFormat,
          defaultChannels: settings.defaultChannels,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to update settings')
      }
      const updated = await res.json()
      setSettings(updated)
      setSuccess('Settings updated! All schedules synchronized with new timezone.')
    } catch (e: any) {
      setSettingsError(e?.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const applyBrowserTimezone = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone // MDN: resolvedOptions().timeZone
      if (!tz) throw new Error('Timezone not available')
      setSettings((s) => (s ? { ...s, timezone: tz } : s))
    } catch {
      alert('Unable to detect your timezone in this browser.')
    }
  }

  // ---------- Global first-render loader ----------
  if (status === 'loading' || (userLoading && !profile)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-[#12B5C9]/30 border-t-[#12B5C9] rounded-full animate-spin" />
          <p className="text-[#64748B] font-medium">Loading your profile…</p>
        </motion.div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-[16px] mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Access Denied</h1>
          <p className="text-[#64748B]">Please sign in to view your profile.</p>
        </motion.div>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'accounts', label: 'Accounts', icon: ExternalLink },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ]

  const ChannelToggle = ({ value }: { value: Channel }) => {
    const checked = settings?.defaultChannels.includes(value) ?? false
    const label = value === 'EMAIL' ? 'Email' : value === 'PUSH' ? 'Push' : 'SMS'
    const id = `channel-${value.toLowerCase()}`

    return (
      <label
        htmlFor={id}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition select-none',
          checked ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/50',
        )}
      >
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(on) => {
            const isOn = !!on
            setSettings((s) => {
              if (!s) return s
              const set = new Set(s.defaultChannels)
              isOn ? set.add(value) : set.delete(value)
              return { ...s, defaultChannels: Array.from(set) as Channel[] }
            })
          }}
          // за потреби: disabled={loading}
        />
        <span className="text-sm text-foreground">{label}</span>
      </label>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]">
      <Container>
        <div className="py-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-row justify-between mb-6"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-[#64748B] hover:text-[#0F172A]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/home')}
              className="text-[#64748B] hover:text-[#0F172A]"
            >
              Go to App
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6] p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#12B5C9]/90 to-[#3EC7E6]/90" />
              <div className="relative z-10">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profile?.image ? (
                      <div className="w-20 h-20 rounded-[20px] overflow-hidden border-4 border-white/30 shadow-lg">
                        <img src={profile.image} alt={profile.name || 'User'} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#0EA8BC] to-[#12B5C9] flex items-center justify-center border-4 border-white/30 shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold">{profile?.name || 'Welcome back!'}</h1>
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full border backdrop-blur',
                          isVerified
                            ? 'bg-white/20 border-white/30'
                            : 'bg-yellow-400/20 border-white/30 text-yellow-100',
                        )}
                      >
                        {verifiedBadge}
                      </span>
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full border backdrop-blur',
                          'bg-white/20 border-white/30',
                        )}
                      >
                        Security: {securityLevel}
                      </span>
                      {!!providersCount && (
                        <span className="text-xs px-2 py-1 rounded-full border bg-white/20 border-white/30">
                          Providers: {providersCount}
                        </span>
                      )}
                    </div>
                    <p className="text-white/90 text-lg">
                      {profile?.email || 'Manage your PillMind account and preferences'}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 text-white/80">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm">Active</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Pill className="w-4 h-4" />
                        <span className="text-sm">PillMind User</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5 blur-xl" />
            </div>

            {/* Tabs */}
            <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] overflow-x-auto">
              <nav className="flex min-w-max sm:min-w-0">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all duration-200 relative whitespace-nowrap flex-shrink-0',
                      activeTab === tab.id
                        ? 'text-[#0EA8BC] bg-white border-b-2 border-[#0EA8BC]'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/50',
                    )}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden min-[375px]:inline">{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white rounded-t-[8px] -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-8">
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-[12px]"
                >
                  <Check className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-green-600">{success}</p>
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-[12px]"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* PROFILE */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Welcome */}
                  <div className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-[16px] p-6 border border-[#E2E8F0]">
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-[#0EA8BC]" />
                      <div>
                        <h2 className="text-xl font-bold text-[#0F172A]">
                          Welcome back, {profile?.name?.split(' ')[0] || 'User'}!
                        </h2>
                        <p className="text-[#64748B]">Here’s your account overview and settings</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0EA8BC]/10 rounded-[8px] flex items-center justify-center">
                          <User className="w-4 h-4 text-[#0EA8BC]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#0F172A]">Personal Information</h3>
                      </div>

                      <div className="space-y-4">
                        {/* Avatar */}
                        <div className="group p-4 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-[#0EA8BC]/30 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {profile?.image ? (
                                <div className="w-12 h-12 rounded-[12px] overflow-hidden border-2 border-[#0EA8BC]/20 shadow-sm">
                                  <img
                                    src={profile.image}
                                    alt={profile.name || 'User'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-[#0EA8BC] to-[#12B5C9] flex items-center justify-center border-2 border-[#0EA8BC]/20 shadow-sm">
                                  <span className="text-lg font-bold text-white">
                                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-[#64748B]">Profile Picture</p>
                              <p className="font-medium text-[#0F172A]">
                                {profile?.image ? 'Custom avatar' : 'Default avatar with initials'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Name */}
                        <div className="group p-4 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-[#0EA8BC]/30 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-[#0EA8BC]" />
                            <div className="flex-1">
                              <p className="text-sm text-[#64748B]">Full Name</p>
                              <p className="font-medium text-[#0F172A]">{profile?.name || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="group p-4 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-[#0EA8BC]/30 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-[#0EA8BC]" />
                            <div className="flex-1">
                              <p className="text-sm text-[#64748B]">Email Address</p>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-[#0F172A]">{profile?.email || 'Not provided'}</p>
                                <span
                                  className={cn(
                                    'text-[11px] px-2 py-0.5 rounded-full',
                                    isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
                                  )}
                                >
                                  {isVerified ? 'Verified' : 'Unverified'}
                                </span>
                              </div>
                              {!isVerified && (
                                <p className="text-xs text-amber-700 mt-1">
                                  Verify your email to improve account recovery.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white border border-[#E2E8F0] rounded-[12px]">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-[#0EA8BC]" />
                              <div className="flex-1">
                                <p className="text-sm text-[#64748B]">Member Since</p>
                                <p className="font-medium text-[#0F172A]">
                                  {profile?.createdAt ? format(parseISO(profile.createdAt), 'PPP') : 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-white border border-[#E2E8F0] rounded-[12px]">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-[#0EA8BC]" />
                              <div className="flex-1">
                                <p className="text-sm text-[#64748B]">Last Updated</p>
                                <p className="font-medium text-[#0F172A]">
                                  {profile?.updatedAt ? format(parseISO(profile.updatedAt), 'PPpp') : 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Account Status */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0EA8BC]/10 rounded-[8px] flex items-center justify-center">
                          <Shield className="w-4 h-4 text-[#0EA8BC]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#0F172A]">Account Status</h3>
                      </div>

                      <div className="space-y-4">
                        {/* Active */}
                        <div className="p-4 bg-green-50 border border-green-200 rounded-[12px]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-[8px] flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Account Active</p>
                                <p className="text-sm text-green-600">Your account is in good standing</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              OK
                            </span>
                          </div>
                        </div>

                        {/* Security level */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-[12px]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-[8px] flex items-center justify-center">
                                <Lock className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-blue-800">Security Level</p>
                                <p className="text-sm text-blue-600">
                                  Calculated from password, providers & email status
                                </p>
                              </div>
                            </div>
                            <span className={cn('px-2 py-1 text-xs font-medium rounded-full', securityColor)}>
                              {securityLevel}
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${healthBar}%` }} />
                            </div>
                          </div>
                          {!!suggestions.length && (
                            <ul className="mt-3 list-disc pl-5 text-xs text-blue-800 space-y-1">
                              {suggestions.map((s) => (
                                <li key={s}>{s}</li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* PillMind */}
                        <div className="p-4 bg-[#0EA8BC]/5 border border-[#0EA8BC]/20 rounded-[12px]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#0EA8BC]/10 rounded-[8px] flex items-center justify-center">
                              <Pill className="w-4 h-4 text-[#0EA8BC]" />
                            </div>
                            <div>
                              <p className="font-medium text-[#0F172A]">PillMind Features</p>
                              <p className="text-sm text-[#64748B]">Full access to all features</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* SECURITY */}
              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-[16px] p-6 border border-[#E2E8F0]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#0EA8BC]/10 rounded-[12px] flex items-center justify-center">
                        <Shield className="w-6 h-6 text-[#0EA8BC]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[#0F172A]">Security Settings</h2>
                        <p className="text-[#64748B]">Keep your account secure with strong passwords</p>
                      </div>
                    </div>
                  </div>

                  <div className="max-w-full">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0EA8BC]/10 rounded-[8px] flex items-center justify-center">
                          <Key className="w-4 h-4 text-[#0EA8BC]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#0F172A]">Change Password</h3>
                      </div>

                      <form onSubmit={handlePasswordChange} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input
                            label="Current Password"
                            type={showPasswords.current ? 'text' : 'password'}
                            placeholder="Enter current password"
                            value={passwordData.currentPassword}
                            onChange={(e) => onPwdChange('currentPassword', e.target.value)}
                            onBlur={() => onPwdBlur('currentPassword')}
                            error={passwordErrors.currentPassword}
                            leftIcon={<Key className="w-4 h-4" />}
                            rightIcon={
                              <button
                                type="button"
                                onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}
                                className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                              >
                                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            }
                          />

                          <div className="space-y-2">
                            <Input
                              label="New Password"
                              type={showPasswords.new ? 'text' : 'password'}
                              placeholder="Enter new password"
                              value={passwordData.newPassword}
                              onChange={(e) => onPwdChange('newPassword', e.target.value)}
                              onBlur={() => onPwdBlur('newPassword')}
                              error={passwordErrors.newPassword}
                              leftIcon={<Key className="w-4 h-4" />}
                              rightIcon={
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}
                                  className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                                >
                                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              }
                            />
                            {passwordData.newPassword && <PasswordStrength password={passwordData.newPassword} />}
                          </div>
                        </div>

                        <Input
                          label="Confirm New Password"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          value={passwordData.confirmNewPassword}
                          onChange={(e) => onPwdChange('confirmNewPassword', e.target.value)}
                          onBlur={() => onPwdBlur('confirmNewPassword')}
                          error={passwordErrors.confirmNewPassword}
                          leftIcon={<Key className="w-4 h-4" />}
                          rightIcon={
                            <button
                              type="button"
                              onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}
                              className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                            >
                              {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                        />

                        <div className="flex justify-end">
                          <Button type="submit" variant="pillmind" size="lg" disabled={loading}>
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Changing password...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Change Password
                              </div>
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ACCOUNTS */}
              {activeTab === 'accounts' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-[16px] p-6 border border-[#E2E8F0]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#0EA8BC]/10 rounded-[12px] flex items-center justify-center">
                          <ExternalLink className="w-6 h-6 text-[#0EA8BC]" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-[#0F172A]">Connected Accounts</h2>
                          <p className="text-[#64748B]">Manage your sign-in methods and linked accounts</p>
                        </div>
                      </div>
                      <div className="text-sm text-[#0F172A]">
                        Providers linked: <span className="font-semibold">{providersCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Connect buttons (visible only if not connected) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {!accountInfo?.providers.includes('google') && (
                      <Button
                        variant="outline"
                        onClick={() => signIn('google', { callbackUrl: '/profile?linked=google' })}
                        className="justify-center"
                      >
                        {/* простий SVG-лого, або заміни на власний компонент іконки */}
                        <svg width="18" height="18" viewBox="0 0 533.5 544.3" className="mr-2" aria-hidden>
                          <path
                            fill="#4285F4"
                            d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.3H272v95.2h146.9c-6.3 34.1-25.3 63-54 82.4v68h87.3c51.1-47 81.3-116.2 81.3-195.3z"
                          />
                          <path
                            fill="#34A853"
                            d="M272 544.3c73.1 0 134.3-24.1 179.1-65.5l-87.3-68c-24.2 16.4-55 26-91.8 26-70.6 0-130.4-47.7-151.8-111.8H29.9v70.2c44.6 88.3 136.2 148.9 242.1 148.9z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M120.2 325c-10.9-32.6-10.9-67.5 0-100.1V154.7H29.9c-21.7 43.4-34.1 92.5-34.1 144.9s12.4 101.5 34.1 144.9l90.3-70.2z"
                          />
                          <path
                            fill="#EA4335"
                            d="M272 107.7c39.8-.6 77.9 14 106.9 40.9l80-80C410.9 25.5 345.1.7 272 1 166.1 1 74.5 61.7 29.9 150l90.3 70.2C141.6 155.9 201.4 108.2 272 107.7z"
                          />
                        </svg>
                        Connect Google
                      </Button>
                    )}

                    {!accountInfo?.providers.includes('github') && (
                      <Button
                        variant="outline"
                        onClick={() => signIn('github', { callbackUrl: '/profile?linked=github' })}
                        className="justify-center"
                      >
                        {/* простий GitHub-лого */}
                        <svg width="18" height="18" viewBox="0 0 16 16" className="mr-2" aria-hidden>
                          <path
                            fill="currentColor"
                            d="M8 0C3.58 0 0 3.68 0 8.22c0 3.63 2.29 6.71 5.47 7.79c.4.08.55-.18.55-.39c0-.19-.01-.82-.01-1.49c-2.01.37-2.53-.5-2.69-.96c-.09-.24-.48-.96-.82-1.15c-.28-.15-.68-.52-.01-.53c.63-.01 1.08.6 1.23.85c.72 1.21 1.87.87 2.33.66c.07-.54.28-.87.51-1.07c-1.78-.2-3.64-.93-3.64-4.15c0-.92.32-1.67.84-2.26c-.08-.2-.36-1.01.08-2.1c0 0 .67-.22 2.2.86c.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.09 2.2-.86 2.2-.86c.44 1.09.16 1.9.08 2.1c.52.59.84 1.34.84 2.26c0 3.23-1.87 3.95-3.65 4.15c.29.26.54.77.54 1.55c0 1.12-.01 2.02-.01 2.29c0 .21.15.47.55.39A8.04 8.04 0 0 0 16 8.22C16 3.68 12.42 0 8 0z"
                          />
                        </svg>
                        Connect GitHub
                      </Button>
                    )}
                  </div>

                  {/* Existing linked methods */}
                  <div className="space-y-4">
                    {accountInfo?.hasPassword && (
                      <div className="group p-4 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-[#0EA8BC]/30 hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0EA8BC]/10 rounded-[8px] flex items-center justify-center">
                              <Key className="w-5 h-5 text-[#0EA8BC]" />
                            </div>
                            <div>
                              <p className="font-medium text-[#0F172A]">Email & Password</p>
                              <p className="text-sm text-[#64748B]">Sign in with email and password</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Active
                          </span>
                        </div>
                      </div>
                    )}

                    {accountInfo?.providers.map((provider) => {
                      const onlyOneMethodLeft = !accountInfo.hasPassword && (accountInfo.providers?.length ?? 0) <= 1
                      return (
                        <div
                          key={provider}
                          className="group p-4 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-[#0EA8BC]/30 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#0EA8BC]/10 rounded-[8px] flex items-center justify-center">
                                <ExternalLink className="w-5 h-5 text-[#0EA8BC]" />
                              </div>
                              <div>
                                <p className="font-medium text-[#0F172A] capitalize">{provider}</p>
                                <p className="text-sm text-[#64748B]">Sign in with {provider}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Connected
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnlinkAccount(provider)}
                                disabled={onlyOneMethodLeft}
                                title={onlyOneMethodLeft ? 'You must keep at least one sign-in method' : 'Unlink'}
                                className={onlyOneMethodLeft ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                Unlink
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {accountInfo && !accountInfo.hasPassword && accountInfo.providers.length === 0 && (
                      <div className="text-center py-12 text-[#64748B]">
                        <div className="w-16 h-16 bg-[#CBD5E1]/20 rounded-[16px] flex items-center justify-center mx-auto mb-4">
                          <ExternalLink className="w-8 h-8 text-[#CBD5E1]" />
                        </div>
                        <p className="font-medium">No connected accounts yet</p>
                        <p className="text-sm">Use the buttons above to connect Google or GitHub</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* === NEW TAB: SETTINGS === */}
              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-[16px] p-4 sm:p-6 border border-[#E2E8F0]">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0EA8BC]/10 rounded-[12px] flex items-center justify-center flex-shrink-0">
                        <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0EA8BC]" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">User Settings</h2>
                        <p className="text-sm sm:text-base text-[#64748B]">
                          Timezone, time format, and default notification channels
                        </p>
                      </div>
                    </div>
                  </div>

                  {settingsLoading ? (
                    <div className="flex items-center gap-3 text-[#64748B]">
                      <div className="w-5 h-5 border-2 border-[#12B5C9]/30 border-t-[#12B5C9] rounded-full animate-spin" />
                      Loading settings…
                    </div>
                  ) : settingsError ? (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[12px]">
                      {settingsError}
                    </div>
                  ) : settings ? (
                    <form onSubmit={saveSettings} className="space-y-6">
                      {/* Timezone */}
                      <div className="p-4 sm:p-6 bg-white border border-[#E2E8F0] rounded-[12px]">
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">Timezone (IANA)</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Select
                            value={settings.timezone}
                            onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                          >
                            <SelectTrigger className="flex-1 w-full sm:w-auto">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              {getTimezonesWithCurrent(settings.timezone).map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={applyBrowserTimezone}
                            className="whitespace-nowrap w-full sm:w-auto"
                          >
                            Use my timezone
                          </Button>
                        </div>
                        <p className="mt-1 text-xs text-[#64748B]">
                          Your timezone is used for scheduling doses and displaying times
                        </p>
                      </div>

                      {/* Time format */}
                      <div className="p-4 sm:p-6 bg-white border border-[#E2E8F0] rounded-[12px]">
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">Time format</label>

                        <RadioGroup
                          className="flex flex-col sm:flex-row flex-wrap gap-3"
                          value={settings.timeFormat}
                          onValueChange={(v) => setSettings({ ...settings, timeFormat: v as TimeFormat })}
                        >
                          {/* 24-hour */}
                          <label
                            htmlFor="tf-24"
                            className={cn(
                              'inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition w-full sm:w-auto',
                              settings.timeFormat === 'H24'
                                ? 'border-[#0EA8BC] bg-[#0EA8BC]/5'
                                : 'border-slate-200 hover:bg-slate-50',
                            )}
                          >
                            <RadioGroupItem id="tf-24" value="H24" />
                            <span className="text-sm text-[#0F172A]">24-hour (e.g., 15:00)</span>
                          </label>

                          {/* 12-hour */}
                          <label
                            htmlFor="tf-12"
                            className={cn(
                              'inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition w-full sm:w-auto',
                              settings.timeFormat === 'H12'
                                ? 'border-[#0EA8BC] bg-[#0EA8BC]/5'
                                : 'border-slate-200 hover:bg-slate-50',
                            )}
                          >
                            <RadioGroupItem id="tf-12" value="H12" />
                            <span className="text-sm text-[#0F172A]">12-hour (e.g., 3:00 PM)</span>
                          </label>
                        </RadioGroup>
                      </div>

                      {/* Default channels */}
                      <div className="p-4 sm:p-6 bg-white border border-[#E2E8F0] rounded-[12px]">
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Default notification channels
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <ChannelToggle value="EMAIL" />
                          <ChannelToggle value="PUSH" />
                          <ChannelToggle value="SMS" />
                        </div>
                        <p className="mt-1 text-xs text-[#64748B]">
                          Used as fallback for reminders unless overridden per prescription.
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" variant="pillmind" disabled={loading} className="w-full sm:w-auto">
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving…
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Save className="w-4 h-4" />
                              Save Settings
                            </div>
                          )}
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </motion.div>
              )}

              {/* DANGER */}
              {activeTab === 'danger' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-[16px] p-6 border border-red-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-[12px] flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-red-800">Danger Zone</h2>
                        <p className="text-red-600">Irreversible actions that affect your account</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Sign Out */}
                    <div className="p-6 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-red-200 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-[8px] flex items-center justify-center">
                          <LogOut className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-[#0F172A] mb-1">Sign Out</h4>
                          <p className="text-sm text-[#64748B] mb-3">
                            Sign out of your account on this device. You can sign back in anytime.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="border-orange-200 text-orange-600 hover:bg-orange-50"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Account */}
                    <div className="p-6 bg-red-50 border border-red-200 rounded-[12px]">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-[8px] flex items-center justify-center">
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-red-800 mb-1">Delete Account</h4>
                          <p className="text-sm text-red-600 mb-4">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>

                          {!showDeleteConfirm ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(true)}
                              className="text-white bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Account
                            </Button>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-4"
                            >
                              <div className="p-4 bg-white border border-red-300 rounded-[8px]">
                                <p className="text-sm font-medium text-red-800 mb-2">⚠️ Final Confirmation Required</p>
                                <p className="text-sm text-red-600 mb-3">
                                  This will permanently delete your account, all your data, and cannot be recovered.
                                </p>
                                <Input
                                  label="Type 'DELETE' to confirm"
                                  placeholder="DELETE"
                                  value={deleteConfirm}
                                  onChange={(e) => setDeleteConfirm(e.target.value)}
                                  className="max-w-xs"
                                />
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={handleDeleteAccount}
                                  disabled={deleteConfirm !== 'DELETE'}
                                  className="text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Confirm Delete
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setDeleteConfirm('')
                                  }}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  )
}
