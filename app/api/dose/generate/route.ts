import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'
import { generateDosesForSchedule } from '@/lib/dose-generation'

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
    
    const results = []
    let totalGenerated = 0
    let totalSkipped = 0

    // Generate doses for each schedule
    for (const schedule of prescription.schedules) {
      const result = await generateDosesForSchedule({
        scheduleId: schedule.id,
        prescriptionId: prescription.id,
        schedule: {
          daysOfWeek: schedule.daysOfWeek as any,
          times: schedule.times,
          doseQuantity: schedule.doseQuantity?.toNumber() ?? null,
          doseUnit: schedule.doseUnit as any,
        },
        from: fromDate,
        to: toDate,
        timezone,
        prescriptionEndDate: prescription.endDate,
        scheduleStartDate: schedule.startDate,
        scheduleEndDate: schedule.endDate,
      })

      results.push({
        scheduleId: schedule.id,
        ...result,
      })

      totalGenerated += result.generated
      totalSkipped += result.skipped
    }

    return NextResponse.json({
      message: `Generated ${totalGenerated} doses, skipped ${totalSkipped} duplicates`,
      totalGenerated,
      totalSkipped,
      results,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error generating doses:', error)
    return NextResponse.json({ error: 'Failed to generate doses' }, { status: 500 })
  }
}
