'use client'

import React from 'react'
import { Pill, FileText, Calendar } from 'lucide-react'
import { Medication, Prescription } from '@/types/medication'

interface ProfileStatsProps {
  medications: Medication[]
  prescriptions: Prescription[]
}

export function ProfileStats({ medications, prescriptions }: ProfileStatsProps) {
  const activePrescriptions = prescriptions.filter(
    (rx) => !rx.endDate || new Date(rx.endDate) > new Date(),
  )

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <h3 className="font-semibold text-[#0F172A] mb-3">Statistics</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Pill className="w-4 h-4 text-[#0EA8BC]" />
            <span className="text-xs text-[#64748B]">Medications</span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A]">{medications.length}</div>
        </div>

        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-[#0EA8BC]" />
            <span className="text-xs text-[#64748B]">Active Prescriptions</span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A]">{activePrescriptions.length}</div>
        </div>
      </div>
    </div>
  )
}

