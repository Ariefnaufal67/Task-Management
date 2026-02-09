import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          {
            assignees: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        subtasks: {
          orderBy: {
            order: 'asc'
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        attachments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST create new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, priority, status, dueDate, tagIds, assigneeIds, subtasks } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        status: status || 'todo',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: session.user.id,
        tags: tagIds ? {
          create: tagIds.map((tagId: string) => ({
            tag: { connect: { id: tagId } }
          }))
        } : undefined,
        assignees: assigneeIds ? {
          create: assigneeIds.map((userId: string) => ({
            user: { connect: { id: userId } }
          }))
        } : undefined,
        subtasks: subtasks ? {
          create: subtasks.map((subtask: any, index: number) => ({
            title: subtask.title,
            completed: subtask.completed || false,
            order: index
          }))
        } : undefined
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        subtasks: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
