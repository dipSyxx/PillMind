import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { timezone } = body

    if (!timezone) {
      return NextResponse.json({ error: 'Timezone is required' }, { status: 400 })
    }

    // Update all user's schedules with new timezone
    const result = await prisma.schedule.updateMany({
      where: {
        prescription: {
          userId,
        },
      },
      data: {
        timezone,
      },
    })

    return NextResponse.json({
      message: `Updated ${result.count} schedules with timezone ${timezone}`,
      updatedCount: result.count
    })
  } catch (error) {
    console.error('Error syncing schedule timezones:', error)
    return NextResponse.json({ error: 'Failed to sync schedule timezones' }, { status: 500 })
  }
}
