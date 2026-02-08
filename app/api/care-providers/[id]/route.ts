import { getUserIdFromSession } from '@/lib/session'
import prisma from '@/prisma/prisma-client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const careProviderUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  clinic: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const careProvider = await prisma.careProvider.findFirst({
      where: { id, userId },
      include: {
        prescriptions: {
          include: {
            medication: true,
            schedules: true,
          },
        },
      },
    })

    if (!careProvider) {
      return NextResponse.json({ error: 'Care provider not found' }, { status: 404 })
    }

    return NextResponse.json(careProvider)
  } catch (error) {
    console.error('Error fetching care provider:', error)
    return NextResponse.json({ error: 'Failed to fetch care provider' }, { status: 500 })
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
    const validatedData = careProviderUpdateSchema.parse(body)

    // Check if care provider exists and belongs to user
    const existingCareProvider = await prisma.careProvider.findFirst({
      where: { id, userId },
    })

    if (!existingCareProvider) {
      return NextResponse.json({ error: 'Care provider not found' }, { status: 404 })
    }

    const careProvider = await prisma.careProvider.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(careProvider)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating care provider:', error)
    return NextResponse.json({ error: 'Failed to update care provider' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    // Check if care provider exists and belongs to user
    const existingCareProvider = await prisma.careProvider.findFirst({
      where: { id, userId },
      include: {
        prescriptions: true,
      },
    })

    if (!existingCareProvider) {
      return NextResponse.json({ error: 'Care provider not found' }, { status: 404 })
    }

    // Check if care provider has active prescriptions
    if (existingCareProvider.prescriptions.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete care provider with active prescriptions',
        },
        { status: 400 },
      )
    }

    await prisma.careProvider.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Care provider deleted successfully' })
  } catch (error) {
    console.error('Error deleting care provider:', error)
    return NextResponse.json({ error: 'Failed to delete care provider' }, { status: 500 })
  }
}
