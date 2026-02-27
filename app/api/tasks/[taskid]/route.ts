import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT update task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, priority, status, dueDate, tagIds, assigneeIds, subtasks } = body

    // Check if user owns the task or is assigned to it
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignees: true
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const canEdit = existingTask.userId === session.user.id || 
                    existingTask.assignees.some(a => a.userId === session.user.id)

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete existing relations
    await prisma.taskTag.deleteMany({
      where: { taskId: params.id }
    })
    await prisma.taskAssignee.deleteMany({
      where: { taskId: params.id }
    })
    await prisma.subtask.deleteMany({
      where: { taskId: params.id }
    })

    // Update task
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
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
        subtasks: {
          orderBy: {
            order: 'asc'
          }
        },
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

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
