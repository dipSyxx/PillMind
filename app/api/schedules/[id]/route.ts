import {
  deleteFutureDosesForSchedule,
  deletePastDosesForSchedule,
  updateScheduledDosesQuantity,
} from '@/lib/dose-cleanup'
import { generateDosesForSchedule } from '@/lib/dose-generation'
import { checkScheduleConflicts } from '@/lib/schedule-conflict-checker'
import { getUserIdFromSession } from '@/lib/session'
import prisma from '@/prisma/prisma-client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const scheduleUpdateSchema = z.object({
  timezone: z.string().min(1).optional(),
  daysOfWeek: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).optional(),
  times: z.array(z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)).optional(), // HH:mm format
  doseQuantity: z.number().positive().optional(),
  doseUnit: z.enum(['MG', 'MCG', 'G', 'ML', 'IU', 'DROP', 'PUFF', 'UNIT', 'TAB', 'CAPS']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const schedule = await prisma.schedule.findFirst({
      where: {
        id,
        prescription: {
          userId,
        },
      },
      include: {
        prescription: {
          include: {
            medication: true,
          },
        },
        doseLogs: {
          orderBy: { scheduledFor: 'desc' },
          take: 10,
        },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = scheduleUpdateSchema.parse(body)

    // Check if schedule exists and belongs to user
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        id,
        prescription: {
          userId,
        },
      },
      include: {
        prescription: {
          include: {
            schedules: true,
          },
        },
      },
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Get user settings to validate timezone
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    })

    const userTimezone = userSettings?.timezone || 'UTC'

    // Validate timezone if provided
    if (validatedData.timezone && validatedData.timezone !== userTimezone) {
      return NextResponse.json(
        {
          error: `Schedule timezone must match user timezone (${userTimezone})`,
          code: 'TIMEZONE_MISMATCH',
        },
        { status: 400 },
      )
    }

    const newTimezone = validatedData.timezone || existingSchedule.timezone
    const newStartDate = validatedData.startDate ? new Date(validatedData.startDate) : existingSchedule.startDate
    const newEndDate = validatedData.endDate ? new Date(validatedData.endDate) : existingSchedule.endDate
    const newDaysOfWeek = validatedData.daysOfWeek || existingSchedule.daysOfWeek
    const newTimes = validatedData.times || existingSchedule.times

    // Validate schedule dates against prescription dates
    const now = new Date()

    if (newStartDate && newStartDate < existingSchedule.prescription.startDate) {
      return NextResponse.json(
        { error: 'Schedule start date cannot be before prescription start date' },
        { status: 400 },
      )
    }

    if (newEndDate && existingSchedule.prescription.endDate && newEndDate > existingSchedule.prescription.endDate) {
      return NextResponse.json({ error: 'Schedule end date cannot be after prescription end date' }, { status: 400 })
    }

    if (newStartDate && newEndDate && newEndDate < newStartDate) {
      return NextResponse.json({ error: 'Schedule end date cannot be before start date' }, { status: 400 })
    }

    // Validate that schedule dates are not too far in the past
    // Allow schedules starting up to 7 days in the past (for data migration scenarios)
    const maxPastDays = 7
    const maxPastDate = new Date(now.getTime() - maxPastDays * 24 * 60 * 60 * 1000)
    if (newStartDate && newStartDate < maxPastDate) {
      return NextResponse.json(
        { error: `Schedule start date cannot be more than ${maxPastDays} days in the past` },
        { status: 400 },
      )
    }

    if (newEndDate && newEndDate < maxPastDate) {
      return NextResponse.json(
        { error: `Schedule end date cannot be more than ${maxPastDays} days in the past` },
        { status: 400 },
      )
    }

    // Check for conflicts with existing schedules (excluding current schedule)
    const conflicts = checkScheduleConflicts(
      {
        daysOfWeek: newDaysOfWeek as any,
        times: newTimes,
        startDate: newStartDate,
        endDate: newEndDate,
      },
      existingSchedule.prescription.schedules.map((s) => ({
        id: s.id,
        daysOfWeek: s.daysOfWeek as any,
        times: s.times,
        startDate: s.startDate,
        endDate: s.endDate,
      })),
      id, // Exclude current schedule from conflict check
    )

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          code: 'SCHEDULE_CONFLICT',
          message: 'Schedule conflicts with existing schedules',
          conflicts,
        },
        { status: 409 },
      )
    }

    // Cleanup doses based on date changes
    if (newEndDate && (!existingSchedule.endDate || newEndDate < existingSchedule.endDate)) {
      // End date moved earlier - delete doses after new end date
      // Use deleteMany directly to delete doses after endDate
      await prisma.doseLog.deleteMany({
        where: {
          scheduleId: id,
          status: 'SCHEDULED',
          scheduledFor: {
            gt: newEndDate,
          },
        },
      })
    }

    if (newStartDate && (!existingSchedule.startDate || newStartDate > existingSchedule.startDate)) {
      // Start date moved later - delete doses before new start date
      await deletePastDosesForSchedule(id, newStartDate)
    }

    // Check if critical fields changed (require regeneration)
    const timezoneChanged = validatedData.timezone && validatedData.timezone !== existingSchedule.timezone
    const daysOfWeekChanged =
      validatedData.daysOfWeek &&
      JSON.stringify(validatedData.daysOfWeek.sort()) !== JSON.stringify(existingSchedule.daysOfWeek.sort())
    const timesChanged =
      validatedData.times &&
      JSON.stringify(validatedData.times.sort()) !== JSON.stringify(existingSchedule.times.sort())

    // If critical fields changed, delete all future doses and regenerate them
    let doseGenerationResult = null
    if (timezoneChanged || daysOfWeekChanged || timesChanged) {
      await deleteFutureDosesForSchedule(id)

      // Regenerate doses with new schedule parameters
      if (!existingSchedule.prescription.asNeeded) {
        try {
          const now = new Date()
          const fourWeeksLater = new Date(now)
          fourWeeksLater.setDate(fourWeeksLater.getDate() + 28)

          const scheduleTimezone = newTimezone || existingSchedule.timezone

          doseGenerationResult = await generateDosesForSchedule({
            scheduleId: id,
            prescriptionId: existingSchedule.prescriptionId,
            schedule: {
              daysOfWeek: newDaysOfWeek as any,
              times: newTimes,
              doseQuantity: validatedData.doseQuantity ?? existingSchedule.doseQuantity?.toNumber() ?? null,
              doseUnit: (validatedData.doseUnit ?? existingSchedule.doseUnit) as any,
            },
            from: now,
            to: fourWeeksLater,
            timezone: scheduleTimezone,
            prescriptionEndDate: existingSchedule.prescription.endDate,
            scheduleStartDate: newStartDate,
            scheduleEndDate: newEndDate,
          })
        } catch (error) {
          console.error('Error regenerating doses after schedule update:', error)
          // Don't fail the request if regeneration fails
          doseGenerationResult = {
            requested: 0,
            generated: 0,
            skipped: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          }
        }
      }
    }

    // Update quantity/unit for future SCHEDULED doses if changed
    if (validatedData.doseQuantity !== undefined || validatedData.doseUnit !== undefined) {
      const newQuantity = validatedData.doseQuantity ?? existingSchedule.doseQuantity?.toNumber() ?? null
      const newUnit = validatedData.doseUnit ?? existingSchedule.doseUnit ?? null
      await updateScheduledDosesQuantity(id, newQuantity, newUnit as any)
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        ...validatedData,
        timezone: newTimezone,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      },
      include: {
        prescription: true,
      },
    })

    // Add dose generation info to response if available
    const response: any = schedule
    if (doseGenerationResult) {
      response.doseGeneration = doseGenerationResult
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating schedule:', error)
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    // Check if schedule exists and belongs to user
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        id,
        prescription: {
          userId,
        },
      },
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Delete all future SCHEDULED doses for this schedule before deleting the schedule
    const deletedDosesCount = await deleteFutureDosesForSchedule(id)
    console.log(`Deleted ${deletedDosesCount} future SCHEDULED doses for schedule ${id}`)

    await prisma.schedule.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Schedule deleted successfully',
      deletedDosesCount,
    })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}
