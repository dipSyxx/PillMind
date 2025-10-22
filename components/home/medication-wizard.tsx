'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { DraftMedication, MedForm, RouteKind, Unit, Weekday, TimeFormat } from '@/types/medication'
import { WEEKDAYS, weekdayLabelShort } from '@/lib/medication-utils'
import { format } from 'date-fns'

const FORM_OPTIONS: MedForm[] = ['TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'INHALER', 'TOPICAL', 'DROPS', 'OTHER']
const ROUTE_OPTIONS: RouteKind[] = [
  'ORAL',
  'SUBLINGUAL',
  'INHALATION',
  'TOPICAL',
  'INJECTION',
  'OPHTHALMIC',
  'NASAL',
  'RECTAL',
  'OTHER',
]
const UNIT_OPTIONS: Unit[] = ['MG', 'MCG', 'G', 'ML', 'IU', 'TAB', 'CAPS', 'DROP', 'PUFF', 'UNIT']

interface MedicationWizardProps {
  mode: 'create' | 'edit'
  initial?: Partial<DraftMedication>
  onSaved: (draft: DraftMedication) => void
  onClose: () => void
  timezone: string
  timeFormat: TimeFormat
}

type WizardStep = 1 | 2 | 3 | 4

export function MedicationWizard({ mode, initial, onSaved, onClose, timezone, timeFormat }: MedicationWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<DraftMedication>({
    name: initial?.name ?? '',
    brandName: initial?.brandName ?? '',
    form: initial?.form ?? 'TABLET',
    strengthValue: initial?.strengthValue,
    strengthUnit: initial?.strengthUnit ?? 'MG',
    route: initial?.route ?? 'ORAL',
    notes: initial?.notes ?? '',
    asNeeded: initial?.asNeeded ?? false,
    indication: initial?.indication ?? '',
    instructions: initial?.instructions ?? '',
    maxDailyDose: initial?.maxDailyDose,
    doseQuantity: initial?.doseQuantity ?? 1,
    doseUnit: initial?.doseUnit ?? 'TAB',
    daysOfWeek: initial?.daysOfWeek ?? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    times: initial?.times ?? ['08:00', '20:00'],
    inventoryCurrentQty: initial?.inventoryCurrentQty ?? 30,
    inventoryUnit: initial?.inventoryUnit ?? initial?.doseUnit ?? 'TAB',
    inventoryLowThreshold: initial?.inventoryLowThreshold ?? 10,
    inventoryLastRestockedAt: initial?.inventoryLastRestockedAt,
  })
  const [touchedSteps, setTouchedSteps] = useState<WizardStep[]>([])

  const restockedDateInputValue =
    draft.inventoryLastRestockedAt && !Number.isNaN(new Date(draft.inventoryLastRestockedAt).getTime())
      ? format(new Date(draft.inventoryLastRestockedAt), 'yyyy-MM-dd')
      : ''
  const effectiveDoseQuantity = draft.doseQuantity && draft.doseQuantity > 0 ? draft.doseQuantity : null
  const estimatedDosesRemaining =
    draft.inventoryCurrentQty != null && effectiveDoseQuantity
      ? Math.max(0, Math.floor(draft.inventoryCurrentQty / effectiveDoseQuantity))
      : null

  function update<K extends keyof DraftMedication>(k: K, v: DraftMedication[K]) {
    setDraft((d) => ({ ...d, [k]: v }))
  }

  const errorsByStep = useMemo<Record<WizardStep, string[]>>(
    () => ({
      1: getStepErrors(1, draft),
      2: getStepErrors(2, draft),
      3: getStepErrors(3, draft),
      4: getStepErrors(4, draft),
    }),
    [draft],
  )

  const markStepTouched = (targetStep: WizardStep) => {
    setTouchedSteps((prev) => (prev.includes(targetStep) ? prev : [...prev, targetStep]))
  }

  const handleNext = (current: WizardStep, next: WizardStep) => {
    if (errorsByStep[current].length > 0) {
      markStepTouched(current)
      return
    }
    setStep(next)
  }

  const step1Errors = errorsByStep[1]
  const step2Errors = errorsByStep[2]
  const step3Errors = errorsByStep[3]
  const step4Errors = errorsByStep[4]

  const step1Touched = touchedSteps.includes(1)
  const step2Touched = touchedSteps.includes(2)
  const step3Touched = touchedSteps.includes(3)
  const step4Touched = touchedSteps.includes(4)

  const showStep1Errors = step1Touched && step1Errors.length > 0
  const showStep2Errors = step2Touched && step2Errors.length > 0
  const showStep3Errors = step3Touched && step3Errors.length > 0
  const showStep4Errors = step4Touched && step4Errors.length > 0

  const medicationNameMissing = !draft.name.trim()
  const strengthInvalid = !isPositiveNumber(draft.strengthValue)
  const instructionsMissing = !(draft.instructions ?? '').trim()
  const maxDailyDoseInvalid = draft.asNeeded && !isPositiveNumber(draft.maxDailyDose)
  const inventoryQtyInvalid = !isNonNegativeNumber(draft.inventoryCurrentQty)
  const inventoryUnitMissing = !draft.inventoryUnit
  const inventoryThresholdInvalid = draft.inventoryLowThreshold != null && draft.inventoryLowThreshold < 0
  const doseQuantityInvalid = !isPositiveNumber(draft.doseQuantity)
  const doseUnitMissing = !draft.doseUnit
  const scheduleDaysMissing = !draft.asNeeded && (!draft.daysOfWeek || draft.daysOfWeek.length === 0)
  const scheduleTimesMissing = !draft.asNeeded && (!draft.times || draft.times.length === 0)

  const save = async () => {
    if (errorsByStep[4].length > 0) {
      markStepTouched(4)
      setStep(4)
      return
    }
    setSaving(true)
    try {
      // TODO:
      // 1) POST /api/medications (body: Medication fields)
      // 2) POST /api/prescriptions (link to medicationId)
      // 3) if !asNeeded -> POST /api/schedules
      //    else -> optional POST /api/schedules for default doseQuantity/unit (no fixed times)
      onSaved(draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <DrawerHeader>
        <DrawerTitle>{mode === 'create' ? 'Add medication' : 'Edit medication'}</DrawerTitle>
        <DrawerDescription>Complete 4 quick steps to configure medication, reminders, and inventory.</DrawerDescription>
      </DrawerHeader>

      {/* Steps */}
      <div className="flex items-center justify-center gap-2 text-xs">
        <StepDot done={step > 1} active={step === 1}>
          Medication
        </StepDot>
        <StepDot done={step > 2} active={step === 2}>
          Prescription
        </StepDot>
        <StepDot done={step > 3} active={step === 3}>
          Inventory
        </StepDot>
        <StepDot done={step > 4} active={step === 4}>
          Schedule
        </StepDot>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <Input
            label="Name *"
            placeholder="e.g., Metformin"
            value={draft.name}
            required
            aria-invalid={step1Touched && medicationNameMissing ? 'true' : undefined}
            className={cn(step1Touched && medicationNameMissing && 'border-red-400 focus-visible:ring-red-400')}
            onChange={(e) => update('name', e.target.value)}
          />
          <Input
            label="Brand name (optional)"
            value={draft.brandName}
            onChange={(e) => update('brandName', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Form *</label>
              <Select value={draft.form} onValueChange={(v) => update('form', v as MedForm)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Route *</label>
              <Select value={draft.route} onValueChange={(v) => update('route', v as RouteKind)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Strength *"
              type="number"
              placeholder="500"
              value={draft.strengthValue ?? ''}
              min={0}
              step="any"
              required
              aria-invalid={step1Touched && strengthInvalid ? 'true' : undefined}
              className={cn(step1Touched && strengthInvalid && 'border-red-400 focus-visible:ring-red-400')}
              onChange={(e) => {
                const value = e.target.value
                update('strengthValue', value ? Number(value) : undefined)
              }}
            />
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Unit *</label>
              <Select value={draft.strengthUnit} onValueChange={(v) => update('strengthUnit', v as Unit)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              label="Notes"
              placeholder="e.g., take with food"
              value={draft.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>

          {showStep1Errors && <ValidationErrors messages={step1Errors} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="pillmindWhite" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="pillmind" onClick={() => handleNext(1, 2)} className="rounded-xl">
              Next
            </Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-xl bg-white">
            <div>
              <div className="text-sm font-medium text-[#0F172A]">As needed (PRN)</div>
              <div className="text-xs text-[#64748B]">Enable for non-scheduled, on-demand intake</div>
            </div>
            <Switch
              checked={draft.asNeeded}
              onCheckedChange={(v) => {
                const value = !!v
                update('asNeeded', value)
                if (!value) {
                  update('maxDailyDose', undefined)
                }
              }}
            />
          </div>

          <Input
            label="Indication (optional)"
            placeholder="e.g., Diabetes"
            value={draft.indication}
            onChange={(e) => update('indication', e.target.value)}
          />
          <Input
            label="Instructions *"
            placeholder="e.g., 1 tab twice daily"
            value={draft.instructions}
            required
            aria-invalid={step2Touched && instructionsMissing ? 'true' : undefined}
            className={cn(step2Touched && instructionsMissing && 'border-red-400 focus-visible:ring-red-400')}
            onChange={(e) => update('instructions', e.target.value)}
          />
          {draft.asNeeded && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Max/day *"
                type="number"
                placeholder="e.g., 6"
                value={draft.maxDailyDose ?? ''}
                min={1}
                step="1"
                required
                aria-invalid={step2Touched && maxDailyDoseInvalid ? 'true' : undefined}
                className={cn(step2Touched && maxDailyDoseInvalid && 'border-red-400 focus-visible:ring-red-400')}
                onChange={(e) => {
                  const value = e.target.value
                  update('maxDailyDose', value ? Number(value) : undefined)
                }}
              />
              <div className="p-3 border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] bg-[#F8FAFC]">
                PRN has no fixed times. You can still set default dose amount on next step.
              </div>
            </div>
          )}

          {showStep2Errors && <ValidationErrors messages={step2Errors} />}

          <div className="flex justify-between pt-2">
            <Button variant="pillmindWhite" onClick={() => setStep(1)} className="rounded-xl">
              Back
            </Button>
            <Button variant="pillmind" onClick={() => handleNext(2, 3)} className="rounded-xl">
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Current quantity *"
              type="number"
              placeholder="e.g., 30"
              value={draft.inventoryCurrentQty ?? ''}
              min={0}
              step="any"
              required
              aria-invalid={step3Touched && inventoryQtyInvalid ? 'true' : undefined}
              className={cn(step3Touched && inventoryQtyInvalid && 'border-red-400 focus-visible:ring-red-400')}
              onChange={(e) => {
                const value = e.target.value
                update('inventoryCurrentQty', value ? Number(value) : undefined)
              }}
            />
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Inventory unit *</label>
              <Select
                value={draft.inventoryUnit ?? draft.doseUnit ?? 'TAB'}
                onValueChange={(v) => update('inventoryUnit', v as Unit)}
              >
                <SelectTrigger
                  className={cn('w-full', step3Touched && inventoryUnitMissing && 'border-red-400 focus-visible:ring-red-400')}
                >
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Input
            label="Low stock threshold (optional)"
            type="number"
            placeholder="e.g., 10"
            value={draft.inventoryLowThreshold ?? ''}
            min={0}
            aria-invalid={step3Touched && inventoryThresholdInvalid ? 'true' : undefined}
            className={cn(step3Touched && inventoryThresholdInvalid && 'border-red-400 focus-visible:ring-red-400')}
            onChange={(e) => {
              const value = e.target.value
              update('inventoryLowThreshold', value ? Number(value) : undefined)
            }}
          />

          <Input
            label="Last restocked (optional)"
            type="date"
            value={restockedDateInputValue}
            onChange={(e) => {
              const value = e.target.value
              update('inventoryLastRestockedAt', value ? new Date(`${value}T00:00:00`).toISOString() : undefined)
            }}
          />

          <div className="p-3 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] text-xs text-[#64748B]">
            <p>
              Track remaining supply to trigger low stock alerts and plan refills in time.
              {estimatedDosesRemaining != null && effectiveDoseQuantity ? (
                <span className="block text-[#0F172A] mt-1">
                  Approx. {estimatedDosesRemaining} doses left at {effectiveDoseQuantity}{' '}
                  {draft.doseUnit ?? draft.inventoryUnit ?? 'unit'} per dose.
                </span>
              ) : null}
            </p>
          </div>

          {showStep3Errors && <ValidationErrors messages={step3Errors} />}

          <div className="flex justify-between pt-2">
            <Button variant="pillmindWhite" onClick={() => setStep(2)} className="rounded-xl">
              Back
            </Button>
            <Button variant="pillmind" onClick={() => handleNext(3, 4)} className="rounded-xl">
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Dose quantity *"
              type="number"
              value={draft.doseQuantity ?? ''}
              min={0}
              step="any"
              required
              aria-invalid={step4Touched && doseQuantityInvalid ? 'true' : undefined}
              className={cn(step4Touched && doseQuantityInvalid && 'border-red-400 focus-visible:ring-red-400')}
              onChange={(e) => {
                const value = e.target.value
                update('doseQuantity', value ? Number(value) : undefined)
              }}
            />
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Dose unit *</label>
              <Select value={draft.doseUnit} onValueChange={(v) => update('doseUnit', v as Unit)}>
                <SelectTrigger
                  className={cn('w-full', step4Touched && doseUnitMissing && 'border-red-400 focus-visible:ring-red-400')}
                >
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!draft.asNeeded && (
            <>
              <div>
                <div className="text-sm font-medium text-[#334155] mb-2">Weekdays *</div>
                <div
                  className={cn(
                    'grid grid-cols-7 gap-1',
                    step4Touched && scheduleDaysMissing && 'ring-1 ring-red-300 rounded-lg'
                  )}
                >
                  {WEEKDAYS.map((w) => {
                    const on = draft.daysOfWeek.includes(w)
                    return (
                      <label
                        key={w}
                        className={cn(
                          'text-xs px-2 py-1 rounded-lg border cursor-pointer text-center',
                          on ? 'bg-[#0EA8BC]/10 border-[#0EA8BC] text-[#0F172A]' : 'border-[#E2E8F0] text-[#64748B]',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={on}
                          onChange={(e) => {
                            const set = new Set(draft.daysOfWeek)
                            e.target.checked ? set.add(w) : set.delete(w)
                            update('daysOfWeek', Array.from(set) as Weekday[])
                          }}
                        />
                        {weekdayLabelShort[w]}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-[#334155] mb-2">Times (24h "HH:mm") *</div>
                <TimesEditor
                  value={draft.times}
                  onChange={(arr) => update('times', arr)}
                  placeholder="08:00, 20:00"
                  invalid={step4Touched && scheduleTimesMissing}
                />
                <p className="text-xs text-[#64748B] mt-1">Timezone: {timezone}</p>
              </div>
            </>
          )}

          {showStep4Errors && <ValidationErrors messages={step4Errors} />}

          <div className="flex justify-between pt-2">
            <Button variant="pillmindWhite" onClick={() => setStep(3)} className="rounded-xl">
              Back
            </Button>
            <Button variant="pillmind" onClick={save} disabled={saving} className="rounded-xl">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      <DrawerFooter className="pt-1" />
    </div>
  )
}

function ValidationErrors({ messages }: { messages: string[] }) {
  if (!messages.length) return null
  return (
    <div className="border border-red-100 bg-red-50 text-xs text-red-600 rounded-xl p-3">
      <ul className="list-disc list-inside space-y-1">
        {messages.map((msg, index) => (
          <li key={`${msg}-${index}`}>{msg}</li>
        ))}
      </ul>
    </div>
  )
}

function StepDot({ active, done, children }: { active?: boolean; done?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] transition-colors',
        done
          ? 'bg-green-50 border-green-500 text-green-700'
          : active
            ? 'bg-[#0EA8BC]/10 border-[#0EA8BC] text-[#0F172A]'
            : 'border-[#E2E8F0] text-[#64748B]',
      )}
      aria-current={active ? 'step' : undefined}
    >
      {done && <Check className="w-3 h-3" aria-hidden />}
      {children}
    </div>
  )
}

function TimesEditor({
  value,
  onChange,
  placeholder,
  invalid = false,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  invalid?: boolean
}) {
  const [draft, setDraft] = useState(value.join(', '))
  useEffect(() => setDraft(value.join(', ')), [value])

  function apply() {
    const clean = draft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        // normalize 8:0 -> 08:00
        const m = s.match(/^(\d{1,2}):(\d{1,2})$/)
        if (!m) return s
        const hh = String(Math.min(23, Number(m[1]))).padStart(2, '0')
        const mm = String(Math.min(59, Number(m[2]))).padStart(2, '0')
        return `${hh}:${mm}`
      })
    onChange(Array.from(new Set(clean)))
  }

  return (
    <div className="flex gap-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className={cn('flex-1', invalid && 'border-red-400 focus-visible:ring-red-400')}
        aria-invalid={invalid ? 'true' : undefined}
      />
      <Button variant="pillmindOutline" onClick={apply} className="rounded-xl">
        Apply
      </Button>
    </div>
  )
}

function getStepErrors(step: WizardStep, draft: DraftMedication): string[] {
  const errors: string[] = []
  const trim = (value?: string) => (value ?? '').trim()

  switch (step) {
    case 1: {
      if (!trim(draft.name)) errors.push('Medication name is required.')
      if (!isPositiveNumber(draft.strengthValue)) errors.push('Strength must be greater than 0.')
      if (!draft.strengthUnit) errors.push('Strength unit is required.')
      if (!draft.form) errors.push('Medication form is required.')
      if (!draft.route) errors.push('Administration route is required.')
      return errors
    }
    case 2: {
      if (!trim(draft.instructions)) errors.push('Medication instructions are required.')
      if (draft.asNeeded && !isPositiveNumber(draft.maxDailyDose)) {
        errors.push('Provide a positive max per day value for PRN medications.')
      }
      return errors
    }
    case 3: {
      if (!isNonNegativeNumber(draft.inventoryCurrentQty)) errors.push('Current inventory quantity cannot be negative.')
      if (!draft.inventoryUnit) errors.push('Inventory unit is required.')
      if (draft.inventoryLowThreshold != null && draft.inventoryLowThreshold < 0) {
        errors.push('Low stock threshold cannot be negative.')
      }
      return errors
    }
    case 4: {
      if (!isPositiveNumber(draft.doseQuantity)) errors.push('Dose quantity must be greater than 0.')
      if (!draft.doseUnit) errors.push('Dose unit is required.')
      if (!draft.asNeeded) {
        if (!Array.isArray(draft.daysOfWeek) || draft.daysOfWeek.length === 0) {
          errors.push('Select at least one weekday.')
        }
        if (!Array.isArray(draft.times) || draft.times.length === 0) {
          errors.push('Add at least one intake time.')
        }
      }
      return errors
    }
    default:
      return errors
  }
}

function isPositiveNumber(value?: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isNonNegativeNumber(value?: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
