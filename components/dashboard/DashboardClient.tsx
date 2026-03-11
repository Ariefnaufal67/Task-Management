'use client'

import { useState, useEffect, memo, useCallback, useRef } from 'react'
import { signOut } from 'next-auth/react'
import toast from 'react-hot-toast'
import { 
  CheckCircle2, Circle, Clock, Plus, Search, Moon, Sun, LogOut, User,
  Edit2, Trash2, Copy, Calendar, AlertCircle, GripVertical,
  Users as UsersIcon, Download, Upload, Filter, X, Settings, FileText
} from 'lucide-react'

interface DashboardClientProps {
  user: any
}

// ========================================
// SUBTASKS LOCALSTORAGE HELPER
// ========================================
const SUBTASKS_KEY = 'task-subtasks-v1'

const getSubtasksFromStorage = (taskId: string) => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(SUBTASKS_KEY)
    if (!stored) return []
    const allSubtasks = JSON.parse(stored)
    return allSubtasks[taskId] || []
  } catch {
    return []
  }
}

const saveSubtasksToStorage = (taskId: string, subtasks: any[]) => {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(SUBTASKS_KEY)
    const allSubtasks = stored ? JSON.parse(stored) : {}
    allSubtasks[taskId] = subtasks
    localStorage.setItem(SUBTASKS_KEY, JSON.stringify(allSubtasks))
  } catch (e) {
    console.error('Failed to save subtasks:', e)
  }
}

const deleteSubtasksFromStorage = (taskId: string) => {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(SUBTASKS_KEY)
    if (!stored) return
    const allSubtasks = JSON.parse(stored)
    delete allSubtasks[taskId]
    localStorage.setItem(SUBTASKS_KEY, JSON.stringify(allSubtasks))
  } catch (e) {
    console.error('Failed to delete subtasks:', e)
  }
}

// Memoized TaskCard
const TaskCard = memo(({ task, onEdit, onDelete, onDuplicate, onDragStart, onDragEnd, getPriorityColor, isOverdue, users, tags, onToggleSubtask, localSubtasks }: any) => {
  const subtasks = localSubtasks || []
  const completedSubtasks = subtasks.filter((s: any) => s.completed).length
  const totalSubtasks = subtasks.length
  const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-gray-700 border-l-4 ${
        task.priority === 'high' ? 'border-red-500' :
        task.priority === 'medium' ? 'border-yellow-500' : 'border-green-500'
      } rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isOverdue(task.dueDate) ? 'bg-red-50 dark:bg-red-900/20' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2 text-gray-400">
        <GripVertical className="h-4 w-4" />
        <span className="text-xs">Drag to move</span>
      </div>

      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white flex-1 pr-2">{task.title}</h4>
        <div className="flex items-center space-x-1">
          <button onClick={() => onDuplicate(task)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded" title="Duplicate">
            <Copy className="h-4 w-4 text-green-600" />
          </button>
          <button onClick={() => onEdit(task)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded" title="Edit">
            <Edit2 className="h-4 w-4 text-blue-600" />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded" title="Delete">
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((taskTag: any) => {
            const tag = tags.find((t: any) => t.id === taskTag.tagId)
            return tag ? (
              <span key={taskTag.id} className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                {tag.name}
              </span>
            ) : null
          })}
        </div>
      )}

      {/* Subtasks Progress (From LocalStorage) */}
      {totalSubtasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Subtasks (Local)</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="mt-2 space-y-1">
            {subtasks.slice(0, 2).map((subtask: any, idx: number) => (
              <div key={subtask.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => onToggleSubtask(task.id, idx)}
                  className="rounded"
                />
                <span className={subtask.completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'}>
                  {subtask.title}
                </span>
              </div>
            ))}
            {totalSubtasks > 2 && <div className="text-xs text-gray-400">+{totalSubtasks - 2} more</div>}
          </div>
        </div>
      )}

      {/* Priority & Due Date */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className={`px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${isOverdue(task.dueDate) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 truncate">
          {task.assignees.map((a: any) => a.user.name || a.user.email).join(', ')}
        </div>
      )}
    </div>
  )
})

TaskCard.displayName = 'TaskCard'

export default function DashboardClient({ user }: DashboardClientProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [taskSubtasks, setTaskSubtasks] = useState<Record<string, any[]>>({}) // LocalStorage state
  const [tags, setTags] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [predefinedTags] = useState([
    { name: 'Frontend', color: '#3b82f6' },
    { name: 'Backend', color: '#10b981' },
    { name: 'Design', color: '#f59e0b' },
    { name: 'Bug', color: '#ef4444' },
    { name: 'Feature', color: '#8b5cf6' },
    { name: 'Documentation', color: '#06b6d4' },
    { name: 'Testing', color: '#ec4899' },
    { name: 'Urgent', color: '#dc2626' }
  ])
  const [darkMode, setDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterTag, setFilterTag] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'medium', status: 'todo', dueDate: '',
    tagIds: [] as string[], assigneeIds: [] as string[], finalReport: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load subtasks from localStorage on mount and when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      const subtasksMap: Record<string, any[]> = {}
      tasks.forEach(task => {
        subtasksMap[task.id] = getSubtasksFromStorage(task.id)
      })
      setTaskSubtasks(subtasksMap)
    }
  }, [tasks])

  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const fetchData = async () => {
    try {
      const [tasksRes, tagsRes, usersRes] = await Promise.all([
        fetch('/api/tasks'), fetch('/api/tags'), fetch('/api/users')
      ])
      setTasks(await tasksRes.json())
      const fetchedTags = await tagsRes.json()
      
      // Initialize predefined tags if database is empty
      if (fetchedTags.length === 0) {
        const createdTags = []
        for (const tag of predefinedTags) {
          try {
            const res = await fetch('/api/tags', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(tag)
            })
            if (res.ok) createdTags.push(await res.json())
          } catch (e) {}
        }
        setTags(createdTags)
      } else {
        setTags(fetchedTags)
      }
      
      setUsers(await usersRes.json())
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!formData.title.trim()) return toast.error('Title required')
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subtasks: undefined // Don't send subtasks to backend
        })
      })
      if (!res.ok) throw new Error()
      const newTask = await res.json()
      
      // Save subtasks to localStorage
      if (formData.subtasks.length > 0) {
        saveSubtasksToStorage(newTask.id, formData.subtasks)
        setTaskSubtasks(prev => ({ ...prev, [newTask.id]: formData.subtasks }))
      }
      
      setTasks([...tasks, newTask])
      toast.success('Task created!')
      resetForm()
    } catch {
      toast.error('Failed to create task')
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title.trim()) return
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subtasks: undefined // Don't send subtasks to backend
        })
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      
      // Save subtasks to localStorage
      saveSubtasksToStorage(editingTask.id, formData.subtasks)
      setTaskSubtasks(prev => ({ ...prev, [editingTask.id]: formData.subtasks }))
      
      setTasks(tasks.map(t => t.id === updated.id ? updated : t))
      toast.success('Task updated!')
      resetForm()
    } catch {
      toast.error('Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      
      // Delete subtasks from localStorage
      deleteSubtasksFromStorage(taskId)
      setTaskSubtasks(prev => {
        const newMap = { ...prev }
        delete newMap[taskId]
        return newMap
      })
      
      setTasks(tasks.filter(t => t.id !== taskId))
      toast.success('Task deleted!')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleDuplicateTask = async (task: any) => {
    try {
      const duplicateData = {
        title: `${task.title} (Copy)`,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        tagIds: task.tags?.map((t: any) => t.tagId) || [],
        assigneeIds: task.assignees?.map((a: any) => a.userId) || []
      }
      
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      })
      if (!res.ok) throw new Error()
      const newTask = await res.json()
      
      // Duplicate subtasks to localStorage
      const originalSubtasks = taskSubtasks[task.id] || []
      if (originalSubtasks.length > 0) {
        const duplicatedSubtasks = originalSubtasks.map(s => ({ ...s, id: Date.now() + Math.random() }))
        saveSubtasksToStorage(newTask.id, duplicatedSubtasks)
        setTaskSubtasks(prev => ({ ...prev, [newTask.id]: duplicatedSubtasks }))
      }
      
      setTasks([...tasks, newTask])
      toast.success('Task duplicated!')
    } catch {
      toast.error('Failed to duplicate')
    }
  }

  const openEditModal = (task: any) => {
    setEditingTask(task)
    
    // Load subtasks from localStorage
    const localSubtasks = taskSubtasks[task.id] || []
    
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      tagIds: task.tags?.map((t: any) => t.tagId) || [],
      assigneeIds: task.assignees?.map((a: any) => a.userId) || [],
      subtasks: localSubtasks // Load from localStorage
    })
    setShowTaskModal(true)
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tagIds: [], assigneeIds: [], finalReport: '' })
    setEditingTask(null)
    setShowTaskModal(false)
  }

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    setFormData({
      ...formData,
      subtasks: [...formData.subtasks, { id: Date.now().toString(), title: newSubtask, completed: false }]
    })
  }

  const removeSubtask = (idx: number) => {
    setFormData({ ...formData, subtasks: formData.subtasks.filter((_, i) => i !== idx) })
  }

  const handleToggleSubtask = useCallback((taskId: string, idx: number) => {
    const currentSubtasks = taskSubtasks[taskId] || []
    const updated = [...currentSubtasks]
    updated[idx] = { ...updated[idx], completed: !updated[idx].completed }
    
    saveSubtasksToStorage(taskId, updated)
    setTaskSubtasks(prev => ({ ...prev, [taskId]: updated }))
  }, [taskSubtasks])

  // Rest of the code continues... (drag/drop, filters, etc.)
  const handleDragStart = useCallback((e: React.DragEvent, task: any) => {
    setDraggedTask(task)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null)
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

    const optimisticUpdate = tasks.map(t => 
      t.id === draggedTask.id ? { ...t, status: newStatus } : t
    )
    setTasks(optimisticUpdate)
    setDraggedTask(null)
    setIsDragging(false)

    try {
      const res = await fetch(`/api/tasks/${draggedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draggedTask, status: newStatus })
      })
      if (!res.ok) throw new Error()
      toast.success('Task moved!')
    } catch {
      setTasks(tasks)
      toast.error('Failed to move task')
    }
  }, [draggedTask, tasks])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  // ... Continue with filters, export/import, and render
  // (Keep rest of the original code)
  
  const filteredTasks = tasks
    .filter(t => !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => filterPriority === 'all' || t.priority === filterPriority)
    .filter(t => filterTag === 'all' || t.tags?.some((tag: any) => tag.tagId === filterTag))
    .filter(t => filterAssignee === 'all' || t.assignees?.some((a: any) => a.userId === filterAssignee))

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
    }
    if (sortBy === 'dueDate') return (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const todoTasks = sortedTasks.filter(t => t.status === 'todo')
  const inProgressTasks = sortedTasks.filter(t => t.status === 'in-progress')
  const doneTasks = sortedTasks.filter(t => t.status === 'done')

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    completion: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0
  }

  const exportData = () => {
    const data = {
      tasks: tasks.map(t => ({
        ...t,
        subtasks: taskSubtasks[t.id] || [] // Include localStorage subtasks in export
      })),
      tags,
      users,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    toast.success('Data exported!')
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        
        // Import tasks (without subtasks to backend)
        for (const task of imported.tasks) {
          const { subtasks, ...taskData } = task
          await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
          }).then(res => res.json()).then(newTask => {
            // Save subtasks to localStorage
            if (subtasks && subtasks.length > 0) {
              saveSubtasksToStorage(newTask.id, subtasks)
            }
          })
        }
        
        await fetchData()
        toast.success('Data imported!')
      } catch {
        toast.error('Import failed')
      }
    }
    reader.readAsText(file)
  }

  if (loading) return <div className="flex items-center justify-center h-screen dark:bg-gray-900"><div className="text-xl dark:text-white">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management Pro</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={exportData} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Export">
                <Download className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Import">
                <Upload className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={importData} className="hidden" />
              
              <button onClick={() => setShowUserModal(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Settings">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-600" />}
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name || user.email}</span>
              </div>
              <button onClick={() => signOut()} className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg text-red-600 dark:text-red-400">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-purple-600 text-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-90">Total</div>
          </div>
          <div className="bg-red-500 text-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold">{stats.todo}</div>
            <div className="text-sm opacity-90">To Do</div>
          </div>
          <div className="bg-yellow-500 text-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold">{stats.inProgress}</div>
            <div className="text-sm opacity-90">In Progress</div>
          </div>
          <div className="bg-green-600 text-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold">{stats.done}</div>
            <div className="text-sm opacity-90">Done</div>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold">{stats.completion}%</div>
            <div className="text-sm opacity-90">Complete</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => { resetForm(); setShowTaskModal(true) }} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
            <Plus className="h-5 w-5" />
            New Task
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="all">All Tags</option>
            {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
          </select>
          
          <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="all">All Users</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
          
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="createdAt">Newest</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'todo')} className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Circle className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">To Do</h3>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">{todoTasks.length}</span>
            </div>
            <div className="p-4 space-y-3 min-h-[200px]">
              {todoTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No tasks</div>
              ) : (
                todoTasks.map(task => (
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
                    tags={tags}
                    onToggleSubtask={handleToggleSubtask}
                    localSubtasks={taskSubtasks[task.id]}
                  />
                ))
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'in-progress')} className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">In Progress</h3>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">{inProgressTasks.length}</span>
            </div>
            <div className="p-4 space-y-3 min-h-[200px]">
              {inProgressTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No tasks</div>
              ) : (
                inProgressTasks.map(task => (
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
                    tags={tags}
                    onToggleSubtask={handleToggleSubtask}
                    localSubtasks={taskSubtasks[task.id]}
                  />
                ))
              )}
            </div>
          </div>

          {/* Done Column */}
          <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'done')} className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Done</h3>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">{doneTasks.length}</span>
            </div>
            <div className="p-4 space-y-3 min-h-[200px]">
              {doneTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No tasks</div>
              ) : (
                doneTasks.map(task => (
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
                    tags={tags}
                    onToggleSubtask={handleToggleSubtask}
                    localSubtasks={taskSubtasks[task.id]}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags (pilih yang sesuai)</label>
                <div className="grid grid-cols-2 gap-2">
                  {tags.map(tag => (
                    <label key={tag.id} className="flex items-center gap-2 p-2 border dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.tagIds.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] })
                          } else {
                            setFormData({ ...formData, tagIds: formData.tagIds.filter(id => id !== tag.id) })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></span>
                      <span className="text-sm text-gray-900 dark:text-white">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign to</label>
                <div className="space-y-2">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-2">
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
                      <span className="text-sm text-gray-900 dark:text-white">{u.name || u.email}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtasks <span className="text-xs text-purple-600">(Saved locally - private to you)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                    className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add subtask"
                  />
                  <button onClick={addSubtask} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.subtasks.map((sub, idx) => (
                    <div key={sub.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="flex-1 text-sm text-gray-900 dark:text-white">{sub.title}</span>
                      <button onClick={() => removeSubtask(idx)} className="text-red-500 hover:text-red-700 h-4 w-4">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={resetForm} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                  Cancel
                </button>
                <button onClick={editingTask ? handleUpdateTask : handleCreateTask} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Logged in as:</div>
                <div className="font-medium text-gray-900 dark:text-white">{user.name || user.email}</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-1">💡 Subtasks Info</div>
                <div className="text-xs text-purple-700 dark:text-purple-300">
                  Subtasks are saved locally in your browser only. They are private to you and will not be visible to other users.
                </div>
              </div>
              <button onClick={() => signOut()} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
