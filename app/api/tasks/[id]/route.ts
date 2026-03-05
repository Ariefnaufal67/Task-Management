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
        user: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
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

// PUT update task (FINAL FIX - Proper subtasks handling)
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
    console.log('📝 Update request for task:', params.id)
    
    const { title, description, status, priority, dueDate, tagIds, assigneeIds, subtasks } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Prepare update data - conditional subtasks
    const updateData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null
    }

    // Only add subtasks if it's actually provided and not empty
    if (subtasks !== undefined && subtasks !== null) {
      updateData.subtasks = subtasks
    }

    console.log('Update data:', updateData)

    // Step 1: Delete existing tag relations
    await prisma.taskTag.deleteMany({
      where: { taskId: params.id }
    })
    console.log('✅ Deleted old tags')

    // Step 2: Delete existing assignee relations  
    await prisma.taskAssignee.deleteMany({
      where: { taskId: params.id }
    })
    console.log('✅ Deleted old assignees')

    // Step 3: Update task basic fields
    await prisma.task.update({
      where: { id: params.id },
      data: updateData
    })
    console.log('✅ Updated task fields')

    // Step 4: Create new tag relations (if any)
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await prisma.taskTag.createMany({
        data: tagIds.map((tagId: string) => ({
          taskId: params.id,
          tagId: tagId
        })),
        skipDuplicates: true
      })
      console.log('✅ Created new tags:', tagIds.length)
    }

    // Step 5: Create new assignee relations (if any)
    if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      await prisma.taskAssignee.createMany({
        data: assigneeIds.map((userId: string) => ({
          taskId: params.id,
          userId: userId
        })),
        skipDuplicates: true
      })
      console.log('✅ Created new assignees:', assigneeIds.length)
    }

    // Step 6: Fetch complete updated task with all relations
    const updatedTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { tag: true } },
        assignees: { include: { user: true } },
        user: true
      }
    })

    console.log('✅ Task updated successfully!')
    return NextResponse.json(updatedTask)
    
  } catch (error) {
    console.error('❌ PUT Error:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
    
    return NextResponse.json({ 
      error: 'Failed to update task',
      message: error instanceof Error ? error.message : 'Unknown error'
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

    const task = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete task (cascade will delete related records)
    await prisma.task.delete({
      where: { id: params.id }
    })

    console.log('✅ Task deleted:', params.id)
    return NextResponse.json({ message: 'Task deleted successfully' })
    
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
