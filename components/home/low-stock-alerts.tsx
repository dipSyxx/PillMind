'use client'

import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Medication, Inventory } from '@/types/medication'

interface LowStockAlertsProps {
  lowStock: (Medication & { inventory?: Inventory | null })[]
  onRefill: (medicationId: string, newQuantity: number) => void
}

export function LowStockAlerts({ lowStock, onRefill }: LowStockAlertsProps) {
  const [refilling, setRefilling] = useState<string | null>(null)

  if (lowStock.length === 0) return null

  const handleRefill = async (medication: Medication & { inventory?: Inventory | null }) => {
    if (!medication.inventory) return

    setRefilling(medication.id)
    try {
      // Refill to 30 units (or adjust as needed)
      const newQuantity = 30
      await onRefill(medication.id, newQuantity)
    } catch (error) {
      console.error('Failed to refill medication:', error)
    } finally {
      setRefilling(null)
    }
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <p className="text-sm font-semibold text-red-700">Low stock</p>
      </div>
      <div className="space-y-2">
        {lowStock.map((m) => (
          <div key={m.id} className="flex items-center justify-between text-sm">
            <span className="text-red-700">
              {m.name} • {m.inventory?.currentQty} {m.inventory?.unit} left
            </span>
            <Button
              variant="pillmindOutline"
              size="sm"
              className="rounded-xl"
              onClick={() => handleRefill(m)}
              disabled={refilling === m.id}
            >
              {refilling === m.id ? 'Refilling...' : 'Refill'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
