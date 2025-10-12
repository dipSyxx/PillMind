import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'
import { startOfWeek, addDays, isSameDay } from 'date-fns'

const generateDosesSchema = z.object({
  prescriptionId: z.string().min(1),
  from: z.string().datetime(),
  to: z.string().datetime(),
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
    const generatedDoses = []

    // Generate doses for each schedule
    for (const schedule of prescription.schedules) {
      const currentDate = new Date(fromDate)

      while (currentDate <= toDate) {
        const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase().slice(0, 3) as any

        // Check if this day is in the schedule
        if (schedule.daysOfWeek.includes(weekday)) {
          // Generate doses for each time in the schedule
          for (const time of schedule.times) {
            const [hours, minutes] = time.split(':').map(Number)
            const scheduledFor = new Date(currentDate)
            scheduledFor.setHours(hours, minutes, 0, 0)

            // Check if dose already exists
            const existingDose = await prisma.doseLog.findFirst({
              where: {
                prescriptionId: prescription.id,
                scheduleId: schedule.id,
                scheduledFor,
              },
            })

            if (!existingDose) {
              const doseLog = await prisma.doseLog.create({
                data: {
                  prescriptionId: prescription.id,
                  scheduleId: schedule.id,
                  scheduledFor,
                  status: 'SCHEDULED',
                  quantity: schedule.doseQuantity,
                  unit: schedule.doseUnit,
                },
              })
              generatedDoses.push(doseLog)
            }
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
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
