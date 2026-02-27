import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to create activity log
export async function createActivity(
  taskId: string,
  userId: string,
  action: string,
  details?: string
) {
  try {
    // Store activities as special comments with [ACTIVITY] prefix
    // This is a temporary solution until we add Activity model to schema
    await prisma.comment.create({
      data: {
        content: `[ACTIVITY] ${action}${details ? `: ${details}` : ''}`,
        taskId,
        userId
      }
    })
  } catch (error) {
    console.error('Failed to create activity:', error)
  }
}

// GET activity history for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get activities (comments with [ACTIVITY] prefix)
    const activities = await prisma.comment.findMany({
      where: {
        taskId: params.taskId,
        content: {
          startsWith: '[ACTIVITY]'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 activities
    })

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      action: activity.content.replace('[ACTIVITY] ', ''),
      user: activity.user,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt
    }))

    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

// POST create activity log (called internally by other APIs)
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, details } = body

    if (!action?.trim()) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    await createActivity(params.taskId, session.user.id, action, details)

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
