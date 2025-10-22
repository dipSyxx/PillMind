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
  const { status, takenAt, scheduledFor, quantity, unit } = body

  const updateData: any = {}

  if (status !== undefined) {
    updateData.status = status
  }

  if (Object.prototype.hasOwnProperty.call(body, 'takenAt')) {
    updateData.takenAt = takenAt ? new Date(takenAt) : null
  }

  if (Object.prototype.hasOwnProperty.call(body, 'scheduledFor')) {
    updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null
  }

  if (Object.prototype.hasOwnProperty.call(body, 'quantity')) {
    if (quantity === null || quantity === undefined) {
      updateData.quantity = null
    } else {
      const parsedQuantity = Number(quantity)
      if (!Number.isFinite(parsedQuantity)) {
        return NextResponse.json({ error: 'Invalid quantity value' }, { status: 400 })
      }
      updateData.quantity = parsedQuantity
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'unit')) {
    updateData.unit = unit ?? null
  }

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

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No update fields provided' }, { status: 400 })
  }

  const updatedDoseLog = await prisma.doseLog.update({
    where: { id: params.id },
    data: updateData,
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
