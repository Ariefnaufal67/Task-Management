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

// PUT update task - WITH TAGS SUPPORT
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== UPDATE TASK START ===')
    console.log('Task ID:', params.id)
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ Session OK')

    const body = await request.json()
    console.log('📦 Body:', JSON.stringify(body, null, 2))
    
    const { title, description, status, priority, dueDate, tagIds, assigneeIds, subtasks } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }

    // STEP 1: Update basic fields
    console.log('🔄 Step 1: Update basic fields...')
    await prisma.task.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })
    console.log('✅ Basic fields updated')

    // STEP 2: Handle Tags
    if (tagIds !== undefined) {
      console.log('🔄 Step 2: Update tags...')
      console.log('Tag IDs received:', tagIds)
      
      // Delete old tags
      await prisma.taskTag.deleteMany({
        where: { taskId: params.id }
      })
      console.log('✅ Old tags deleted')
      
      // Create new tags (if any)
      if (Array.isArray(tagIds) && tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: tagIds.map((tagId: string) => ({
            taskId: params.id,
            tagId: tagId
          })),
          skipDuplicates: true
        })
        console.log('✅ New tags created:', tagIds.length)
      }
    }

    // STEP 3: Handle Assignees
    if (assigneeIds !== undefined) {
      console.log('🔄 Step 3: Update assignees...')
      console.log('Assignee IDs received:', assigneeIds)
      
      // Delete old assignees
      await prisma.taskAssignee.deleteMany({
        where: { taskId: params.id }
      })
      console.log('✅ Old assignees deleted')
      
      // Create new assignees (if any)
      if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assigneeIds.map((userId: string) => ({
            taskId: params.id,
            userId: userId
          })),
          skipDuplicates: true
        })
        console.log('✅ New assignees created:', assigneeIds.length)
      }
    }

    // STEP 4: Handle Subtasks
    if (subtasks !== undefined && subtasks !== null) {
      console.log('🔄 Step 4: Update subtasks...')
      console.log('Subtasks received:', subtasks)
      
      await prisma.task.update({
        where: { id: params.id },
        data: { subtasks: subtasks }
      })
      console.log('✅ Subtasks updated')
    }

    // STEP 5: Fetch complete task
    console.log('🔄 Step 5: Fetch complete task...')
    const updatedTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { tag: true } },
        assignees: { include: { user: true } },
        user: true
      }
    })

    console.log('✅ UPDATE COMPLETE!')
    console.log('=== UPDATE TASK END ===')
    
    return NextResponse.json(updatedTask)
    
  } catch (error: any) {
    console.error('=== UPDATE ERROR ===')
    console.error('Error:', error)
    console.error('Message:', error?.message)
    console.error('Code:', error?.code)
    console.error('===================')
    
    return NextResponse.json({ 
      error: 'Update failed',
      details: error?.message || 'Unknown error'
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

    console.log('✅ Task deleted:', params.id)
    return NextResponse.json({ message: 'Task deleted' })
    
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
