'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Key,
  Trash2,
  ExternalLink,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  LogOut,
  Settings,
  UserCheck,
  Lock,
  AlertCircle,
  ArrowLeft,
  Pill,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordStrength } from '@/components/ui/password-strength'
import { Container } from '@/components/shared/container'
import {
  changePasswordSchema,
  calculatePasswordStrength,
  currentPasswordSchema,
  newPasswordSchema,
  confirmNewPasswordSchema,
} from '@/lib/validation'
import { cn } from '@/lib/utils'

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

// Заміни твій UserProfile інтерфейс на:
interface UserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: string
  updatedAt: string
  emailVerified: string | null
  hasPassword: boolean
}

interface AccountInfo {
  userId: string | null
  providers: string[]
  hasPassword: boolean
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'accounts' | 'danger'>('profile')

  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)

  const [userLoading, setUserLoading] = useState(true)
  const [accountsLoading, setAccountsLoading] = useState(true)
  const isFetchingEnd = !userLoading || !accountsLoading

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

  // Account deletion
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      void Promise.all([fetchUser(), fetchAccountInfo()])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const fetchUser = async () => {
    setUserLoading(true)
    try {
      const res = await fetch('/api/profile/user', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('Failed to load user')
      }
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
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAccountInfo(data)
    } catch (error) {
      console.error('Failed to fetch account info:', error)
      setError('Unable to load connected accounts.')
    } finally {
      setAccountsLoading(false)
    }
  }

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
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to change password')
      }
    } catch (error: any) {
      if (error.errors) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path[0]) {
            errors[err.path[0]] = err.message
          }
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
        fetchAccountInfo()
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to unlink account')
      }
    } catch (error) {
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
    } catch (error) {
      setError('Failed to delete account')
    }
  }

  const validatePasswordField = (field: string, value: string) => {
    try {
      const fieldSchemas = {
        currentPassword: currentPasswordSchema,
        newPassword: newPasswordSchema,
        confirmNewPassword: confirmNewPasswordSchema,
      }

      const fieldSchema = fieldSchemas[field as keyof typeof fieldSchemas]
      if (fieldSchema) {
        fieldSchema.parse(value)
      }
      return ''
    } catch (error: any) {
      return error.errors[0]?.message || 'Invalid input'
    }
  }

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handlePasswordBlur = (field: string) => {
    const value = passwordData[field as keyof typeof passwordData]
    const error = validatePasswordField(field, value)
    setPasswordErrors((prev) => ({ ...prev, [field]: error }))
  }

  if (isFetchingEnd) {
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

  if (status === 'unauthenticated') {
    return null
  }

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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'accounts', label: 'Accounts', icon: ExternalLink },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]">
      <Container>
        <div className="py-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
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
                  {/* User Avatar */}
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
                    {/* Online Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-1">{profile?.name || 'Welcome back!'}</h1>
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
            <div className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <nav className="flex">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 relative',
                      activeTab === tab.id
                        ? 'text-[#0EA8BC] bg-white border-b-2 border-[#0EA8BC]'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/50',
                    )}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
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
              {/* Success/Error Messages */}
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

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Welcome Section */}
                  <div className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-[16px] p-6 border border-[#E2E8F0]">
                    <div className="flex items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-[#0F172A]">
                          Welcome back, {profile?.name?.split(' ')[0] || 'User'}!
                        </h2>
                        <p className="text-[#64748B]">Here's your account overview and settings</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal Information */}
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
                        {/* Profile Picture Card */}
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
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-[#64748B]">Profile Picture</p>
                              <p className="font-medium text-[#0F172A]">
                                {profile?.image ? 'Custom avatar' : 'Default avatar with initials'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="group p-4 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-[#0EA8BC]/30 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-[#0EA8BC]" />
                            <div className="flex-1">
                              <p className="text-sm text-[#64748B]">Full Name</p>
                              <p className="font-medium text-[#0F172A]">{profile?.name || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="group p-4 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-[#0EA8BC]/30 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-[#0EA8BC]" />
                            <div className="flex-1">
                              <p className="text-sm text-[#64748B]">Email Address</p>
                              <p className="font-medium text-[#0F172A]">{profile?.email || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="group p-4 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-[#0EA8BC]/30 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-[#0EA8BC]" />
                            <div className="flex-1">
                              <p className="text-sm text-[#64748B]">Member Since</p>
                              <p className="font-medium text-[#0F172A]">
                                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                              </p>
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
                        <div className="p-4 bg-green-50 border border-green-200 rounded-[12px]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-[8px] flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Account Active</p>
                                <p className="text-sm text-green-600">Your account is verified and active</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Verified
                            </span>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-[12px]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-[8px] flex items-center justify-center">
                                <Lock className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-blue-800">Security Level</p>
                                <p className="text-sm text-blue-600">High security enabled</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              High
                            </span>
                          </div>
                        </div>

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

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Security Header */}
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
                            onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                            onBlur={() => handlePasswordBlur('currentPassword')}
                            error={passwordErrors.currentPassword}
                            leftIcon={<Key className="w-4 h-4" />}
                            rightIcon={
                              <button
                                type="button"
                                onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
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
                              onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                              onBlur={() => handlePasswordBlur('newPassword')}
                              error={passwordErrors.newPassword}
                              leftIcon={<Key className="w-4 h-4" />}
                              rightIcon={
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
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
                          onChange={(e) => handlePasswordInputChange('confirmNewPassword', e.target.value)}
                          onBlur={() => handlePasswordBlur('confirmNewPassword')}
                          error={passwordErrors.confirmNewPassword}
                          leftIcon={<Key className="w-4 h-4" />}
                          rightIcon={
                            <button
                              type="button"
                              onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
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

              {/* Accounts Tab */}
              {activeTab === 'accounts' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Accounts Header */}
                  <div className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-[16px] p-6 border border-[#E2E8F0]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#0EA8BC]/10 rounded-[12px] flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-[#0EA8BC]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[#0F172A]">Connected Accounts</h2>
                        <p className="text-[#64748B]">Manage your sign-in methods and linked accounts</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0EA8BC]/10 rounded-[8px] flex items-center justify-center">
                        <Settings className="w-4 h-4 text-[#0EA8BC]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#0F172A]">Sign-in Methods</h3>
                    </div>

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
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Active
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {accountInfo?.providers.map((provider) => (
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
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Unlink
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {!accountInfo?.hasPassword && accountInfo?.providers.length === 0 && (
                        <div className="text-center py-12 text-[#64748B]">
                          <div className="w-16 h-16 bg-[#CBD5E1]/20 rounded-[16px] flex items-center justify-center mx-auto mb-4">
                            <ExternalLink className="w-8 h-8 text-[#CBD5E1]" />
                          </div>
                          <p className="font-medium">No connected accounts found</p>
                          <p className="text-sm">Connect an account to get started</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Danger Zone Header */}
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
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-[8px] flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#0F172A]">Account Actions</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Sign Out */}
                      <div className="p-6 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-red-200 transition-colors">
                        <div className="flex items-start justify-between">
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
                      </div>

                      {/* Delete Account */}
                      <div className="p-6 bg-red-50 border border-red-200 rounded-[12px]">
                        <div className="flex items-start justify-between">
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
                                    <p className="text-sm font-medium text-red-800 mb-2">
                                      ⚠️ Final Confirmation Required
                                    </p>
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
                                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-300"
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
