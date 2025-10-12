import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

export async function GET() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  })

  if (!settings) {
    // Create default settings if they don't exist
    const defaultSettings = await prisma.userSettings.create({
      data: {
        userId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        timeFormat: 'H24',
        defaultChannels: ['EMAIL'],
      },
    })
    return NextResponse.json(defaultSettings)
  }

  return NextResponse.json(settings)
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { timezone, timeFormat, defaultChannels } = body

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: {
      timezone,
      timeFormat,
      defaultChannels,
    },
    create: {
      userId,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      timeFormat: timeFormat || 'H24',
      defaultChannels: defaultChannels || ['EMAIL'],
    },
  })

  // If timezone was updated, sync all user's schedules
  if (timezone) {
    await prisma.schedule.updateMany({
      where: {
        prescription: {
          userId,
        },
      },
      data: {
        timezone,
      },
    })
  }

  return NextResponse.json(settings)
}
