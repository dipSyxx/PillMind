import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'
import { startOfWeek, addDays, isSameDay, weekdayOf, tzHmToUtcISO, addDaysInTz, startOfDayInTz } from '@/lib/medication-utils'

const generateDosesSchema = z.object({
  prescriptionId: z.string().min(1),
  from: z.string().datetime(),
  to: z.string().datetime(),
  timezone: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = generateDosesSchema.parse(body)

    // Check if prescription exists and belongs to user
    const prescription = await prisma.prescription.findFirst({
      where: { id: validatedData.prescriptionId, userId },
      include: {
        schedules: true,
      },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    if (prescription.asNeeded) {
      return NextResponse.json({ error: 'Cannot generate doses for PRN prescriptions' }, { status: 400 })
    }

    const fromDate = new Date(validatedData.from)
    const toDate = new Date(validatedData.to)
    const timezone = validatedData.timezone
    const generatedDoses = []

    // Generate doses for each schedule
    for (const schedule of prescription.schedules) {
      const currentDate = startOfDayInTz(fromDate, timezone)

      while (currentDate <= toDate) {
        const weekday = weekdayOf(currentDate, timezone)

        // Check if this day is in the schedule
        if (schedule.daysOfWeek.includes(weekday)) {
          // Generate doses for each time in the schedule
          for (const time of schedule.times) {
            const scheduledForUtc = tzHmToUtcISO(currentDate, time, timezone)

            // Check if dose already exists
            const existingDose = await prisma.doseLog.findFirst({
              where: {
                prescriptionId: prescription.id,
                scheduleId: schedule.id,
                scheduledFor: new Date(scheduledForUtc),
              },
            })

            if (!existingDose) {
              const doseLog = await prisma.doseLog.create({
                data: {
                  prescriptionId: prescription.id,
                  scheduleId: schedule.id,
                  scheduledFor: new Date(scheduledForUtc),
                  status: 'SCHEDULED',
                  quantity: schedule.doseQuantity,
                  unit: schedule.doseUnit,
                },
              })
              generatedDoses.push(doseLog)
            }
          }
        }

        // Move to next day in timezone
        const nextDay = addDaysInTz(currentDate, 1, timezone)
        currentDate.setTime(nextDay.getTime())
      }
    }

    return NextResponse.json({
      message: `Generated ${generatedDoses.length} doses`,
      generatedDoses,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error generating doses:', error)
    return NextResponse.json({ error: 'Failed to generate doses' }, { status: 500 })
  }
}
