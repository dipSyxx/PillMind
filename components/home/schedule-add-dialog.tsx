'use client'

import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WEEKDAYS, weekdayLabelShort } from '@/lib/medication-utils'
import { cn } from '@/lib/utils'
import { TimeFormat, Unit, Weekday } from '@/types/medication'
import { format, parseISO } from 'date-fns'
import { Clock, Loader2, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

const UNIT_OPTIONS: Unit[] = ['MG', 'MCG', 'G', 'ML', 'IU', 'TAB', 'CAPS', 'DROP', 'PUFF', 'UNIT']

interface ScheduleAddDialogProps {
  prescriptionId: string
  open: boolean
  onClose: () => void
  onSaved: () => void
  timezone: string
  timeFormat: TimeFormat
}

export function ScheduleAddDialog({
  prescriptionId,
  open,
  onClose,
  onSaved,
  timezone,
  timeFormat,
}: ScheduleAddDialogProps) {
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [formData, setFormData] = useState({
    daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as Weekday[],
    times: [] as string[],
    doseQuantity: 1,
    doseUnit: 'TAB' as Unit,
    startDate: '',
    endDate: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newHour, setNewHour] = useState<string>('08')
  const [newMinute, setNewMinute] = useState<string>('00')
  const [newPeriod, setNewPeriod] = useState<'AM' | 'PM'>('AM')

  const hourOptions = useMemo(() => {
    if (timeFormat === 'H24') {
      return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
    } else {
      return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
    }
  }, [timeFormat])

  const minuteOptions = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
  }, [])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (formData.daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'Select at least one weekday'
    }
    if (formData.times.length === 0) {
      newErrors.times = 'Add at least one time'
    }
    if (!formData.doseQuantity || formData.doseQuantity <= 0) {
      newErrors.doseQuantity = 'Dose quantity must be greater than 0'
    }
    if (!formData.doseUnit) {
      newErrors.doseUnit = 'Dose unit is required'
    }
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (end < start) {
        newErrors.endDate = 'End date must be after start date'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before saving')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        timezone,
        daysOfWeek: formData.daysOfWeek,
        times: formData.times,
        doseQuantity: typeof formData.doseQuantity === 'number' ? formData.doseQuantity : parseFloat(String(formData.doseQuantity)) || 1,
        doseUnit: formData.doseUnit,
      }
      if (formData.startDate) {
        payload.startDate = new Date(formData.startDate).toISOString()
      }
      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString()
      }

      const res = await fetch(`/api/prescriptions/${prescriptionId}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        const doseGen = data.doseGeneration
        if (doseGen) {
          if (doseGen.generated > 0) {
            toast.success(
              `Schedule created successfully. Generated ${doseGen.generated} doses${doseGen.skipped > 0 ? `, skipped ${doseGen.skipped} duplicates` : ''}.`
            )
          } else if (doseGen.errors && doseGen.errors.length > 0) {
            toast.warning(
              `Schedule created, but dose generation had issues: ${doseGen.errors.join(', ')}`
            )
          } else {
            toast.success('Schedule created successfully. Doses have been generated automatically.')
          }
        } else {
          toast.success('Schedule created successfully.')
        }
        onSaved()
        onClose()
        // Reset form
        setFormData({
          daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          times: [],
          doseQuantity: 1,
          doseUnit: 'TAB',
          startDate: '',
          endDate: '',
        })
      } else {
        const error = await res.json()

        // Handle schedule conflict (409)
        if (res.status === 409 && error.code === 'SCHEDULE_CONFLICT') {
          const conflictDetails = error.conflicts
            ?.map((c: any) => {
              const days = c.conflictingDays?.join(', ') || 'N/A'
              const times = c.conflictingTimes?.join(', ') || 'N/A'
              return `Days: ${days}, Times: ${times}`
            })
            .join('; ') || 'Unknown conflict'

          toast.error(`Schedule conflicts with existing schedule(s). ${conflictDetails}`)
        } else if (error.code === 'TIMEZONE_MISMATCH') {
          toast.error(error.error || 'Schedule timezone must match user timezone')
        } else {
          toast.error(error.error || 'Failed to create schedule')
        }
      }
    } catch (e) {
      toast.error('Failed to create schedule')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateDoses = async () => {
    setRegenerating(true)
    try {
      // Generate doses for the next 4 weeks
      const now = new Date()
      const fourWeeksLater = new Date(now)
      fourWeeksLater.setDate(fourWeeksLater.getDate() + 28)

      const res = await fetch('/api/dose/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId,
          from: now.toISOString(),
          to: fourWeeksLater.toISOString(),
          timezone,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        toast.success(`Regenerated ${result.generatedDoses?.length || 0} doses`)
        onSaved()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to regenerate doses')
      }
    } catch (e) {
      toast.error('Failed to regenerate doses')
    } finally {
      setRegenerating(false)
    }
  }

  const addTime = () => {
    let hours24 = Number(newHour)
    if (timeFormat === 'H12') {
      if (newPeriod === 'PM' && hours24 !== 12) hours24 += 12
      if (newPeriod === 'AM' && hours24 === 12) hours24 = 0
    }

    const time24h = `${String(hours24).padStart(2, '0')}:${newMinute}`

    if (formData.times.includes(time24h)) {
      toast.error('This time is already added')
      return
    }

    const updated = [...formData.times, time24h].sort((a, b) => {
      const [h1, m1] = a.split(':').map(Number)
      const [h2, m2] = b.split(':').map(Number)
      return h1 * 60 + m1 - (h2 * 60 + m2)
    })
    setFormData({ ...formData, times: updated })

    // Reset
    setNewHour('08')
    setNewMinute('00')
    setNewPeriod('AM')
  }

  const removeTime = (time: string) => {
    setFormData({ ...formData, times: formData.times.filter((t) => t !== time) })
  }

  const toggleDay = (day: Weekday) => {
    const set = new Set(formData.daysOfWeek)
    if (set.has(day)) {
      set.delete(day)
    } else {
      set.add(day)
    }
    setFormData({ ...formData, daysOfWeek: Array.from(set) as Weekday[] })
  }

  const formatTimeForDisplay = (time24h: string): string => {
    const [hours, minutes] = time24h.split(':').map(Number)
    if (timeFormat === 'H12') {
      const period = hours >= 12 ? 'PM' : 'AM'
      const hours12 = hours % 12 || 12
      return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`
    }
    return time24h
  }

  const sortedTimes = useMemo(() => {
    return [...formData.times].sort((a, b) => {
      const [h1, m1] = a.split(':').map(Number)
      const [h2, m2] = b.split(':').map(Number)
      return h1 * 60 + m1 - (h2 * 60 + m2)
    })
  }, [formData.times])

  return (
    <Drawer open={open} onOpenChange={onClose} direction="bottom">
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Add Schedule</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">Days of Week *</label>
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((day) => {
                const selected = formData.daysOfWeek.includes(day)
                return (
                  <label
                    key={day}
                    className={cn(
                      'text-xs px-2 py-2 rounded-lg border cursor-pointer text-center',
                      selected
                        ? 'bg-[#0EA8BC]/10 border-[#0EA8BC] text-[#0F172A]'
                        : 'border-[#E2E8F0] text-[#64748B]',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selected}
                      onChange={() => toggleDay(day)}
                    />
                    {weekdayLabelShort[day]}
                  </label>
                )
              })}
            </div>
            {errors.daysOfWeek && <p className="text-xs text-red-500 mt-1">{errors.daysOfWeek}</p>}
          </div>

          {/* Times */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Times ({timeFormat === 'H12' ? '12-hour' : '24-hour'}) *
            </label>
            <div className="space-y-2">
              {sortedTimes.map((time) => (
                <div
                  key={time}
                  className="flex items-center justify-between p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#64748B]" />
                    <span className="text-sm font-medium text-[#0F172A]">{formatTimeForDisplay(time)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTime(time)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={newHour} onValueChange={setNewHour}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newMinute} onValueChange={setNewMinute}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minuteOptions.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {timeFormat === 'H12' && (
                    <Select value={newPeriod} onValueChange={(v) => setNewPeriod(v as 'AM' | 'PM')}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button type="button" variant="outline" onClick={addTime} className="flex-shrink-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
            {errors.times && <p className="text-xs text-red-500 mt-1">{errors.times}</p>}
          </div>

          {/* Dose Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">Dose Quantity *</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.doseQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, doseQuantity: parseFloat(e.target.value) || 0 })
                }
                className={cn(errors.doseQuantity && 'border-red-500')}
              />
              {errors.doseQuantity && <p className="text-xs text-red-500 mt-1">{errors.doseQuantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">Dose Unit *</label>
              <Select
                value={formData.doseUnit}
                onValueChange={(value) => setFormData({ ...formData, doseUnit: value as Unit })}
              >
                <SelectTrigger className={cn(errors.doseUnit && 'border-red-500')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.doseUnit && <p className="text-xs text-red-500 mt-1">{errors.doseUnit}</p>}
            </div>
          </div>

          {/* Start Date and End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">Start Date (optional)</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">End Date (optional)</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={cn(errors.endDate && 'border-red-500')}
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div className="text-xs text-[#64748B]">
            <p>Timezone: {timezone}</p>
          </div>

          {/* Info about automatic dose generation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-medium mb-1">Note:</p>
            <p>Doses will be automatically generated for the next 4 weeks when you create this schedule.</p>
          </div>
        </div>

        <DrawerFooter className="flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} disabled={saving || regenerating} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || regenerating} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Schedule'
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleRegenerateDoses}
            disabled={saving || regenerating}
            className="w-full"
          >
            {regenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              'Regenerate Doses (Next 4 Weeks)'
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
