import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Offcanvas } from 'bootstrap/dist/js/bootstrap.bundle.min.js'
import Cookies from 'js-cookie'
import { apiClient } from '@/js/api/manager.js';
import { endpoints } from '@/js/api/endpoints.js';

export const useKanbanStore = defineStore('kanbanStore', () => {
  const toast = useToast()
  const columns = ref([])
  const editableTask = ref(null)
  const isLoading = ref(false)
  const currentUserId = ref(null)

  // Инициализация - получаем ID пользователя из кук
  const initialize = () => {
    currentUserId.value = parseInt(Cookies.get('userId')) || null
    if (!currentUserId.value) {
      toast.error('Пользователь не авторизован')
    }
  }

  // Получение всех задач текущего пользователя
  const getAllTasks = () => {
    if (!currentUserId.value) return []
    return columns.value.flatMap(column => 
      column.cards.filter(card => card.user_id === currentUserId.value)
    )
  }

  // Получение задачи по ID (только если она принадлежит текущему пользователю)
  const getTaskById = (id) => {
    const task = getAllTasks().find(task => task.id === id)
    if (!task) {
      toast.error('Задача не найдена или у вас нет доступа')
    }
    return task
  }

  // Генерация следующего ID
  const getNextTaskId = () => {
    const allTasks = getAllTasks()
    return allTasks.length > 0 ? Math.max(...allTasks.map(t => t.id)) + 1 : 1
  }

  // Загрузка данных с сервера только для текущего пользователя
  const fetchColumns = async () => {
    if (!currentUserId.value) {
      toast.error('Необходимо авторизоваться')
      return
    }

    isLoading.value = true
    try {
      const response = await apiClient.get(endpoints.crm.tasks.sectionTasks, { user_id: parseInt(Cookies.get('userId'))});
      
      if (!response.ok) throw new Error('Ошибка при загрузке данных')
      
      const data = await response.json()
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Некорректный формат данных от API')
      }

      // Фильтруем задачи по user_id
      columns.value = data.data.map(section => ({
        id: section.id,
        title: section.title,
        cards: section.cards
          .filter(task => task.user_id === currentUserId.value)
          .map(task => ({
            id: task.id,
            title: task.title,
            priority: task.priority,
            description: task.description || '',
            is_completed: task.is_completed || false,
            assignee_id: task.assignee_id || null,
            deadline: task.deadline || null,
            user_id: task.user_id,
            subtasks: task.subtasks || [],
            image: task.image,
            attachments: task.attachments,
            comments: task.comments,
          }))
      }))
    } catch (error) {
      toast.error('Ошибка при загрузке данных: ' + error.message)
    } finally {
      isLoading.value = false
    }
  }

  // Выбор задачи (только если она принадлежит пользователю)
  const setSelectedTask = (task) => {
    if (task.user_id !== currentUserId.value) {
      toast.error('У вас нет доступа к этой задаче')
      return
    }
    
    editableTask.value = task
    const bsOffcanvas = new Offcanvas('#kanbanCanvas')
    bsOffcanvas.show()
  }

  // Очистка выбранной задачи
  const cleanSelectedTask = () => (editableTask.value = null)

  // Создание нового раздела
  const addSection = async (sectionData) => {
    if (!currentUserId.value) {
      toast.error('Необходимо авторизоваться')
      return
    }

    isLoading.value = true
    try {
      // Формируем данные в точном соответствии с API
      const requestData = {
        section_name: sectionData.section_name, // Используем section_name как в API
        project_id: sectionData.project_id || 1 // project_id обязателен
      }

      const response = await fetch('http://localhost:8000/api/crm/tasks/section-new/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken') || '',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Детали ошибки:', errorData)
        throw new Error(
          errorData.error || 
          errorData.message || 
          'Ошибка при создании раздела'
        )
      }

      const data = await response.json()
      console.log('Ответ сервера:', data)

      // Обрабатываем ответ сервера
      const newSection = {
        id: data.data.id,
        title: data.data.name, // Используем name из ответа
        cards: []
      }

      columns.value = [...columns.value, newSection]
      toast.success(`Раздел "${data.data.name}" успешно создан!`)
      return newSection

    } catch (error) {
      console.error('Ошибка при создании раздела:', error)
      toast.error(error.message || 'Ошибка при создании раздела')
      throw error
    } finally {
      isLoading.value = false
    }
  }
  // Создание новой задачи
 // Создание новой задачи
 const createTask = async (taskData) => {
  if (!currentUserId.value) {
    toast.error('Необходимо авторизоваться')
    return
  }

  isLoading.value = true
  try {
    if (!taskData.text || !taskData.section_id) {
      throw new Error('Не указаны обязательные поля (text и section_id)')
    }

    // Добавляем текущую дату создания
    const requestData = {
      text: taskData.text,
      section_id: taskData.section_id,
      description: taskData.description || null,
      deadline: taskData.deadline || null,
      priority: taskData.priority || 0,
      parenttask_id: taskData.parenttask_id || 1,
      user_id: currentUserId.value,
      isdone: taskData.isdone || false,
      dateofcreation: new Date().toISOString() // Добавляем текущую дату
    }

    const response = await fetch('http://localhost:8000/api/crm/tasks/task-new/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken') || '',
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'Ошибка при создании задачи')
    }

    const responseData = await response.json()
    
    if (!responseData.data || !responseData.data.id) {
      throw new Error('Неверный формат ответа сервера')
    }

    const createdTask = responseData.data

    const newTask = {
      id: createdTask.id,
      title: createdTask.text,
      section_id: createdTask.section_id,
      isdone: createdTask.isdone || false,
      dateofcreation: createdTask.dateofcreation, // Сохраняем дату создания
      priority: createdTask.priority || 0,
      description: createdTask.description || '',
      user_id: currentUserId.value,
      subtasks: [],
      deadline: createdTask.deadline || null
    }

    const columnIndex = columns.value.findIndex(col => col.id === taskData.section_id)
    if (columnIndex !== -1) {
      columns.value[columnIndex].cards.push(newTask)
    } else {
      console.warn(`Раздел с ID ${taskData.section_id} не найден`)
    }

    toast.success('Задача успешно создана!')
    return newTask

  } catch (error) {
    console.error('Ошибка при создании задачи:', error)
    toast.error(error.message || 'Ошибка при создании задачи')
    throw error
  } finally {
    isLoading.value = false
  }
}
  // Обновление информации о задаче
  const updateTask = async (info) => {
    if (!currentUserId.value) {
      toast.error('Необходимо авторизоваться')
      return
    }

    try {
      // Проверяем, что задача принадлежит пользователю
      const originalTask = getTaskById(info.id)
      if (!originalTask || originalTask.user_id !== currentUserId.value) {
        toast.error('У вас нет прав для редактирования этой задачи')
        return
      }

      const response = await fetch(`http://localhost:8000/api/crm/tasks/task-update/${info.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken') || '',
        },
        body: JSON.stringify({
          ...info,
          user_id: currentUserId.value
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const updatedTask = data.data || data

      // Обновляем задачу в хранилище
      columns.value.forEach(column => {
        const taskIndex = column.cards.findIndex(t => t.id === info.id)
        if (taskIndex !== -1) {
          column.cards[taskIndex] = {
            ...column.cards[taskIndex],
            ...updatedTask
          }
        }
      })

      toast.success('Задача обновлена!')
      return updatedTask
    } catch (error) {
      toast.error(`Ошибка при обновлении задачи: ${error.message}`)
      throw error
    }
  }

  // Удаление задачи
  const deleteTask = async (taskId) => {
    if (!currentUserId.value) {
      toast.error('Необходимо авторизоваться')
      return
    }

    try {
      // Проверяем, что задача принадлежит пользователю
      const task = getTaskById(taskId)
      if (!task || task.user_id !== currentUserId.value) {
        toast.error('У вас нет прав для удаления этой задачи')
        return
      }

      const response = await fetch(`http://localhost:8000/api/crm/tasks/task-delete/${taskId}/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': Cookies.get('csrftoken') || '',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Удаляем задачу из хранилища
      columns.value.forEach(column => {
        const taskIndex = column.cards.findIndex(t => t.id === taskId)
        if (taskIndex !== -1) {
          column.cards.splice(taskIndex, 1)
        }
      })

      toast.success('Задача удалена!')
    } catch (error) {
      toast.error(`Ошибка при удалении задачи: ${error.message}`)
      throw error
    }
  }

  // Инициализация при создании хранилища
  initialize()

  return {
    columns,
    editableTask,
    isLoading,
    currentUserId,
    addSection,
    createTask,
    getAllTasks,
    getTaskById,
    getNextTaskId,
    setSelectedTask,
    cleanSelectedTask,
    updateTask,
    deleteTask,
    fetchColumns,
  }
})