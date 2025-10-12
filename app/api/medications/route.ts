import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'

const medicationSchema = z.object({
  name: z.string().min(1).max(100),
  brandName: z.string().optional(),
  form: z.enum(['TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'INHALER', 'TOPICAL', 'DROPS', 'OTHER']),
  strengthValue: z.number().positive().optional(),
  strengthUnit: z.enum(['MG', 'MCG', 'G', 'ML', 'IU', 'DROP', 'PUFF', 'UNIT', 'TAB', 'CAPS']).optional(),
  route: z.enum(['ORAL', 'SUBLINGUAL', 'INHALATION', 'TOPICAL', 'INJECTION', 'OPHTHALMIC', 'NASAL', 'RECTAL', 'OTHER']).optional(),
  notes: z.string().optional(),
})

export async function GET() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const medications = await prisma.medication.findMany({
      where: { userId },
      include: {
        inventory: true,
        prescriptions: {
          include: {
            schedules: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(medications)
  } catch (error) {
    console.error('Error fetching medications:', error)
    return NextResponse.json({ error: 'Failed to fetch medications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = medicationSchema.parse(body)

    const medication = await prisma.medication.create({
      data: {
        userId,
        ...validatedData,
      },
      include: {
        inventory: true,
        prescriptions: {
          include: {
            schedules: true,
          },
        },
      },
    })

    return NextResponse.json(medication, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating medication:', error)
    return NextResponse.json({ error: 'Failed to create medication' }, { status: 500 })
  }
}
