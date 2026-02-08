import { getUserIdFromSession } from '@/lib/session'
import prisma from '@/prisma/prisma-client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  age: z.number().int().min(1).max(150).optional().nullable(),
  weight: z.number().positive().max(500).optional().nullable(), // kg
  height: z.number().positive().max(300).optional().nullable(), // cm
  sex: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().nullable(),
  goals: z
    .array(
      z.enum([
        'GENERAL_HEALTH',
        'WEIGHT_MANAGEMENT',
        'CHRONIC_CONDITION_MANAGEMENT',
        'PREVENTIVE_CARE',
        'FITNESS_PERFORMANCE',
        'MENTAL_HEALTH',
        'OTHER',
      ]),
    )
    .optional(),
  medicalConditions: z
    .array(
      z.enum([
        'DIABETES',
        'HYPERTENSION',
        'HEART_DISEASE',
        'ASTHMA',
        'ARTHRITIS',
        'DEPRESSION',
        'ANXIETY',
        'THYROID_DISORDERS',
        'KIDNEY_DISEASE',
        'LIVER_DISEASE',
        'CANCER',
        'AUTOIMMUNE_DISORDERS',
        'OTHER',
      ]),
    )
    .optional(),
})

export async function GET() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
      age: true,
      weight: true,
      height: true,
      sex: true,
      goals: true,
      medicalConditions: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Не віддаємо passwordHash у відповідь
  const { passwordHash, ...rest } = user

  return new NextResponse(
    JSON.stringify({
      ...rest,
      hasPassword: Boolean(passwordHash),
      weight: user.weight ? Number(user.weight) : null,
      height: user.height ? Number(user.height) : null,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  )
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = userUpdateSchema.parse(body)

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.age !== undefined) updateData.age = validatedData.age
    if (validatedData.weight !== undefined) updateData.weight = validatedData.weight
    if (validatedData.height !== undefined) updateData.height = validatedData.height
    if (validatedData.sex !== undefined) updateData.sex = validatedData.sex
    if (validatedData.goals !== undefined) updateData.goals = validatedData.goals
    if (validatedData.medicalConditions !== undefined) updateData.medicalConditions = validatedData.medicalConditions

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        age: true,
        weight: true,
        height: true,
        sex: true,
        goals: true,
        medicalConditions: true,
      },
    })

    return NextResponse.json({
      ...updatedUser,
      weight: updatedUser.weight ? Number(updatedUser.weight) : null,
      height: updatedUser.height ? Number(updatedUser.height) : null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
