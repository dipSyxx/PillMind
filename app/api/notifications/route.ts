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
    const limit = parseInt(searchParams.get('limit') || '50')
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')

    const whereClause: any = { userId }

    if (channel) {
      whereClause.channel = channel
    }

    if (status) {
      whereClause.status = status
    }

    const notifications = await prisma.notificationLog.findMany({
      where: whereClause,
      include: {
        doseLog: {
          include: {
            prescription: {
              include: {
                medication: true,
              },
            },
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
