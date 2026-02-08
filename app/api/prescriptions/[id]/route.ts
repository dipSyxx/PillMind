import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'
import {
  deleteFutureDosesForPrescription,
  deleteAllFutureDosesForPrescription,
} from '@/lib/dose-cleanup'
import { generateDosesForSchedule } from '@/lib/dose-generation'

const prescriptionUpdateSchema = z.object({
  providerId: z.string().optional(),
  indication: z.string().optional(),
  asNeeded: z.boolean().optional(),
  maxDailyDose: z.number().positive().optional(),
  instructions: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  autoCreateSchedule: z.boolean().optional(), // Auto-create schedule when asNeeded changes from true to false
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const prescription = await prisma.prescription.findFirst({
      where: { id, userId },
      include: {
        medication: {
          include: {
            inventory: true,
          },
        },
        schedules: true,
        provider: true,
        doseLogs: {
          orderBy: { scheduledFor: 'desc' },
        },
      },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    return NextResponse.json(prescription)
  } catch (error) {
    console.error('Error fetching prescription:', error)
    return NextResponse.json({ error: 'Failed to fetch prescription' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = prescriptionUpdateSchema.parse(body)

    // Check if prescription exists and belongs to user
    const existingPrescription = await prisma.prescription.findFirst({
      where: { id, userId },
    })

    if (!existingPrescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Check if provider exists and belongs to user (if provided)
    if (validatedData.providerId) {
      const provider = await prisma.careProvider.findFirst({
        where: { id: validatedData.providerId, userId },
      })

      if (!provider) {
        return NextResponse.json({ error: 'Care provider not found' }, { status: 404 })
      }
    }

    const newEndDate = validatedData.endDate ? new Date(validatedData.endDate) : existingPrescription.endDate
    const asNeededChanged = validatedData.asNeeded !== undefined && validatedData.asNeeded !== existingPrescription.asNeeded
    const autoCreateSchedule = validatedData.autoCreateSchedule !== false // Default to true if not specified

    // Cleanup doses if endDate changed and moved earlier
    if (newEndDate && (!existingPrescription.endDate || newEndDate < existingPrescription.endDate)) {
      await deleteFutureDosesForPrescription(id, newEndDate)
    }

    // If asNeeded changed from false to true, delete all schedules and future doses
    if (asNeededChanged && validatedData.asNeeded === true && existingPrescription.asNeeded === false) {
      // Delete all future SCHEDULED doses
      await deleteAllFutureDosesForPrescription(id)

      // Delete all schedules for this prescription
      await prisma.schedule.deleteMany({
        where: {
          prescriptionId: id,
        },
      })
    }

    // If asNeeded changed from true to false, auto-create schedule if none exists
    if (
      asNeededChanged &&
      validatedData.asNeeded === false &&
      existingPrescription.asNeeded === true &&
      existingPrescription.schedules.length === 0 &&
      autoCreateSchedule
    ) {
      // Get user settings for timezone
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
      })

      const userTimezone = userSettings?.timezone || 'UTC'

      // Create default schedule
      const defaultSchedule = await prisma.schedule.create({
        data: {
          prescriptionId: id,
          timezone: userTimezone,
          daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          times: ['08:00'],
          doseQuantity: 1,
          doseUnit: 'TAB',
          startDate: existingPrescription.startDate,
          endDate: existingPrescription.endDate,
        },
      })

      // Generate doses for the next 4 weeks
      const now = new Date()
      const fourWeeksLater = new Date(now)
      fourWeeksLater.setDate(fourWeeksLater.getDate() + 28)

      try {
        const { generateDosesForSchedule } = await import('@/lib/dose-generation')
        
        await generateDosesForSchedule({
          scheduleId: defaultSchedule.id,
          prescriptionId: id,
          schedule: {
            daysOfWeek: defaultSchedule.daysOfWeek as any,
            times: defaultSchedule.times,
            doseQuantity: defaultSchedule.doseQuantity?.toNumber() ?? null,
            doseUnit: defaultSchedule.doseUnit as any,
          },
          from: now,
          to: fourWeeksLater,
          timezone: userTimezone,
          prescriptionEndDate: existingPrescription.endDate,
          scheduleStartDate: existingPrescription.startDate,
          scheduleEndDate: existingPrescription.endDate,
        })
      } catch (error) {
        console.error('Error generating doses for auto-created schedule:', error)
        // Don't fail the request if dose generation fails
      }
    }

    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      },
      include: {
        medication: {
          include: {
            inventory: true,
          },
        },
        schedules: {
          orderBy: { createdAt: 'asc' },
        },
        provider: true,
      },
    })

    return NextResponse.json(prescription)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating prescription:', error)
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    // Check if prescription exists and belongs to user
    const existingPrescription = await prisma.prescription.findFirst({
      where: { id, userId },
    })

    if (!existingPrescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    await prisma.prescription.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Prescription deleted successfully' })
  } catch (error) {
    console.error('Error deleting prescription:', error)
    return NextResponse.json({ error: 'Failed to delete prescription' }, { status: 500 })
  }
}
