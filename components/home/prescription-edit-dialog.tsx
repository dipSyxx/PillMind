'use client'

import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { Prescription } from '@/types/medication'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface CareProvider {
  id: string
  name: string
  email: string | null
  phone: string | null
  clinic: string | null
}

interface PrescriptionEditDialogProps {
  prescription: Prescription
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function PrescriptionEditDialog({ prescription, open, onClose, onSaved }: PrescriptionEditDialogProps) {
  const [saving, setSaving] = useState(false)
  const [careProviders, setCareProviders] = useState<CareProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [formData, setFormData] = useState({
    indication: prescription.indication || '',
    asNeeded: prescription.asNeeded,
    maxDailyDose: prescription.maxDailyDose || undefined,
    instructions: prescription.instructions || '',
    startDate: prescription.startDate ? format(new Date(prescription.startDate), 'yyyy-MM-dd') : '',
    endDate: prescription.endDate ? format(new Date(prescription.endDate), 'yyyy-MM-dd') : '',
    providerId: prescription.providerId || '__none__',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      // Load care providers
      const loadProviders = async () => {
        try {
          const res = await fetch('/api/care-providers', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            setCareProviders(data)
          }
        } catch (e) {
          console.error('Failed to load care providers:', e)
        } finally {
          setLoadingProviders(false)
        }
      }
      void loadProviders()
    }
  }, [open])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required'
    }
    if (formData.asNeeded && (!formData.maxDailyDose || formData.maxDailyDose <= 0)) {
      newErrors.maxDailyDose = 'Max daily dose is required for PRN medications'
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
        indication: formData.indication.trim() || undefined,
        asNeeded: formData.asNeeded,
        instructions: formData.instructions.trim(),
      }
      if (formData.asNeeded && formData.maxDailyDose) {
        payload.maxDailyDose = formData.maxDailyDose
      }
      if (formData.startDate) {
        payload.startDate = new Date(formData.startDate).toISOString()
      }
      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString()
      } else {
        payload.endDate = null
      }
      if (formData.providerId && formData.providerId !== '__none__') {
        payload.providerId = formData.providerId
      } else {
        payload.providerId = null
      }

      const res = await fetch(`/api/prescriptions/${prescription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success('Prescription updated successfully')
        onSaved()
        onClose()
      } else {
        const error = await res.json()
        if (error.details) {
          const validationErrors: Record<string, string> = {}
          error.details.forEach((issue: any) => {
            if (issue.path?.[0]) {
              validationErrors[issue.path[0]] = issue.message
            }
          })
          setErrors(validationErrors)
          toast.error('Please fix the validation errors')
        } else {
          toast.error(error.error || 'Failed to update prescription')
        }
      }
    } catch (e) {
      toast.error('Failed to update prescription')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onClose} direction="bottom">
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Edit Prescription</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* As Needed / PRN */}
          <div className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-xl">
            <div className="flex-1">
              <div className="text-sm font-medium text-[#0F172A]">As needed (PRN)</div>
              <div className="text-xs text-[#64748B] mt-0.5">Enable for non-scheduled, on-demand intake</div>
            </div>
            <Switch
              checked={formData.asNeeded}
              onCheckedChange={(checked) => {
                setFormData({
                  ...formData,
                  asNeeded: checked,
                  maxDailyDose: checked ? formData.maxDailyDose : undefined,
                })
              }}
            />
          </div>

          {/* Indication */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">Indication (optional)</label>
            <Input
              placeholder="e.g., Diabetes"
              value={formData.indication}
              onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">Instructions *</label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA8BC] focus:border-transparent"
              placeholder="e.g., 1 tab twice daily"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            />
            {errors.instructions && <p className="text-xs text-red-500 mt-1">{errors.instructions}</p>}
          </div>

          {/* Max Daily Dose (if PRN) */}
          {formData.asNeeded && (
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">Max per day *</label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="e.g., 6"
                value={formData.maxDailyDose ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, maxDailyDose: e.target.value ? Number(e.target.value) : undefined })
                }
                className={cn(errors.maxDailyDose && 'border-red-500')}
              />
              {errors.maxDailyDose && <p className="text-xs text-red-500 mt-1">{errors.maxDailyDose}</p>}
            </div>
          )}

          {/* Care Provider */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">Care Provider (optional)</label>
            {loadingProviders ? (
              <div className="text-sm text-[#64748B]">Loading providers...</div>
            ) : (
              <Select
                value={formData.providerId}
                onValueChange={(value) => setFormData({ ...formData, providerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a care provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {careProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name} {provider.clinic && `- ${provider.clinic}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Start Date and End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">Start Date</label>
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
        </div>

        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
