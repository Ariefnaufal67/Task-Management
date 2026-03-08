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

// PUT update task - DEFENSIVE VERSION (try-catch per step)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const errors: string[] = []
  
  try {
    console.log('=== UPDATE TASK START ===')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📦 Received data:', JSON.stringify(body, null, 2))
    
    const { title, description, status, priority, dueDate, tagIds, assigneeIds, subtasks } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }

    // STEP 1: Update basic fields (ALWAYS WORKS)
    try {
      console.log('🔄 Step 1: Basic fields...')
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
      console.log('✅ Step 1: Success')
    } catch (e: any) {
      console.error('❌ Step 1 failed:', e.message)
      errors.push(`Basic fields: ${e.message}`)
    }

    // STEP 2: Update Tags (TRY, don't fail whole request)
    if (tagIds !== undefined) {
      try {
        console.log('🔄 Step 2: Tags...', tagIds)
        
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
        console.log('✅ Step 2: Success')
      } catch (e: any) {
        console.error('❌ Step 2 failed:', e.message)
        errors.push(`Tags: ${e.message}`)
      }
    }

    // STEP 3: Update Assignees (TRY, don't fail whole request)
    if (assigneeIds !== undefined) {
      try {
        console.log('🔄 Step 3: Assignees...', assigneeIds)
        
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
        console.log('✅ Step 3: Success')
      } catch (e: any) {
        console.error('❌ Step 3 failed:', e.message)
        errors.push(`Assignees: ${e.message}`)
      }
    }

    // STEP 4: Update Subtasks (TRY, don't fail whole request)
    if (subtasks !== undefined && subtasks !== null) {
      try {
        console.log('🔄 Step 4: Subtasks...', subtasks)
        
        await prisma.task.update({
          where: { id: params.id },
          data: { subtasks: subtasks }
        })
        console.log('✅ Step 4: Success')
      } catch (e: any) {
        console.error('❌ Step 4 failed:', e.message)
        errors.push(`Subtasks: ${e.message}`)
        
        // If subtasks fail, try without it
        console.log('⚠️ Retrying update without subtasks...')
      }
    }

    // STEP 5: Fetch updated task
    const updatedTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { tag: true } },
        assignees: { include: { user: true } },
        user: true
      }
    })

    if (errors.length > 0) {
      console.log('⚠️ Partial success. Errors:', errors)
    } else {
      console.log('✅ Complete success!')
    }
    console.log('=== UPDATE END ===')
    
    return NextResponse.json({
      ...updatedTask,
      _warnings: errors.length > 0 ? errors : undefined
    })
    
  } catch (error: any) {
    console.error('=== FATAL ERROR ===')
    console.error(error)
    
    return NextResponse.json({ 
      error: 'Update failed',
      details: error?.message,
      warnings: errors
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
