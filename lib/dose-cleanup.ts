import prisma from '@/prisma/prisma-client'
import { Unit } from '@/types/medication'

/**
 * Delete all future SCHEDULED doses for a specific schedule
 * @param scheduleId - The schedule ID
 * @param beforeDate - Optional: only delete doses before this date (if not provided, uses current time)
 * @returns Number of deleted doses
 */
export async function deleteFutureDosesForSchedule(
  scheduleId: string,
  beforeDate?: Date
): Promise<number> {
  const cutoffDate = beforeDate || new Date()

  const result = await prisma.doseLog.deleteMany({
    where: {
      scheduleId,
      status: 'SCHEDULED',
      scheduledFor: {
        gte: cutoffDate,
      },
    },
  })

  return result.count
}

/**
 * Delete all future SCHEDULED doses for a prescription after a specific date
 * @param prescriptionId - The prescription ID
 * @param endDate - The end date (doses after this date will be deleted)
 * @returns Number of deleted doses
 */
export async function deleteFutureDosesForPrescription(
  prescriptionId: string,
  endDate: Date
): Promise<number> {
  const result = await prisma.doseLog.deleteMany({
    where: {
      prescriptionId,
      status: 'SCHEDULED',
      scheduledFor: {
        gt: endDate,
      },
    },
  })

  return result.count
}

/**
 * Delete all past SCHEDULED doses for a schedule before a specific date
 * @param scheduleId - The schedule ID
 * @param startDate - The start date (doses before this date will be deleted)
 * @returns Number of deleted doses
 */
export async function deletePastDosesForSchedule(
  scheduleId: string,
  startDate: Date
): Promise<number> {
  const result = await prisma.doseLog.deleteMany({
    where: {
      scheduleId,
      status: 'SCHEDULED',
      scheduledFor: {
        lt: startDate,
      },
    },
  })

  return result.count
}

/**
 * Update quantity and unit for all future SCHEDULED doses for a schedule
 * @param scheduleId - The schedule ID
 * @param quantity - New quantity value
 * @param unit - New unit value
 * @returns Number of updated doses
 */
export async function updateScheduledDosesQuantity(
  scheduleId: string,
  quantity: number | null,
  unit: Unit | null
): Promise<number> {
  const now = new Date()

  const updateData: {
    quantity: number | null
    unit: Unit | null
  } = {
    quantity: quantity ?? null,
    unit: unit ?? null,
  }

  const result = await prisma.doseLog.updateMany({
    where: {
      scheduleId,
      status: 'SCHEDULED',
      scheduledFor: {
        gte: now,
      },
    },
    data: updateData,
  })

  return result.count
}

/**
 * Delete all future SCHEDULED doses for all schedules of a prescription
 * Used when prescription.asNeeded changes from false to true
 * @param prescriptionId - The prescription ID
 * @returns Number of deleted doses
 */
export async function deleteAllFutureDosesForPrescription(
  prescriptionId: string
): Promise<number> {
  const now = new Date()

  const result = await prisma.doseLog.deleteMany({
    where: {
      prescriptionId,
      status: 'SCHEDULED',
      scheduledFor: {
        gte: now,
      },
    },
  })

  return result.count
}
