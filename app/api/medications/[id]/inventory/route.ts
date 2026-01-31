import { nowInTz } from '@/lib/medication-utils'
import { getUserIdFromSession } from '@/lib/session'
import prisma from '@/prisma/prisma-client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const inventorySchema = z.object({
  currentQty: z.number().min(0),
  unit: z.enum(['MG', 'MCG', 'G', 'ML', 'IU', 'DROP', 'PUFF', 'UNIT', 'TAB', 'CAPS']),
  lowThreshold: z.number().min(0).optional(),
  lastRestockedAt: z.string().datetime().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    // Check if medication exists and belongs to user
    const medication = await prisma.medication.findFirst({
      where: { id, userId },
      include: {
        inventory: true,
      },
    })

    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }

    return NextResponse.json(medication.inventory)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = inventorySchema.parse(body)

    // Check if medication exists and belongs to user
    const medication = await prisma.medication.findFirst({
      where: { id, userId },
    })

    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }

    // Check if inventory already exists
    const existingInventory = await prisma.inventory.findUnique({
      where: { medicationId: id },
    })

    if (existingInventory) {
      return NextResponse.json({ error: 'Inventory already exists for this medication' }, { status: 400 })
    }

    const inventory = await prisma.inventory.create({
      data: {
        medicationId: id,
        currentQty: validatedData.currentQty,
        unit: validatedData.unit,
        lowThreshold: validatedData.lowThreshold,
        lastRestockedAt: validatedData.lastRestockedAt ? new Date(validatedData.lastRestockedAt) : null,
      },
    })

    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating inventory:', error)
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 })
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
    const validatedData = inventorySchema.parse(body)

    // Check if medication exists and belongs to user
    const medication = await prisma.medication.findFirst({
      where: { id, userId },
      include: {
        user: {
          include: {
            settings: true,
          },
        },
      },
    })

    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }

    // Get user's timezone for proper timestamp handling
    const userTimezone = medication.user.settings?.timezone || 'UTC'
    const nowInUserTz = nowInTz(userTimezone)

    // Check if inventory exists to determine if this is a restock
    const existingInventory = await prisma.inventory.findUnique({
      where: { medicationId: id },
    })

    // Calculate if this is a restock (quantity increased)
    const isRestock = existingInventory && validatedData.currentQty > Number(existingInventory.currentQty)
    const lastRestockedAt = isRestock
      ? nowInUserTz
      : validatedData.lastRestockedAt
        ? new Date(validatedData.lastRestockedAt)
        : existingInventory?.lastRestockedAt

    const inventory = await prisma.inventory.upsert({
      where: { medicationId: id },
      update: {
        currentQty: validatedData.currentQty,
        unit: validatedData.unit,
        lowThreshold: validatedData.lowThreshold,
        lastRestockedAt,
      },
      create: {
        medicationId: id,
        currentQty: validatedData.currentQty,
        unit: validatedData.unit,
        lowThreshold: validatedData.lowThreshold,
        lastRestockedAt,
      },
    })

    return NextResponse.json(inventory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating inventory:', error)
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}
