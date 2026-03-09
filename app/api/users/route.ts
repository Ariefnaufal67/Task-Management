import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { tag: true } },
        assignees: { include: { user: true } },
        user: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

// PUT update task - WITH FINAL REPORT
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== UPDATE TASK ===')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, status, priority, dueDate, finalReport, tagIds, assigneeIds } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }

    // Step 1: Update basic fields including finalReport
    await prisma.task.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        finalReport: finalReport?.trim() || null  // NEW: Laporan Akhir
      }
    })
    console.log('✅ Basic fields updated (including final report)')

    // Step 2: Update Tags
    if (tagIds !== undefined) {
      await prisma.taskTag.deleteMany({
        where: { taskId: params.id }
      })
      
      if (Array.isArray(tagIds) && tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: tagIds.map((tagId: string) => ({
            taskId: params.id,
            tagId: tagId
          })),
          skipDuplicates: true
        })
      }
      console.log('✅ Tags updated')
    }

    // Step 3: Update Assignees
    if (assigneeIds !== undefined) {
      await prisma.taskAssignee.deleteMany({
        where: { taskId: params.id }
      })
      
      if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assigneeIds.map((userId: string) => ({
            taskId: params.id,
            userId: userId
          })),
          skipDuplicates: true
        })
      }
      console.log('✅ Assignees updated')
    }

    // Fetch complete task
    const updatedTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { tag: true } },
        assignees: { include: { user: true } },
        user: true
      }
    })

    console.log('✅ Update complete')
    return NextResponse.json(updatedTask)
    
  } catch (error: any) {
    console.error('❌ Update error:', error?.message)
    return NextResponse.json({ 
      error: 'Update failed',
      details: error?.message
    }, { status: 500 })
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

    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Task deleted' })
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
