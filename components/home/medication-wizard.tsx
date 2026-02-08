'use client'

import { Button } from '@/components/ui/button'
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { WEEKDAYS, weekdayLabelShort } from '@/lib/medication-utils'
import { cn } from '@/lib/utils'
import { DraftMedication, MedForm, RouteKind, TimeFormat, Unit, Weekday } from '@/types/medication'
import { format } from 'date-fns'
import { Check, Clock, Loader2, Plus, Trash2 } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

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

interface CareProvider {
  id: string
  name: string
  email: string | null
  phone: string | null
  clinic: string | null
}

export function MedicationWizard({ mode, initial, onSaved, onClose, timezone, timeFormat }: MedicationWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const [saving, setSaving] = useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  const [careProviders, setCareProviders] = useState<CareProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
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
    providerId: initial?.providerId,
    startDate: initial?.startDate,
    endDate: initial?.endDate,
    doseQuantity: initial?.doseQuantity ?? 1,
    doseUnit: initial?.doseUnit ?? 'TAB',
    daysOfWeek: initial?.daysOfWeek ?? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    times: initial?.times ?? [],
    inventoryCurrentQty: initial?.inventoryCurrentQty ?? 30,
    inventoryUnit: initial?.inventoryUnit ?? initial?.doseUnit ?? 'TAB',
    inventoryLowThreshold: initial?.inventoryLowThreshold ?? 10,
    inventoryLastRestockedAt: initial?.inventoryLastRestockedAt,
  })
  const [touchedSteps, setTouchedSteps] = useState<WizardStep[]>([])

  // Load care providers when step 2 is active
  useEffect(() => {
    if (step === 2 && careProviders.length === 0 && !loadingProviders) {
      setLoadingProviders(true)
      fetch('/api/care-providers', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          setCareProviders(data)
        })
        .catch((e) => {
          console.error('Failed to load care providers:', e)
        })
        .finally(() => {
          setLoadingProviders(false)
        })
    }
  }, [step, careProviders.length, loadingProviders])

  // Update draft when initial prop changes
  useEffect(() => {
    if (initial) {
      setDraft({
        name: initial.name ?? '',
        brandName: initial.brandName ?? '',
        form: initial.form ?? 'TABLET',
        strengthValue: initial.strengthValue,
        strengthUnit: initial.strengthUnit ?? 'MG',
        route: initial.route ?? 'ORAL',
        notes: initial.notes ?? '',
        asNeeded: initial.asNeeded ?? false,
        indication: initial.indication ?? '',
        instructions: initial.instructions ?? '',
        maxDailyDose: initial.maxDailyDose,
        providerId: initial.providerId,
        startDate: initial.startDate,
        endDate: initial.endDate,
        doseQuantity: initial.doseQuantity ?? 1,
        doseUnit: initial.doseUnit ?? 'TAB',
        daysOfWeek: initial.daysOfWeek ?? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        times: initial.times ?? [],
        inventoryCurrentQty: initial.inventoryCurrentQty ?? 30,
        inventoryUnit: initial.inventoryUnit ?? initial.doseUnit ?? 'TAB',
        inventoryLowThreshold: initial.inventoryLowThreshold ?? 10,
        inventoryLastRestockedAt: initial.inventoryLastRestockedAt,
      })
      // Reset to first step when initial changes
      setStep(1)
      setTouchedSteps([])
    }
  }, [initial])

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
      await onSaved(draft)
    } finally {
      setSaving(false)
    }
  }

  // Track viewport height for keyboard detection
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return

    function updateViewportHeight() {
      setViewportHeight(window.visualViewport?.height || null)
    }

    updateViewportHeight()
    window.visualViewport.addEventListener('resize', updateViewportHeight)
    return () => window.visualViewport?.removeEventListener('resize', updateViewportHeight)
  }, [])

  // Handle input focus to scroll into view on mobile when keyboard opens
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!scrollContainerRef.current) return

    const input = e.target
    const scrollContainer = scrollContainerRef.current

    // Use visualViewport if available, otherwise fallback to window.innerHeight
    const viewportHeight = window.visualViewport?.height || window.innerHeight
    const keyboardHeight = window.innerHeight - viewportHeight

    // Only handle on mobile devices (when keyboard is likely to appear)
    if (keyboardHeight < 50) return

    // Wait for keyboard animation to complete
    const scrollIntoView = () => {
      const inputRect = input.getBoundingClientRect()
      const containerRect = scrollContainer.getBoundingClientRect()
      const scrollTop = scrollContainer.scrollTop

      // Calculate input position relative to container
      const inputOffsetTop = inputRect.top - containerRect.top + scrollTop

      // Calculate available height (viewport minus keyboard)
      const availableHeight = viewportHeight
      const padding = 20 // Padding from bottom
      const inputBottom = inputRect.bottom

      // Check if input is too close to viewport bottom (keyboard area)
      if (inputBottom > availableHeight - padding) {
        // Calculate how much we need to scroll
        const scrollAmount = inputBottom - availableHeight + padding
        const newScrollTop = Math.max(0, scrollTop + scrollAmount)

        scrollContainer.scrollTo({
          top: newScrollTop,
          behavior: 'smooth',
        })
      } else if (inputRect.top < containerRect.top) {
        // If input is above visible area, scroll it into view
        const scrollAmount = inputOffsetTop - padding
        scrollContainer.scrollTo({
          top: Math.max(0, scrollAmount),
          behavior: 'smooth',
        })
      }
    }

    // Multiple attempts to handle keyboard animation
    setTimeout(() => scrollIntoView(), 100)
    setTimeout(() => scrollIntoView(), 300)
    setTimeout(() => scrollIntoView(), 500)
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="flex-shrink-0">
        <DrawerHeader>
          <DrawerTitle className="text-lg sm:text-xl">
            {mode === 'create' ? 'Add medication' : 'Edit medication'}
          </DrawerTitle>
          <DrawerDescription className="text-sm">
            Complete 4 quick steps to configure medication, reminders, and inventory.
          </DrawerDescription>
        </DrawerHeader>

        {/* Steps */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs flex-wrap">
            <StepDot done={step > 1} active={step === 1}>
              <span className="hidden sm:inline">Medication</span>
              <span className="sm:hidden">Med</span>
            </StepDot>
            <StepDot done={step > 2} active={step === 2}>
              <span className="hidden sm:inline">Prescription</span>
              <span className="sm:hidden">Rx</span>
            </StepDot>
            <StepDot done={step > 3} active={step === 3}>
              <span className="hidden sm:inline">Inventory</span>
              <span className="sm:hidden">Stock</span>
            </StepDot>
            <StepDot done={step > 4} active={step === 4}>
              <span className="hidden sm:inline">Schedule</span>
              <span className="sm:hidden">Time</span>
            </StepDot>
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
        {step === 1 && (
          <div className="space-y-4 sm:space-y-3">
            <Input
              label="Name *"
              placeholder="e.g., Metformin"
              value={draft.name}
              required
              aria-invalid={step1Touched && medicationNameMissing ? 'true' : undefined}
              className={cn(step1Touched && medicationNameMissing && 'border-red-400 focus-visible:ring-red-400')}
              onChange={(e) => update('name', e.target.value)}
              onFocus={handleInputFocus}
            />
            <Input
              label="Brand name (optional)"
              value={draft.brandName}
              onChange={(e) => update('brandName', e.target.value)}
              onFocus={handleInputFocus}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5 sm:mb-1">Form *</label>
                <Select value={draft.form} onValueChange={(v) => update('form', v as MedForm)}>
                  <SelectTrigger className="w-full h-11 sm:h-10">
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
                <label className="block text-sm font-medium text-[#334155] mb-1.5 sm:mb-1">Route *</label>
                <Select value={draft.route} onValueChange={(v) => update('route', v as RouteKind)}>
                  <SelectTrigger className="w-full h-11 sm:h-10">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
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
                onFocus={handleInputFocus}
              />
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5 sm:mb-1">Unit *</label>
                <Select value={draft.strengthUnit} onValueChange={(v) => update('strengthUnit', v as Unit)}>
                  <SelectTrigger className="w-full h-11 sm:h-10">
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
                onFocus={handleInputFocus}
              />
            </div>

            {showStep1Errors && <ValidationErrors messages={step1Errors} />}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 pt-4 sm:pt-2">
              <Button variant="pillmindWhite" onClick={onClose} className="rounded-xl h-11 sm:h-10 w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                variant="pillmind"
                onClick={() => handleNext(1, 2)}
                className="rounded-xl h-11 sm:h-10 w-full sm:w-auto"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 sm:space-y-3">
            <div className="flex items-center justify-between p-4 sm:p-3 border border-[#E2E8F0] rounded-xl bg-white gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#0F172A]">As needed (PRN)</div>
                <div className="text-xs text-[#64748B] mt-0.5">Enable for non-scheduled, on-demand intake</div>
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
              onFocus={handleInputFocus}
            />
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Instructions <span className="text-red-500">*</span>
              </label>
              <textarea
                className={cn(
                  'w-full min-h-[100px] px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA8BC] focus:border-transparent',
                  step2Touched && instructionsMissing && 'border-red-400 focus-visible:ring-red-400',
                )}
                placeholder="e.g., 1 tab twice daily"
                value={draft.instructions}
                required
                aria-invalid={step2Touched && instructionsMissing ? 'true' : undefined}
                onChange={(e) => update('instructions', e.target.value)}
                onFocus={handleInputFocus}
              />
            </div>
            {draft.asNeeded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
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
                  onFocus={handleInputFocus}
                />
                <div className="p-3 sm:p-3 border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] bg-[#F8FAFC]">
                  PRN has no fixed times. You can still set default dose amount on next step.
                </div>
              </div>
            )}

            {/* Care Provider */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">Care Provider (optional)</label>
              {loadingProviders ? (
                <div className="text-sm text-[#64748B]">Loading providers...</div>
              ) : (
                <Select
                  value={draft.providerId || '__none__'}
                  onValueChange={(value) => update('providerId', value === '__none__' ? undefined : value)}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
              <Input
                label="Start date (optional)"
                type="date"
                value={
                  draft.startDate && !Number.isNaN(new Date(draft.startDate).getTime())
                    ? format(new Date(draft.startDate), 'yyyy-MM-dd')
                    : ''
                }
                onChange={(e) => {
                  const value = e.target.value
                  update('startDate', value ? new Date(value).toISOString() : undefined)
                }}
                onFocus={handleInputFocus}
              />
              <Input
                label="End date (optional)"
                type="date"
                value={
                  draft.endDate && !Number.isNaN(new Date(draft.endDate).getTime())
                    ? format(new Date(draft.endDate), 'yyyy-MM-dd')
                    : ''
                }
                onChange={(e) => {
                  const value = e.target.value
                  update('endDate', value ? new Date(value).toISOString() : undefined)
                }}
                onFocus={handleInputFocus}
              />
            </div>

            {showStep2Errors && <ValidationErrors messages={step2Errors} />}

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-2 pt-4 sm:pt-2">
              <Button
                variant="pillmindWhite"
                onClick={() => setStep(1)}
                className="rounded-xl h-11 sm:h-10 w-full sm:w-auto"
              >
                Back
              </Button>
              <Button
                variant="pillmind"
                onClick={() => handleNext(2, 3)}
                className="rounded-xl h-11 sm:h-10 w-full sm:w-auto"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
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
                onFocus={handleInputFocus}
              />
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5 sm:mb-1">Inventory unit *</label>
                <Select
                  value={draft.inventoryUnit ?? draft.doseUnit ?? 'TAB'}
                  onValueChange={(v) => update('inventoryUnit', v as Unit)}
                >
                  <SelectTrigger
                    className={cn(
                      'w-full h-11 sm:h-10',
                      step3Touched && inventoryUnitMissing && 'border-red-400 focus-visible:ring-red-400',
                    )}
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
              onFocus={handleInputFocus}
            />

            <Input
              label="Last restocked (optional)"
              type="date"
              value={restockedDateInputValue}
              onChange={(e) => {
                const value = e.target.value
                update('inventoryLastRestockedAt', value ? new Date(`${value}T00:00:00`).toISOString() : undefined)
              }}
              onFocus={handleInputFocus}
            />

            <div className="p-3 sm:p-3 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] text-xs text-[#64748B]">
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

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-2 pt-4 sm:pt-2">
              <Button
                variant="pillmindWhite"
                onClick={() => setStep(2)}
                className="rounded-xl h-11 sm:h-10 w-full sm:w-auto"
              >
                Back
              </Button>
              <Button
                variant="pillmind"
                onClick={() => handleNext(3, 4)}
                className="rounded-xl h-11 sm:h-10 w-full sm:w-auto"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
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
                onFocus={handleInputFocus}
              />
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5 sm:mb-1">Dose unit *</label>
                <Select value={draft.doseUnit} onValueChange={(v) => update('doseUnit', v as Unit)}>
                  <SelectTrigger
                    className={cn(
                      'w-full h-11 sm:h-10',
                      step4Touched && doseUnitMissing && 'border-red-400 focus-visible:ring-red-400',
                    )}
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
                  <div className="text-sm font-medium text-[#334155] mb-2 sm:mb-2">Weekdays *</div>
                  <div
                    className={cn(
                      'grid grid-cols-7 gap-1.5 sm:gap-1',
                      step4Touched && scheduleDaysMissing && 'ring-1 ring-red-300 rounded-lg p-1',
                    )}
                  >
                    {WEEKDAYS.map((w) => {
                      const on = draft.daysOfWeek.includes(w)
                      return (
                        <label
                          key={w}
                          className={cn(
                            'text-[10px] sm:text-xs px-1.5 sm:px-2 py-2 sm:py-1 rounded-lg border cursor-pointer text-center touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center',
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
                  <div className="text-sm font-medium text-[#334155] mb-2">
                    Times ({timeFormat === 'H12' ? '12-hour' : '24-hour'}) *
                  </div>
                  <TimesEditor
                    value={draft.times}
                    onChange={(arr) => update('times', arr)}
                    timezone={timezone}
                    timeFormat={timeFormat}
                    invalid={step4Touched && scheduleTimesMissing}
                    onInputFocus={handleInputFocus}
                  />
                  <p className="text-xs text-[#64748B] mt-1">Timezone: {timezone}</p>
                </div>
              </>
            )}

            {showStep4Errors && <ValidationErrors messages={step4Errors} />}

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-2 pt-4 sm:pt-2">
              <Button
                variant="pillmindWhite"
                onClick={() => setStep(3)}
                className="rounded-xl h-11 sm:h-10 w-full sm:w-auto"
              >
                Back
              </Button>
              <Button
                variant="pillmind"
                onClick={save}
                disabled={saving}
                className="rounded-xl h-11 sm:h-10 w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <DrawerFooter className="pt-1 flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6" />
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
        'inline-flex items-center gap-1 px-2 sm:px-2 py-1.5 sm:py-1 rounded-lg border transition-colors touch-manipulation',
        done
          ? 'bg-green-50 border-green-500 text-green-700 text-[10px] sm:text-[11px]'
          : active
            ? 'bg-[#0EA8BC]/10 border-[#0EA8BC] text-[#0F172A] text-[10px] sm:text-[11px]'
            : 'border-[#E2E8F0] text-[#64748B] text-[10px] sm:text-[11px]',
      )}
      aria-current={active ? 'step' : undefined}
    >
      {done && <Check className="w-3 h-3 flex-shrink-0" aria-hidden />}
      {children}
    </div>
  )
}

/**
 * Convert HH:mm (24h) to display format (H12 or H24)
 */
function formatTimeForDisplay(time24h: string, timeFormat: TimeFormat): string {
  if (!time24h || !time24h.match(/^\d{2}:\d{2}$/)) return time24h
  if (timeFormat === 'H24') return time24h

  // Convert to H12 format
  const [hours, minutes] = time24h.split(':').map(Number)
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const period = hours < 12 ? 'AM' : 'PM'
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

/**
 * Convert display format (H12 or H24) to HH:mm (24h)
 */
function parseTimeFromDisplay(timeStr: string, timeFormat: TimeFormat): string | null {
  if (!timeStr) return null

  if (timeFormat === 'H24') {
    // Parse 24h format: HH:mm or H:mm
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{1,2})$/)
    if (!match) return null
    const hours = Math.min(23, Math.max(0, Number(match[1])))
    const minutes = Math.min(59, Math.max(0, Number(match[2])))
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  } else {
    // Parse 12h format: h:mm AM/PM, hh:mm AM/PM, h:mmAM/PM, etc.
    // Allow flexible spacing and case
    const trimmed = timeStr.trim()
    const match = trimmed.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM|am|pm)$/i)
    if (!match) return null
    let hours = Number(match[1])
    const minutes = Math.min(59, Math.max(0, Number(match[2])))
    const period = match[3].toUpperCase()

    // Validate hours for 12h format
    if (hours < 1 || hours > 12) return null

    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0

    hours = Math.min(23, Math.max(0, hours))
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
}

function TimesEditor({
  value,
  onChange,
  timezone,
  timeFormat,
  invalid = false,
  onInputFocus,
}: {
  value: string[] // масив часів у форматі "HH:mm" (24h)
  onChange: (v: string[]) => void
  timezone: string
  timeFormat: TimeFormat
  invalid?: boolean
  onInputFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
}) {
  // Time picker state
  const [hour, setHour] = useState<string>('08')
  const [minute, setMinute] = useState<string>('00')
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')
  const [error, setError] = useState<string | null>(null)

  // Sort times
  const sortedTimes = useMemo(() => {
    return [...value].sort((a, b) => {
      const [h1, m1] = a.split(':').map(Number)
      const [h2, m2] = b.split(':').map(Number)
      return h1 * 60 + m1 - (h2 * 60 + m2)
    })
  }, [value])

  // Generate hour options based on format
  const hourOptions = useMemo(() => {
    if (timeFormat === 'H24') {
      return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
    } else {
      return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
    }
  }, [timeFormat])

  // Generate minute options (00-59)
  const minuteOptions = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
  }, [])

  function addTime() {
    // Convert to 24h format
    let hours24 = Number(hour)
    if (timeFormat === 'H12') {
      if (period === 'PM' && hours24 !== 12) hours24 += 12
      if (period === 'AM' && hours24 === 12) hours24 = 0
    }

    const time24h = `${String(hours24).padStart(2, '0')}:${minute}`

    // Check if time already exists
    if (value.includes(time24h)) {
      setError('This time is already added')
      return
    }

    setError(null)
    onChange(
      [...value, time24h].sort((a, b) => {
        const [h1, m1] = a.split(':').map(Number)
        const [h2, m2] = b.split(':').map(Number)
        return h1 * 60 + m1 - (h2 * 60 + m2)
      }),
    )

    // Reset to default
    setHour('08')
    setMinute('00')
    setPeriod('AM')
  }

  function removeTime(time24h: string) {
    onChange(value.filter((t) => t !== time24h))
  }

  return (
    <div className={cn('space-y-2', invalid && 'border border-red-400 rounded-lg p-2')}>
      {/* Time list */}
      {sortedTimes.length > 0 && (
        <div className="space-y-2">
          {sortedTimes.map((time24h) => (
            <div
              key={time24h}
              className="flex items-center justify-between p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg hover:border-[#0EA8BC]/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#64748B]" />
                <span className="text-sm font-medium text-[#0F172A]">{formatTimeForDisplay(time24h, timeFormat)}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTime(time24h)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                aria-label="Remove time"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new time */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Hour selector */}
          <Select value={hour} onValueChange={setHour}>
            <SelectTrigger className="w-20">
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

          <span className="text-[#64748B] font-medium">:</span>

          {/* Minute selector */}
          <Select value={minute} onValueChange={setMinute}>
            <SelectTrigger className="w-20">
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

          {/* AM/PM selector for H12 format */}
          {timeFormat === 'H12' && (
            <Select value={period} onValueChange={(v) => setPeriod(v as 'AM' | 'PM')}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            type="button"
            variant="pillmindOutline"
            onClick={addTime}
            className="rounded-xl h-11 sm:h-10 flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add time
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {invalid && !error && <p className="text-xs text-red-500">At least one time is required</p>}
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
      if (draft.endDate) {
        const endDate = new Date(draft.endDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (endDate < today) {
          errors.push('End date must be today or in the future.')
        }
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
