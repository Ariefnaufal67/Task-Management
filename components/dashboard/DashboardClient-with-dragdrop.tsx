'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import toast from 'react-hot-toast'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Search, 
  Filter,
  Moon,
  Sun,
  LogOut,
  User,
  Tag as TagIcon,
  Users,
  Download,
  Upload,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  AlertCircle
} from 'lucide-react'

interface DashboardClientProps {
  user: any
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [draggedTask, setDraggedTask] = useState<any>(null)
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
      toast.success('Task created successfully')
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
      toast.success('Task updated successfully')
      resetForm()
    } catch (error) {
      toast.error('Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete task')

      setTasks(tasks.filter(t => t.id !== taskId))
      toast.success('Task deleted successfully')
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const handleDuplicateTask = async (task: any) => {
    const duplicatedTask = {
      ...task,
      title: `${task.title} (Copy)`,
      status: 'todo',
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
      toast.success('Task duplicated successfully')
    } catch (error) {
      toast.error('Failed to duplicate task')
    }
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    // Add visual feedback
    e.currentTarget.classList.add('opacity-50')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50')
    setDraggedTask(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.classList.add('bg-purple-50', 'dark:bg-purple-900/20')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.classList.remove('bg-purple-50', 'dark:bg-purple-900/20')
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.classList.remove('bg-purple-50', 'dark:bg-purple-900/20')

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    try {
      // Update task status
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

      if (!response.ok) throw new Error('Failed to update task')

      const updatedTask = await response.json()
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))
      toast.success(`Task moved to ${newStatus.replace('-', ' ')}`)
    } catch (error) {
      toast.error('Failed to move task')
    }

    setDraggedTask(null)
  }

  const openEditModal = (task: any) => {
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
  }

  const resetForm = () => {
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
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status)
  }

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
      {/* Header */}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-purple-100 text-sm mt-1">Total Tasks</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.todo}</div>
            <div className="text-red-100 text-sm mt-1">To Do</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.inProgress}</div>
            <div className="text-yellow-100 text-sm mt-1">In Progress</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.done}</div>
            <div className="text-green-100 text-sm mt-1">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.completion}%</div>
            <div className="text-blue-100 text-sm mt-1">Completion</div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">💡 Tips:</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                <li>• <strong>Drag & Drop:</strong> Seret task ke kolom lain untuk pindah status</li>
                <li>• <strong>Assign Users:</strong> Register user baru untuk bisa assign tasks (minimal 2 users)</li>
                <li>• <strong>Registered Users:</strong> {users.length} user(s) - {users.map(u => u.name || u.email).join(', ')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
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
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(column => (
            <div 
              key={column.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`${column.color} text-white px-4 py-3 rounded-t-xl flex items-center justify-between`}>
                <div className="flex items-center space-x-2">
                  <column.icon className="h-5 w-5" />
                  <h3 className="font-semibold">{column.title}</h3>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded text-sm">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>

              <div className="p-4 space-y-3 min-h-[400px]">
                {getTasksByStatus(column.id).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white dark:bg-gray-700 border-l-4 ${
                      task.priority === 'high' ? 'border-red-500' :
                      task.priority === 'medium' ? 'border-yellow-500' :
                      'border-green-500'
                    } rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-move ${
                      isOverdue(task.dueDate) ? 'bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex-1">
                        {task.title}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleDuplicateTask(task)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
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
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>

                    {task.assignees && task.assignees.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          👤 Assigned to: {task.assignees.map((a: any) => a.user.name || a.user.email).join(', ')}
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
                ))}

                {getTasksByStatus(column.id).length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Circle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No tasks</p>
                    <p className="text-xs mt-1">Drag tasks here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {editingTask ? 'Edit Task' : 'Create New Task'}
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
                  <label className="block text-sm font-medium mb-2">Assign to ({users.length} users available)</label>
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

              {users.length === 1 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    💡 <strong>Tip:</strong> Register more users to enable task assignment. Currently only you ({user.name || user.email}) are registered.
                  </p>
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
                {editingTask ? 'Update' : 'Create'} Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
