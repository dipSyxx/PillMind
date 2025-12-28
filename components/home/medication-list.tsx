'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Inventory, Medication, Prescription } from '@/types/medication'
import { Filter, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MedicationCard } from './medication-card'

interface MedicationListProps {
  medications: (Medication & { inventory?: Inventory | null })[]
  prescriptions: (Prescription & { schedules?: any[]; medication?: Medication | null })[]
  onEdit: (medication: Medication) => void
  onDelete: (medicationId: string) => void
  onViewDetails: (medication: Medication) => void
}

type FilterType = 'all' | 'active' | 'low-stock' | 'no-prescriptions'

export function MedicationList({ medications, prescriptions, onEdit, onDelete, onViewDetails }: MedicationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  // Group prescriptions by medicationId
  const prescriptionsByMedId = useMemo(() => {
    const map = new Map<string, (Prescription & { schedules?: any[] })[]>()
    prescriptions.forEach((rx) => {
      if (rx.medicationId) {
        const existing = map.get(rx.medicationId) || []
        map.set(rx.medicationId, [...existing, rx])
      }
    })
    return map
  }, [prescriptions])

  // Filter and search medications
  const filteredMedications = useMemo(() => {
    let filtered = medications

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (med) => med.name.toLowerCase().includes(query) || med.brandName?.toLowerCase().includes(query) || false,
      )
    }

    // Apply filter
    if (filter === 'active') {
      filtered = filtered.filter((med) => {
        const medPrescriptions = prescriptionsByMedId.get(med.id) || []
        return medPrescriptions.some((rx) => !rx.endDate || new Date(rx.endDate) > new Date())
      })
    } else if (filter === 'low-stock') {
      filtered = filtered.filter(
        (med) =>
          med.inventory && med.inventory.lowThreshold != null && med.inventory.currentQty <= med.inventory.lowThreshold,
      )
    } else if (filter === 'no-prescriptions') {
      filtered = filtered.filter((med) => !prescriptionsByMedId.has(med.id))
    }

    return filtered
  }, [medications, searchQuery, filter, prescriptionsByMedId])

  // Check if medication has low stock
  const isLowStock = (medication: Medication & { inventory?: Inventory | null }): boolean => {
    return !!(
      medication.inventory &&
      medication.inventory.lowThreshold != null &&
      medication.inventory.currentQty <= medication.inventory.lowThreshold
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] z-[1]" />
          <Input
            placeholder="Search medications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] z-[1]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All medications</SelectItem>
              <SelectItem value="active">Active prescriptions</SelectItem>
              <SelectItem value="low-stock">Low stock</SelectItem>
              <SelectItem value="no-prescriptions">No prescriptions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      {filteredMedications.length > 0 && (
        <div className="text-sm text-[#64748B]">
          {filteredMedications.length} medication{filteredMedications.length !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Medications list */}
      {filteredMedications.length === 0 ? (
        <div className="text-center py-12 bg-white border border-[#E2E8F0] rounded-2xl">
          <p className="text-[#64748B] text-sm">
            {searchQuery || filter !== 'all'
              ? 'No medications found matching your criteria.'
              : 'No medications yet. Add your first medication to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMedications.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              prescriptions={prescriptionsByMedId.get(medication.id) || []}
              onEdit={() => onEdit(medication)}
              onDelete={() => onDelete(medication.id)}
              onViewDetails={() => onViewDetails(medication)}
              isLowStock={isLowStock(medication)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
