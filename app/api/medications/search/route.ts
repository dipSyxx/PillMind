import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters long' }, { status: 400 })
    }

    const medications = await prisma.medication.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brandName: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        inventory: true,
        prescriptions: {
          include: {
            schedules: true,
          },
        },
      },
      take: limit,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(medications)
  } catch (error) {
    console.error('Error searching medications:', error)
    return NextResponse.json({ error: 'Failed to search medications' }, { status: 500 })
  }
}
