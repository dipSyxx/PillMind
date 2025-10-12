'use client'

import React from 'react'
import { Pill, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Prescription, Medication } from '@/types/medication'

interface PrnQuickActionsProps {
  prnPrescriptions: (Prescription & { medication: Medication })[]
  onTakeNow: (prescriptionId: string) => void
}

export function PrnQuickActions({ prnPrescriptions, onTakeNow }: PrnQuickActionsProps) {
  if (prnPrescriptions.length === 0) return null

  return (
    <>
      {prnPrescriptions.map((r) => (
        <div key={r.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#0EA8BC]" />
              <div>
                <div className="text-sm font-semibold text-[#0F172A]">{r.medication.name}</div>
                <div className="text-xs text-[#64748B]">PRN • {r.instructions}</div>
              </div>
            </div>
            <Button variant="pillmind" size="sm" onClick={() => onTakeNow(r.id)} className="rounded-xl">
              <Check className="w-4 h-4 mr-1" />
              Take now
            </Button>
          </div>
        </div>
      ))}
    </>
  )
}
