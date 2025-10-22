'use client'

import React, { useState, useEffect } from 'react'
import { Check, Plus } from 'lucide-react'
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
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { DraftMedication, MedForm, RouteKind, Unit, Weekday, TimeFormat } from '@/types/medication'
import { WEEKDAYS, weekdayLabelShort } from '@/lib/medication-utils'
import { format } from 'date-fns'

interface MedicationWizardProps {
  mode: 'create' | 'edit'
  initial?: Partial<DraftMedication>
  onSaved: (draft: DraftMedication) => void
  onClose: () => void
  timezone: string
  timeFormat: TimeFormat
}

export function MedicationWizard({ mode, initial, onSaved, onClose, timezone, timeFormat }: MedicationWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
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

  async function save() {
    setSaving(true)
    try {
      // TODO:
      // 1) POST /api/medications (body: Medication fields)
      // 2) POST /api/prescriptions (link to medicationId)
      // 3) if !asNeeded → POST /api/schedules
      //    else → optional POST /api/schedules for default doseQuantity/unit (no fixed times)
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
            label="Name"
            placeholder="e.g., Metformin"
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
          />
          <Input
            label="Brand name (optional)"
            value={draft.brandName}
            onChange={(e) => update('brandName', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Form</label>
              <Select value={draft.form} onValueChange={(v) => update('form', v as MedForm)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ['TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'INHALER', 'TOPICAL', 'DROPS', 'OTHER'] as MedForm[]
                  ).map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Route</label>
              <Select value={draft.route} onValueChange={(v) => update('route', v as RouteKind)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      'ORAL',
                      'SUBLINGUAL',
                      'INHALATION',
                      'TOPICAL',
                      'INJECTION',
                      'OPHTHALMIC',
                      'NASAL',
                      'RECTAL',
                      'OTHER',
                    ] as RouteKind[]
                  ).map((r) => (
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
              label="Strength"
              type="number"
              placeholder="500"
              value={draft.strengthValue ?? ''}
              onChange={(e) => update('strengthValue', Number(e.target.value))}
            />
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Unit</label>
              <Select value={draft.strengthUnit} onValueChange={(v) => update('strengthUnit', v as Unit)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {(['MG', 'MCG', 'G', 'ML', 'IU', 'TAB', 'CAPS', 'DROP', 'PUFF', 'UNIT'] as Unit[]).map((u) => (
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

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="pillmindWhite" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="pillmind" onClick={() => setStep(2)} className="rounded-xl">
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
            <Switch checked={draft.asNeeded} onCheckedChange={(v) => update('asNeeded', !!v)} />
          </div>

          <Input
            label="Indication (optional)"
            placeholder="e.g., Diabetes"
            value={draft.indication}
            onChange={(e) => update('indication', e.target.value)}
          />
          <Input
            label="Instructions (optional)"
            placeholder="e.g., 1 tab twice daily"
            value={draft.instructions}
            onChange={(e) => update('instructions', e.target.value)}
          />
          {draft.asNeeded && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Max/day (optional)"
                type="number"
                placeholder="e.g., 6"
                value={draft.maxDailyDose ?? ''}
                onChange={(e) => update('maxDailyDose', Number(e.target.value))}
              />
              <div className="p-3 border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] bg-[#F8FAFC]">
                PRN has no fixed times. You can still set default dose amount on next step.
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="pillmindWhite" onClick={() => setStep(1)} className="rounded-xl">
              Back
            </Button>
            <Button variant="pillmind" onClick={() => setStep(3)} className="rounded-xl">
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Current quantity"
              type="number"
              placeholder="e.g., 30"
              value={draft.inventoryCurrentQty ?? ''}
              onChange={(e) => {
                const value = e.target.value
                update('inventoryCurrentQty', value ? Number(value) : undefined)
              }}
            />
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Inventory unit</label>
              <Select
                value={draft.inventoryUnit ?? draft.doseUnit ?? 'TAB'}
                onValueChange={(v) => update('inventoryUnit', v as Unit)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {(['MG', 'MCG', 'G', 'ML', 'IU', 'TAB', 'CAPS', 'DROP', 'PUFF', 'UNIT'] as Unit[]).map((u) => (
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

          <div className="flex justify-between pt-2">
            <Button variant="pillmindWhite" onClick={() => setStep(2)} className="rounded-xl">
              Back
            </Button>
            <Button variant="pillmind" onClick={() => setStep(4)} className="rounded-xl">
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Dose quantity"
              type="number"
              value={draft.doseQuantity ?? ''}
              onChange={(e) => update('doseQuantity', Number(e.target.value))}
            />
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Dose unit</label>
              <Select value={draft.doseUnit} onValueChange={(v) => update('doseUnit', v as Unit)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {(['TAB', 'CAPS', 'ML', 'MG', 'UNIT', 'DROP', 'PUFF'] as Unit[]).map((u) => (
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
                <div className="text-sm font-medium text-[#334155] mb-2">Weekdays</div>
                <div className="grid grid-cols-7 gap-1">
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
                <div className="text-sm font-medium text-[#334155] mb-2">Times (24h "HH:mm")</div>
                <TimesEditor value={draft.times} onChange={(arr) => update('times', arr)} placeholder="08:00, 20:00" />
                <p className="text-xs text-[#64748B] mt-1">Timezone: {timezone}</p>
              </div>
            </>
          )}

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
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState(value.join(', '))
  useEffect(() => setDraft(value.join(', ')), [value])

  function apply() {
    const clean = draft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        // normalize 8:0 → 08:00
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
      <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="flex-1" />
      <Button variant="pillmindOutline" onClick={apply} className="rounded-xl">
        Apply
      </Button>
    </div>
  )
}
