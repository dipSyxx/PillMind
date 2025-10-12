import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'

const careProviderSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  clinic: z.string().optional(),
})

export async function GET() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const careProviders = await prisma.careProvider.findMany({
      where: { userId },
      include: {
        prescriptions: {
          include: {
            medication: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(careProviders)
  } catch (error) {
    console.error('Error fetching care providers:', error)
    return NextResponse.json({ error: 'Failed to fetch care providers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = careProviderSchema.parse(body)

    const careProvider = await prisma.careProvider.create({
      data: {
        userId,
        ...validatedData,
      },
    })

    return NextResponse.json(careProvider, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating care provider:', error)
    return NextResponse.json({ error: 'Failed to create care provider' }, { status: 500 })
  }
}
