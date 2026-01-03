'use client'

import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTimezonesWithCurrent } from '@/lib/timezones'
import { TimeFormat, UserSettings } from '@/types/medication'
import { Clock, Globe, Save, Settings } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface QuickSettingsProps {
  settings: UserSettings | null
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>
}

export function QuickSettings({ settings, onUpdate }: QuickSettingsProps) {
  const [timezone, setTimezone] = useState(settings?.timezone || 'UTC')
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(settings?.timeFormat || 'H24')
  const [isSaving, setIsSaving] = useState(false)

  // Update state when settings change
  useEffect(() => {
    if (settings?.timezone) {
      setTimezone(settings.timezone)
    }
    if (settings?.timeFormat) {
      setTimeFormat(settings.timeFormat)
    }
  }, [settings])

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

  const hasChanges = timezone !== (settings?.timezone || 'UTC') || timeFormat !== (settings?.timeFormat || 'H24')

  // Get timezones list with current timezone included if needed
  const timezones = React.useMemo(() => {
    const currentTz = settings?.timezone || timezone
    return getTimezonesWithCurrent(currentTz)
  }, [settings?.timezone, timezone])

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
              {timezones.map((tz) => (
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
        <Button variant="pillmind" size="sm" onClick={handleSave} disabled={isSaving} className="w-full">
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
