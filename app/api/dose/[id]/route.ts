import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { status, takenAt, scheduledFor } = body

  // Verify that the dose log belongs to the user
  const doseLog = await prisma.doseLog.findFirst({
    where: { id: params.id },
    include: {
      prescription: {
        select: { userId: true },
      },
    },
  })

  if (!doseLog || doseLog.prescription.userId !== userId) {
    return NextResponse.json({ error: 'Dose log not found' }, { status: 404 })
  }

  const updatedDoseLog = await prisma.doseLog.update({
    where: { id: params.id },
    data: {
      status,
      takenAt: takenAt ? new Date(takenAt) : null,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    },
    include: {
      prescription: {
        include: {
          medication: {
            include: {
              inventory: true,
            },
          },
          provider: true,
        },
      },
      schedule: {
        select: {
          id: true,
          doseQuantity: true,
          doseUnit: true,
        },
      },
    },
  })

  return NextResponse.json(updatedDoseLog)
}
