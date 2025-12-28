'use client'

import React from 'react'
import { ExternalLink, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileSummary } from './profile-summary'
import { QuickSettings } from './quick-settings'
import { ProfileStats } from './profile-stats'
import { useUserData, useUserActions } from '@/hooks/useUserStore'
import { useRouter } from 'next/navigation'
import { UserSettings } from '@/types/medication'

interface ProfileTabProps {
  timezone: string
  timeFormat: 'H12' | 'H24'
}

export function ProfileTab({ timezone, timeFormat }: ProfileTabProps) {
  const router = useRouter()
  const { profile, settings, medications, prescriptions, isLoading } = useUserData()
  const { updateSettings, initialize } = useUserActions()

  const handleUpdateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const response = await fetch('/api/profile/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const updated = await response.json()
        updateSettings(updated)
        // Refresh data
        await initialize()
      } else {
        throw new Error('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0EA8BC] mx-auto mb-2"></div>
          <p className="text-sm text-[#64748B]">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] pb-[88px]">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-bold text-[#0F172A]">Profile</h1>
      </div>

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* Profile Summary */}
        <ProfileSummary profile={profile} />

        {/* Quick Settings */}
        <QuickSettings settings={settings} onUpdate={handleUpdateSettings} />

        {/* Statistics */}
        <ProfileStats medications={medications} prescriptions={prescriptions} />

        {/* Full Profile Link */}
        <Button
          variant="pillmindOutline"
          size="md"
          className="w-full"
          onClick={() => router.push('/profile')}
        >
          Open Full Profile
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

