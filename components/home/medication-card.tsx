'use client'

import React from 'react'
import { Pill, AlertTriangle, Edit, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Medication, Inventory, Prescription } from '@/types/medication'
import { cn } from '@/lib/utils'

interface MedicationCardProps {
  medication: Medication & { inventory?: Inventory | null }
  prescriptions?: (Prescription & { schedules?: any[] })[]
  onEdit?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
  isLowStock?: boolean
}

export function MedicationCard({
  medication,
  prescriptions = [],
  onEdit,
  onDelete,
  onViewDetails,
  isLowStock = false,
}: MedicationCardProps) {
  const activePrescriptions = prescriptions.filter(
    (rx) => !rx.endDate || new Date(rx.endDate) > new Date(),
  )
  const hasActivePrescriptions = activePrescriptions.length > 0

  const strengthDisplay =
    medication.strengthValue && medication.strengthUnit
      ? `${medication.strengthValue} ${medication.strengthUnit}`
      : null

  return (
    <div
      className={cn(
        'bg-white border rounded-2xl p-4 transition-all hover:shadow-md',
        isLowStock ? 'border-red-200 bg-red-50/50' : 'border-[#E2E8F0]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-[#0EA8BC]/10 border border-[#0EA8BC]/20 grid place-items-center flex-shrink-0">
            <Pill className="w-6 h-6 text-[#0EA8BC]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-[#0F172A] truncate">{medication.name}</h3>
              {isLowStock && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Low stock
                </Badge>
              )}
            </div>

            {medication.brandName && (
              <p className="text-xs text-[#64748B] mb-1">{medication.brandName}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] mb-2">
              <span className="capitalize">{medication.form.toLowerCase()}</span>
              {strengthDisplay && (
                <>
                  <span>•</span>
                  <span>{strengthDisplay}</span>
                </>
              )}
              {medication.route && (
                <>
                  <span>•</span>
                  <span className="capitalize">{medication.route.toLowerCase()}</span>
                </>
              )}
            </div>

            {/* Inventory */}
            {medication.inventory && (
              <div className="text-xs text-[#64748B] mb-2">
                Stock: <span className="font-medium">{medication.inventory.currentQty}</span>{' '}
                {medication.inventory.unit}
                {medication.inventory.lowThreshold && (
                  <span className="text-[#64748B]">
                    {' '}
                    (low: {medication.inventory.lowThreshold})
                  </span>
                )}
              </div>
            )}

            {/* Prescriptions info */}
            {hasActivePrescriptions && (
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <Badge variant="outline" className="text-xs">
                  {activePrescriptions.length} active prescription{activePrescriptions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}

            {!hasActivePrescriptions && prescriptions.length === 0 && (
              <div className="text-xs text-[#64748B] italic">No active prescriptions</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onViewDetails && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onViewDetails}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E2E8F0]">
          {onEdit && (
            <Button variant="pillmindOutline" size="sm" className="flex-1" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

