'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import toast from 'react-hot-toast'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Search,
  Moon,
  Sun,
  LogOut,
  User,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  AlertCircle,
  GripVertical
} from 'lucide-react'

interface DashboardClientProps {
  user: any
}

// Memoized TaskCard component untuk prevent unnecessary re-renders
const TaskCard = memo(({ 
  task, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onDragStart,
  onDragEnd,
  getPriorityColor,
  isOverdue,
  users
}: any) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-gray-700 border-l-4 ${
        task.priority === 'high' ? 'border-red-500' :
        task.priority === 'medium' ? 'border-yellow-500' :
        'border-green-500'
      } rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isOverdue(task.dueDate) ? 'bg-red-50 dark:bg-red-900/20' : ''
      }`}
    >
      {/* Drag Handle */}
      <div className="flex items-center gap-2 mb-2 text-gray-400">
        <GripVertical className="h-4 w-4" />
        <span className="text-xs">Drag to move</span>
      </div>

      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white flex-1">
          {task.title}
        </h4>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onDuplicate(task)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            title="Duplicate"
          >
            <Copy className="h-4 w-4 text-green-600" />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            title="Edit"
          >
            <Edit2 className="h-4 w-4 text-blue-600" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className={`px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={`flex items-center space-x-1 ${isOverdue(task.dueDate) ? 'text-red-600 font-semibold' : ''}`}>
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
          </span>
        )}
      </div>

      {task.assignees && task.assignees.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            👤 {task.assignees.map((a: any) => a.user.name || a.user.email).join(', ')}
          </div>
        </div>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ✅ {task.subtasks.filter((s: any) => s.completed).length} / {task.subtasks.length} subtasks
          </div>
        </div>
      )}
    </div>
  )
})

TaskCard.displayName = 'TaskCard'

export default function DashboardClient({ user }: DashboardClientProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    tagIds: [] as string[],
    assigneeIds: [] as string[],
    subtasks: [] as any[]
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const fetchData = async () => {
    try {
      const [tasksRes, tagsRes, usersRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/tags'),
        fetch('/api/users')
      ])

      const tasksData = await tasksRes.json()
      const tagsData = await tagsRes.json()
      const usersData = await usersRes.json()

      setTasks(tasksData)
      setTags(tagsData)
      setUsers(usersData)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create task')

      const newTask = await response.json()
      setTasks([...tasks, newTask])
      toast.success('Task created!')
      resetForm()
    } catch (error) {
      toast.error('Failed to create task')
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title.trim()) return

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to update task')

      const updatedTask = await response.json()
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))
      toast.success('Task updated!')
      resetForm()
    } catch (error) {
      toast.error('Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete task')

      setTasks(tasks.filter(t => t.id !== taskId))
      toast.success('Task deleted!')
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const handleDuplicateTask = async (task: any) => {
    const duplicatedTask = {
      title: `${task.title} (Copy)`,
      description: task.description,
      priority: task.priority,
      status: 'todo',
      dueDate: task.dueDate,
      tagIds: task.tags?.map((t: any) => t.tagId) || [],
      assigneeIds: task.assignees?.map((a: any) => a.userId) || [],
      subtasks: task.subtasks?.map((s: any) => ({ title: s.title, completed: false })) || []
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedTask)
      })

      if (!response.ok) throw new Error('Failed to duplicate task')

      const newTask = await response.json()
      setTasks([...tasks, newTask])
      toast.success('Task duplicated!')
    } catch (error) {
      toast.error('Failed to duplicate task')
    }
  }

  // Optimized drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, task: any) => {
    setDraggedTask(task)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    
    // Add visual feedback with less opacity change
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '0.4'
  }, [])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '1'
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      setIsDragging(false)
      return
    }

    // Optimistic update - update UI immediately
    const updatedTasks = tasks.map(t => 
      t.id === draggedTask.id ? { ...t, status: newStatus } : t
    )
    setTasks(updatedTasks)
    setDraggedTask(null)
    setIsDragging(false)

    // Show instant feedback
    toast.success(`Moved to ${newStatus.replace('-', ' ')}`, { duration: 1000 })

    // Then update database in background
    try {
      const response = await fetch(`/api/tasks/${draggedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draggedTask,
          status: newStatus,
          tagIds: draggedTask.tags?.map((t: any) => t.tagId) || [],
          assigneeIds: draggedTask.assignees?.map((a: any) => a.userId) || [],
          subtasks: draggedTask.subtasks || []
        })
      })

      if (!response.ok) {
        // Revert on error
        setTasks(tasks)
        throw new Error('Failed to update task')
      }

      // Silently update with server response
      const updatedTask = await response.json()
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    } catch (error) {
      toast.error('Failed to move task')
    }
  }, [draggedTask, tasks])

  const openEditModal = useCallback((task: any) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      tagIds: task.tags?.map((t: any) => t.tagId) || [],
      assigneeIds: task.assignees?.map((a: any) => a.userId) || [],
      subtasks: task.subtasks || []
    })
    setShowTaskModal(true)
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueDate: '',
      tagIds: [],
      assigneeIds: [],
      subtasks: []
    })
    setEditingTask(null)
    setShowTaskModal(false)
  }, [])

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    return matchesSearch && matchesPriority
  })

  const getTasksByStatus = useCallback((status: string) => {
    return filteredTasks.filter(task => task.status === status)
  }, [filteredTasks])

  const getStats = () => {
    const total = tasks.length
    const todo = tasks.filter(t => t.status === 'todo').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const done = tasks.filter(t => t.status === 'done').length
    const completion = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, todo, inProgress, done, completion }
  }

  const stats = getStats()

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-red-500', icon: Circle },
    { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-500', icon: Clock },
    { id: 'done', title: 'Done', color: 'bg-green-500', icon: CheckCircle2 }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Simplified */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-purple-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                Task Management Pro
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user.name || user.email}
                </span>
              </div>

              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-purple-100 text-xs mt-1">Total</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl">
            <div className="text-2xl font-bold">{stats.todo}</div>
            <div className="text-red-100 text-xs mt-1">To Do</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 rounded-xl">
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <div className="text-yellow-100 text-xs mt-1">Progress</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl">
            <div className="text-2xl font-bold">{stats.done}</div>
            <div className="text-green-100 text-xs mt-1">Done</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl">
            <div className="text-2xl font-bold">{stats.completion}%</div>
            <div className="text-blue-100 text-xs mt-1">Complete</div>
          </div>
        </div>

        {/* Filters - Compact */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span>New Task</span>
          </button>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Kanban Board - Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(column => (
            <div 
              key={column.id} 
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-colors ${
                isDragging ? 'ring-2 ring-purple-300' : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`${column.color} text-white px-4 py-3 rounded-t-xl flex items-center justify-between`}>
                <div className="flex items-center space-x-2">
                  <column.icon className="h-5 w-5" />
                  <h3 className="font-semibold">{column.title}</h3>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded text-sm font-medium">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>

              <div className="p-3 space-y-3 min-h-[400px]">
                {getTasksByStatus(column.id).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onDuplicate={handleDuplicateTask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    getPriorityColor={getPriorityColor}
                    isOverdue={isOverdue}
                    users={users}
                  />
                ))}

                {getTasksByStatus(column.id).length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Circle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No tasks</p>
                    <p className="text-xs mt-1">Drag here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Task Modal - Same as before but simplified */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {editingTask ? 'Edit Task' : 'New Task'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {users.length > 1 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Assign to</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                    {users.filter(u => u.id !== user.id).map(u => (
                      <label key={u.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.assigneeIds.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, assigneeIds: [...formData.assigneeIds, u.id] })
                            } else {
                              setFormData({ ...formData, assigneeIds: formData.assigneeIds.filter(id => id !== u.id) })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{u.name || u.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={editingTask ? handleUpdateTask : handleCreateTask}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {editingTask ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
