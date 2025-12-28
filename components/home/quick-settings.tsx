'use client'

import React, { useState } from 'react'
import { Settings, Globe, Clock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { UserSettings, TimeFormat } from '@/types/medication'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface QuickSettingsProps {
  settings: UserSettings | null
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>
}

export function QuickSettings({ settings, onUpdate }: QuickSettingsProps) {
  const [timezone, setTimezone] = useState(settings?.timezone || 'UTC')
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(settings?.timeFormat || 'H24')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate({ timezone, timeFormat })
    } catch (error) {
      console.error('Failed to update settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges =
    timezone !== (settings?.timezone || 'UTC') || timeFormat !== (settings?.timeFormat || 'H24')

  // Common timezones
  const commonTimezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Kyiv', label: 'Kyiv (EET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
  ]

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-[#0EA8BC]" />
        <h3 className="font-semibold text-[#0F172A]">Quick Settings</h3>
      </div>

      <div className="space-y-3">
        {/* Timezone */}
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Timezone
          </label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {commonTimezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Format */}
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Time Format
          </label>
          <Select value={timeFormat} onValueChange={(value) => setTimeFormat(value as TimeFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="H24">24-hour (14:30)</SelectItem>
              <SelectItem value="H12">12-hour (2:30 PM)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <Button
          variant="pillmind"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      )}
    </div>
  )
}

