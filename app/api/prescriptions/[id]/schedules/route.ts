import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'
import { checkScheduleConflicts } from '@/lib/schedule-conflict-checker'
import { generateDosesForSchedule } from '@/lib/dose-generation'

const scheduleSchema = z.object({
  timezone: z.string().min(1),
  daysOfWeek: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])),
  times: z.array(z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)), // HH:mm format
  doseQuantity: z.number().positive().optional(),
  doseUnit: z.enum(['MG', 'MCG', 'G', 'ML', 'IU', 'DROP', 'PUFF', 'UNIT', 'TAB', 'CAPS']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
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
    // Check if prescription exists and belongs to user
    const prescription = await prisma.prescription.findFirst({
      where: { id, userId },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    const schedules = await prisma.schedule.findMany({
      where: { prescriptionId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(
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
    const validatedData = scheduleSchema.parse(body)

    // Check if prescription exists and belongs to user
    const prescription = await prisma.prescription.findFirst({
      where: { id, userId },
      include: {
        schedules: true,
      },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Get user settings to validate timezone
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    })

    const userTimezone = userSettings?.timezone || 'UTC'

    // Validate timezone matches user timezone
    if (validatedData.timezone !== userTimezone) {
      return NextResponse.json(
        {
          error: `Schedule timezone must match user timezone (${userTimezone})`,
          code: 'TIMEZONE_MISMATCH',
        },
        { status: 400 }
      )
    }

    // Validate schedule dates against prescription dates
    const scheduleStartDate = validatedData.startDate ? new Date(validatedData.startDate) : null
    const scheduleEndDate = validatedData.endDate ? new Date(validatedData.endDate) : null
    const now = new Date()

    if (scheduleStartDate && scheduleStartDate < prescription.startDate) {
      return NextResponse.json(
        { error: 'Schedule start date cannot be before prescription start date' },
        { status: 400 }
      )
    }

    if (scheduleEndDate && prescription.endDate && scheduleEndDate > prescription.endDate) {
      return NextResponse.json(
        { error: 'Schedule end date cannot be after prescription end date' },
        { status: 400 }
      )
    }

    if (scheduleStartDate && scheduleEndDate && scheduleEndDate < scheduleStartDate) {
      return NextResponse.json(
        { error: 'Schedule end date cannot be before start date' },
        { status: 400 }
      )
    }

    // Validate that schedule dates are not too far in the past
    // Allow schedules starting up to 7 days in the past (for data migration scenarios)
    const maxPastDays = 7
    const maxPastDate = new Date(now.getTime() - maxPastDays * 24 * 60 * 60 * 1000)
    if (scheduleStartDate && scheduleStartDate < maxPastDate) {
      return NextResponse.json(
        { error: `Schedule start date cannot be more than ${maxPastDays} days in the past` },
        { status: 400 }
      )
    }

    if (scheduleEndDate && scheduleEndDate < maxPastDate) {
      return NextResponse.json(
        { error: `Schedule end date cannot be more than ${maxPastDays} days in the past` },
        { status: 400 }
      )
    }

    // Check for conflicts with existing schedules
    const conflicts = checkScheduleConflicts(
      {
        daysOfWeek: validatedData.daysOfWeek,
        times: validatedData.times,
        startDate: scheduleStartDate,
        endDate: scheduleEndDate,
      },
      prescription.schedules.map((s) => ({
        id: s.id,
        daysOfWeek: s.daysOfWeek as any,
        times: s.times,
        startDate: s.startDate,
        endDate: s.endDate,
      })),
    )

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          code: 'SCHEDULE_CONFLICT',
          message: 'Schedule conflicts with existing schedules',
          conflicts,
        },
        { status: 409 }
      )
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const schedule = await tx.schedule.create({
        data: {
          prescriptionId: id,
          timezone: validatedData.timezone,
          daysOfWeek: validatedData.daysOfWeek,
          times: validatedData.times,
          doseQuantity: validatedData.doseQuantity,
          doseUnit: validatedData.doseUnit,
          startDate: scheduleStartDate,
          endDate: scheduleEndDate,
        },
      })

      // Auto-generate doses for the new schedule (if not PRN)
      let doseGenerationResult = null
      if (!prescription.asNeeded) {
        try {
          const now = new Date()
          const fourWeeksLater = new Date(now)
          fourWeeksLater.setDate(fourWeeksLater.getDate() + 28)

          doseGenerationResult = await generateDosesForSchedule({
            scheduleId: schedule.id,
            prescriptionId: id,
            schedule: {
              daysOfWeek: schedule.daysOfWeek as any,
              times: schedule.times,
              doseQuantity: schedule.doseQuantity?.toNumber() ?? null,
              doseUnit: schedule.doseUnit as any,
            },
            from: now,
            to: fourWeeksLater,
            timezone: userTimezone,
            prescriptionEndDate: prescription.endDate,
            scheduleStartDate: scheduleStartDate,
            scheduleEndDate: scheduleEndDate,
          })
        } catch (error) {
          console.error('Error generating doses for new schedule:', error)
          // Don't fail the transaction if dose generation fails
          doseGenerationResult = {
            requested: 0,
            generated: 0,
            skipped: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          }
        }
      }

      return { schedule, doseGenerationResult }
    })

    // Return schedule with dose generation info
    const response: any = result.schedule
    if (result.doseGenerationResult) {
      response.doseGeneration = result.doseGenerationResult
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
