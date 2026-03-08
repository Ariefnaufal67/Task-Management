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

// PUT update task - ULTRA SIMPLE VERSION
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== UPDATE TASK START ===')
    console.log('Task ID:', params.id)
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('❌ No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ Session OK:', session.user.email)

    const body = await request.json()
    console.log('📦 Request body:', JSON.stringify(body, null, 2))
    
    const { title, description, status, priority, dueDate } = body

    if (!title?.trim()) {
      console.log('❌ No title')
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }

    // STEP 1: Update ONLY basic fields - NO RELATIONS, NO SUBTASKS
    console.log('🔄 Updating basic fields only...')
    
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        tags: { include: { tag: true } },
        assignees: { include: { user: true } },
        user: true
      }
    })

    console.log('✅ Update successful!')
    console.log('=== UPDATE TASK END ===')
    
    return NextResponse.json(updatedTask)
    
  } catch (error: any) {
    console.error('=== UPDATE ERROR ===')
    console.error('Error:', error)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    console.error('Error code:', error?.code)
    console.error('Error meta:', error?.meta)
    console.error('===================')
    
    return NextResponse.json({ 
      error: 'Update failed',
      details: error?.message || 'Unknown error',
      code: error?.code,
      meta: error?.meta
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
