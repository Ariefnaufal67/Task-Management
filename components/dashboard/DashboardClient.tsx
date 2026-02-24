'use client'

import { useState, useEffect, memo, useCallback, useRef } from 'react'
import { signOut } from 'next-auth/react'
import toast from 'react-hot-toast'
import { 
  CheckCircle2, Circle, Clock, Plus, Search, Moon, Sun, LogOut, User,
  Edit2, Trash2, Copy, Calendar, AlertCircle, GripVertical, Tag as TagIcon,
  Users as UsersIcon, Download, Upload, Filter, X, Settings
} from 'lucide-react'

interface DashboardClientProps {
  user: any
}

// Memoized TaskCard
const TaskCard = memo(({ task, onEdit, onDelete, onDuplicate, onDragStart, onDragEnd, getPriorityColor, isOverdue, users, tags, onToggleSubtask }: any) => {
  const completedSubtasks = task.subtasks?.filter((s: any) => s.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0
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

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Subtasks</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="mt-2 space-y-1">
            {task.subtasks?.slice(0, 2).map((subtask: any, idx: number) => (
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

      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>{task.priority}</span>
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${isOverdue(task.dueDate) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {task.assignees && task.assignees.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 truncate">
          👤 {task.assignees.map((a: any) => a.user.name || a.user.email).join(', ')}
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
  const [filterTag, setFilterTag] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'medium', status: 'todo', dueDate: '',
    tagIds: [] as string[], assigneeIds: [] as string[], subtasks: [] as any[]
  })
  const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6' })
  const [newSubtask, setNewSubtask] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setTags(await tagsRes.json())
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
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error()
      setTasks([...tasks, await res.json()])
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
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
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
      setTasks(tasks.filter(t => t.id !== taskId))
      toast.success('Task deleted!')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleDuplicateTask = async (task: any) => {
    const dup = {
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
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dup)
      })
      if (!res.ok) throw new Error()
      setTasks([...tasks, await res.json()])
      toast.success('Task duplicated!')
    } catch {
      toast.error('Failed to duplicate')
    }
  }

  const handleToggleSubtask = async (taskId: string, subtaskIndex: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const newSubtasks = [...task.subtasks]
    newSubtasks[subtaskIndex] = { ...newSubtasks[subtaskIndex], completed: !newSubtasks[subtaskIndex].completed }
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...task,
          tagIds: task.tags?.map((t: any) => t.tagId) || [],
          assigneeIds: task.assignees?.map((a: any) => a.userId) || [],
          subtasks: newSubtasks
        })
      })
      if (!res.ok) throw new Error()
      setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: newSubtasks } : t))
    } catch {
      toast.error('Failed to update subtask')
    }
  }

  const handleDragStart = useCallback((e: React.DragEvent, task: any) => {
    setDraggedTask(task)
    setIsDragging(true)
    ;(e.currentTarget as HTMLElement).style.opacity = '0.4'
  }, [])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      setIsDragging(false)
      return
    }

    const updatedTasks = tasks.map(t => t.id === draggedTask.id ? { ...t, status: newStatus } : t)
    setTasks(updatedTasks)
    setDraggedTask(null)
    setIsDragging(false)
    toast.success(`Moved to ${newStatus.replace('-', ' ')}`, { duration: 1000 })

    try {
      await fetch(`/api/tasks/${draggedTask.id}`, {
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
    } catch {
      setTasks(tasks)
      toast.error('Failed to move')
    }
  }, [draggedTask, tasks])

  const addTag = async () => {
    if (!newTag.name.trim()) return
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTag)
      })
      if (!res.ok) throw new Error()
      setTags([...tags, await res.json()])
      setNewTag({ name: '', color: '#3b82f6' })
      toast.success('Tag added!')
    } catch {
      toast.error('Failed to add tag')
    }
  }

  const deleteTag = async (id: string) => {
    if (!confirm('Delete tag?')) return
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTags(tags.filter(t => t.id !== id))
      toast.success('Tag deleted!')
    } catch {
      toast.error('Failed to delete tag')
    }
  }

  const exportJSON = () => {
    const data = { tasks, tags, users, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    toast.success('Data exported!')
  }

  const exportCSV = () => {
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Tags', 'Assignees']
    const rows = tasks.map(t => [
      t.title, t.description || '', t.status, t.priority,
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
      t.tags?.map((tt: any) => tags.find(tag => tag.id === tt.tagId)?.name).join(', ') || '',
      t.assignees?.map((a: any) => a.user.name || a.user.email).join(', ') || ''
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('CSV exported!')
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.tasks) setTasks(data.tasks)
        if (data.tags) setTags(data.tags)
        toast.success('Data imported!')
      } catch {
        toast.error('Invalid file')
      }
    }
    reader.readAsText(file)
  }

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

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tagIds: [], assigneeIds: [], subtasks: [] })
    setEditingTask(null)
    setShowTaskModal(false)
  }

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    setFormData({ ...formData, subtasks: [...formData.subtasks, { id: Date.now().toString(), title: newSubtask, completed: false }] })
    setNewSubtask('')
  }

  const removeSubtask = (index: number) => {
    setFormData({ ...formData, subtasks: formData.subtasks.filter((_, i) => i !== index) })
  }

  // Filtering and sorting
  let filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority
    const matchTag = filterTag === 'all' || t.tags?.some((tt: any) => tt.tagId === filterTag)
    const matchAssignee = filterAssignee === 'all' || t.assignees?.some((a: any) => a.userId === filterAssignee)
    return matchSearch && matchPriority && matchTag && matchAssignee
  })

  filteredTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (sortBy === 'priority') {
      const order: any = { high: 0, medium: 1, low: 2 }
      return order[a.priority] - order[b.priority]
    }
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const getTasksByStatus = (status: string) => filteredTasks.filter(t => t.status === status)
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    completion: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0
  }

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-red-500', icon: Circle },
    { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-500', icon: Clock },
    { id: 'done', title: 'Done', color: 'bg-green-500', icon: CheckCircle2 }
  ]

  const getPriorityColor = (p: string) => 
    p === 'high' ? 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200' :
    p === 'medium' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200' :
    'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'

  const isOverdue = (d: string) => d && new Date(d) < new Date()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-purple-600" />
            <h1 className="text-xl font-bold">Task Management Pro</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowTagModal(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Manage Tags">
              <TagIcon className="h-5 w-5" />
            </button>
            <button onClick={exportJSON} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Export JSON">
              <Download className="h-5 w-5" />
            </button>
            <button onClick={exportCSV} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Export CSV">
              <Download className="h-5 w-5" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Import">
              <Upload className="h-5 w-5" />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={importData} className="hidden" />
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm">{user.name || user.email}</span>
            </div>
            <button onClick={() => signOut()} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'from-purple-500 to-purple-600' },
            { label: 'To Do', value: stats.todo, color: 'from-red-500 to-red-600' },
            { label: 'Progress', value: stats.inProgress, color: 'from-yellow-500 to-yellow-600' },
            { label: 'Done', value: stats.done, color: 'from-green-500 to-green-600' },
            { label: 'Complete', value: `${stats.completion}%`, color: 'from-blue-500 to-blue-600' }
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} text-white p-4 rounded-xl`}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs opacity-90 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={() => setShowTaskModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
            <Plus className="h-5 w-5" /> New Task
          </button>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-4 py-2 border rounded-lg dark:bg-gray-700">
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="px-4 py-2 border rounded-lg dark:bg-gray-700">
            <option value="all">All Tags</option>
            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="px-4 py-2 border rounded-lg dark:bg-gray-700">
            <option value="all">All Users</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-lg dark:bg-gray-700">
            <option value="createdAt">Newest</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(col => (
            <div key={col.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col.id)}>
              <div className={`${col.color} text-white px-4 py-3 rounded-t-xl flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <col.icon className="h-5 w-5" />
                  <h3 className="font-semibold">{col.title}</h3>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded text-sm">{getTasksByStatus(col.id).length}</span>
              </div>
              <div className="p-3 space-y-3 min-h-[400px]">
                {getTasksByStatus(col.id).map(task => (
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
                  />
                ))}
                {getTasksByStatus(col.id).length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Circle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={resetForm}><X className="h-6 w-6" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700">
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tagIds.includes(tag.id)}
                        onChange={(e) => setFormData({
                          ...formData,
                          tagIds: e.target.checked ? [...formData.tagIds, tag.id] : formData.tagIds.filter(id => id !== tag.id)
                        })}
                      />
                      <span className="px-2 py-1 text-xs rounded-full" style={{backgroundColor: tag.color + '20', color: tag.color}}>{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              {users.length > 1 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Assign to</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                    {users.filter(u => u.id !== user.id).map(u => (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.assigneeIds.includes(u.id)}
                          onChange={(e) => setFormData({
                            ...formData,
                            assigneeIds: e.target.checked ? [...formData.assigneeIds, u.id] : formData.assigneeIds.filter(id => id !== u.id)
                          })}
                        />
                        <span className="text-sm">{u.name || u.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Subtasks</label>
                </div>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSubtask()} className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700" placeholder="Add subtask" />
                  <button onClick={addSubtask} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Add</button>
                </div>
                <div className="space-y-2">
                  {formData.subtasks.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="flex-1 text-sm">{sub.title}</span>
                      <button onClick={() => removeSubtask(idx)} className="text-red-500"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={resetForm} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={editingTask ? handleUpdateTask : handleCreateTask} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                {editingTask ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && setShowTagModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Manage Tags</h2>
              <button onClick={() => setShowTagModal(false)}><X className="h-6 w-6" /></button>
            </div>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newTag.name} onChange={(e) => setNewTag({...newTag, name: e.target.value})} className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700" placeholder="Tag name" />
              <input type="color" value={newTag.color} onChange={(e) => setNewTag({...newTag, color: e.target.value})} className="w-12 h-10 rounded-lg cursor-pointer" />
              <button onClick={addTag} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Add</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded" style={{backgroundColor: tag.color}}></div>
                    <span>{tag.name}</span>
                  </div>
                  <button onClick={() => deleteTag(tag.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
